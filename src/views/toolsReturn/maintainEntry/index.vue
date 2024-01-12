<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="維修入庫" name="first">
			<TableSearch
				:search="state.tableData.search"
				@search="(data) => onSearch(data, state.tableData)"
				:searchConfig="state.tableData.searchConfig"
				labelWidth="100px"
			/>
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
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="維修入庫記錄" name="second">
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
			dialogWidth="40%"
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
			@inputBlur="onInputBlur"
			@inputFocus="onInputFocus"
		>
			<template #optionFat="{ row }">
				<span style="float: left; margin-right: 35px">{{ row.text }}</span>
				<span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ row.label }}</span>
			</template>
			<template #buttonFooter="{ row, data }">
				<el-button v-if="row.type === 'button'" type="primary" plain @click="addButton(data)">{{ row.label }}</el-button>
			</template>
		</Dialog>
	</el-tabs>
</template>

<script setup lang="ts" name="/toolsReturn/maintainEntry">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox, FormInstance, TabsPaneContext } from 'element-plus';
// 引入接口
import {
	GetQueryStorableRepairCheckDetailsApi,
	GetPutStorageApi,
	GetQueryRepairPutStorageRecordApi,
	getCodesOfRepairPutStorageApi,
} from '/@/api/toolsReturn/maintainEntry';
import { GetUserManagedStoreHouseApi } from '/@/api/requistManage/entryJob';
import { useI18n } from 'vue-i18n';
import { getLegalStoreTypesExceptIdleStoreApi } from '/@/api/global';
import {
	getOrCreatePutStorageDraftApi,
	getStockOperDraftAddCodesApi,
	getStockOperDraftModifyPutStorageDraftApi,
	getStockOperDraftRemoveCodeFromPutStorageDraftApi,
	getStockOperDraftResetCodesOfPutStorageDraftApi,
} from '/@/api/toolsReturn/sampleStorage';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
const qrCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/qrCodeDialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const entryJobDialogRef = ref();
const loadingBtn = ref(false);
const inventoryDialogRef = ref();
let qrCode = ref<EmptyArrayType>([]);
// tags的数据
const tags = ref<EmptyArrayType<string>>([]);
// 单元格样式
const cellStyle = ref();
// 弹窗标题
const dilogTitle = ref();
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
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			// { key: 'repairReceiveNo', colWidth: '', title: '維修收貨單號', type: 'text', isCheck: true },
			// { key: 'reqno', colWidth: '', title: '申请单号', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			// { key: 'checkQty', colWidth: '', title: '驗收數量', type: 'text', isCheck: true },
			// { key: 'passQty', colWidth: '', title: '合格數量', type: 'text', isCheck: true },
			// { key: 'failQty', colWidth: '', title: '不合格數量', type: 'text', isCheck: true },
			{ key: 'dispatcher', colWidth: '', title: '發料人', type: 'text', isCheck: true },
			{ key: 'dispatchTime', colWidth: '', title: '發料時間', type: 'text', isCheck: true },
			{ key: 'qty', colWidth: '', title: '發料數量', type: 'text', isCheck: true },
			{ key: 'receiveStorageType', colWidth: '', title: '領用倉庫類型', type: 'text', isCheck: true },
			{ key: 'receiveSLocation', colWidth: '', title: '領用倉庫位置', type: 'text', isCheck: true },
			{ key: 'codeManageModeText', colWidth: '', title: '二維碼管理模式', type: 'text', isCheck: true },
			// { key: 'runstatus', colWidth: '', title: '状态', type: 'status', isCheck: true },
			// { key: 'isstorage', colWidth: '', title: '是否入库', type: 'text', isCheck: true },
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
			{ label: '維修單號', prop: 'repairNo', required: false, type: 'input' },
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{ label: '發料人', prop: 'dispatcher', required: false, type: 'input' },
			{
				label: '領用倉庫類型',
				prop: 'receiveStorageType',
				required: false,
				type: 'select',
				options: [],
			},
			{
				label: '領用倉庫位置',
				prop: 'receiveSLocation',
				required: false,
				type: 'input',
				placeholder: '請輸入倉庫位置',
				// options: [],
				// loading: true,
				// filterable: true,
				// remote: true,
				// remoteShowSuffix: true,
				// lg: 6,
				// xl: 6,
			},
			{ label: '發料時間', prop: 'dispatchDate', required: false, type: 'dateRange' },
			// { label: '維修驗收單號', prop: 'repairCheckNo', required: false, type: 'input' },
			// { label: '維修收貨單號', prop: 'repairReceiveNo', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '入庫', color: '#e6a23c', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			// repairCheckNo: '',
		},
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '表格打印演示',
		//入库弹窗
		dialogConfig: [
			// { label: '入库单号:', prop: 'putno', placeholder: '请输入入库单号', required: false, type: 'text', xs: 24, sm: 8, md: 8, lg: 8, xl: 8 },
			{ label: '維修單號:', prop: 'repairNo', placeholder: '', required: false, type: 'text' },
			{ label: '料號:', prop: 'matNo', placeholder: '', required: false, type: 'text' },
			{ label: '圖紙編號:', prop: 'drawNo', placeholder: '', required: false, type: 'text' },
			{ label: '品名-中文:', prop: 'nameCh', placeholder: '', required: false, type: 'text' },
			{ label: '品名-英文:', prop: 'nameEn', placeholder: '', required: false, type: 'text' },
			{ label: '發料時間:', prop: 'dispatchTime', placeholder: '', required: false, type: 'text' },
			{ label: '發料數量:', prop: 'qty', placeholder: '', required: false, type: 'text' },
			{ label: '發料人:', prop: 'dispatcher', placeholder: '', required: false, type: 'text' },
			{ label: '二維碼管理:', prop: 'codeManageModeText', placeholder: '', required: false, type: 'text' },
			{ label: '領用倉庫類型:', prop: 'receiveStorageType', placeholder: '', required: false, type: 'text' },
			{ label: '領用倉庫位置:', prop: 'receiveSLocation', placeholder: '', required: false, type: 'text' },
			// { label: '厂商代码:', prop: 'vendorCode', placeholder: '请输入厂商代码', required: false, type: 'text', xs: 24, sm: 8, md: 8, lg: 8, xl: 8 },
			// {
			// 	label: '厂商名称:',
			// 	prop: 'vendorName',
			// 	placeholder: '请输入厂商名称',
			// 	required: false,
			// 	type: 'text',
			// 	xs: 24,
			// 	sm: 8,
			// 	md: 8,
			// 	lg: 16,
			// 	xl: 16,
			// },
			// { label: '驗收合格數量:', prop: 'passQty', placeholder: '', required: false, type: 'text' },
			// 这个字段待定
			// {
			// 	label: '驗收時間:',
			// 	prop: 'checkTime',
			// 	placeholder: '',
			// 	required: false,
			// 	type: 'text',
			// 	xs: 24,
			// 	sm: 24,
			// 	md: 24,
			// 	lg: 24,
			// 	xl: 24,
			// },
			// validateForm: 'number',
			// 	message: '请输入正整数',
			// {
			// 	label: '收貨倉庫:',
			// 	prop: 'storageId',
			// 	placeholder: '請選擇收貨倉庫',
			// 	required: true,
			// 	type: 'select',
			// 	options: [],
			// },
			{
				type: 'textarea',
				label: '備註:',
				placeholder: '請輸入備註',
				prop: 'describe',
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
				placeholder: '',
				required: false,
				type: 'text',
				xs: 24,
				sm: 12,
				md: 6,
				lg: 6,
				xl: 6,
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
				placeholder: '',
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
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			{ key: 'repairPutNo', colWidth: '', title: '入庫單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'dispatcher', colWidth: '', title: '發料人', type: 'text', isCheck: true },
			{ key: 'dispatchTime', colWidth: '', title: '發料時間', type: 'text', isCheck: true },
			{ key: 'putQty', colWidth: '', title: '入庫數量', type: 'text', isCheck: true },
			{ key: 'storageType', colWidth: '', title: '倉庫類型', type: 'text', isCheck: true },
			{ key: 'sLocation', colWidth: '', title: '倉庫位置', type: 'text', isCheck: true },
			{ key: 'putStorageTime', colWidth: '', title: '入庫時間', type: 'text', isCheck: true },
			{ key: 'describe', colWidth: '', title: '備註', type: 'text', isCheck: true },
			{ key: 'codeManageModeText', colWidth: '130', title: '二維碼管理模式', type: 'text', isCheck: true },
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
			{ label: '維修單號', prop: 'repairNo', required: false, type: 'input' },
			{ label: '入庫單號', prop: 'repairPutNo', required: false, type: 'input' },
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{ label: '發料人', prop: 'dispatcher', required: false, type: 'input' },
			{
				label: '倉庫類型',
				prop: 'storageType',
				required: false,
				type: 'select',
				options: [],
			},
			{ label: '倉庫位置', prop: 'sLocation', required: false, type: 'input', placeholder: '請輸入倉庫位置' },
			{ label: '入庫時間', prop: 'putStorageTime', required: false, type: 'dateRange' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'detail', name: '查看二維碼', color: '#1890ff', isSure: false, icon: 'ele-View' }],
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
// cellStyle.value = changeToStyle([1]);
// 下拉选项数据
const getOptionsData = async () => {
	let res = await GetUserManagedStoreHouseApi();
	if (state.tableData.dialogConfig) {
		state.tableData.dialogConfig.forEach((option) => {
			if (option.prop == 'storageId') {
				option.options = res.data.map((item: any) => {
					return { label: item.storeType, text: item.sLocation, value: item.storeId };
				});
			}
		});
	}
};
// 類型下拉框数据
const getSelect = async () => {
	const res = await getLegalStoreTypesExceptIdleStoreApi();
	const option = res.data.map((item: any) => {
		return { label: item, text: item, value: item };
	});
	state.tableData.search?.forEach((item) => {
		if (item.prop === 'receiveStorageType') {
			item.options = option;
		}
	});
	secondState.tableData.search?.forEach((item) => {
		if (item.prop === 'storageType') {
			item.options = option;
		}
	});
};
// 初始化列表数据
const getTableData = async (datas: EmptyObjectType) => {
	const form = datas.form;
	let res = null;
	const codeManageModeMap: EmptyObjectType = {
		0: '有碼管理',
		1: '無碼管理',
	};
	if (activeName.value === 'first') {
		let data = {
			...form,
			dispatchDate: form.dispatchDate,
			startDispatchTime: form.dispatchDate && form.dispatchDate[0],
			endDispatchTime: form.dispatchDate && form.dispatchDate[1],
			page: datas.page,
		};
		delete data.dispatchDate;
		res = await GetQueryStorableRepairCheckDetailsApi(data);
	} else {
		let data = {
			...form,
			page: datas.page,
			putStorageTime: form.putStorageTime,
			startPutStorageTime: form.putStorageTime && form.putStorageTime[0],
			endPutStorageTime: form.putStorageTime && form.putStorageTime[1],
		};
		delete data.putStorageTime;
		res = await GetQueryRepairPutStorageRecordApi(data);
		res.data.data.forEach((item: any) => {
			item.disabled = item.codeManageMode ? true : false;
		});
	}
	res.data.data.forEach((item: any) => {
		item.stockqty = 0;
		item.codeManageModeText = codeManageModeMap[item.codeManageMode];
		item.dispatcher = `${item.dispatcher} / ${item.dispatcherName}`;
	});
	datas.data = res!.data.data;
	datas.config.total = res!.data.total;
	if (res!.status) {
		datas.config.loading = false;
	}
};
// 手動添加碼
const addButton = async (data: EmptyObjectType) => {
	let formInnerData = data.formInnerData;
	let formData = data.formData;
	if (formInnerData.codeList.length + 1 > formData.qty) {
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
let oldDescribe = '';
// 獲取焦點
const onInputFocus = (formData: EmptyObjectType) => {
	oldDescribe = formData.describe;
};
// 描述失去焦點
const onInputBlur = async (formData: EmptyObjectType) => {
	if (oldDescribe === formData.describe) return;
	const res = await getStockOperDraftModifyPutStorageDraftApi({
		draftId,
		describe: formData.describe,
	});
	res.status && ElMessage.success(`保存成功`);
};
// change
const change = async (val: any, prop: string, state: any, iscontu: boolean) => {
	let { formInnerData, formData } = state;
	if (prop == 'sacnstockqty') {
		if (formInnerData.codeList.length + 1 > formData.qty) {
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
// 清空
const innnerDialogCancel = (formData: EmptyObjectType, formInnerData: EmptyObjectType) => {
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
const innnerDialogSubmit = async (formInnerData: any, formData: any) => {
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
		describe: formData.describe,
		stockqty: formData.stockqty,
	});
	res.status && ElMessage.success(`保存成功`);
};
// 打开嵌套弹窗
const openInnerDialog = (state: any) => {
	let { formInnerData, formData } = state;
	formInnerData['stockqty'] = formInnerData.codeList.length;
	formData['stockqty'] = formInnerData.codeList.length;
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
// 打開查看二維碼按鈕
const openLookQrcodeDialog = async (scope: any) => {
	let res = await getCodesOfRepairPutStorageApi(scope.row.repairPutNo);
	if (res.data.length == 0) {
		ElMessage.error('暫無條碼數據');
	} else if (res.status) {
		qrCode.value = res.data;
		inventoryDialogRef.value?.openDialog();
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
	const res = await getOrCreatePutStorageDraftApi({ relationCheckId: scope.row.repairCheckDetailId, putStorageType: 1 });
	scope.row.describe = res.data.describe;
	draftId = res.data.draftId;
	scope.row.stockqty = res.data.codes?.length || 0;
	entryJobDialogRef.value.openDialog('entry', scope.row, '入庫', { codeList: res.data.codes || [] });
};
const scanCodeEntry = () => {
	entryJobDialogRef.value.openInnerDialog('掃碼錄入');
};
//点击确认入库
const entrySubmit = async (ruleForm: object, type: string, formInnerData: EmptyObjectType) => {
	let obj: EmptyObjectType = { ...ruleForm };
	state.tableData.dialogConfig &&
		state.tableData.dialogConfig.forEach((option) => {
			if (option.prop == 'storageId' && option.options) {
				option.options.forEach((item) => {
					if (item.value == obj.storageId) {
						obj.sLocation = item.text;
						obj.storeType = item.label;
					}
				});
			}
		});
	obj.codeList = formInnerData.codeList;

	let submitData = {
		repairCheckDetailId: obj.repairCheckDetailId,
		// runId: obj.runid,
		// storageId: obj.storageId,
		// describe: obj.describe,
		// codes: obj.codeList,
		// checkno: obj.checkno,
		// creator: obj.creator,
		// matno: obj.matno,
		// namech: obj.namech,
		// nameen: obj.nameen,
		// vendorcode: obj.vendorcode,
		// vendorname: obj.vendorname,
		// checkqty: obj.checkQty,
		// putQty: obj.stockqty,
		// stockcode: obj.stockcode,
		// storeType: obj.storeType,
		// sLocation: obj.sLocation,
	};
	if (obj.stockqty > obj.passQty && !obj.codeManageMode) {
		ElMessage.error(`有碼數量大於驗收合格數量`);
	} else if (obj.stockqty < obj.passQty && !obj.codeManageMode) {
		ElMessage.error(`有碼數量小於驗收合格數量，請繼續掃碼錄入`);
	}
	// else if (submitData.Codes && submitData.putQty < submitData.Codes.length) {
	// 	ElMessage.error(`有码数量小于扫码数量`);
	// } else if (submitData.putQty != submitData.checkqty) {
	// 	ElMessageBox.confirm('入库数量与验收数量不一致，是否继续提交', '提示', {
	// 		confirmButtonText: '确认',
	// 		cancelButtonText: '取消',
	// 		type: 'warning',
	// 		buttonSize: 'default',
	// 	})
	// 		.then(async () => {
	// 			const res = await GetPutStorageApi(submitData);
	// 			if (res.status) {
	// 				ElMessage.success(`入库成功`);
	// 				entryJobDialogRef.value.closeDialog();
	// 				getTableData();
	// 			}
	// 		})
	// 		.catch(() => {
	// 			// ElMessage({
	// 			// 	type: 'info',
	// 			// 	message: 'Delete canceled',
	// 			// });
	// 		});
	// }
	else {
		// console.log(submitData);
		loadingBtn.value = true;
		// console.log(submitData);
		const res = await GetPutStorageApi(submitData);
		if (res.status) {
			ElMessage.success(`入庫成功`);
			entryJobDialogRef.value.closeDialog();
			getTableData(state.tableData);
		}
	}
	loadingBtn.value = false;
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
// 根据弹出窗不一样展现的配置不一样
// const changeStatus = (header: EmptyArrayType, height: number, isShow: boolean) => {
// 	let tableData = dialogState.tableData;
// 	let config = tableData.config;
// 	tableData.header = header;
// 	config.height = height;
// 	config.isOperate = isShow;
// 	config.isInlineEditing = isShow;
// };
// 提交
// const onSubmit = async (formEl: FormInstance | undefined) => {
// 	if (!formEl) return;
// 	await formEl.validate(async (valid: boolean) => {
// 		if (!valid) return ElMessage.warning(t('表格項必填未填'));
// 		// if (!dialogState.tableData.form['sendTime']) return ElMessage.warning(t('请填写收货时间'));
// 		let allData: EmptyObjectType = {};
// 		allData = { ...dialogState.tableData.form };
// 		allData['details'] = dialogState.tableData.data;
// 		const res = await getAddReceiveApi(allData);
// 		if (res.status) {
// 			ElMessage.success(t('收货成功'));
// 			arriveJobDialogVisible.value = false;
// 		}
// 	});
// };
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
	getOptionsData();
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
</style>
