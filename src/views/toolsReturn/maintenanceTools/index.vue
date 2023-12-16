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
				@cellclick="matnoClick"
				:cellStyle="cellStyle"
				@onOpenOtherDialog="openReturnDialog"
			/>
			<Dialog
				ref="repairReturnDialogRef"
				:dialogConfig="dialogState.tableData.dialogConfig"
				:innerDialogConfig="dialogState.tableData.innerDialogConfig"
				dialogWidth="40%"
				dialogType="nestDialogConfig"
				@addData="returnSubmit"
				@dailogFormButton="scanCodeEntry"
				@commonInputHandleChange="change"
				:tagsData="tags"
				@innnerDialogCancel="innnerDialogCancel"
				@innnerDialogSubmit="innnerDialogSubmit"
				@openInnerDialog="openInnerDialog"
				@handleTagClose="handleTagClose"
				@selectChange="selectChange"
				@remoteMethod="remoteMethod"
				@inputBlur="onInputBlur"
				:loadingBtn="loadingBtn"
			>
				<template #optionFat="{ row }" v-if="dilogTitle === '轉倉'">
					<span style="float: left">{{ row.text }}</span>
					<span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ row.label }}</span>
				</template>
				<template #buttonFooter="{ row, data }">
					<el-button v-if="row.type === 'button'" type="primary" plain @click="addButton(data)">{{ row.label }}</el-button>
				</template>
			</Dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="/toolsReturn/maintenanceTools">
import { defineAsyncComponent, reactive, ref, onMounted, computed, nextTick } from 'vue';
import type { FormInstance } from 'element-plus';

import { ElMessage } from 'element-plus';
// 引入接口
import { getStockListApi, ExitStoreApi, getExitReasonApi, getTransferStorageApi } from '/@/api/toolsReturn/maintentanceTools';
import { getAdminNamesOfStoreHouseApi, getQueryStoreHouseExceptIdleStoreNoPageApi, getUserNameApi } from '/@/api/global';

import { useI18n } from 'vue-i18n';
import type { TabsPaneContext } from 'element-plus';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
const activeName = ref('first');

const handleClick = (tab: TabsPaneContext, event: Event) => {
	// console.log(tab, event);
};
// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const loadingBtn = ref(false);
const repairReturnDialogRef = ref();
// tags的数据
const tags = ref<EmptyArrayType<string>>([]);
// 单元格样式
const cellStyle = ref();

// 弹窗标题
const dilogTitle = ref();
const header = ref([]);
const header1 = ref([
	{ key: 'matNo', colWidth: '', title: 'message.pages.matNo', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
	{ key: 'drawNo', colWidth: '', title: 'message.pages.drawNo', type: 'text', isCheck: true },
	{ key: 'specs', colWidth: '', title: 'message.pages.specs', type: 'text', isCheck: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matno', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
			// { key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
			// { key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
			{ key: 'storageType', colWidth: '', title: '倉庫類型', type: 'text', isCheck: true },
			{ key: 'sLocation', colWidth: '', title: '倉庫位置', type: 'text', isCheck: true },
			{ key: 'stockqty', colWidth: '', title: '庫存總量', type: 'text', isCheck: true },
			{ key: 'qrstockqty', colWidth: '', title: '有碼庫存量', type: 'text', isCheck: true },
			{ key: 'notqrstockqty', colWidth: '', title: '無碼庫存量', type: 'text', isCheck: true },
			{ key: 'codeManageModeText', colWidth: '', title: '二維碼管理模式', type: 'text', isCheck: true },
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
			operateWidth: 220, //操作栏宽度，如果操作栏有几个按钮就自己定宽度
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [
			{ type: 'transferStorage', name: '轉倉', color: '#36C78B', isSure: false, icon: 'ele-Position' },
			{
				type: 'sendReceive',
				name: '退庫',
				color: '#e6a23c',
				isSure: false,
				icon: 'ele-EditPen',
			},
		],
		// 给后端的数据
		form: {
			matNo: '',
			matName: '',
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
// const secondState = reactive<TableDemoState>({
// 	tableData: {
// 		// 列表数据（必传）
// 		data: [],
// 		// 表头内容（必传，注意格式）
// 		header: [
// 			{ key: 'matno', colWidth: '', title: '料号', type: 'text', isCheck: true },
// 			{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
// 			{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
// 			{ key: 'storageType', colWidth: '', title: '倉庫類型', type: 'text', isCheck: true },
// 			{ key: 'sLocation', colWidth: '', title: '倉庫位置', type: 'text', isCheck: true },
// 			{ key: 'stockqty', colWidth: '', title: '数量', type: 'text', isCheck: true },
// 			{ key: 'qrstockqty', colWidth: '', title: '原因', type: 'text', isCheck: true },
// 		],
// 		// 配置项（必传）

// 		config: {
// 			total: 0, // 列表总数
// 			loading: true, // loading 加载
// 			isBorder: false, // 是否显示表格边框
// 			isSerialNo: true, // 是否显示表格序号
// 			isSelection: false, // 是否显示表格多选
// 			isOperate: true, // 是否显示表格操作栏
// 			isButton: false, //是否显示表格上面的新增删除按钮
// 			isInlineEditing: false, //是否是行内编辑
// 			isTopTool: true, //是否有表格右上角工具
// 			isPage: true, //是否有分页
// 			operateWidth: 220, //操作栏宽度，如果操作栏有几个按钮就自己定宽度
// 		},
// 		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
// 		search: [
// 			{ label: '料号', prop: 'matNo', required: false, type: 'input' },
// 			{ label: '品名', prop: 'matName', required: false, type: 'input' },
// 		],
// 		searchConfig: {
// 			isSearchBtn: true,
// 		},
// 		btnConfig: [
// 			{ type: 'transferStorage', name: '详情', color: '#36C78B', isSure: false, icon: 'ele-Position' },
// 			{
// 				type: 'sendReceive',
// 				name: '送签',
// 				color: '#e6a23c',
// 				isSure: false,
// 				icon: 'ele-EditPen',
// 			},
// 		],
// 		// 给后端的数据
// 		form: {
// 			matNo: '',
// 			matName: '',
// 		},
// 		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
// 		page: {
// 			pageNum: 1,
// 			pageSize: 10,
// 		},
// 		// 打印标题
// 		printName: '表格打印演示',
// 	},
// });
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
			isOperate: false, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			isDialogTab: true, //是否是弹窗里面的表格
			height: 500,
		},
		// 给后端的数据
		form: {},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [],
		btnConfig: [],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		//退库弹窗
		dialogConfig: [
			{ label: '料號', prop: 'matno', placeholder: '', required: false, type: 'text' },
			{ label: '品名-中文', prop: 'nameCh', placeholder: '', required: false, type: 'text' },
			{ label: '品名-英文', prop: 'nameEn', placeholder: '', required: false, type: 'text' },
			{ label: '倉庫類型', prop: 'storageType', placeholder: '', required: false, type: 'text' },
			{ label: '倉庫位置', prop: 'sLocation', placeholder: '', required: false, type: 'text' },
			{ label: '庫存總量', prop: 'stockqty', placeholder: '', required: false, type: 'text' },
			// { label: '厂商代码', prop: 'vendorcode', placeholder: '', required: false, type: 'text', xs: 24, sm: 8, md: 12, lg: 8, xl: 8 },
			// { label: '厂商名称', prop: 'vendorname', placeholder: '', required: false, type: 'text', xs: 24, sm: 12, md: 12, lg: 12, xl: 12 },
			{ label: 'DRI', prop: 'dri', placeholder: '', required: true, type: 'input' },
			{ label: '姓名', prop: 'userName', placeholder: '', required: false, type: 'text' },
			{
				label: '退庫類型',
				prop: 'exitType',
				placeholder: '請選擇退庫類型',
				required: true,
				bindOthers: 'reasonId',
				type: 'select',
				options: [
					{ value: 1, label: '維修', text: '維修' },
					{ value: 2, label: '閒置', text: '閒置' },
					{ value: 3, label: '報廢', text: '報廢' },
				],
			},
			{
				label: '退庫原因',
				prop: 'reasonId',
				placeholder: '請選擇退庫原因',
				required: true,
				type: 'select',
				options: [],
			},

			{
				label: '接收倉庫:',
				prop: 'storageId',
				placeholder: '請選擇接收倉庫',
				required: true,
				type: 'select',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
			},
			{
				label: '出庫日期:',
				prop: 'outDate',
				placeholder: '請選擇出庫日期',
				required: true,
				type: 'date',
				isdisabledDate: true,
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
				label: '備註:',
				prop: 'describe',
				placeholder: '請輸入備註',
				required: false,
				type: 'textarea',
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
			{
				label: '退庫數量',
				prop: 'exitQty',
				placeholder: '請輸入退庫數量',
				validateForm: 'number',
				message: '請輸入正整數',
				required: true,
				type: 'input',
				xs: 24,
				sm: 8,
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
				label: '掃碼退庫:',
				prop: 'sacnexitqty',
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
				prop: 'exitQty',
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
// 单元格字体颜色
const changeToStyle = (indList: number[]) => {
	// return ({ columnIndex }: any) => {
	// 	for (let j = 0; j < indList.length; j++) {
	// 		let ind = indList[j];
	// 		if (columnIndex === ind) {
	// 			return { color: 'var(--el-color-primary)', cursor: 'pointer' };
	// 		}
	// 	}
	// };
};
cellStyle.value = changeToStyle([1]);
// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	const codeManageModeMap: EmptyObjectType = {
		0: '有碼管理',
		1: '無碼管理',
	};
	let data = {
		matNo: form.matNo,
		matName: form.matName,
		page: state.tableData.page,
	};
	const res = await getStockListApi(data);
	res.data.data.forEach((item: any) => {
		item.exitQty = item.codeManageMode === 0 ? 0 : null;
		item.codeManageModeText = codeManageModeMap[item.codeManageMode];
	});
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
const exitTypeMap: EmptyObjectType = {
	1: 'RepairReason',
	2: 'IdleReason',
	3: 'UselessReason',
};
//退库弹窗里的退库类型和退库原因选择时的操作
const selectChange = async (val: string, name: string, formData: EmptyObjectType) => {
	let exitReasonMap: any = [];
	if (name == 'exitType') {
		formData.reasonId = '';
		dialogState.tableData.dialogConfig?.forEach(async (item, index) => {
			if (item.prop == 'reasonId') {
				let res = await getExitReasonApi(exitTypeMap[val]);
				item.options = res.data.map((val: EmptyObjectType) => {
					return { value: val.runid, label: val.dataname, text: val.dataname };
				});
			}
		});
	}
	//根据原因id获取原因名称
	if (name == 'reasonId' && dialogState.tableData.dialogConfig) {
		dialogState.tableData.dialogConfig?.forEach(async (item, index) => {
			if (item.prop == 'reasonId') {
				item.options?.forEach((item) => {
					if (item.value == formData.reasonId) {
						formData['exitReason'] = item.label;
					}
				});
			}
		});
	}
	if (name == 'storageId') {
		const res = await getAdminNamesOfStoreHouseApi(formData.storageId);
		formData.warehouseManager = res.data;
	}
};

// 点击退库或者转仓按钮弹窗
let deleteData: any = [];
let deleteStorage: any = [];
let btnType = '';
const openReturnDialog = (scope: EmptyObjectType, type: string) => {
	loadingBtn.value = false;
	btnType = type === 'transferStorage' ? '轉倉' : '退庫';
	dialogState.tableData.dialogConfig?.forEach((item) => {
		if (item.prop === 'scan') {
			item.disabled = scope.row.codeManageMode === 1 ? true : false;
		} else if (item.prop === 'exitQty') {
			item.type = scope.row.codeManageMode === 1 ? 'input' : 'text';
			item.message = scope.row.codeManageMode === 1 ? '請輸入正整數' : `${btnType}數量不能為空或零，請掃碼錄入`;
		}
	});
	let dialogConfig = dialogState.tableData.dialogConfig;
	// 转仓
	if (type === 'transferStorage') {
		dilogTitle.value = '轉倉';
		dialogConfig?.forEach((item, index) => {
			if (item.prop === 'exitQty') {
				item.label = '轉倉數量';
				item.placeholder = '請輸入轉倉數量';
			}

			const delArr = ['exitType', 'reasonId', 'dri', 'userName'];
			if (delArr.includes(item.prop)) {
				deleteData = JSON.parse(JSON.stringify(dialogConfig?.splice(index, 4)));
			}
		});
		deleteStorage.reverse().forEach((item: any) => {
			dialogConfig?.splice(6, 0, item);
		});
		deleteStorage = [];
	} else {
		dilogTitle.value = '退庫';
		dialogConfig?.forEach((item, index) => {
			if (item.prop === 'exitQty') {
				item.label = '退庫數量';
				item.placeholder = '請輸入退庫數量';
			}
			const arr = ['storageId', 'outDate', 'warehouseManager'];
			if (arr.includes(item.prop)) {
				deleteStorage = JSON.parse(JSON.stringify(dialogConfig?.splice(index, 3)));
			}
		});
		deleteData.reverse().forEach((item: any) => {
			dialogConfig?.splice(6, 0, item);
		});
		deleteData = [];
	}
	repairReturnDialogRef.value.openDialog('return', scope.row, dilogTitle.value);
};
// 輸入DRI得到姓名
const onInputBlur = async (formData: EmptyObjectType, item: EmptyObjectType) => {
	if (item.prop === 'dri' && formData.dri) {
		const res = await getUserNameApi(formData.dri);
		if (res.status) {
			formData.userName = res.message;
		} else {
			formData.dri = '';
			formData.userName = '';
			ElMessage.warning('請重新輸入DRI');
		}
	}
};
// 根据接口得到仓库下拉数据
let options: EmptyArrayType = [];
const remoteMethod = (query: string) => {
	let dialogConfig = dialogState.tableData.dialogConfig;
	dialogConfig?.forEach((item) => {
		if (item.prop === 'storageId') item.loading = true;
	});
	if (query) {
		setTimeout(async () => {
			const res = await getQueryStoreHouseExceptIdleStoreNoPageApi('', query);
			options = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.storeId}`, label: `${item.storeType}`, text: `${item.sLocation}` };
			});
			dialogConfig?.forEach((item) => {
				if (item.prop === 'storageId') item.loading = false;
				item.options = options.filter((item: EmptyObjectType) => {
					return item.text.toLowerCase().includes(query.toLowerCase()) || item.label.toLowerCase().includes(query.toLowerCase());
				});
			});
		}, 500);
	} else {
		dialogConfig?.forEach((item) => {
			if (item.prop === 'storageId') item.options = [];
		});
	}
};
const scanCodeEntry = () => {
	repairReturnDialogRef.value.openInnerDialog('掃碼錄入');
};
// 嵌套弹窗提交
const innnerDialogSubmit = (formInnerData: any, formData: any) => {
	// 防止用户用扫码枪扫数据之后又手动修改数量
	if (formInnerData.codeList.length != 0) {
		formInnerData.exitQty = formInnerData.codeList.length;
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
};
// 打开嵌套弹窗
const openInnerDialog = (state: any) => {
	let { formInnerData, formData } = state;
	formInnerData['exitQty'] = formInnerData.codeList.length;
	formData['exitQty'] = formInnerData.codeList.length;
};
// 关闭tag标签
const handleTagClose = (tag: any, state: EmptyObjectType) => {
	let { formInnerData, formData } = state;
	formInnerData.codeList.splice(formInnerData.codeList.indexOf(tag), 1);
	formInnerData['exitQty'] = formInnerData.codeList.length;
	formData['exitQty'] = formInnerData.codeList.length;
};
// 手動添加碼
const addButton = (data: EmptyObjectType) => {
	let formInnerData = data.formInnerData;
	let formData = data.formData;
	if (formInnerData.codeList.length + 1 > formData.stockqty) {
		ElMessage.error(`掃碼數量超過發料數量，請勿繼續掃碼`);
		formInnerData['inputQty'] = null;
	} else if (formInnerData.codeList.includes(formInnerData['inputQty'])) {
		ElMessage.warning(`該條碼已存在，請勿重複掃碼`);
		formInnerData['inputQty'] = null;
	} else {
		formInnerData.codeList.push(formInnerData['inputQty']);
		formInnerData['inputQty'] = null;
		formInnerData['exitQty'] = formInnerData.codeList.length;
		formData['exitQty'] = formInnerData.codeList.length;
	}
};
// change
const change = (val: any, prop: string, state: any, iscontu: boolean) => {
	let { formInnerData, formData } = state;
	if (prop == 'sacnexitqty') {
		if (formInnerData.codeList.length + 1 > formData.stockqty) {
			ElMessage.error(`掃碼數量超過庫存總量，請勿繼續掃碼`);
			formInnerData['sacnexitqty'] = null;
		} else if (formInnerData.codeList.includes(val)) {
			ElMessage.warning(`該條碼已存在，請勿重複掃碼`);
			formInnerData['sacnexitqty'] = null;
		} else {
			formInnerData.codeList.push(val);
			formInnerData['sacnexitqty'] = null;
			formInnerData['exitQty'] = formInnerData.codeList.length;
			formData['exitQty'] = formInnerData.codeList.length;
		}
	}
};
const innnerDialogCancel = (formData: EmptyObjectType, formInnerData: EmptyObjectType) => {
	formInnerData.codeList = [];
	formInnerData['exitQty'] = 0;
	formData['exitQty'] = 0;
};
// 点击料号,暂时不做
const matnoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	// if (column.property === 'matno') {
	// 	dilogTitle.value = '料号:' + row.matNo;
	// 	changeStatus(header1.value, 500, false);
	// 	getDetailData(row.matNo);
	// }
};

// 提交 确认退库
const returnSubmit = async (ruleForm: EmptyObjectType, type: string, formInnerData: EmptyObjectType) => {
	loadingBtn.value = true;
	let allData: EmptyObjectType = { ...ruleForm };
	options.forEach((item) => {
		if (item.value === allData.storageId) {
			allData['receiveStorageId'] = item.value;
			allData['sLocation'] = item.text;
		}
	});
	let submitData = {
		stockId: allData.runid,
		exitType: allData.exitType,
		reasonId: allData.reasonId,
		exitReason: allData.exitReason,
		receiveStorageName: allData.storageId,
		exitQty: allData.exitQty,
		transferQty: allData.exitQty,
		describe: allData.describe,
		outDate: allData.outDate,
		sLocation: allData.sLocation,
		dri: allData.dri,
		receiveStorageId: allData.receiveStorageId,
		codeList: formInnerData.codeList,
	};
	if (submitData.exitQty > ruleForm.stockqty) {
		ElMessage.error(`${btnType}數量大於庫存總量`);
	} else if (submitData.exitQty < submitData.codeList.length) {
		ElMessage.error(`${btnType}數量小於掃碼數量`);
	} else {
		// 转仓提交
		if (ruleForm.storageId) {
			let transferStorageData = {
				receiveStorageId: submitData.receiveStorageId,
				stockId: submitData.stockId,
				outDate: submitData.outDate,
				describe: submitData.describe,
				transferQty: submitData.transferQty,
				codeList: formInnerData.codeList,
			};
			// console.log('轉倉成功', transferStorageData);
			const res = await getTransferStorageApi(transferStorageData);
			if (res.status) {
				ElMessage.success(t('轉倉成功'));
				getTableData();
				repairReturnDialogRef.value.closeDialog();
			}
		} else {
			// 退库提交
			// delete submitData.transferQty;
			let exitStoreData = {
				stockId: submitData.stockId,
				exitType: submitData.exitType,
				reasonId: submitData.reasonId,
				exitReason: submitData.exitReason,
				exitQty: submitData.exitQty,
				describe: submitData.describe,
				dri: submitData.dri,
				codeList: formInnerData.codeList,
			};
			// console.log('退庫成功', exitStoreData);
			const res = await ExitStoreApi(exitStoreData);
			if (res.status) {
				ElMessage.success(t('退庫成功'));
				getTableData();
				repairReturnDialogRef.value.closeDialog();
			}
		}
	}
	loadingBtn.value = false;
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value?.pageReset();
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
.dialog-input {
	display: flex;
	align-items: center;
	.el-input {
		width: 90%;
	}
	.el-select {
		width: 90%;
	}
}
:deep(.el-tabs__item) {
	font-weight: 700;
	font-size: 14px;
}
</style>
