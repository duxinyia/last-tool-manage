<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<div class="title">维修单提报</div>
			<el-form ref="tableSearchRef" size="default" label-width="auto" class="table-form">
				<el-row>
					<el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4" class="mb20 mr20" v-for="(val, key) in state.tableData.search" :key="key">
						<el-form-item :label="$t(val.label)" :prop="val.prop">
							<el-input
								v-model="state.tableData.form[val.prop]"
								:placeholder="`请输入${$t(val.label)}`"
								clearable
								v-if="val.type === 'input'"
								style="width: 100%"
							/>
							<el-date-picker
								v-if="val.type === 'time'"
								v-model="state.tableData.form[val.prop]"
								:placeholder="`请选择时间`"
								clearable
								value-format="YYYY-MM-DD"
								type="date"
								style="height: 30px; max-width: 167px"
							/>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<!-- 表格 -->
			<el-form ref="tableFormRef" :model="state.tableData" size="default">
				<Table
					ref="tableRef"
					v-bind="state.tableData"
					class="table"
					@delRow="onDelRow"
					@addrow="onAddRow"
					@querysearchasync="querySearchAsync"
					@handleselect="handleSelect"
					@handlechange="handleChange"
				/>
			</el-form>
			<div class="describe">
				<span>描述说明：</span>
				<el-input
					class="input-textarea"
					show-word-limit
					v-model="state.tableData.form['describe']"
					type="textarea"
					placeholder="请输入"
					maxlength="150"
				></el-input>
			</div>
			<!-- 提交按钮 -->
			<span class="table-bottom">
				<el-button type="primary" @click="onSubmit(tableFormRef)" size="default">提交</el-button>
			</span>
		</div>
	</div>
</template>

<script setup lang="ts" name="/requistManage/presentation">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
// 接口
import { getQueryNoPageApi, getToolApplyInsertApi } from '/@/api/requistManage/presentation';
// 定义变量内容
const { t } = useI18n();
const tableRef = ref<RefType>();
const tableFormRef = ref();
const state = reactive<EmptyObjectType>({
	tableData: {
		// 列表数据（必传）
		data: [
			{
				matNo: '',
				nameCh: '',
				nameEn: '',
				vendorCode: '',
				vendorName: '',
				sampleQty: '',
				sampleTime: '',
				pr: '',
			},
		],
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: true, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			height: 500,
			isAddRowBtn: true, //是否有添加行按钮
		},
		// 表头内容（必传，注意格式）
		header: [
			{
				key: 'matNo',
				colWidth: '250',
				title: 'message.pages.matNo',
				type: 'autocomplete',
				isCheck: true,
				isRequired: true,
			},
			{ key: 'machine', colWidth: '', title: '机种', type: 'text', isCheck: true, isRequired: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true, isRequired: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true, isRequired: true },
			{ key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'input', isCheck: true, isRequired: true },
			{ key: 'vendorName', colWidth: '', title: '厂商名称', type: 'input', isCheck: true, isRequired: true },
			{ key: 'pr', colWidth: '', title: 'PR项次', type: 'input', isCheck: true, isRequired: true },
			{ key: 'sampleQty', colWidth: '', title: '送修数量', type: 'input', isCheck: true, isRequired: true },
			{ key: 'sampleQty', colWidth: '', title: '送修原因', type: 'input', isCheck: true, isRequired: true },
		],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		searchConfig: {
			isSearchBtn: false, //搜索框
		},
		search: [
			{ label: '维修单号：', prop: 'matNo', placeholder: '请输入维修单号', type: 'text' },
			{ label: '需求单号：', prop: 'matNo', placeholder: '请输入需求单号', type: 'text' },
			{ label: 'PR单号:', prop: 'prNo', placeholder: '请输入PR单号', type: 'text' },
			{ label: '时间:', prop: 'prNo', placeholder: '请选择时间', type: 'time' },
		],
		// 给后端的数据
		form: {
			describe: '',
			prNo: '',
		},
	},
});
let links = ref([]);
// 获取输入建议的方法， 仅当你的输入建议数据 resolve 时，通过调用 callback(data:[])  来返回它
const querySearchAsync = async (queryString: string, cb: (arg: any) => void) => {
	if (queryString) {
		let res = await getQueryNoPageApi(queryString);
		res.data.forEach((item: any) => {
			item['value'] = item.matNo;
		});
		links.value = res.data;
		const results = links.value;
		cb(results);
	} else {
		links.value = [];
		cb(links.value);
	}
};
// 	点击选中建议项时触发 清空数据
const handleChange = (i: number) => {
	let data = state.tableData.data[i];
	data.nameCh = '';
	data.nameEn = '';
};
// 	在 Input 值改变时触发
const handleSelect = async (i: number, item: any) => {
	let data = state.tableData.data[i];
	data.nameCh = item.nameCh;
	data.nameEn = item.nameEn;
};
// 增加一行数据
const onAddRow = () => {
	state.tableData.data.push({
		matNo: '',
		nameCh: '',
		nameEn: '',
		vendorCode: '',
		vendorName: '',
		sampleQty: '',
		sampleTime: '',
		pr: '',
	});
	// 对 Table 进行重新布局。 当表格可见性变化时，您可能需要调用此方法以获得正确的布局
	// tableRef.value.doLayout();
};
//删除
const onDelRow = (row: EmptyObjectType, i: number) => {
	state.tableData.data.splice(i, 1);
};
// 提交
const onSubmit = async (formEl: EmptyObjectType | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格项必填未填'));
		let allData: EmptyObjectType = {};
		allData = { ...state.tableData.form };
		allData['details'] = state.tableData.data;
		const res = await getToolApplyInsertApi(allData);
		if (res.status) {
			ElMessage.success(t('提交成功'));
			// 清空
			const tableData = state.tableData;
			tableData.form = {};
			tableData.data = [];
		}
	});
};
// 页面加载时
onMounted(() => {});
</script>

<style scoped lang="scss">
.table-container {
	.table-padding {
		padding: 15px;
		.table {
			flex: 1;
			overflow: hidden;
		}
	}
}
.title {
	font-size: 20px;
	display: flex;
	justify-content: center;
	margin-bottom: 10px;
}
.describe {
	display: flex;
	margin-top: 10px;
	span {
		width: 90px;
	}
}
.table-bottom {
	display: flex;
	justify-content: flex-end;
	margin-top: 10px;
}
</style>
