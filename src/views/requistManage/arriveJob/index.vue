<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="到貨作業" name="first">
			<TableSearch
				:search="state.tableData.search"
				@search="(data) => onSearch(data, state.tableData)"
				:searchConfig="state.tableData.searchConfig"
				labelWidth=" "
			/>
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="(page) => onTablePageChange(page, state.tableData)"
				@sortHeader="(data) => onSortHeader(data, state.tableData)"
				@onOpenOtherDialog="openArriveJobDialog"
			/>
			<Dialog
				ref="arriveJobDialogRef"
				:dialogConfig="state.tableData.dialogConfig"
				@addData="onSubmit"
				@remoteMethod="remoteMethod"
				:loadingBtn="loadingBtn"
				@handleNumberInputChange="changeInput"
			>
				<template #Header="{ hearName }">
					<div class="header">
						<div style="font-size: 18px">{{ hearName }}</div>
						<el-tag style="font-weight: 700" v-if="isApplyCheckId" class="ml30" type="danger">二次收貨</el-tag>
					</div>
				</template>
				<template #optionFat="{ row }">
					<span style="float: left">{{ row.label }}</span>
					<span style="float: right; color: var(--el-text-color-secondary)">{{ row.value }}</span>
				</template>
			</Dialog>
		</el-tab-pane>
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="到貨記錄" name="second">
			<TableSearch
				:search="secondState.tableData.search"
				@search="(data) => onSearch(data, secondState.tableData)"
				:searchConfig="secondState.tableData.searchConfig"
				labelWidth="90px"
			/>
			<Table
				ref="tableRef"
				v-bind="secondState.tableData"
				class="table"
				@pageChange="(page) => onTablePageChange(page, secondState.tableData)"
				@sortHeader="(data) => onSortHeader(data, secondState.tableData)"
			/>
		</el-tab-pane>
	</el-tabs>
</template>

<script setup lang="ts" name="/requistManage/arriveJob">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, FormInstance, TabsPaneContext } from 'element-plus';
// 引入接口
import { getGetWaitRecievePageListApi, getAddReceiveApi, getQueryReceiveRecordApi } from '/@/api/requistManage/arriveJob';
import { getEngieerGroupApi } from '/@/api/global/index';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const arriveJobDialogRef = ref();
const loading = ref(false);
const loadingBtn = ref(false);
const activeName = ref<string | number>('first');
const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	getTableData(activeName.value === 'first' ? state.tableData : secondState.tableData);
};
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'reqNo', colWidth: '', title: '申請單號', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR單號', type: 'text', isCheck: true },
			{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'machineType', colWidth: '', title: '機種', type: 'text', isCheck: true },
			{ key: 'reqQty', colWidth: '', title: '需求數量', type: 'text', isCheck: true },
			{ key: 'receiveQty', colWidth: '', title: '已收貨數量', type: 'text', isCheck: true },
			{ key: 'reqDate', colWidth: '', title: '需求日期', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '提報人', type: 'text', isCheck: true },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: true, //是否有分页
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '申請單號', prop: 'reqNo', required: false, type: 'input' },
			{ label: 'PR單號', prop: 'prNo', required: false, type: 'input' },
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input', xl: 3 },
			{
				label: '是否是二次收货',
				prop: 'isReapply',
				required: false,
				clearable: false,
				type: 'select',
				options: [
					{ value: true, label: '是', text: '是' },
					{ value: false, label: '否', text: '否' },
				],
				xl: 3,
			},
			{ label: '需求日期', prop: 'reqDate', required: false, type: 'dateRange' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '收貨', color: '#e6a23c', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			// reqNo: '',
			// prNo: '',
		},
		dialogConfig: [
			// { type: 'text', label: '收货单号', placeholder: '', prop: 'sendNo', required: false },
			{ type: 'text', label: '申請單號', placeholder: '', prop: 'reqNo', required: false },
			{ type: 'text', label: 'PR單號', placeholder: '', prop: 'prNo', required: false },
			{ type: 'text', label: 'PR項次', placeholder: '', prop: 'prItemNo', required: false },
			{ type: 'text', label: 'message.pages.matNo', placeholder: '', prop: 'matNo', required: false },
			{ type: 'text', label: '圖紙編號', placeholder: '', prop: 'drawNo', required: false },
			{ type: 'text', label: '品名-中文', placeholder: '', prop: 'nameCh', required: false },
			{ type: 'text', label: '品名-英文', placeholder: '', prop: 'nameEn', required: false },
			{ type: 'text', label: '機種', placeholder: '', prop: 'machineType', required: false },
			{ type: 'text', label: '需求數量', placeholder: '', prop: 'reqQty', required: false },
			{ type: 'text', label: '已收貨數量', placeholder: '', prop: 'receiveQty', required: false },
			{ type: 'text', label: '需求日期', placeholder: '', prop: 'reqDate', required: false },
			{ type: 'text', label: '提報人', placeholder: '', prop: 'creator', required: false },
			{
				label: '工程驗收人',
				prop: 'engineer',
				placeholder: '請輸入選擇工程驗收人',
				required: true,
				type: 'select',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
			},
			{ type: 'number', label: '收貨數量', placeholder: '', prop: 'receiptQty', required: true, min: 1 },
			{ type: 'date', label: '收貨時間', placeholder: '', prop: 'receiveDate', required: true, isdisabledDate: true },
			{
				type: 'textarea',
				label: '備註',
				placeholder: '請輸入備註',
				prop: 'describe',
				required: false,
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
		],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '表格打印演示',
	},
});
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'reqNo', colWidth: '', title: '申請單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'reqMatNo', colWidth: '', title: '請購料號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'machineType', colWidth: '', title: '機種', type: 'text', isCheck: true },
			{ key: 'qty', colWidth: '', title: '收貨數量', type: 'text', isCheck: true },
			{ key: 'receiveDate', colWidth: '', title: '收貨日期', type: 'text', isCheck: true },
			{ key: 'hasChecked', colWidth: '120', title: '是否已驗收', type: 'text', isCheck: true },
			{ key: 'engineer', colWidth: '', title: '工程驗收人', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR單號', type: 'text', isCheck: true },
			{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'text', isCheck: true },
			{ key: 'describe', colWidth: '', title: '備註', type: 'text', isCheck: true },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: false, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: true, //是否有分页
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '申請單號', prop: 'reqNo', required: false, type: 'input' },
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{
				label: '是否已驗收',
				prop: 'hasChecked',
				required: false,
				clearable: false,
				type: 'select',
				options: [
					{ value: true, label: '是', text: '是' },
					{ value: false, label: '否', text: '否' },
				],
			},
			{ label: 'PR單號', prop: 'prNo', required: false, type: 'input' },
			{ label: '請購料號', prop: 'reqMatNo', required: false, type: 'input' },
			{ label: '工程驗收人', prop: 'engineer', required: false, type: 'input' },
			{ label: '收貨日期', prop: 'receiveDate', required: false, type: 'dateRange' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [],
		// 给后端的数据
		form: {},
		dialogConfig: [],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// const dialogState = reactive<TableDemoState>({
// 	tableData: {
// 		// 列表数据（必传）
// 		data: [],
// 		// 表头内容（必传，注意格式）
// 		header: [],
// 		// 配置项（必传）
// 		config: {
// 			total: 0, // 列表总数
// 			loading: true, // loading 加载
// 			isBorder: false, // 是否显示表格边框
// 			isSerialNo: true, // 是否显示表格序号
// 			isSelection: false, // 是否显示表格多选
// 			isOperate: false, // 是否显示表格操作栏
// 			isButton: false, //是否显示表格上面的新增删除按钮
// 			isInlineEditing: false, //是否是行内编辑
// 			isTopTool: false, //是否有表格右上角工具
// 			isPage: false, //是否有分页
// 			isDialogTab: true, //是否是弹窗里面的表格
// 			height: 500,
// 		},
// 		// 给后端的数据
// 		form: {},
// 		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
// 		search: [
// 			{ label: '收货单号', prop: 'sendNo', required: false, type: 'text' },
// 			{ label: '申请单号', prop: 'reqNo', required: false, type: 'text' },
// 			{ label: 'PR单号', prop: 'prNo', required: false, type: 'text' },
// 			{ label: '工程验收人', prop: 'engineer', required: false, type: 'select', options: [], isRequired: true },
// 			// { label: '收货时间', prop: 'sendTime', required: false, type: 'time', isRequired: true },
// 		],
// 		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true, disabled: true }],
// 		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
// 		page: {
// 			pageNum: 1,
// 			pageSize: 10,
// 		},
// 	},
// });
// 点击收货弹窗
const isApplyCheckId = ref(false);
const currentData = ref<EmptyObjectType>([]);
const openArriveJobDialog = (scope: EmptyObjectType) => {
	isApplyCheckId.value = scope.row.applyCheckId ? true : false;
	loadingBtn.value = false;
	arriveJobDialogRef.value.openDialog('samp', scope.row, '收貨');
	currentData.value = scope.row;
};
const changeInput = (val: number, formData: EmptyObjectType) => {
	const dialogData = currentData.value;
	if (state.tableData.dialogConfig) {
		state.tableData.dialogConfig.forEach((item) => {
			if (item.prop === 'receiptQty') {
				item.max = dialogData.reqQty - dialogData.receiveQty;
			}
		});
		if (val > dialogData.reqQty - dialogData.receiveQty) {
			formData.receiptQty = dialogData.reqQty - dialogData.receiveQty;
		}
	}
};

// 搜索下拉选择
const remoteMethod = (query: string) => {
	let dialogConfig = state.tableData.dialogConfig;
	dialogConfig?.forEach((item) => {
		if (item.prop === 'engineer') item.loading = true;
	});
	if (query) {
		loading.value = true;
		setTimeout(async () => {
			const res = await getEngieerGroupApi(query);
			loading.value = false;
			let options = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.userid}`, label: `${item.username}` };
			});
			dialogConfig?.forEach((item) => {
				if (item.prop === 'engineer') item.loading = false;
				item.options = options.filter((item: EmptyObjectType) => {
					return item.value.toLowerCase().includes(query.toLowerCase()) || item.label.toLowerCase().includes(query.toLowerCase());
				});
			});
		}, 500);
	} else {
		dialogConfig?.forEach((item) => {
			if (item.prop === 'engineer') item.options = [];
		});
	}
};

// 初始化列表数据
const getTableData = async (datas: EmptyObjectType) => {
	const form = datas.form;
	let res = null;
	if (activeName.value === 'first') {
		if (form.isReapply === '') form.isReapply = null;
		let data = {
			...form,
			reqDate: form.reqDate,
			startReqDate: form.reqDate && form.reqDate[0],
			endReqDate: form.reqDate && form.reqDate[1],
			page: datas.page,
		};
		delete data.reqDate;
		res = await getGetWaitRecievePageListApi(data);
	} else {
		if (form.hasChecked === '') form.hasChecked = null;
		let data = {
			...form,
			receiveDate: form.receiveDate,
			startReceiveDate: form.receiveDate && form.receiveDate[0],
			endReceiveDate: form.receiveDate && form.receiveDate[1],
			page: datas.page,
		};
		delete data.receiveDate;
		res = await getQueryReceiveRecordApi(data);
		res.data.data.forEach((item: any) => {
			item.hasChecked = item.hasChecked ? '是' : '否';
			item.engineer = `${item.engineer} / ${item.engineerName}`;
		});
	}
	datas.data = res!.data.data;
	datas.config.total = res!.data.total;
	if (res!.status) {
		datas.config.loading = false;
	}
};

// 提交
const onSubmit = async (formData: any) => {
	loadingBtn.value = true;
	const getData = {
		applyDetailId: formData.applyDetailId,
		receiveQty: formData.receiptQty,
		receiveDate: formData.receiveDate,
		engineer: formData.engineer,
		describe: formData.describe,
	};
	// options.forEach((item) => {
	// 	if (item.value === formData.purchaserName) {
	// 		getData['purchaser'] = item.label;
	// 		getData['purchaserName'] = item.text;
	// 	}
	// });
	const res = await getAddReceiveApi(getData);
	if (res.status) {
		ElMessage.success(t('收貨成功'));
		arriveJobDialogRef.value.closeDialog();
		getTableData(state.tableData);
	}
	loadingBtn.value = false;
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType, tableData: EmptyObjectType) => {
	tableData.form = Object.assign({}, tableData.form, { ...data });
	tableRef.value?.pageReset();
};

// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType, tableData: EmptyObjectType) => {
	tableData.page.pageNum = page.pageNum;
	tableData.page.pageSize = page.pageSize;
	getTableData(tableData);
};
// 拖动显示列排序回调
const onSortHeader = (data: TableHeaderType[], tableData: EmptyObjectType) => {
	tableData.header = data;
};
// if (dialogState.tableData.btnConfig)
// 	dialogState.tableData.btnConfig[0].disabled = computed(() => {
// 		return dialogState.tableData.data.length <= 1 ? true : false;
// 	});
// 页面加载时
onMounted(() => {
	getTableData(state.tableData);
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
.header {
	display: flex;
	align-items: center;
}
</style>
