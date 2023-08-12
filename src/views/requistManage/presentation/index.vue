<template>
	<div class="table-demo-container layout-padding">
		<div class="table-demo-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" :searchConfig="state.tableData.searchConfig" />
			<div class="table-top">
				<el-button size="default" class="buttonBorder mb12" @click="onAddRow" type="primary" plain
					><el-icon><ele-Plus /></el-icon>{{ $t('message.allButton.addBtn') }}</el-button
				>
			</div>
			<el-form ref="tableRequistRef" :model="state.tableData" size="default">
				<el-table
					ref="tableRef"
					class="tableData"
					height="500"
					id="elTable"
					:data="state.tableData.data"
					v-bind="$attrs"
					row-key="id"
					style="width: 100%"
					:row-style="{ height: '10px' }"
					:header-row-style="{ background: '#dce9fd' }"
				>
					<el-table-column
						align="center"
						v-for="item in state.tableData.header"
						:key="item.key"
						show-overflow-tooltip
						:prop="item.key"
						:width="item.colWidth"
						:label="$t(item.title)"
					>
						<template v-slot:header>
							<span v-if="item.isRequired" class="color-danger">*</span>
							<span class="pl5">{{ $t(item.title) }}</span>
						</template>
						<template v-slot="scope">
							<el-form-item
								:prop="`data.${scope.$index}.${item.key}`"
								:rules="[
									{ required: item.isRequired, message: '不能为空', trigger: item.type === 'input' || item.type === 'time' ? 'blur' : 'change' },
								]"
							>
								<el-input
									v-if="item.type === 'input'"
									style="height: 30px"
									v-model="state.tableData.data[scope.$index][item.key]"
									placeholder="请输入"
									clearable
								></el-input>

								<el-date-picker
									v-if="item.type === 'time'"
									value-format="YYYY-MM-DD"
									v-model="state.tableData.data[scope.$index][item.key]"
									type="date"
									placeholder="请选择"
									style="height: 30px; max-width: 167px"
								/>
								<div v-if="item.type != 'input' && item.type != 'time'" style="text-align: center; width: 100%">
									<span>{{ scope.row[item.key] }}</span>
								</div>
							</el-form-item>
						</template>
					</el-table-column>
					<el-table-column align="center" :label="$t('message.pages.operation')" :width="130">
						<template v-slot="scope">
							<el-button
								:disabled="state.tableData.data.length <= 1"
								size="default"
								class="button buttonBorder"
								color="#D33939"
								@click="onDelRow(scope.$index)"
								plain
								><el-icon><ele-Delete /></el-icon> 删除
							</el-button>
						</template>
					</el-table-column>
					<template #empty>
						<el-empty :description="$t('message.hint.nodata')" />
					</template>
				</el-table>
				<div class="describe">
					<span>描述说明：</span>
					<el-input class="input-textarea" show-word-limit v-model="describe" type="textarea" placeholder="请输入" maxlength="150"></el-input>
				</div>
			</el-form>

			<span class="table-bottom">
				<el-button type="primary" @click="onSubmit(tableRequistRef)" size="default">提交</el-button>
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
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 定义变量内容
const { t } = useI18n();
const tableRef = ref<RefType>();
const describe = ref();
const tableRequistRef = ref();
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
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matNo', colWidth: '', title: 'message.pages.matNo', type: 'input', isCheck: true, isRequired: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true, isRequired: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true, isRequired: true },
			{ key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'input', isCheck: true, isRequired: true },
			{ key: 'vendorName', colWidth: '', title: '厂商名称', type: 'input', isCheck: true, isRequired: true },
			{ key: 'sampleQty', colWidth: '', title: '需求数量', type: 'input', isCheck: true, isRequired: true },
			{ key: 'sampleTime', colWidth: '150', title: '需求时间', type: 'time', isCheck: true, isRequired: true },
			{ key: 'pr', colWidth: '', title: 'PR项次', type: 'input', isCheck: true, isRequired: true },
		],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		searchConfig: {
			isSearchBtn: false, //搜索框
		},
		search: [
			{ label: '申请单号：', prop: 'matNo', placeholder: '请输入料号', required: false, type: 'text' },
			{ label: 'PR单号', prop: 'matNo', placeholder: '请输入PR单号', required: false, type: 'input' },
		],
		// 给后端的数据
		form: {
			matNo: '',
		},
	},
});
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
	tableRef.value.doLayout();
};
//删除
const onDelRow = (i: number) => {
	state.tableData.data.splice(i, 1);
};
const onSubmit = async (formEl: EmptyObjectType | undefined) => {
	if (!formEl) return;
	await formEl.validate((valid: boolean) => {
		if (!valid) return ElMessage.warning('表格项必填未填');
		let sampleData: EmptyObjectType = {};
	});
};
// 初始化列表数据
const getTableData = async () => {
	// state.tableData.config.loading = true;
	// const form = state.tableData.form;
	// let data = {
	// 	matNo: form.matNo,
	// 	page: state.tableData.page,
	// 	queryType: 1,
	// };
	// const res = await getMaterialListApi(data);
	// state.tableData.data = res.data.data;
	// state.tableData.config.total = res.data.total;
	// if (res.status) {
	// 	state.tableData.config.loading = false;
	// }
};

// 删除当前项回调
const onTableDelRow = async (row: EmptyObjectType, type: string) => {
	// let rows = [];
	// if (type === 'bulkDel') {
	// 	Object.keys(row).forEach((key) => {
	// 		rows.push(row[key].matNo);
	// 	});
	// } else {
	// 	rows.push(row.matNo);
	// }
	// const res = await getInvalidMaterialApi(rows);
	// if (res.status) {
	// 	type === 'bulkDel'
	// 		? ElMessage.success(`删除成功`)
	// 		: ElMessage.success(`${t('message.allButton.deleteBtn')}${row.matNo}${t('message.hint.success')}`);
	// 	getTableData();
	// }
};

// 页面加载时
onMounted(() => {
	getTableData();
});
</script>

<style scoped lang="scss">
.table-demo-container {
	.table-demo-padding {
		padding: 15px;
		.table-demo {
			flex: 1;
			overflow: hidden;
		}
	}
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
