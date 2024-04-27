<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="樣品入庫" name="first">
			<TableSearch
				:search="state.tableData.search"
				@search="(data) => onSearch(data, state.tableData)"
				:searchConfig="state.tableData.searchConfig"
				@remoteMethod="remoteMethod"
				@selectChange="selectChangeStoreType"
			>
				<!-- <template #optionSearchFat="{ row, value }">
					<span v-if="value.prop === 'dispatcher'" style="float: left; margin-right: 35px">{{ row.value }}</span>
					<span v-if="value.prop === 'dispatcher'" style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ row.label }}</span>
				</template> -->
			</TableSearch>
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="(page) => onTablePageChange(page, state.tableData)"
				@sortHeader="(data) => onSortHeader(data, state.tableData)"
				@cellclick="reqNoClick"
				@onOpenOtherDialog="openEntryDialog"
			/>
		</el-tab-pane>
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="樣品入庫記錄" name="second">
			<TableSearch
				:search="secondState.tableData.search"
				@search="(data) => onSearch(data, secondState.tableData)"
				:searchConfig="secondState.tableData.searchConfig"
				labelWidth="70px"
			/>
			<Table
				ref="tableRef"
				v-bind="secondState.tableData"
				class="table"
				@pageChange="(page) => onTablePageChange(page, secondState.tableData)"
				@sortHeader="(data) => onSortHeader(data, secondState.tableData)"
				@onOpenOtherDialog="openLookQrcodeDialog"
			/>
		</el-tab-pane>
		<qrCodeDialog ref="inventoryDialogRef" :tags="qrCode" dialogTitle="入庫條碼" />
		<Dialog
			ref="entryJobDialogRef"
			:dialogConfig="state.tableData.dialogConfig"
			:innerDialogConfig="state.tableData.innerDialogConfig"
			dialogWidth="50%"
			dialogType="nestDialogConfig"
			@addData="entrySubmit"
			@dailogFormButton="scanCodeEntry"
			@commonInputHandleChange="change"
			:tagsData="tags"
			@innnerDialogCancel="innnerDialogCancel"
			@innnerDialogSubmit="innnerDialogSubmit"
			@openInnerDialog="openInnerDialog"
			@handleTagClose="handleTagClose"
			:loadingBtn="loadingBtn"
			@onImportQrcodeData="onImportQrcodeData"
			@inputBlur="onInputBlur"
			@inputFocus="onInputFocus"
		>
			<template #optionFat="{ row }">
				<span style="float: left; margin-right: 10px">{{ row.text }}</span>
				<span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ row.label }}</span>
			</template>
			<template #buttonFooter="{ row, data }">
				<el-button v-if="row.type === 'button'" type="primary" plain @click="addButton(data)">{{ row.label }}</el-button>
			</template>
		</Dialog>
	</el-tabs>
</template>

<script setup lang="ts" name="sampleStorage">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox, FormInstance, TabsPaneContext } from 'element-plus';
// 引入接口
import {
	getCodesOfSamplePutStorageRecordApi,
	getOrCreatePutStorageDraftApi,
	getQuerySamplePutStorageRecordApi,
	GetQueryStoragableSampleCheckDetailsApi,
	getSamplePutStorageApi,
	getStockOperDraftAddCodesApi,
	getStockOperDraftModifyPutStorageDraftApi,
	getStockOperDraftRemoveCodeFromPutStorageDraftApi,
	getStockOperDraftResetCodesOfPutStorageDraftApi,
} from '/@/api/toolsReturn/sampleStorage';
import { getCodesOfApplyPutStorageApi } from '/@/api/requistManage/entryJob';

import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
const qrCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/qrCodeDialog.vue'));
import { getLegalStoreTypesApi, getOperAttachmentApi, getQueryStoreHouseNoPageApi } from '/@/api/global/index';
const activeName = ref<string | number>('first');
const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	getTableData(activeName.value === 'first' ? state.tableData : secondState.tableData);
};
// 定义变量内容
const { t } = useI18n();
const loadingBtn = ref(false);
const tableFormRef = ref();
const tableRef = ref<RefType>();
const entryJobDialogRef = ref();
const inventoryDialogRef = ref();
let qrCode = ref<EmptyArrayType>([]);
// tags的数据
const tags = ref<EmptyArrayType<string>>([]);
// 弹窗标题
const dilogTitle = ref();
const header = ref([
	{ key: 'matNo', colWidth: '250', title: 'message.pages.matNo', type: 'text', isCheck: true },
	{ key: 'machinetype', colWidth: '', title: '機種', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'vendorcode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true },
	{ key: 'vendorname', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true },
	{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'text', isCheck: true },
	{ key: 'reqQty', colWidth: '', title: '需求數量', type: 'text', isCheck: true },
	{ key: 'reqDate', colWidth: '', title: '需求時間', type: 'text', isCheck: true },
	{ key: 'receiptQty', colWidth: '', title: '收貨數量', type: 'input', isCheck: true, isRequired: true },
	{ key: 'receiptDate', colWidth: '150', title: '收貨時間', type: 'time', isCheck: true, isRequired: true },
]);
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
			{ key: 'dispatchQty', colWidth: '', title: '發料數量', type: 'text', isCheck: true },
			{ key: 'dispatcher', colWidth: '', title: '發料人', type: 'text', isCheck: true },
			{ key: 'dispatchTime', colWidth: '', title: '發料時間', type: 'text', isCheck: true },
			{ key: 'receiveStorageType', colWidth: '120', title: '領用倉庫類型', type: 'text', isCheck: true },
			{ key: 'receiveSLocation', colWidth: '120', title: '領用倉庫位置', type: 'text', isCheck: true },
			{ key: 'codeManageModeText', colWidth: '130', title: '二維碼管理模式', type: 'text', isCheck: true },
			{ key: 'dispatchDescribe', colWidth: '', title: '發料備註', type: 'text', isCheck: true },
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
			{ label: '料號', prop: 'matNo', required: false, type: 'input', lg: 6, xl: 6 },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{ label: '廠商', prop: 'vendor', required: false, type: 'input' },
			{
				label: '發料人',
				prop: 'dispatcher',
				required: false,
				type: 'input',
				placeholder: '請輸入發料人',
			},
			{
				label: '領用倉庫類型',
				prop: 'receiveStorageType',
				required: false,
				type: 'select',
				placeholder: '',
				options: [],
				lg: 6,
				xl: 6,
			},
			{
				label: '領用倉庫位置',
				prop: 'receiveSLocation',
				required: false,
				type: 'input',
				placeholder: '請輸入選擇領用倉庫位置',
				// options: [],
				// loading: true,
				// filterable: true,
				// remote: true,
				// remoteShowSuffix: true,
			},
			{ label: '發料時間', prop: 'dispatchTime', required: false, type: 'dateRange' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '入庫', color: '#e6a23c', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {},
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '表格打印演示',
		//入库弹窗
		dialogConfig: [
			{ label: '送樣單號:', prop: 'sampleNo', placeholder: '', required: false, type: 'text' },
			{ label: '料號:', prop: 'matNo', placeholder: '', required: false, type: 'text' },
			{ label: '圖紙編號:', prop: 'drawNo', placeholder: '', required: false, type: 'text' },
			{ label: '品名-中文:', prop: 'nameCh', placeholder: '', required: false, type: 'text' },
			{ label: '品名-英文:', prop: 'nameEn', placeholder: '', required: false, type: 'text' },
			{ label: '廠商代碼:', prop: 'vendorCode', placeholder: '', required: false, type: 'text' },
			{ label: '廠商名稱:', prop: 'vendorName', placeholder: '', required: false, type: 'text' },
			{ label: '發料數量:', prop: 'dispatchQty', placeholder: '', required: false, type: 'text' },
			{ label: '發料人:', prop: 'dispatcher', placeholder: '', required: false, type: 'text' },
			{ label: '發料時間:', prop: 'dispatchTime', placeholder: '', required: false, type: 'text' },
			{ label: '領用倉庫類型:', prop: 'receiveStorageType', placeholder: '', required: false, type: 'text' },
			{ label: '領用倉庫位置:', prop: 'receiveSLocation', placeholder: '', required: false, type: 'text' },
			{ label: '發料備註:', prop: 'dispatchDescribe', placeholder: '', required: false, type: 'text', xs: 24, sm: 24, md: 24, lg: 24, xl: 24 },
			{
				type: 'button',
				label: '查看發料附件',
				placeholder: '',
				prop: 'attachments',
				required: false,
				isCheck: false,
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
			{
				type: 'textarea',
				label: '入庫備註:',
				placeholder: '請輸入備註',
				prop: 'entryDescribe',
				required: false,
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
			{
				label: '掃碼數量:',
				prop: 'stockqty',
				required: false,
				type: 'text',
				placeholder: '',
				xs: 24,
				sm: 12,
				md: 8,
				lg: 8,
				xl: 8,
			},
			{
				label: '掃碼錄入',
				prop: 'scan',
				placeholder: '',
				required: false,
				type: 'button',
				xs: 4,
				sm: 4,
				md: 4,
				lg: 4,
				xl: 4,
				disabled: false,
			},
		],
		innerDialogConfig: [
			{
				label: '掃碼入庫:',
				prop: 'sacnstockqty',
				placeholder: '請將光標放到此處掃碼',
				required: false,
				type: 'sacnstockqtyInput',
				xs: 12,
				sm: 12,
				md: 20,
				lg: 20,
				xl: 20,
			},
			{
				label: '手動錄入:',
				prop: 'inputQty',
				placeholder: '請輸入二維碼',
				required: false,
				type: 'sacnstockqtyInput',
				xs: 12,
				sm: 12,
				md: 20,
				lg: 20,
				xl: 20,
			},
			{
				label: '添加',
				prop: 'add',
				placeholder: '',
				required: false,
				type: 'button',
				xs: 4,
				sm: 4,
				md: 4,
				lg: 4,
				xl: 4,
			},
			{
				label: '掃碼數量:',
				prop: 'stockqty',
				placeholder: '1',
				required: false,
				type: 'text',
				xs: 12,
				sm: 12,
				md: 12,
				lg: 12,
				xl: 12,
			},
			{
				label: '掃碼信息:',
				prop: 'codeList',
				placeholder: '請輸入掃碼信息',
				required: false,
				type: 'tagsarea',
				tag: true,
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
		],
	},
});
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'sampleNo', colWidth: '', title: '送樣單號', type: 'text', isCheck: true },
			{ key: 'samplePutStorageNo', colWidth: '', title: '入庫單號', type: 'text', isCheck: true },
			{ key: 'checkNo', colWidth: '', title: '驗收單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '100', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '100', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'reqMatNo', colWidth: '', title: '請購料號', type: 'text', isCheck: true },
			{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true },
			{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true },
			{ key: 'qty', colWidth: '', title: '入庫數量', type: 'text', isCheck: true },
			{ key: 'putStorageTime', colWidth: '', title: '入庫時間', type: 'text', isCheck: true },
			{ key: 'storageType', colWidth: '', title: '倉庫類型', type: 'text', isCheck: true },
			{ key: 'sLocation', colWidth: '', title: '倉庫位置', type: 'text', isCheck: true },
			{ key: 'dispatcher', colWidth: '', title: '發料人', type: 'text', isCheck: true },
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
			{ label: '送樣單號', prop: 'sampleNo', required: false, type: 'input' },
			{ label: '入庫單號', prop: 'samplePutStorageNo', required: false, type: 'input', lg: 6, xl: 6 },
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{ label: '廠商', prop: 'vendor', required: false, type: 'input' },
			{ label: '入庫時間', prop: 'putStorageTime', required: false, type: 'dateRange', lg: 6, xl: 6 },
			{
				label: '倉庫類型',
				prop: 'storageType',
				required: false,
				type: 'select',
				placeholder: '',
				options: [],
			},
			{ label: '倉庫位置', prop: 'sLocation', required: false, type: 'input', placeholder: '請輸入倉庫位置' },
			{ label: '發料人', prop: 'dispatcher', required: false, type: 'input' },
			{ label: '請購料號', prop: 'reqMatNo', required: false, type: 'input' },
			{ label: '驗收單號', prop: 'checkNo', required: false, type: 'input', lg: 6, xl: 6 },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'detail', name: '查看二維碼', color: '#1890ff', isSure: false, icon: 'ele-View' }],
		// 给后端的数据
		form: {},
		dialogConfig: [],
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// 改变仓库类型下拉
const selectChangeStoreType = (vals: string, prop: string, form: EmptyObjectType) => {
	if (prop === 'receiveStorageType') {
		form.receiveSLocation = '';
	}
};
// 領用倉庫類型下拉选项数据
const getOptionsData = async () => {
	const res = await getLegalStoreTypesApi();
	const option = res.data.map((item: any) => {
		return { label: item, text: item, value: item };
	});
	state.tableData.search[6].options = option;
	state.tableData.dialogConfig![5].options = option;
	secondState.tableData.search?.forEach((item) => {
		if (item.prop === 'storageType') {
			item.options = option;
		}
	});
};
let option: EmptyArrayType = [];
const remoteMethod = (query: string, form: EmptyObjectType, prop: string) => {
	if (query) {
		if (prop === 'receiveSLocation') {
			state.tableData.search[6].loading = true;
		} else {
			state.tableData.search[4].loading = true;
		}
		setTimeout(async () => {
			if (prop === 'receiveSLocation') {
				const res = await getQueryStoreHouseNoPageApi(form.storeType, query);
				option = res.data.map((item: EmptyObjectType) => {
					return { value: `${item.storeId}`, label: `${item.storeType}`, text: `${item.sLocation}` };
				});
				state.tableData.search?.forEach((item) => {
					if (item.prop === 'receiveSLocation') {
						item.loading = false;
						item.options = option.filter((item: EmptyObjectType) => {
							return item.text.toLowerCase().includes(query.toLowerCase()) || item.label.toLowerCase().includes(query.toLowerCase());
						});
					}
				});
			} else {
				// 發料人下拉
				// const res = await getEngieerGroupApi(query);
				// state.tableData.search[4].loading = false;
				// let options = res.data.map((item: EmptyObjectType) => {
				// 	return { value: `${item.userid}`, label: `${item.username}` };
				// });
				// state.tableData.search[4].options = options.filter((item: EmptyObjectType) => {
				// 	return item.label.toLowerCase().includes(query.toLowerCase()) || item.value.toLowerCase().includes(query.toLowerCase());
				// });
			}
		}, 500);
	} else {
		if (prop === 'receiveSLocation') {
			state.tableData.search[6].options = [];
		} else {
			state.tableData.search[4].options = [];
		}
	}
};
// 初始化列表数据
const getTableData = async (datas: EmptyObjectType) => {
	const form = datas.form;
	let res = null;
	option.forEach((item) => {
		if (item.value === form.receiveSLocation) {
			form.receiveSLocation = item.text;
		}
	});
	const codeManageModeMap: EmptyObjectType = {
		0: '有碼管理',
		1: '無碼管理',
	};
	if (activeName.value === 'first') {
		let data = {
			...form,
			dispatchTime: form.dispatchTime,
			startDispatchTime: form.dispatchTime && form.dispatchTime[0],
			endDispatchTime: form.dispatchTime && form.dispatchTime[1],
			page: datas.page,
		};
		delete data.dispatchTime;
		res = await GetQueryStoragableSampleCheckDetailsApi(data);
	} else {
		let data = {
			...form,
			page: datas.page,
			putStorageTime: form.putStorageTime,
			startPutStorageTime: form.putStorageTime && form.putStorageTime[0],
			endPutStorageTime: form.putStorageTime && form.putStorageTime[1],
		};
		delete data.putStorageTime;
		res = await getQuerySamplePutStorageRecordApi(data);
		res.data.data.forEach((item: any) => {
			item.disabled = item.codeManageMode ? true : false;
		});
	}
	datas.data = res!.data.data;
	datas.data.forEach((item: any) => {
		item.stockqty = 0;
		item.codeManageModeText = codeManageModeMap[item.codeManageMode];
		item.dispatcher = `${item.dispatcher} / ${item.dispatcherName}`;
	});
	datas.config.total = res!.data.total;
	if (res!.status) {
		datas.config.loading = false;
	}
};
// 手動添加碼
const addButton = async (data: EmptyObjectType) => {
	let formInnerData = data.formInnerData;
	let formData = data.formData;
	if (formInnerData.codeList.length + 1 > formData.dispatchQty) {
		ElMessage.error(`掃碼數量超過發料數量，請勿繼續掃碼`);
		formInnerData['inputQty'] = null;
	} else if (formInnerData.codeList.includes(formInnerData['inputQty'])) {
		ElMessage.warning(`該條碼已存在，請勿重複掃碼`);
		formInnerData['inputQty'] = null;
	} else {
		formInnerData.codeList.push(formInnerData['inputQty']);
		const res = await getStockOperDraftAddCodesApi({
			draftId,
			codesToAdd: [formInnerData['inputQty']],
		});
		if (!res.status) {
			let errorCode = res.message.split('：');
			formInnerData.codeList.splice(formInnerData.codeList.indexOf(errorCode[1]), 1);
		} else {
			formInnerData['inputQty'] = null;
			ElMessage.success('掃碼成功');
		}
		formInnerData['stockqty'] = formInnerData.codeList.length;
		formData['stockqty'] = formInnerData.codeList.length;
	}
};
let oldEntryDescribe = '';
// 獲取焦點
const onInputFocus = (formData: EmptyObjectType) => {
	oldEntryDescribe = formData.entryDescribe;
};
// 描述失去焦點
const onInputBlur = async (formData: EmptyObjectType) => {
	if (oldEntryDescribe === formData.entryDescribe) return;
	const res = await getStockOperDraftModifyPutStorageDraftApi({
		draftId,
		describe: formData.entryDescribe,
	});
	res.status && ElMessage.success(`保存成功`);
};
// change掃碼錄入

const change = async (val: any, prop: string, state: any, iscontu: boolean) => {
	let { formInnerData, formData } = state;
	if (prop == 'sacnstockqty') {
		if (formInnerData.codeList.length + 1 > formData.dispatchQty) {
			ElMessage.error(`掃碼數量超過發料數量，請勿繼續掃碼`);
			formInnerData['sacnstockqty'] = null;
		} else if (formInnerData.codeList.includes(val)) {
			ElMessage.warning(`該條碼已存在，請勿重複掃碼`);
			formInnerData['sacnstockqty'] = null;
		} else {
			formInnerData.codeList.push(val);
			formInnerData['sacnstockqty'] = null;
			const res = await getStockOperDraftAddCodesApi({
				draftId,
				codesToAdd: [val],
			});
			if (!res.status) {
				let errorCode = res.message.split('：');
				formInnerData.codeList.splice(formInnerData.codeList.indexOf(errorCode[1]), 1);
			} else {
				ElMessage.success('掃碼成功');
			}
			formInnerData['stockqty'] = formInnerData.codeList.length;
			formData['stockqty'] = formInnerData.codeList.length;
		}
	}
};
// 點擊導入二維碼按鈕
const onImportQrcodeData = (formInnerData: EmptyObjectType) => {
	formInnerData.draftId = draftId;
};
// 清空條碼
const innnerDialogCancel = async (formData: EmptyObjectType, formInnerData: EmptyObjectType) => {
	if (formInnerData.codeList.length <= 0) return ElMessage.warning('數據已清空');
	ElMessageBox.confirm('確定清空嗎?', '提示', {
		confirmButtonText: '確 定',
		cancelButtonText: '取 消',
		type: 'warning',
		draggable: true,
	})
		.then(async () => {
			const res = await getStockOperDraftResetCodesOfPutStorageDraftApi(draftId);
			if (res.status) {
				formInnerData.codeList = [];
				formInnerData['stockqty'] = 0;
				formData['stockqty'] = 0;
			}
		})
		.catch(() => {});
};
// 嵌套弹窗提交
const innnerDialogSubmit = async (formInnerData: any, formData: any, isShowInnerDialog: boolean) => {
	// 防止用户用扫码枪扫数据之后又手动修改数量
	if (formInnerData.codeList.length != 0) {
		formInnerData.stockqty = formInnerData.codeList.length;
	}
	//如果存在需要存放扫码枪输入信息的字段
	state.tableData.innerDialogConfig &&
		state.tableData.innerDialogConfig.forEach((item: any) => {
			if (item.tag) {
				// formInnerData[item.prop] = [];
				formInnerData.codeList = formInnerData.codeList.map((item: any) => {
					return item;
				});
			}
		});
	const res = await getStockOperDraftModifyPutStorageDraftApi({
		draftId,
		stockqty: formData.stockqty,
		describe: formData.entryDescribe,
	});
	res.status && ElMessage.success(`保存成功`);
};
// 打开嵌套弹窗
const openInnerDialog = (state: any) => {
	let { formInnerData, formData } = state;
	formInnerData['stockqty'] = formInnerData.codeList.length;
};
// 打開查看二維碼按鈕
const openLookQrcodeDialog = async (scope: any) => {
	let res = await getCodesOfSamplePutStorageRecordApi(scope.row.samplePutStorageNo);
	if (res.data.length == 0) {
		ElMessage.error('暫無條碼數據');
	} else if (res.status) {
		qrCode.value = res.data;
		inventoryDialogRef.value?.openDialog();
	}
};
// 关闭tag标签
const handleTagClose = async (tag: any, state: EmptyObjectType) => {
	let { formInnerData, formData } = state;
	const res = await getStockOperDraftRemoveCodeFromPutStorageDraftApi({ draftId, codesToRemove: [tag] });
	if (res.status) {
		formInnerData.codeList.splice(formInnerData.codeList.indexOf(tag), 1);
		formInnerData['stockqty'] = formInnerData.codeList.length;
		formData['stockqty'] = formInnerData.codeList.length;
		ElMessage.success('刪除成功');
	}
};
let draftId = '';

// 打开入库弹窗
const openEntryDialog = async (scope: any) => {
	loadingBtn.value = false;
	state.tableData.dialogConfig?.forEach((item) => {
		if (item.prop === 'stockqty' || item.prop === 'scan') {
			if (scope.row.codeManageMode === 1) {
				item.type = 'null';
			} else {
				item.type = item.prop === 'stockqty' ? 'text' : 'button';
			}
		}
	});
	const res = await getOrCreatePutStorageDraftApi({ relationCheckId: scope.row.sampleCheckDetailId, putStorageType: 2 });
	scope.row.entryDescribe = res.data.describe;
	draftId = res.data.draftId;
	scope.row.stockqty = res.data.codes?.length || 0;
	entryJobDialogRef.value.openDialog('entry', scope.row, '入庫', { codeList: res.data.codes || [] });
};
const scanCodeEntry = async (formData: EmptyObjectType, btnConfig: EmptyObjectType) => {
	if (btnConfig.prop === 'scan') {
		entryJobDialogRef.value.openInnerDialog('掃碼錄入');
	} else {
		// 查看附件
		const res = await getOperAttachmentApi(5, formData.sampleCheckDetailId);
		if (res.status) {
			window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${res.data}`, '_blank');
		}
	}
};
//点击确认入库
const entrySubmit = async (ruleForm: object, type: string, formInnerData: EmptyObjectType) => {
	let obj: EmptyObjectType = { ...ruleForm };
	state.tableData.dialogConfig &&
		state.tableData.dialogConfig.forEach((item) => {
			if (item.prop == 'storageId' && item.options) {
				item.options.forEach((option) => {
					if (option.value == obj.storageId) {
						obj.sLocation = option.text;
						obj.storeType = option.label;
					}
				});
			}
		});

	obj.codeList = formInnerData.codeList;
	let submitData = {
		sampleCheckDetailId: obj.sampleCheckDetailId,
		// describe: obj.entryDescribe,
		// codes: obj.codeList,
	};
	if (obj.stockqty > obj.dispatchQty && !obj.codeManageMode) {
		ElMessage.error(`掃碼數量大於發料數量`);
	} else if (obj.stockqty < obj.dispatchQty && !obj.codeManageMode) {
		ElMessage.error(`掃碼數量小於發料數量，請繼續掃碼錄入`);
	} else {
		loadingBtn.value = true;
		const res = await getSamplePutStorageApi(submitData);
		if (res.status) {
			// onInputBlur(obj);
			ElMessage.success(`入庫成功`);
			ElMessageBox.confirm(`入庫單號：${res.data}`, '提示', {
				confirmButtonText: '確 定',
				showCancelButton: false,
				showClose: false,
				type: 'success',
				draggable: true,
			})
				.then(async () => {
					entryJobDialogRef.value.closeDialog();
				})
				.catch(() => {});
			getTableData(state.tableData);
		}
		loadingBtn.value = false;
	}
};
// 点击收货单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	// if (column.property === 'checkno') {
	// 	dilogTitle.value = '单号:' + row.reqNo;
	// 	changeStatus(header1.value, 500, false);
	// 	let data = { reqNo: row.reqNo };
	// 	getDetailData(data);
	// }
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
	getOptionsData();
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
</style>
