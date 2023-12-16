<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="樣品發料" name="first">
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
				@dailogFormButton="onDownLoad"
				@selectChange="onSelectChange"
			>
			</Dialog>
		</el-tab-pane>
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="樣品發料記錄" name="second">
			<!-- <TableSearch
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
			/> -->
		</el-tab-pane>
	</el-tabs>
</template>

<script setup lang="ts" name="sampleIssue">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, FormInstance, TabsPaneContext } from 'element-plus';
// 引入接口
import { getAdminNamesOfStoreHouseApi, getLegalStoreTypesExceptIdleStoreApi, getQueryStoreHouseExceptIdleStoreNoPageApi } from '/@/api/global/index';
import { useI18n } from 'vue-i18n';
import { getQueryDispatchableCheckDetailsApi, getSampleDispatchApi } from '/@/api/sampleManage/sampleIssue';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));

// 定义变量内容
const { t } = useI18n();
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
			{ key: 'sampleNo', colWidth: '', title: '送樣單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true },
			{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true },
			{ key: 'checkQty', colWidth: '', title: '驗收數量', type: 'text', isCheck: true },
			{ key: 'checker', colWidth: '', title: '驗收人', type: 'text', isCheck: true },
			{ key: 'checktime', colWidth: '', title: '驗收日期', type: 'text', isCheck: true },
			{ key: 'createTime', colWidth: '', title: '驗收提交時間', type: 'text', isCheck: true },
			{ key: 'headDescribe', colWidth: '', title: '驗收備註', type: 'text', isCheck: true },
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
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{ label: '廠商', prop: 'vendor', required: false, type: 'input' },
			{ label: '驗收人', prop: 'checker', required: false, type: 'input' },
			{ label: '驗收日期', prop: 'checkTime', required: false, type: 'dateRange' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '發料', color: '#67c23a', isSure: false, icon: 'ele-Van' }],
		// 给后端的数据
		form: {},
		dialogConfig: [
			{ type: 'text', label: '送樣單號', placeholder: '', prop: 'sampleNo', required: false },
			{ type: 'text', label: 'message.pages.matNo', placeholder: '', prop: 'matNo', required: false },
			{ type: 'text', label: '品名-中文', placeholder: '', prop: 'nameCh', required: false },
			{ type: 'text', label: '品名-英文', placeholder: '', prop: 'nameEn', required: false },
			{ type: 'text', label: '廠商代碼', placeholder: '', prop: 'vendorCode', required: false },
			{ type: 'text', label: '廠商名稱', placeholder: '', prop: 'vendorName', required: false },
			{ type: 'text', label: '驗收數量', placeholder: '', prop: 'checkQty', required: false },
			{ type: 'text', label: '驗收人', placeholder: '', prop: 'checker', required: false },
			{ type: 'text', label: '驗收日期', placeholder: '', prop: 'checktime', required: false },
			{ type: 'text', label: '驗收提交時間', placeholder: '', prop: 'createTime', required: false },
			{ type: 'text', label: '驗收備註', placeholder: '', prop: 'headDescribe', required: false },
			{ type: 'button', label: '查看驗收報告', placeholder: '', prop: 'accepReportUrl', required: false, xs: 24, sm: 24, md: 24, lg: 24, xl: 24 },
			{
				label: '倉庫類型',
				prop: 'storeType',
				placeholder: '請選擇倉庫類型',
				required: true,
				type: 'select',
				options: [],
				clearable: true,
			},
			{
				label: '倉庫位置',
				prop: 'sLocation',
				placeholder: '請輸入選擇倉庫位置',
				required: true,
				type: 'select',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
			},
			{
				type: 'text',
				label: '接收DRI',
				placeholder: '',
				prop: 'warehouseManager',
				required: false,
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
			{
				type: 'textarea',
				label: '備註',
				placeholder: '',
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
			{ key: 'reqMatNo', colWidth: '', title: '申請料號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
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
			{ label: '申請料號', prop: 'reqMatNo', required: false, type: 'input' },
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
// 点击發料弹窗
const isApplyCheckId = ref(false);
const currentData = ref<EmptyObjectType>([]);
const openArriveJobDialog = (scope: EmptyObjectType) => {
	isApplyCheckId.value = scope.row.applyCheckId ? true : false;
	loadingBtn.value = false;
	arriveJobDialogRef.value.openDialog('samp', scope.row, '發料');
	currentData.value = scope.row;
};
const onSelectChange = async (val: string, prop: string, formData: EmptyObjectType) => {
	if (prop === 'sLocation') {
		const res = await getAdminNamesOfStoreHouseApi(formData.sLocation);
		formData.warehouseManager = res.data;
	} else {
		formData.sLocation = '';
		formData.warehouseManager = '';
	}
};
const changeInput = (val: number, formData: EmptyObjectType) => {};
// 查看驗收報告
const onDownLoad = (formData: EmptyObjectType) => {
	if (formData.accepreporturl) {
		window.open(
			`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${formData.accepreporturl}`,
			'_blank'
		);
	} else {
		ElMessage.warning(t('沒有驗收報告單'));
	}
};
// 搜索下拉选择
let option: EmptyArrayType = [];
const remoteMethod = (query: string, form: EmptyObjectType) => {
	if (query) {
		state.tableData.dialogConfig?.forEach((item) => {
			if (item.prop === 'sLocation') {
				item.loading = true;
			}
		});
		setTimeout(async () => {
			const res = await getQueryStoreHouseExceptIdleStoreNoPageApi(form.storeType, query);
			option = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.storeId}`, label: `${item.storeType}`, text: `${item.sLocation}` };
			});
			state.tableData.dialogConfig?.forEach((item) => {
				if (item.prop === 'sLocation') {
					item.loading = false;
					item.options = option.filter((item: EmptyObjectType) => {
						return item.text.toLowerCase().includes(query.toLowerCase()) || item.label.toLowerCase().includes(query.toLowerCase());
					});
				}
			});
		}, 500);
	} else {
		state.tableData.dialogConfig?.forEach((item) => {
			if (item.prop === 'sLocation') {
				item.options = [];
			}
		});
	}
};
// 下拉框数据
const getSelect = async () => {
	const res = await getLegalStoreTypesExceptIdleStoreApi();
	const option = res.data.map((item: any) => {
		return { label: item, text: item, value: item };
	});
	state.tableData.dialogConfig?.forEach((item) => {
		if (item.prop === 'storeType') {
			item.options = option;
		}
	});
};
// 初始化列表数据
const getTableData = async (datas: EmptyObjectType) => {
	const form = datas.form;
	let res = null;
	if (activeName.value === 'first') {
		let data = {
			...form,
			checkTime: form.checkTime,
			startCheckTime: form.checkTime && form.checkTime[0],
			endCheckTime: form.checkTime && form.checkTime[1],
			page: datas.page,
		};
		delete data.checkTime;
		res = await getQueryDispatchableCheckDetailsApi(data);
		res!.data.data.forEach((item: any) => {
			item.checker = `${item.checker} / ${item.checkerName}`;
		});
	} else {
		// if (form.hasChecked === '') form.hasChecked = null;
		// let data = {
		// 	...form,
		// 	receiveDate: form.receiveDate,
		// 	startReceiveDate: form.receiveDate && form.receiveDate[0],
		// 	endReceiveDate: form.receiveDate && form.receiveDate[1],
		// 	page: datas.page,
		// };
		// delete data.receiveDate;
		// res = await getQueryReceiveRecordApi(data);
		// res!.data.data.forEach((item: any) => {
		// 	item.hasChecked = item.hasChecked ? '是' : '否';
		// 	item.engineer = `${item.engineer} / ${item.engineerName}`;
		// });
	}
	datas.data = res!.data.data;
	datas.config.total = res!.data.total;
	if (res!.status) {
		datas.config.loading = false;
	}
};

// 提交
const onSubmit = async (formData: any) => {
	const getData = {
		sampleCheckDetailId: formData.sampleCheckDetailId,
		storageId: '',
		describe: formData.describe,
	};
	option.forEach((item) => {
		if (item.value === formData.sLocation) {
			getData['storageId'] = item.value;
		}
	});
	loadingBtn.value = true;
	// console.log(getData);
	const res = await getSampleDispatchApi(getData);
	if (res.status) {
		ElMessage.success(t('發料成功'));
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
// 页面加载时
onMounted(() => {
	getTableData(state.tableData);
	getSelect();
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
