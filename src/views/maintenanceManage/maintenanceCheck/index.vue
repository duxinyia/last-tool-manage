<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="維修單驗收" name="first">
			<TableSearch
				:search="state.tableData.search"
				@search="(data) => onSearch(data, state.tableData)"
				:searchConfig="state.tableData.searchConfig"
				labelWidth=" "
			/>
			<div style="overflow: overlay">
				<Table
					v-if="state1.tableData.data.length > 0"
					ref="tableRef"
					v-bind="state1.tableData"
					style="height: auto"
					class=""
					@sortHeader="(data) => onSortHeader(data, state1.tableData)"
					@pageChange="(page) => onTablePageChange(page, state1.tableData)"
					@onOpenOtherDialog="openArriveJobDialog"
				>
					<template #rowIcons="{ row, itemConfig }">
						<div class="circle" v-if="itemConfig.key === 'repairCheckNo'">
							<span>簽核抽回</span>
						</div>
					</template>
				</Table>
				<Table
					ref="tableRef"
					v-bind="state.tableData"
					class="table"
					@pageChange="(page) => onTablePageChange(page, state.tableData)"
					@sortHeader="(data) => onSortHeader(data, state.tableData)"
					@cellclick="reqNoClick"
					:cellStyle="cellStyle"
					@onOpenOtherDialog="openArriveJobDialog"
				/>
			</div>
		</el-tab-pane>
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="驗收記錄" name="second">
			<TableSearch
				:search="secondState.tableData.search"
				@search="(data) => onSearch(data, secondState.tableData)"
				:searchConfig="secondState.tableData.searchConfig"
				labelWidth=" "
			/>
			<Table
				ref="tableRef"
				v-bind="secondState.tableData"
				class="table"
				@onOpenOtherDialog="openSecondDetailDialog"
				@pageChange="(page) => onTablePageChange(page, secondState.tableData)"
				@sortHeader="(data) => onSortHeader(data, secondState.tableData)"
			/>
		</el-tab-pane>
		<el-dialog
			destroy-on-close
			draggable
			:close-on-click-modal="false"
			v-model="maintenanceCheckDialogVisible"
			:title="dilogTitle"
			:width="titleType == 'sendReceive' || titleType == 'reReceive' ? '80%' : '70%'"
		>
			<el-row v-if="titleType == 'sendReceive' || titleType == 'reReceive'">
				<el-col :xs="24" :sm="12" :md="11" :lg="11" :xl="11" class="mb10" v-for="(val, key) in dialogState.tableData.search" :key="key">
					<div v-if="val.type === 'text'">
						{{ val.label }}：<span style="color: red" class="ml10">{{ dialogState.tableData.form[val.prop] }}</span>
					</div>
					<div v-if="val.type === 'time'">
						<span v-if="val.isRequired" class="color-danger mr5">*</span>
						<span style="width: 96px" class="mr10">{{ val.label }}</span>
					</div>
				</el-col>
			</el-row>

			<el-form ref="tableFormRef" :model="dialogState.tableData" size="default">
				<Table
					v-bind="dialogState.tableData"
					class="table"
					@delRow="onDelRow"
					@handleNumberInputChange="changeInput"
					:cellStyle="cellStyle"
					@cellclick="uselessCodeClick"
				>
					<template #slotCol="{ row }">
						<span
							v-if="row.codeManageMode === 1 || row.passQty >= row.checkQty || row.passQty + row.reRepairQty >= row.checkQty"
							style="text-align: center; width: 100%"
						>
							{{ row.uselessQty }}
						</span>
						<!-- v-if="
								(row.codeManageMode === 0 && row.passQty < row.checkQty) ||
								(row.passQty != 0 && row.passQty < row.checkQty && row.codeManageMode === 0)
							" -->
						<el-tooltip v-else class="box-item" effect="dark" content="錄入二維碼" placement="top">
							<span style="text-align: center; width: 100%; cursor: pointer; color: #0047c5" @click="onEnterQrcode(row)">
								{{ row.uselessQty || 0 }}
							</span>
						</el-tooltip>
					</template>
				</Table>
			</el-form>
			<template v-if="titleType == 'sendReceive' || titleType == 'reReceive' || dilogTitle == '詳情'">
				<div style="display: flex; align-items: center" v-if="titleType == 'sendReceive' || titleType == 'reReceive'" class="mt10">
					<span>收貨備註：</span>
					<div style="font-weight: 700; color: #1890ff">{{ dialogState.tableData.form['describe'] }}</div>
				</div>
				<el-button class="mt5" v-if="titleType == 'sendReceive'" size="default" type="success" auto-insert-space @click="lookAttachments">
					查看收貨附件
				</el-button>
				<div class="describe up-file" v-if="titleType == 'sendReceive' || titleType == 'reReceive'">
					<span>驗收報告：</span>
					<el-upload
						style="width: 100%"
						v-model:file-list="inputfileList"
						:auto-upload="false"
						ref="inputuploadRefs"
						action="#"
						class="upload"
						drag
						:limit="1"
						:show-file-list="false"
						:on-exceed="inputHandleExceed"
						:on-change="inputHandleChange"
					>
						<el-input style="height: 35px" v-model="dialogState.tableData.form['accepReportUrl']" placeholder="請點擊此處上傳文件"> > </el-input>
					</el-upload>
					<el-button size="default" plain @click="onClearFile" type="primary" class="ml10">清空驗收報告</el-button>
					<el-button size="default" plain type="primary" @click="lookUpload">查看驗收報告</el-button>
				</div>
				<el-button class="mt5" v-if="dilogTitle == '詳情'" size="default" plain type="primary" @click="lookUpload">查看驗收報告</el-button>
				<div :class="{ describe: titleType == 'sendReceive' || titleType == 'reReceive' }" class="mt10">
					<span>驗收備註：</span>
					<el-input
						style="width: 120%"
						v-if="titleType == 'sendReceive' || titleType == 'reReceive'"
						class="input-textarea"
						show-word-limit
						v-model="dialogState.tableData.form['describe1']"
						type="textarea"
						placeholder="請輸入"
						maxlength="150"
					></el-input>
					<span v-else style="color: #1890ff; font-weight: 700; width: 100%">{{ dialogState.tableData.form['describe1'] }}</span>
				</div>
			</template>

			<template #footer>
				<span class="dialog-footer" v-if="titleType == 'sendReceive' || titleType == 'reReceive'">
					<el-button size="default" auto-insert-space @click="maintenanceCheckDialogVisible = false">取消</el-button>
					<el-button :disabled="isSureDisabled" size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)" :loading="loadingBtn">
						確定
					</el-button>
				</span>
			</template>
		</el-dialog>
		<!-- 掃碼彈窗 -->
		<inputCodeDialog
			ref="qrcodeDialogRef"
			:dialogConfig="[]"
			:inputQrcodeDialogConfig="state.tableData.innerDialogConfig"
			:loadingBtn="loadingBtn"
			@innnerDialogSubmit="innnerDialogSubmit"
		>
		</inputCodeDialog>

		<!-- 二維碼彈窗 -->
		<qrCodeDialog color="danger" ref="inventoryDialogRef" :tags="tags" dialogTitle="報廢數量" />
	</el-tabs>
</template>

<script setup lang="ts" name="/maintenanceManage/maintenanceCheck">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch } from 'vue';
import {
	ElMessage,
	UploadInstance,
	UploadProps,
	UploadUserFile,
	genFileId,
	UploadRawFile,
	FormInstance,
	TabsPaneContext,
	ElMessageBox,
} from 'element-plus';
const maintenanceCheckDialogVisible = ref(false);
// 引入接口
import {
	getQueryCheckableRepairReceiveHeadApi,
	getRepariReceiveDetailsForCheckApi,
	getCheckApi,
	getQueryRepairCheckRecordApi,
	getRepairCheckRecordDetailApi,
	getWithdrawnCheckDetailsForRecheckApi,
	getRecheckApi,
} from '/@/api/maintenanceManage/maintenanceCheck';
import { getExitReasonApi } from '/@/api/toolsReturn/maintentanceTools';
import { getOperAttachmentApi, getUploadFileApi } from '/@/api/global/index';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const qrCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/qrCodeDialog.vue'));
const inputCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/inputCodeDialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const loadingBtn = ref(false);
const tableRef = ref<RefType>();
const inputfileList = ref<UploadUserFile[]>([]);
const inputuploadRefs = ref<UploadInstance>();
const inputuploadForm = ref();
const isSureDisabled = ref(true);
const inventoryDialogRef = ref();
const qrcodeDialogRef = ref();
// tags的数据
let tags = ref<EmptyArrayType>([]);
// 弹窗标题
const dilogTitle = ref();
const activeName = ref<string | number>('first');
const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	getTableData(activeName.value === 'first' ? state.tableData : secondState.tableData);
};
const header = ref<EmptyArrayType>([
	{ key: 'matNo', colWidth: '250', title: 'message.pages.matNo', type: 'text', isCheck: true },
	{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'receiptQty', colWidth: '', title: '收貨數量', type: 'text', isCheck: true },
	{ key: 'receiptDate', colWidth: '', title: '收貨日期', type: 'text', isCheck: true },
	{ key: 'checkQty', colWidth: '100', title: '驗收數量', type: 'text', isCheck: true, isRequired: false, min: 0 },
	{ key: 'repairQty', colWidth: '100', title: '收貨數量', type: 'text', isCheck: false, isRequired: false, min: 0 },
	{ key: 'passQty', colWidth: '100', title: '通過數量', type: 'number', isCheck: true, isRequired: true, min: 0 },
	{ key: 'reRepairQty', colWidth: '100', title: '返修數量', type: 'number', isCheck: true, isRequired: true, min: 0 },
	{ key: 'uselessQty', colWidth: '100', title: '報廢數量', type: 'slot', isCheck: true, isRequired: false },
	{ key: 'failReasonIds', colWidth: '180', title: '驗收不通過原因', type: 'multipleSelect', isCheck: true, options: [] },
	{ key: 'checkDate', colWidth: '150', title: '驗收時間', type: 'time', isCheck: true, isRequired: true, isdisabledDate: true },
]);
const header1 = ref([
	{
		key: 'matNo',
		colWidth: '250',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'receiptQty', colWidth: '', title: '收貨數量', type: 'text', isCheck: true },
	{ key: 'receiptDate', colWidth: '150', title: '收貨時間', type: 'text', isCheck: true },
]);
const header2 = ref([
	{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'text', isCheck: true },
	{
		key: 'matNo',
		colWidth: '240',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'checkDate', colWidth: '', title: '驗收日期', type: 'text', isCheck: true },
	{ key: 'checkQty', colWidth: '', title: '驗收數量', type: 'text', isCheck: true },
	{ key: 'passQty', colWidth: '', title: '通過數量', type: 'text', isCheck: true },
	{ key: 'reRepairQty', colWidth: '', title: '返修數量', type: 'text', isCheck: true },
	{ key: 'uselessQty', colWidth: '', title: '報廢數量', type: 'text', isCheck: true },
	{ key: 'failReasons', colWidth: '240', title: '驗收不通過原因', type: 'text', isCheck: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'repairReceiveNo', colWidth: '', title: '收貨單號', type: 'text', isCheck: true },
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '收貨人', type: 'text', isCheck: true },
			{ key: 'receiptTime', colWidth: '', title: '收貨時間', type: 'text', isCheck: true },
			{ key: 'buCode', colWidth: '', title: 'BU', type: 'text', isCheck: true },
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
			height: 618,
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '收貨單號', prop: 'repairReceiveNo', required: false, type: 'input' },
			{ label: '維修單號', prop: 'repairNo', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '驗收', color: '#e6a23c', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			repairReceiveNo: '',
			repairNo: '',
		},
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '表格打印演示',
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
const state1 = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'repairCheckNo', colWidth: '', title: '驗收單號', type: 'text', isCheck: true },
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			{ key: 'withdrawTime', colWidth: '', title: '抽回時間', type: 'text', isCheck: true },
			{ key: 'repairReceiveNo', colWidth: '', title: '收貨單號', type: 'text', isCheck: true },
			{ key: 'receiptTime', colWidth: '', title: '收貨時間', type: 'text', isCheck: true },
			{ key: 'receiver', colWidth: '', title: '收貨人', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR單號', type: 'text', isCheck: true },
			{ key: 'receiptDescribe', colWidth: '', title: '收貨備註', type: 'text', isCheck: true },
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
			isPage: false, //是否有分页
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'reReceive', name: '重新驗收', color: '#e6a23c', isSure: false, icon: '' }],
		// 给后端的数据
		form: {},
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '',
	},
});
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			{ key: 'repairCheckNo', colWidth: '', title: '驗收單號', type: 'text', isCheck: true },
			{ key: 'repairReceiveNo', colWidth: '', title: '收貨單號', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR單號', type: 'text', isCheck: true },
			{ key: 'receiver', colWidth: '', title: '收貨人', type: 'text', isCheck: true },
			{ key: 'createTime', colWidth: '', title: '提交時間', type: 'text', isCheck: true },
			{ key: 'signStatusStr', colWidth: '', title: '簽核狀態', type: 'text', isCheck: true },
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
			{ label: '驗收單號', prop: 'repairCheckNo', required: false, type: 'input' },
			{ label: '收貨單號', prop: 'repairReceiveNo', required: false, type: 'input' },
			{ label: '提交時間', prop: 'createTime', required: false, type: 'dateRange' },
			{
				label: '簽核狀態',
				prop: 'signStatus',
				required: false,
				clearable: false,
				type: 'select',
				placeholder: '',
				options: [
					{ value: 0, label: '簽核抽回', text: '簽核抽回', selected: false },
					{ value: 1, label: '簽核中', text: '簽核中', selected: false },
					{ value: 2, label: '簽核完成', text: '簽核完成', selected: false },
				],
			},
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'detail', name: '查看詳情', color: '#1890ff', isSure: false, icon: 'ele-View' }],
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
		search: [
			{ label: '驗收單號', prop: 'checkno', required: false, type: 'text' },
			{ label: '收貨單號', prop: 'repairReceiveNo', required: false, type: 'text' },
		],
		// btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true, disabled: true }],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// 查看附件
const lookAttachments = async () => {
	const res = await getOperAttachmentApi(13, detailRows.repairReceiveNo);
	if (res.status) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${res.data}`, '_blank');
	}
};
let outTableRow: EmptyObjectType = {};
// 彈出錄入二維碼彈窗
const onEnterQrcode = (row: EmptyObjectType) => {
	if (activeName.value == 'first') {
		outTableRow = row;
		qrcodeDialogRef.value.openDialog('qrcode', row, '錄入二維碼');
	}
};
// 二維碼提交
const innnerDialogSubmit = async (formData: any) => {
	dialogState.tableData.data.forEach((item) => {
		if (outTableRow.repairReceiveDetailId === item.repairReceiveDetailId && outTableRow.repairCheckDetailId === item.repairCheckDetailId) {
			item.uselessCodes = formData.codeList;
			item.uselessQty = formData.codeList.length;
			if (item.uselessQty === item.checkQty) {
				item.passQty = item.reRepairQty = 0;
			}
			item.passQtymax = item.checkQty - formData.codeList.length - (item.reRepairQty || 0);
			item.reRepairQtymax = item.checkQty - (item.passQty || 0) - formData.codeList.length;
		}
	});
	if (formData.codeList.length > 0) ElMessage.success(`錄入成功`);
};
// 通過數量改變
const changeInput = (val: number, i: number, item: EmptyObjectType) => {
	const data = dialogState.tableData.data[i];
	data.passQtymin = 0;
	if (data.codeManageMode === 1) {
		data.passQtymax = data.checkQty - (data.reRepairQty || 0) >= 0 ? data.checkQty - (data.reRepairQty || 0) : data.checkQty;
		data.reRepairQtymax = data.checkQty - (data.passQty || 0) >= 0 ? data.checkQty - (data.passQty || 0) : data.checkQty;
	} else {
		data.passQtymax =
			data.checkQty - (data.reRepairQty || 0) - data.uselessQty >= 0 ? data.checkQty - (data.reRepairQty || 0) - data.uselessQty : data.checkQty;
		data.reRepairQtymax =
			data.checkQty - (data.passQty || 0) - data.uselessQty >= 0 ? data.checkQty - (data.passQty || 0) - data.uselessQty : data.checkQty;
	}

	if (data.checkQty && data.passQty && data.checkQty <= data.passQty) {
		data.reRepairQty = data.uselessQty = 0;
		data.passQty = data.checkQty;
		data.passQtymax = data.checkQty;
	} else if (!data.checkQty) {
		data.passQty = 0;
	} else if (data.checkQty && data.reRepairQty && data.checkQty <= data.reRepairQty) {
		data.reRepairQty = data.checkQty;
		data.passQty = data.checkQty - data.reRepairQty;
		data.passQtymax = 0;
	}
	if (data.codeManageMode === 1) {
		data.uselessQty = data.checkQty - (data.reRepairQty || 0) - (data.passQty || 0) || 0;
	}
	data.uselessQtydisabled = data.reRepairQtydisabled = data.failReasonIdsdisabled = data.checkQty <= data.passQty ? true : false;
};
// 单元格字体颜色
const cellStyle = ({ row, column }: EmptyObjectType) => {
	const property = column.property;
	if (property === 'repairReceiveNo' && activeName.value == 'first') {
		return { color: 'var(--el-color-primary)', cursor: 'pointer' };
	} else if (property === 'uselessQty' && row.uselessCodes && row.uselessCodes.length > 0 && activeName.value != 'first') {
		return { color: 'red', cursor: 'pointer' };
	}
};
// 點擊報廢數量
const uselessCodeClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	if (activeName.value != 'first' && column.property === 'uselessQty' && row.uselessCodes && row.uselessCodes.length > 0) {
		tags.value = row.uselessCodes;
		inventoryDialogRef.value?.openDialog();
	}
};
// 初始化列表数据
const getTableData = async (datas: EmptyObjectType) => {
	datas.config.loading = true;
	state1.tableData.config.loading = true;
	let res = null;
	const form = datas.form;
	if (activeName.value === 'first') {
		let data = {
			repairReceiveNo: form.repairReceiveNo,
			repairNo: form.repairNo,
			page: datas.page,
		};
		res = await getQueryCheckableRepairReceiveHeadApi(data);
		res.data.checkableRepairReceiveHeads.data.forEach((item: any) => {
			item.creator = `${item.creator} / ${item.receiverName}`;
		});
		datas.data = res!.data.checkableRepairReceiveHeads.data;
		state1.tableData.data = res!.data.withdrawnCheckHeads;
		datas.config.total = res!.data.checkableRepairReceiveHeads.total;
	} else {
		let data = {
			...form,
			page: datas.page,
			createTime: form.createTime,
			startCreateTime: form.createTime && form.createTime[0],
			endCreateTime: form.createTime && form.createTime[1],
		};
		delete data.createTime;
		if (data.signStatus === '') data.signStatus = null;
		res = await getQueryRepairCheckRecordApi(data);
		res.data.data.forEach((item: any) => {
			item.receiver = `${item.receiver} / ${item.receiverName}`;
		});
		datas.data = res!.data.data;
		datas.config.total = res!.data.total;
	}

	if (res!.status) {
		datas.config.loading = false;
		state1.tableData.config.loading = false;
	}
};
// input框里面的数据
const inputHandleChange: UploadProps['onChange'] = async (uploadFile) => {
	dialogState.tableData.form['accepReportUrl'] = uploadFile.name;
	inputuploadForm.value = uploadFile;
	const res = await getUploadFileApi(3, inputuploadForm.value.raw);
	dialogState.tableData.form['fileUrl'] = res.data;
	res.status && ElMessage.success(`上傳成功`);
	getTableData(state.tableData);
};
//可以在选中时自动替换上一个文件
const inputHandleExceed: UploadProps['onExceed'] = (files) => {
	inputuploadRefs.value!.clearFiles();
	const file = files[0] as UploadRawFile;
	file.uid = genFileId();
	inputuploadRefs.value!.handleStart(file);
};
// 清空文件
const onClearFile = () => {
	if (!dialogState.tableData.form['fileUrl'] && !dialogState.tableData.form['accepReportUrl']) {
		ElMessage.warning(t('沒有清空內容，請選擇文件'));
	} else {
		dialogState.tableData.form['fileUrl'] = '';
		dialogState.tableData.form['accepReportUrl'] = '';
		ElMessage.success(t('清空成功'));
		getTableData(state.tableData);
	}
};
// 查看上传的文件
const lookUpload = () => {
	const url = titleType.value === 'reReceive' ? dialogState.tableData.form['accepReportUrl'] : dialogState.tableData.form['fileUrl'];
	if (url) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${url}`, '_blank');
	} else {
		ElMessage.warning(t('沒有驗收報告'));
	}
};
//删除
const onDelRow = (row: EmptyObjectType, i: number) => {
	dialogState.tableData.data.splice(i, 1);
};
// 點擊第二個頁面詳情彈窗按鈕
const openSecondDetailDialog = async (scope: EmptyObjectType) => {
	titleType.value = 'detail';
	dilogTitle.value = '詳情';
	maintenanceCheckDialogVisible.value = true;
	changeStatus(header2.value, 300, false);
	dialogState.tableData.config.loading = true;
	const res = await getRepairCheckRecordDetailApi(scope.row.repairCheckNo);
	if (res.status) {
		dialogState.tableData.form['describe1'] = res.data.describe;
		dialogState.tableData.form['fileUrl'] = res.data.accepReportUrl;
		res.data.details.forEach((item: any) => {
			if (item.failReasons) {
				item.failReasons = item.failReasons.join(' / ');
			}
		});

		dialogState.tableData.data = res.data.details;
		dialogState.tableData.config.loading = false;
	}
};
const titleType = ref('');
// 点击验收按钮
const openArriveJobDialog = async (scope: EmptyObjectType, type: string) => {
	titleType.value = type;
	dialogState.tableData.form = scope.row;
	if (type === 'sendReceive') {
		getDetailData(scope.row.repairReceiveNo);
		dilogTitle.value = '驗收';
	} else {
		getWithdrawnCheckDetailData(scope.row.repairCheckNo);
		dilogTitle.value = '重新驗收';
	}
	isSureDisabled.value = true;
	changeStatus(header.value, 300, true);
};

// 点击收货单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'repairReceiveNo') {
		titleType.value = 'receiptNumber';
		dilogTitle.value = '收貨單號:' + row.repairReceiveNo;
		getDetailData(row.repairReceiveNo);
		changeStatus(header1.value, 300, false);
	}
};
// 點擊重新驗收接口
const getWithdrawnCheckDetailData = async (data: string) => {
	dialogState.tableData.config.loading = true;
	maintenanceCheckDialogVisible.value = true;
	const res = await getWithdrawnCheckDetailsForRecheckApi(data);
	dialogState.tableData.data = res.data;
	if (res.status) {
		dialogState.tableData.config.loading = false;
		isSureDisabled.value = false;
	} else {
		isSureDisabled.value = true;
	}
};
let detailRows: EmptyObjectType = {};
// 详情接口
const getDetailData = async (data: string) => {
	dialogState.tableData.config.loading = true;
	maintenanceCheckDialogVisible.value = true;
	const res = await getRepariReceiveDetailsForCheckApi(data);
	dialogState.tableData.form = res.data.head;
	detailRows = res.data.head;
	dialogState.tableData.data = res.data.details;
	dialogState.tableData.data.forEach((item) => {
		item.checkQty = item.receiptQty;
		item.uselessQty = 0;
	});
	if (res.status) {
		dialogState.tableData.config.loading = false;
		isSureDisabled.value = false;
	} else {
		isSureDisabled.value = true;
	}
};
// 根据弹出窗不一样展现的配置不一样
const changeStatus = (header: EmptyArrayType, height: number, isShow: boolean) => {
	loadingBtn.value = false;
	let tableData = dialogState.tableData;
	let config = tableData.config;
	tableData.header = header;
	config.height = height;
	config.isSerialNo = isShow;
	// config.isOperate = isShow;
	config.isInlineEditing = isShow;
};
// 提交
const onSubmit = async (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格項必填未填'));
		let allData: EmptyObjectType = {};
		const form = dialogState.tableData.form;
		allData = {
			repairReceiveNo: form.repairReceiveNo,
			repairCheckNo: form.repairCheckNo,
			accepReportUrl: form.fileUrl || form.accepReportUrl || '',
			headDescribe: form.describe1 || '',
		};
		let notEqual = 0;
		dialogState.tableData.data.forEach((item) => {
			if (item.reRepairQty + item.uselessQty + item.passQty != item.checkQty) {
				notEqual++;
				console.log(item.reRepairQty, item.uselessQty, item.passQty, item.checkQty);
			}
		});
		if (notEqual) {
			ElMessage.warning(t('通過數量、返修數量、報廢數量之和須大於驗收數量！'));
			return;
		}
		let data = dialogState.tableData.data;
		data = data.map((item) => {
			return {
				repairReceiveDetailId: item.repairReceiveDetailId,
				repairCheckDetailId: item.repairCheckDetailId,
				reRepairQty: item.reRepairQty,
				uselessQty: item.uselessQty,
				passQty: item.passQty,
				checkDate: item.checkDate,
				failReasonIds: item.failReasonIds || [],
				uselessCodes: item.uselessCodes || [],
			};
		});

		allData['details'] = data;
		if (titleType.value === 'reReceive') {
			loadingBtn.value = true;
			const res = await getRecheckApi(allData);
			loadingBtn.value = false;
			if (res.status) {
				ElMessage.success(t('重新驗收成功'));
				maintenanceCheckDialogVisible.value = false;
				getTableData(state.tableData);
			}
		} else {
			loadingBtn.value = true;
			const res = await getCheckApi(allData);
			loadingBtn.value = false;
			if (res.status) {
				ElMessage.success(t('驗收成功'));
				maintenanceCheckDialogVisible.value = false;
				getTableData(state.tableData);
			}
		}
		ElMessageBox.confirm(`請至簽核平台提交簽核，簽核通過后才會生效`, '提示', {
			confirmButtonText: '確 定',
			showCancelButton: false,
			showClose: false,
			type: 'warning',
			draggable: true,
		});
	});
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
if (dialogState.tableData.btnConfig)
	dialogState.tableData.btnConfig[0].disabled = computed(() => {
		return dialogState.tableData.data.length <= 1 ? true : false;
	});
// 獲取原因下拉
const getReasonOption = async () => {
	// 获取验收不通過原因
	let res1 = await getExitReasonApi('CheckFail');
	header.value[10].options = res1.data.map((item: any) => {
		return { value: item.runid, label: item.dataname };
	});
};
// 页面加载时
onMounted(() => {
	getTableData(state.tableData);
	getReasonOption();
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
		width: 110px;
	}
}
.up-file {
	display: flex;
	span {
		line-height: 30px;
	}
}
:deep(.el-upload-dragger) {
	border: 0;
	padding: 0;
	background-color: transparent;
	border-radius: unset;
}
:deep(.el-input-group__prepend) {
	padding: 0;
}
.look-file {
	color: var(--el-color-primary) !important;
}
.circle {
	display: inline-block;
	border: 1px solid red;
	color: red;
	width: 54px;
	height: 22px;
	font-size: 12px;
	border-radius: 7px;
	margin-right: 3px;
}
</style>
