<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="樣品發料" name="first">
			<TableSearch
				:search="state.tableData.search"
				@search="(data) => onSearch(data, state.tableData)"
				:searchConfig="state.tableData.searchConfig"
				labelWidth="70px"
			/>
			<div style="overflow: overlay">
				<Table
					v-if="state1.tableData.data.length > 0"
					ref="tableRef"
					v-bind="state1.tableData"
					style="height: auto"
					@onOpenOtherDialog="openArriveJobDialog"
					class="return-table"
				>
				</Table>
				<Table
					ref="tableRef"
					v-bind="state.tableData"
					class="table"
					@pageChange="(page) => onTablePageChange(page, state.tableData)"
					@sortHeader="(data) => onSortHeader(data, state.tableData)"
					@onOpenOtherDialog="openArriveJobDialog"
				/>
			</div>

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
				<template #optionFat="{ row, val }">
					<div v-if="val.prop === 'sLocation'">
						<span style="float: left">{{ row.text }}</span>
						<span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ row.label }}</span>
					</div>
				</template>
			</Dialog>
		</el-tab-pane>
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="樣品發料記錄" name="second">
			<TableSearch
				:search="secondState.tableData.search"
				@search="(data) => onSearch(data, secondState.tableData)"
				:searchConfig="secondState.tableData.searchConfig"
				labelWidth="100px"
			/>
			<Table
				ref="tableRef"
				v-bind="secondState.tableData"
				class="table"
				@onOpenOtherDialog="lookAttachments"
				@pageChange="(page) => onTablePageChange(page, secondState.tableData)"
				@sortHeader="(data) => onSortHeader(data, secondState.tableData)"
			/>
		</el-tab-pane>
	</el-tabs>
</template>

<script setup lang="ts" name="sampleIssue">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, FormInstance, TabsPaneContext } from 'element-plus';
// 引入接口
import {
	getAdminNamesOfStoreHouseApi,
	getLegalStoreTypesExceptIdleStoreApi,
	getOperAttachmentApi,
	getQueryStoreHouseExceptIdleStoreNoPageApi,
} from '/@/api/global/index';
import { useI18n } from 'vue-i18n';
import {
	getQueryDispatchableCheckDetailsApi,
	getQuerySampleDispatchRecordApi,
	getRejectedSampleDispatchApi,
	getSampleDispatchApi,
	postResubmitSampleDispatchApi,
} from '/@/api/sampleManage/sampleIssue';
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
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true },
			{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true },
			{ key: 'checkQty', colWidth: '', title: '驗收數量', type: 'text', isCheck: true },
			{ key: 'checker', colWidth: '', title: '驗收人', type: 'text', isCheck: true },
			{ key: 'checktime', colWidth: '', title: '驗收日期', type: 'text', isCheck: true },
			{ key: 'createTime', colWidth: '120', title: '驗收提交時間', type: 'text', isCheck: true },
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
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
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
			{ type: 'text', label: '圖紙編號', placeholder: '', prop: 'drawNo', required: false },
			{ type: 'text', label: '品名-中文', placeholder: '', prop: 'nameCh', required: false },
			{ type: 'text', label: '品名-英文', placeholder: '', prop: 'nameEn', required: false },
			{ type: 'text', label: '廠商代碼', placeholder: '', prop: 'vendorCode', required: false },
			{ type: 'text', label: '廠商名稱', placeholder: '', prop: 'vendorName', required: false },
			{ type: 'text', label: '驗收數量', placeholder: '', prop: 'checkQty', required: false },
			{ type: 'text', label: '驗收人', placeholder: '', prop: 'checker', required: false },
			{ type: 'text', label: '驗收日期', placeholder: '', prop: 'checktime', required: false },
			{ type: 'text', label: '驗收提交時間', placeholder: '', prop: 'createTime', required: false },
			{ type: 'text', label: '驗收備註', placeholder: '', prop: 'headDescribe', required: false },
			{ type: 'text', label: '退單時間', prop: 'modifytime', required: false, placeholder: '', isCheck: true },
			{
				type: 'text',
				label: '退單原因',
				prop: 'rejectReason',
				required: false,
				placeholder: '',
				isCheck: true,
				// xs: 24,
				// sm: 24,
				// md: 24,
				// lg: 24,
				// xl: 24,
			},
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
			{
				label: '附件',
				prop: 'attachment',
				placeholder: 'message.pages.placeDrawPath',
				required: false,
				type: 'inputFile',
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
const state1 = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'returnData', colWidth: '70', title: '退回', type: 'text', isCheck: true },
			{ key: 'sampleNo', colWidth: '', title: '送樣單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true },
			{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true },
			{ key: 'checkQty', colWidth: '', title: '驗收數量', type: 'text', isCheck: true },
			{ key: 'checker', colWidth: '', title: '驗收人', type: 'text', isCheck: true },
			{ key: 'checktime', colWidth: '', title: '驗收日期', type: 'text', isCheck: true },
			{ key: 'createTime', colWidth: '120', title: '驗收提交時間', type: 'text', isCheck: true },
			{ key: 'headDescribe', colWidth: '', title: '驗收備註', type: 'text', isCheck: true },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: false, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'others', name: '编辑', color: '#67c23a', isSure: false, icon: '' }],
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
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'sampleNo', colWidth: '', title: '送樣單號', type: 'text', isCheck: true },
			{ key: 'checkNo', colWidth: '', title: '驗收單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true },
			{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true },
			{ key: 'dispatchTime', colWidth: '', title: '發料時間', type: 'text', isCheck: true },
			{ key: 'qty', colWidth: '', title: '發料數量', type: 'text', isCheck: true },
			{ key: 'receiveStorageType', colWidth: '120', title: '領用倉庫類型', type: 'text', isCheck: true },
			{ key: 'receiveSLocation', colWidth: '120', title: '領用倉庫位置', type: 'text', isCheck: true },
			{ key: 'checker', colWidth: '', title: '驗收人', type: 'text', isCheck: true },
			{ key: 'hasPutStorage', colWidth: '120', title: '是否已入庫', type: 'text', isCheck: true },
			{ key: 'describe', colWidth: '', title: '備註', type: 'text', isCheck: true },
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
			{ label: '送樣單號', prop: 'sampleNo	', required: false, type: 'input' },
			{ label: '驗收單號', prop: 'checkNo', required: false, type: 'input' },
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{ label: '廠商', prop: 'vendor', required: false, type: 'input' },
			{ label: '發料時間', prop: 'DispatchTime', required: false, type: 'dateRange' },
			{
				label: '領用倉庫類型',
				prop: 'receiveStorageType',
				required: false,
				type: 'select',
				placeholder: '',
				options: [],
			},
			{ label: '領用倉庫位置', prop: 'receiveSLocation', required: false, type: 'input' },
			{
				label: '是否已入庫',
				prop: 'hasPutStorage',
				required: false,
				clearable: false,
				type: 'select',
				placeholder: '',
				options: [
					{ value: true, label: '是', text: '是' },
					{ value: false, label: '否', text: '否' },
				],
			},
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '查看附件', color: '#438df5', isSure: false, icon: 'ele-View' }],
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
let dialogType = '';
const openArriveJobDialog = async (scope: EmptyObjectType, type: string) => {
	dialogType = type;
	isApplyCheckId.value = scope.row.applyCheckId ? true : false;
	loadingBtn.value = false;
	let rows = scope.row;
	// 倉庫類型
	rows.storeType = rows.receiveStorageType ? rows.receiveStorageType : rows.storeType;
	rows.sLocation = rows.receiveSLocation ? rows.receiveSLocation : rows.sLocation;
	rows.describe = rows.dispatchDescribe ? rows.dispatchDescribe : rows.describe;
	state.tableData.dialogConfig?.forEach((item) => {
		if (item.prop === 'modifytime' || item.prop === 'rejectReason') {
			item.isCheck = type === 'others' ? false : true;
		}
	});
	if (type === 'others') {
		const res = await getAdminNamesOfStoreHouseApi(rows.receiveStorageId);
		rows.warehouseManager = res.data;
		const res1 = await getOperAttachmentApi(5, rows.sampleCheckDetailId);
		rows.attachment = res1.data || '';
	}
	arriveJobDialogRef.value.openDialog('samp', scope.row, type === 'others' ? '编辑' : '發料', {}, type === 'others' ? '重新提交' : '提交');
	currentData.value = scope.row;
};
const onSelectChange = async (val: string, prop: string, formData: EmptyObjectType) => {
	if (prop === 'sLocation') {
		const res = await getAdminNamesOfStoreHouseApi(formData.sLocation);
		formData.warehouseManager = res.data;
		if (!formData.storeType) {
			option.forEach((item) => {
				if (item.value === formData.sLocation) {
					formData.storeType = item.label;
				}
			});
		}
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
	secondState.tableData.search.forEach((item) => {
		if (item.prop === 'receiveStorageType') {
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
		if (form.hasPutStorage === '') form.hasPutStorage = null;
		let data = {
			...form,
			DispatchTime: form.DispatchTime,
			startDispatchTime: form.DispatchTime && form.DispatchTime[0],
			endDispatchTime: form.DispatchTime && form.DispatchTime[1],
			page: datas.page,
		};
		delete data.DispatchTime;
		res = await getQuerySampleDispatchRecordApi(data);
		res!.data.data.forEach((item: any) => {
			item.hasPutStorage = item.hasPutStorage ? '是' : '否';
			item.checker = `${item.checker} / ${item.checkerName}`;
		});
	}
	datas.data = res!.data.data;
	datas.config.total = res!.data.total;
	if (res!.status) {
		datas.config.loading = false;
	}
};
// 查看附件
const lookAttachments = async (scope: EmptyObjectType) => {
	const res = await getOperAttachmentApi(5, scope.row.sampleCheckDetailId);
	if (res.status) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${res.data}`, '_blank');
	}
};
// 提交
const onSubmit = async (formData: any) => {
	const getData = {
		sampleCheckDetailId: formData.sampleCheckDetailId,
		storageId: '',
		describe: formData.describe,
		attachmentUrl: formData.attachmentfileUrl || formData.attachment,
	};
	option.forEach((item) => {
		if (item.value === formData.sLocation) {
			getData['storageId'] = item.value;
		}
	});
	if (formData.receiveStorageId) {
		getData['storageId'] = formData.receiveStorageId;
	}
	loadingBtn.value = true;
	// console.log(getData);
	const res = dialogType === 'others' ? await postResubmitSampleDispatchApi(getData) : await getSampleDispatchApi(getData);
	if (res.status) {
		ElMessage.success(t('發料成功'));
		arriveJobDialogRef.value.closeDialog();
		getTableData(state.tableData);
		getReturnTableData();
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

// 得到退回的數據
const getReturnTableData = async () => {
	state1.tableData.config.loading = true;
	const res = await getRejectedSampleDispatchApi();
	state1.tableData.data = res.data;
	if (res.status) {
		state1.tableData.config.loading = false;
	}
};
// 页面加载时
onMounted(() => {
	getReturnTableData();
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
.return-table {
	:deep(.el-table th.el-table__cell:first-child .cell) {
		border-radius: 10px;
		border: 1px solid red;
		color: red;
	}
}
</style>
