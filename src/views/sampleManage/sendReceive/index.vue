<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="樣品收貨" name="first">
			<TableSearch
				:search="state.tableData.search"
				@search="(data) => onSearch(data, state.tableData)"
				:searchConfig="state.tableData.searchConfig"
			/>
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="(page) => onTablePageChange(page, state.tableData)"
				@sortHeader="(data) => onSortHeader(data, state.tableData)"
				@onOpenOtherDialog="openReceiveDialog"
				:cellStyle="cellStyle"
			/>
		</el-tab-pane>
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="收貨記錄" name="second">
			<TableSearch
				:search="secondState.tableData.search"
				@search="(data) => onSearch(data, secondState.tableData)"
				:searchConfig="secondState.tableData.searchConfig"
			/>
			<Table
				ref="tableRef"
				v-bind="secondState.tableData"
				class="table"
				@pageChange="(page) => onTablePageChange(page, secondState.tableData)"
				@sortHeader="(data) => onSortHeader(data, secondState.tableData)"
				@onOpenOtherDialog="openDetailDialog"
				:cellStyle="cellStyle"
			/>
		</el-tab-pane>
		<Dialog ref="detailDialogRef" :dialogConfig="secondState.tableData.dialogConfig" dialogWidth="50%" :isFootBtn="false">
			<template #dialogTable="{ data }">
				<el-form ref="tableFormRef" :model="dialogState.tableData" size="default">
					<Table ref="dialogTableRef" v-bind="dialogState.tableData" class="table-dialog" />
				</el-form>
			</template>
		</Dialog>
		<SampleDeliveryDialog
			ref="sendReceiveDialogRef"
			v-bind="dialogData"
			@sampleSuccess="getTableData"
			@selectChange="selectChange"
			dialogWidth="50%"
		/>
	</el-tabs>
</template>

<script setup lang="ts" name="sendReceive">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage, TabsPaneContext } from 'element-plus';
import { getQuerySampleReceiveRecordApi, GetRecieveTaskApi, GetSampleDetailApi, getSampleReceiveRecordDetailApi } from '/@/api/partno/sendReceive';
import { getEngieerGroupApi } from '/@/api/global/index';
import { useI18n } from 'vue-i18n';

// 引入表格组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
// 引入上面的表单组件
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入收货弹窗组件
const SampleDeliveryDialog = defineAsyncComponent(() => import('../sampleDelivery/component/dialog.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
// 定义变量内容
const { t } = useI18n();
const sendReceiveDialogRef = ref();
const detailDialogRef = ref();
const tableRef = ref<RefType>();
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
			{ key: 'matNo', colWidth: '', title: 'message.pages.matNo', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'sampleNo', colWidth: '', title: 'message.pages.sampleNo', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
			{ key: 'needor', colWidth: '', title: '需求人', type: 'text', isCheck: true },
			// { key: 'engineer', colWidth: '', title: 'message.pages.engineer', type: 'text', isCheck: true },
			// { key: 'engineerName', colWidth: '', title: 'message.pages.engineerName', type: 'text', isCheck: true },
			{ key: 'runStatus', colWidth: '', title: 'message.pages.state', type: 'text', isCheck: true },
		],
		// 表格配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: true, //是否有分页
		},

		btnConfig: [{ type: 'sendReceive', name: '收貨', color: '#e6a23c', isSure: false }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '送樣單號', prop: 'sampleNo', required: false, type: 'input' },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
			{ label: '需求人', prop: 'needor', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		// 给后端的数据
		form: {},
		// 页码
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'sampleNo', colWidth: '', title: '送樣單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'purchaser', colWidth: '', title: '採購人', type: 'text', isCheck: true },
			{ key: 'needor', colWidth: '', title: '需求人', type: 'text', isCheck: true },
			{ key: 'needorTel', colWidth: '', title: '需求人電話', type: 'text', isCheck: true },
			{ key: 'lastReceiveTime', colWidth: '', title: '最後收貨時間', type: 'text', isCheck: true },
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
			{ label: '送樣單號', prop: 'sampleNo', required: false, type: 'input' },
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '採購人員', prop: 'purchaser', required: false, type: 'input' },
			{ label: '需求人', prop: 'needor', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'detail', name: '查看詳情', color: '#1890ff', isSure: false, icon: 'ele-View' }],
		// 给后端的数据
		form: {},
		dialogConfig: [
			{ label: '送樣單號:', prop: 'sampleNo', placeholder: '', required: false, type: 'text' },
			{ label: '料號:', prop: 'matNo', placeholder: '', required: false, type: 'text' },
			{ label: '圖紙編號:', prop: 'drawNo', placeholder: '', required: false, type: 'text' },
			{ label: '品名-中文:', prop: 'nameEn', placeholder: '', required: false, type: 'text' },
			{ label: '品名-英文:', prop: 'nameCh', placeholder: '', required: false, type: 'text' },
			{ label: '採購人:', prop: 'purchaser', placeholder: '', required: false, type: 'text' },
			{ label: '需求人:', prop: 'needor', placeholder: '', required: false, type: 'text' },
			{ label: '需求人電話:', prop: 'needorTel', placeholder: '', required: false, type: 'text' },
			{ label: '最後收貨時間:', prop: 'lastReceiveTime', placeholder: '', required: false, type: 'text' },
		],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
const dialogState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true, isRequired: false },
			{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true, isRequired: false },
			{ key: 'needsQty', colWidth: '', title: '送樣數量', type: 'text', isCheck: true, isRequired: false },
			{ key: 'engineer', colWidth: '150', title: '工程驗收人', type: 'text', isCheck: true, isRequired: false },
			{ key: 'sampleTime', colWidth: '', title: '收貨日期', type: 'text', isCheck: true, isRequired: false },
			{ key: 'receiveSubmitTime', colWidth: '', title: '收貨提交時間', type: 'text', isCheck: true, isRequired: false },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: false, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			height: 300,
		},
		// 给后端的数据
		form: {},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [],
		dialogConfig: [],
		btnConfig: [],
		page: { pageNum: 1, pageSize: 10 },
	},
});
// 单元格样式
const cellStyle = ref();
const dialogData = reactive({
	// 点击收货表格数据
	otherHeaderData: [
		{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true },
		{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true },
		// { key: 'needsTime', colWidth: '', title: '需求送样时间', type: 'text', isCheck: true },
		{ key: 'needsQty', colWidth: '', title: '送樣數量', type: 'text', isCheck: true },
		{ key: 'receiveTime', colWidth: '', title: '收貨時間', type: 'time', isCheck: true, isRequired: true, isdisabledDate: true },
		{ key: 'receiveQty', colWidth: '', title: '收貨數量', type: 'number', isCheck: true, isRequired: true },
	],
	// 收货弹窗数据
	dialogForm: [
		{ type: 'text', label: '料號', prop: 'matNo', value: '' },
		{ type: 'text', label: '圖紙編號', prop: 'drawNo', value: '' },
		{ type: 'text', label: '送樣單號', prop: 'sampleNo', value: '', lg: 9, xl: 9 },
		{ type: 'text', label: '品名-中文', prop: 'nameCh', value: '' },
		{ type: 'text', label: '品名-英文', prop: 'nameEn', value: '' },
		{ type: 'select', label: '工程驗收人', prop: 'engineerNo', value: '', options: [], isRequired: true, lg: 9, xl: 9 },
		{ type: 'text', label: '送樣時間', prop: 'needsDate', value: '' },
		// { type: 'text', label: '送樣數量', prop: 'needsQty', value: '' },
	],
	//进行送样、收货还是验收操作
	operation: '收貨',
});

// 初始化列表数据
const getTableData = async (datas: EmptyObjectType) => {
	datas.config.loading = true;
	const form = datas.form;
	let res = null;
	const data = { ...form, page: datas.page };
	if (activeName.value === 'first') {
		res = await GetRecieveTaskApi(data);
	} else {
		res = await getQuerySampleReceiveRecordApi(data);
		res.data.data.forEach((item: any) => {
			item.purchaser = `${item.purchaser} / ${item.purchaserName}`;
		});
	}
	datas.data = res!.data.data;
	datas.config.total = res!.data.total;
	if (res!.status) {
		datas.config.loading = false;
	}
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
// 打开收货弹窗 1
const openReceiveDialog = async (scope: any) => {
	const res = await GetSampleDetailApi(scope.row.sampleNo);
	sendReceiveDialogRef.value.openDialog(scope, 1, '收貨', res.data.vendorDetails);
};
// 打開詳情彈窗
const openDetailDialog = async (scope: any) => {
	detailDialogRef.value.openDialog('detail', scope.row, '詳情');
	dialogState.tableData.config.loading = true;
	const res = await getSampleReceiveRecordDetailApi(scope.row.sampleNo);
	if (res.status) {
		res.data.forEach((item: any) => {
			item.engineer = `${item.engineer} / ${item.engineerName}`;
		});
		dialogState.tableData.data = res.data;
		dialogState.tableData.config.loading = false;
	}
};
// 搜索下拉选择
const selectChange = (query: string) => {
	if (query) {
		sendReceiveDialogRef.value.loadingOpen();
		setTimeout(async () => {
			const res = await getEngieerGroupApi(query);
			sendReceiveDialogRef.value.loadingClose();
			let options = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.userid}`, label: `${item.username}` };
			});
			dialogData.dialogForm.forEach((item) => {
				if (item.prop === 'engineerNo') {
					item.options = options.filter((item: EmptyObjectType) => {
						return item.label.toLowerCase().includes(query.toLowerCase()) || item.value.toLowerCase().includes(query.toLowerCase());
					});
				}
			});
		}, 500);
	} else {
		dialogData.dialogForm.forEach((item) => {
			if (item.prop === 'engineerNo') {
				item.options = [];
			}
		});
	}
};

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
// :deep(.mb20) {
// 	margin-bottom: 0px !important;
// }
</style>
