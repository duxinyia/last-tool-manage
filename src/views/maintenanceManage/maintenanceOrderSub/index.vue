<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@cellclick="matNoClick"
				:cellStyle="cellStyle"
				@onOpentopBtnOther="onOpenSendRepair"
			/>
			<el-dialog ref="presentationDialogRef" v-model="presentationDialogVisible" :title="dilogTitle" width="85%">
				<el-row>
					<el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4" class="mb20 mr20" v-for="(val, key) in dialogState.tableData.search" :key="key">
						<div v-if="val.type === 'text'">
							{{ val.label }}<span style="color: red" class="ml10">{{ dialogState.tableData.form[val.prop] }}</span>
						</div>
						<template v-if="val.type === 'input'">
							<span class="mr10">{{ val.label }}</span>
							<el-input
								size="default"
								v-model="dialogState.tableData.form[val.prop]"
								:placeholder="`请输入${$t(val.label)}`"
								clearable
								style="width: 100%; max-width: 167px"
							/>
						</template>
						<div v-if="val.type === 'time'">
							<span v-if="val.isRequired" class="color-danger mr5">*</span>
							<span style="width: 96px" class="mr10">{{ val.label }}</span>
							<el-date-picker
								v-model="dialogState.tableData.form[val.prop]"
								:placeholder="`请选择时间`"
								clearable
								value-format="YYYY-MM-DD"
								type="date"
								style="height: 30px; max-width: 167px"
							/>
						</div>
					</el-col>
				</el-row>

				<!-- 表格 -->
				<el-form ref="tableFormRef" :model="dialogState.tableData" size="default">
					<Table ref="dialogtableRef" v-bind="dialogState.tableData" class="table" @delRow="onDelRow" />
				</el-form>
				<div class="describe">
					<span>描述说明：</span>
					<el-input
						class="input-textarea"
						show-word-limit
						v-model="dialogState.tableData.form['describe']"
						type="textarea"
						placeholder="请输入"
						maxlength="150"
					></el-input>
				</div>
				<!-- 提交按钮 -->
				<template #footer>
					<span class="dialog-footer">
						<el-button size="default" auto-insert-space @click="presentationDialogVisible = false">取消</el-button>
						<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)"> 确定 </el-button>
					</span>
				</template>
			</el-dialog>
			<Dialog ref="matnoDetailDialogRef" :isFootBtn="false" :dialogConfig="dialogMatnoDetail" />
		</div>
	</div>
</template>

<script setup lang="ts" name="maintenanceOrderSub">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch } from 'vue';
import { ElMessage, FormInstance } from 'element-plus';
const presentationDialogVisible = ref(false);
// 引入接口
import { getQueryExitPageApi, getSubmitRepairOrderApi } from '/@/api/maintenanceManage/maintenanceOrderSub';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入组件
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const matnoDetailDialogRef = ref();
const tableRef = ref<RefType>();
const dialogtableRef = ref<RefType>();
const presentationDialogRef = ref();
// 单元格样式
const cellStyle = ref();

// 送修弹窗标题
const dilogTitle = ref();
const header = ref([
	{
		key: 'matno',
		colWidth: '250',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'machine', colWidth: '', title: '机种', type: 'text', isCheck: true },
	{ key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameen', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
	{ key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
	{ key: 'exitqty', colWidth: '', title: '維修数量', type: 'text', isCheck: true },
	{ key: 'exitreason', colWidth: '', title: '維修原因', type: 'text', isCheck: true },
	{ key: 'prItemNo', colWidth: '', title: 'pr项次', type: 'input', isCheck: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{
				key: 'matno',
				colWidth: '250',
				title: 'message.pages.matNo',
				type: 'text',
				isCheck: true,
			},
			{ key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameen', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
			{ key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
			{ key: 'exitqty', colWidth: '', title: '退库数量', type: 'text', isCheck: true },
			{ key: 'exitreason', colWidth: '', title: '退库原因', type: 'text', isCheck: true },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: true, // 是否显示表格多选
			isOperate: false, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: true, //是否有分页
		},
		topBtnConfig: [
			{ type: 'other', name: '送修', defaultColor: 'primary', isSure: true, disabled: true, icon: 'ele-Edit', isNoSelcetDisabled: true },
		],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料号', prop: 'matNo', required: false, type: 'input' },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},

		// 给后端的数据
		form: {
			matNo: '',
			matName: '',
			exitType: 0,
		},
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '表格打印演示',
	},
});
const dialogState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: true, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			isDialogTab: true, //是否是弹窗里面的表格
			height: 500,
		},
		// 给后端的数据
		form: {},
		searchConfig: {
			isSearchBtn: false,
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '维修单号：', prop: 'matNo', placeholder: '请输入维修单号', type: 'text', required: false, isRequired: false },
			{ label: 'PR单号', prop: 'prNo', placeholder: '请输入PR单号', type: 'input', required: false, isRequired: false },
			{ label: '送修时间:', prop: 'sendRepairDate', placeholder: '请选择送修时间', type: 'time', required: false, isRequired: true },
		],
		// 弹窗表单
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true }],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
const dialogMatnoDetail = ref([
	{ label: '料号:', prop: 'matno', type: 'text' },
	{ label: '品名-中文:', prop: 'namech', type: 'text' },
	{ label: '品名-英文:', prop: 'nameen', type: 'text' },
	{ label: '厂商代码:', prop: 'vendorcode', type: 'text' },
	{ label: '厂商名称:', prop: 'vendorname', type: 'text' },
	{ label: '退库类型:', prop: 'exittype', type: 'text' },
	{ label: '退库原因:', prop: 'exitreason', type: 'text' },
	{ label: '退库数量:', prop: 'exitqty', type: 'text' },
	{ label: '描述说明:', prop: 'describe', type: 'text' },
]);
const exitTypeMap: EmptyObjectType = {
	1: '維修',
	2: '閒置',
	3: '報廢',
};
watch(
	() => presentationDialogVisible.value,
	(val) => {
		if (val == false) {
			tableRef.value.clearSelection();
		}
	}
);
// 单元格字体颜色
const changeToStyle = (indList: number[]) => {
	return ({ columnIndex }: any) => {
		for (let j = 0; j < indList.length; j++) {
			let ind = indList[j];
			if (columnIndex === ind) {
				return { color: 'var(--el-color-primary)', cursor: 'pointer' };
			}
		}
	};
};
cellStyle.value = changeToStyle([2]);
// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	let data = {
		matName: form.matName,
		matNo: form.matNo,
		exitType: 1,
		page: state.tableData.page,
	};
	const res = await getQueryExitPageApi(data);
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
//删除
const onDelRow = (row: EmptyObjectType, i: number) => {
	dialogState.tableData.data.splice(i, 1);
};

// 点击送修按钮
const onOpenSendRepair = (row: EmptyObjectType[]) => {
	presentationDialogVisible.value = true;
	let tableData = dialogState.tableData;
	tableData.header = header.value;
	tableData.data = [];
	tableData.data = row;
	tableData.config.loading = false;
	dilogTitle.value = '维修单提报';
};

// 点击料号弹出详情
const matNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'matno') {
		row.exittype = exitTypeMap[row.exittype];
		matnoDetailDialogRef.value.openDialog('matno', row, '退库详情');
	}
};
// 提交
const onSubmit = async (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格项必填未填'));
		if (!dialogState.tableData.form['sendRepairDate']) return ElMessage.warning(t('请填写收货时间'));
		let allData: EmptyObjectType = {};
		dialogState.tableData.data.forEach((item) => {
			item['exitStoreId'] = item.runid;
		});
		allData = { ...dialogState.tableData.form };
		allData['details'] = dialogState.tableData.data;
		const res = await getSubmitRepairOrderApi(allData);
		if (res.status) {
			ElMessage.success(t('送修成功'));
			presentationDialogVisible.value = false;
			getTableData();
		}
	});
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value.pageReset();
};

// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType) => {
	state.tableData.page.pageNum = page.pageNum;
	state.tableData.page.pageSize = page.pageSize;
	getTableData();
};
// 拖动显示列排序回调
const onSortHeader = (data: TableHeaderType[]) => {
	state.tableData.header = data;
};
// 页面加载时
onMounted(() => {
	getTableData();
});
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
.describe {
	display: flex;
	margin-top: 10px;
	span {
		width: 90px;
	}
}
.buttonBorder {
	border: 0px !important;
}
</style>
