<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="到貨驗收" name="first">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" labelWidth=" " />
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
						<div class="circle" v-if="itemConfig.key === 'applyReceiveId'">
							<span>簽核抽回</span>
						</div>
					</template>
				</Table>
				<Table
					ref="tableRef"
					v-bind="state.tableData"
					class="table"
					@sortHeader="(data) => onSortHeader(data, state.tableData)"
					@pageChange="(page) => onTablePageChange(page, state.tableData)"
					@onOpenOtherDialog="openArriveJobDialog"
				/>
			</div>
		</el-tab-pane>
		<el-tab-pane label="驗收記錄" name="second" class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="secondState.tableData.search" @search="onSearch2" :searchConfig="secondState.tableData.searchConfig" labelWidth="90px" />
			<Table
				ref="tableRef2"
				v-bind="secondState.tableData"
				class="table"
				@sortHeader="(data) => onSortHeader(data, secondState.tableData)"
				@pageChange="(page) => onTablePageChange(page, secondState.tableData)"
				@onOpenOtherDialog="openDetailDialog"
			/>
		</el-tab-pane>
		<!-- 验收弹窗 -->
		<Dialog
			ref="arriveJobDialogRef"
			:dialogConfig="state.tableData.dialogConfig"
			@addData="onSubmit"
			:loadingBtn="loadingBtn"
			labelWidth="120px"
			@handleNumberInputChange="changeInput"
			@dailogFormButton="onButton"
		>
			<template #Header="{ hearName }">
				<div class="header">
					<div style="font-size: 18px">{{ hearName }}</div>
					<el-tag size="large" style="font-weight: 700; font-size: 14px" class="ml20" type="danger"
						>此處填寫的通過數量都會進入發料入庫流程，若要全部退回，通過數量請填0</el-tag
					>
				</div>
			</template>
		</Dialog>
		<el-dialog draggable :close-on-click-modal="false" v-model="detaildialogVisible" :title="dilogTitle" width="50%"
			><checkNoDetailDialog :isDialog="true" :checkNoRef="checkNoRef"
		/></el-dialog>
		<!-- 详情 -->
		<!-- <Dialog
			ref="detaildialogRef"
			:dialogConfig="secondState.tableData.dialogConfig"
			labelWidth="120px"
			:isFootBtn="false"
			@dailogFormButton="arriveList"
		>
		</Dialog> -->

		<!-- 驗收記錄詳情彈窗 -->
		<!-- <el-dialog v-model="detaildialogVisible" :title="dilogTitle" width="50%">
			<checkNoDetailDialog :isDialog="true" :checkNoRef="checkNoRef" />
			<template #footer v-if="dilogTitle == '詳情'">
				<span class="dialog-footer">
					<el-button size="default" auto-insert-space @click="detaildialogVisible = false">取消</el-button>
					<el-button size="default" type="primary" auto-insert-space @click="onSend" :loading="loadingBtn" :disabled="sendDisabled">
						送 簽
					</el-button>
				</span>
			</template>
		</el-dialog> -->
	</el-tabs>
</template>

<script setup lang="ts" name="/requistManage/arrivalAcceptance">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox, TabsPaneContext } from 'element-plus';

// 引入接口
import {
	postToolApplyQueryCheckTaskApi,
	getTInsertCheckApi,
	getQueryCheckPageApi,
	getSubmitSignApi,
	postToolApplyRecheckApi,
} from '/@/api/requistManage/arrivalAcceptance';
import { getExitReasonApi } from '/@/api/toolsReturn/maintentanceTools';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { getOperAttachmentApi } from '/@/api/global';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const checkNoDetailDialog = defineAsyncComponent(() => import('/@/views/link/arrivalAcceptanceLink/index.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
// 定义变量内容
const route = useRoute();
const { t } = useI18n();
const tableRef = ref<RefType>();
const tableRef2 = ref<RefType>();
const arriveJobDialogRef = ref();
const detaildialogRef = ref();
const isSendBtn = ref(false);
const sendDisabled = ref(false);
const detaildialogVisible = ref(false);
const checkNoRef = ref();
const loadingBtn = ref(false);

const activeName = ref<string | number>('first');

const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	getTableData();
};

// 弹窗标题
const dilogTitle = ref();

const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'applyReceiveId', colWidth: '', title: '單號', type: 'text', isCheck: true },
			{ key: 'reqNo', colWidth: '', title: '申請單號', type: 'text', isCheck: true },
			{ key: 'matNo', title: 'message.pages.matNo', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'machineType', colWidth: '', title: '機種', type: 'text', isCheck: true },
			{ key: 'qty', colWidth: '', title: '收貨數量', type: 'text', isCheck: true },
			{ key: 'receiver', colWidth: '', title: '收貨人', type: 'text', isCheck: true },
			{ key: 'receiveDate', colWidth: '', title: '收貨日期', type: 'text', isCheck: true },
			// { key: 'describe', colWidth: '', title: '描述说明', type: 'text', isCheck: true },
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
			{ label: '申請單號', prop: 'reqNo', required: false, type: 'input' },
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{ label: '收貨日期', prop: 'receiveDate', required: false, type: 'dateRange', lg: 4, xl: 4 },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '驗收', color: '#e6a23c', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			// reqNo: '',
			// prNo: '',
		},
		dialogConfig: [
			{ type: 'text', label: '申請單號', placeholder: '', prop: 'reqNo', required: false },
			{ type: 'text', label: 'message.pages.matNo', placeholder: '', prop: 'matNo', required: false },
			{ type: 'text', label: '圖紙編號', placeholder: '', prop: 'drawNo', required: false },
			{ type: 'text', label: '品名-中文', placeholder: '', prop: 'nameCh', required: false },
			{ type: 'text', label: '品名-英文', placeholder: '', prop: 'nameEn', required: false },
			{ type: 'text', label: '機種', placeholder: '', prop: 'machineType', required: false },

			{ type: 'text', label: '收貨數量', placeholder: '', prop: 'qty', required: false },
			{ type: 'text', label: '收貨人', placeholder: '', prop: 'receiver', required: false },
			{ type: 'text', label: '收貨日期', placeholder: '', prop: 'receiveDate', required: false },
			{ type: 'text', label: '驗收數量', placeholder: '', prop: 'checkqty', required: true },
			{
				type: 'text',
				label: '收貨備註',
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
				type: 'button',
				label: '查看收貨附件',
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
			{ type: 'date', label: '驗收時間', placeholder: '', prop: 'checkDate', required: true, isdisabledDate: true },
			{ type: 'number', label: '通過數量', placeholder: '', prop: 'passQty', required: true },
			{ type: 'text', label: '不通過數量', placeholder: '', prop: 'failQty', required: false },
			{
				label: '驗收不通過原因',
				prop: 'failReasons',
				placeholder: '請選擇驗收不通過原因',
				required: false,
				type: 'select',
				options: [],
				multiple: true,
				collapseTags: true,
				collapseTagsTooltip: true,
				disabled: false,
				clearable: true,
			},

			{
				label: '驗收報告',
				prop: 'accepReportUrl',
				key: 'accepreporturlName',
				placeholder: '請點擊此處上傳文件',
				required: false,
				type: 'optionFile',
				xs: 14,
				sm: 14,
				md: 14,
				lg: 14,
				xl: 14,
			},
			{
				type: 'button',
				label: '清空驗收報告',
				placeholder: '',
				prop: 'clearUrl',
				required: false,
				xs: 4,
				sm: 4,
				md: 4,
				lg: 4,
				xl: 4,
			},
			{
				type: 'button',
				label: '查看驗收報告',
				placeholder: '',
				prop: 'fileUrl',
				required: false,
				xs: 4,
				sm: 4,
				md: 4,
				lg: 4,
				xl: 4,
			},

			{
				type: 'textarea',
				label: '備註',
				placeholder: '請輸入備註',
				prop: 'checkDescribe',
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
const state1 = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'applyReceiveId', colWidth: '200', title: '單號', type: 'text', isCheck: true },
			{ key: 'reqNo', colWidth: '', title: '申請單號', type: 'text', isCheck: true },
			{ key: 'matNo', title: 'message.pages.matNo', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'machineType', colWidth: '', title: '機種', type: 'text', isCheck: true },
			{ key: 'qty', colWidth: '', title: '收貨數量', type: 'text', isCheck: true },
			{ key: 'receiver', colWidth: '', title: '收貨人', type: 'text', isCheck: true },
			{ key: 'receiveDate', colWidth: '', title: '收貨日期', type: 'text', isCheck: true },
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
			{ key: 'applyCheckId', colWidth: '', title: '驗收單號', type: 'text', isCheck: true },
			{ key: 'reqNo', colWidth: '', title: '申請單號', type: 'text', isCheck: true },
			{ key: 'applyReceiveId', colWidth: '', title: '收貨單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'reqMatNo', colWidth: '', title: '請購料號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'machineType', colWidth: '', title: '機種', type: 'text', isCheck: true },
			{ key: 'checkDate', colWidth: '', title: '驗收日期', type: 'text', isCheck: true },
			// { key: 'checkQty', colWidth: '', title: '验收数量', type: 'text', isCheck: true },
			// { key: 'passQty', colWidth: '', title: '合格数量', type: 'text', isCheck: true },
			// { key: 'failQty', colWidth: '120', title: '不合格数量', type: 'text', isCheck: true },
			{ key: 'receiver', colWidth: '', title: '收貨人', type: 'text', isCheck: true },
			// { key: 'createTime', colWidth: '120', title: '实际提交日期', type: 'text', isCheck: true },
			{ key: 'isDispatched', colWidth: '120', title: '是否已發料', type: 'text', isCheck: true },
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
			{ label: '申請單號', prop: 'reqNo', required: false, type: 'input' },
			{ label: '驗收單號', prop: 'applyCheckId', required: false, type: 'input' },
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '請購料號', prop: 'reqMatNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{
				label: '是否已發料',
				prop: 'isDispatched',
				required: false,
				clearable: false,
				placeholder: '',
				type: 'select',
				options: [
					{ value: true, label: '是', text: '是' },
					{ value: false, label: '否', text: '否' },
				],
			},
			{ label: '驗收日期', prop: 'checkDate', required: false, type: 'dateRange' },
			{
				label: '簽核狀態',
				prop: 'signStatus',
				required: false,
				clearable: false,
				placeholder: '',
				type: 'select',
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
		btnConfig: [{ type: 'sendReceive', name: '查看詳情', color: '#1890ff', isSure: false, icon: 'ele-View' }],
		// 给后端的数据
		form: {
			// checkNo: '',
			// signStatus: Number(route.query.signStatus) || 0,
		},
		dialogConfig: [
			{ type: 'text', label: '驗收單號', placeholder: '', prop: 'applyCheckId', required: false },
			{ type: 'text', label: '申請單號', placeholder: '', prop: 'reqNo', required: false },
			{ type: 'text', label: '收貨單號', placeholder: '', prop: 'applyReceiveId', required: false },
			{ type: 'text', label: 'message.pages.matNo', placeholder: '', prop: 'matNo', required: false },
			{ type: 'text', label: '請購料號', placeholder: '', prop: 'reqMatNo', required: false },
			{ type: 'text', label: '品名-中文', placeholder: '', prop: 'nameCh', required: false },
			{ type: 'text', label: '品名-英文', placeholder: '', prop: 'nameEn', required: false },
			{ type: 'text', label: '驗收日期', placeholder: '', prop: 'checkDate', required: false },
			{ type: 'text', label: '驗收數量', placeholder: '', prop: 'checkQty', required: false },
			{ type: 'text', label: '通過數量', placeholder: '', prop: 'passQty', required: false },
			{ type: 'text', label: '不通過數量', placeholder: '', prop: 'failQty', required: false },
			{ type: 'text', label: '收貨人', placeholder: '', prop: 'checker', required: false },
			{ type: 'text', label: '實際提交日期', placeholder: '', prop: 'createTime', required: false },
			{ type: 'text', label: '是否已發料', placeholder: '', prop: 'isDispatched', required: false },
			{ type: 'text', label: '備註', placeholder: '', prop: 'describe', required: false, lg: 24, xl: 24 },
			{ type: 'button', label: '查看驗收報告', placeholder: '', prop: 'accepReportUrl', required: false },
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

const currentData = ref<EmptyObjectType>([]);
let dialogType = '';
// 点击验收按钮
const openArriveJobDialog = (scope: EmptyObjectType, type: string) => {
	dialogType = type;
	if (scope.row.failReasons && scope.row.failReasons.length > 0 && scope.row.failReasons[0].failReason) {
		scope.row.failReasons = scope.row.failReasons.map((item: any) => {
			return item.failReasonId;
		});
	}
	loadingBtn.value = false;
	scope.row.failReasonsdisabled = scope.row.failQty === 0 ? true : false;
	arriveJobDialogRef.value.openDialog(type, scope.row, type === 'reReceive' ? '重新驗收' : '驗收');
	state.tableData.dialogConfig![11].isCheck = type === 'reReceive' ? true : false;
	// 此處填寫的通過數量都會進入發料入庫流程，若要全部退回通過數量請填0
	scope.row.checkqty = scope.row.qty;
	state.tableData.dialogConfig?.forEach((item) => {
		if (item.prop === 'passQty') {
			item.max = scope.row.qty;
		}
	});
	currentData.value = scope.row;
};
// 點擊按鈕
const onButton = async (formData: EmptyObjectType, btnConfig: EmptyObjectType) => {
	// 清空報告
	if (btnConfig.prop === 'clearUrl') {
		if (!formData.drawPath && !formData.fileUrl && !formData.accepReportUrl) {
			ElMessage.warning(t('沒有清空內容，請選擇文件'));
		} else {
			formData.accepReportUrl = '';
			formData.drawPath = '';
			formData.fileUrl = '';
			ElMessage.success(t('清空成功'));
		}
	} else if (btnConfig.prop === 'attachments') {
		// 查看附件
		const res = await getOperAttachmentApi(8, formData.applyReceiveId);
		if (res.status) {
			window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${res.data}`, '_blank');
		}
	} else {
		// 查看報告
		arriveList(formData);
	}
};
const changeInput = (val: number, formData: EmptyObjectType) => {
	// const dialogData = currentData.value;
	if (val > formData.qty) {
		formData.passQty = formData.checkqty;
	}
	formData.failQty = formData.checkqty - formData.passQty;
	formData.failReasonsdisabled = formData.failQty === 0 ? true : false;
	if (formData.failReasonsdisabled) formData.failReasons = [];
};
// 获取验收不通過原因下拉
const getFailReason = async () => {
	let res = await getExitReasonApi('CheckFail');
	state.tableData.dialogConfig?.forEach((item) => {
		if (item.prop === 'failReasons') {
			item.options = res.data.map((item: any) => {
				return { text: item.dataname, value: item.runid };
			});
		}
	});
};
// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	let data = {
		...form,
		receiveDate: form.receiveDate,
		startReceiveDate: form.receiveDate && form.receiveDate[0],
		endReceiveDate: form.receiveDate && form.receiveDate[1],
		page: state.tableData.page,
	};
	delete data.receiveDate;
	const form2 = secondState.tableData.form;
	if (form2.isDispatched === '') {
		form2.isDispatched = null;
	}
	let data2: EmptyObjectType = {
		...form2,
		checkDate: form2.checkDate,
		startCheckDate: form2.checkDate && form2.checkDate[0],
		endCheckDate: form2.checkDate && form2.checkDate[1],
		page: secondState.tableData.page,
	};
	delete data2.checkDate;
	if (activeName.value === 'first') {
		state.tableData.config.loading = true;
		state1.tableData.config.loading = true;
		const res = await postToolApplyQueryCheckTaskApi(data);
		res.data.checkableApplyReceivePage.data.forEach((item: any) => {
			item.receiver = `${item.receiver} / ${item.receiverName}`;
		});
		state.tableData.data = res.data.checkableApplyReceivePage.data;
		state.tableData.config.total = res.data.checkableApplyReceivePage.total;
		state1.tableData.data = res!.data.withdrawnApplyChecks;
		state1.tableData.config.total = res!.data.withdrawnApplyChecks.total;
		if (res.status) {
			state.tableData.config.loading = false;
			state1.tableData.config.loading = false;
		}
	} else {
		// const signStatusMap: EmptyObjectType = {
		// 	0: '未送签',
		// 	1: '签核中',
		// 	2: '签核完成',
		// };
		if (data2.signStatus === '') {
			data2.signStatus = null;
		}
		const res = await getQueryCheckPageApi(data2);
		// res.data.data.forEach((item: any) => {
		// item.signstatus1 = item.signstatus;
		// item.signstatus = signStatusMap[item.signstatus];
		// });
		res.data.data.forEach((item: any) => {
			item.isDispatched = item.isDispatched ? '是' : '否';
			item.receiver = `${item.receiver} / ${item.receiverName}`;
			item.failReasons = item.failReasons?.join(' | ');
		});
		secondState.tableData.data = res.data.data;
		secondState.tableData.config.total = res.data.total;
		if (res.status) {
			secondState.tableData.config.loading = false;
		}
	}
};

// 点击查看详情按钮
const openDetailDialog = (scope: EmptyObjectType) => {
	// detaildialogRef.value.openDialog('detail', scope.row, '詳情');
	// checkNoRef.value = scope.row.applyCheckId;
	checkNoRef.value = scope.row;
	detaildialogVisible.value = true;
	// // isSendBtn.value = scope.row.signstatus === '未送签' ? true : false;
	dilogTitle.value = '詳情';
	// sendDisabled.value = scope.row.signstatus1 ? true : false;
};
// 查看验收报告单
const arriveList = (formData: EmptyObjectType) => {
	const url = formData.fileUrl || formData.accepReportUrl;
	if (url) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${url}`, '_blank');
	} else {
		ElMessage.warning(t('沒有驗收報告單'));
	}
};
// 送簽
// const onSend = async () => {
// 	loadingBtn.value = true;
// 	const res = await getSubmitSignApi(checkNoRef.value);
// 	if (res.status) {
// 		ElMessage.success(t('送签成功'));
// 		detaildialogVisible.value = false;
// 		getTableData();
// 	}
// 	loadingBtn.value = false;
// };
// 提交
const onSubmit = async (formData: any) => {
	const { applyReceiveId, failQty, checkDescribe, checkDate, fileUrl, accepReportUrl, failReasons, applyCheckId } = formData;
	loadingBtn.value = true;
	let getData: EmptyObjectType = {
		applyReceiveId,
		failQty,
		describe: checkDescribe,
		checkDate,
		accepReportUrl: fileUrl || accepReportUrl,
		failReasonIds: failReasons,
	};
	let getData1: EmptyObjectType = {
		applyCheckId,
		failQty,
		checkDescribe,
		checkDate,
		accepReportUrl: fileUrl || accepReportUrl,
		failReasonIds: failReasons,
	};

	// console.log(getData1);
	const res = dialogType === 'reReceive' ? await postToolApplyRecheckApi(getData1) : await getTInsertCheckApi(getData);
	if (res.status) {
		ElMessage.success(dialogType === 'reReceive' ? t('重新驗收成功') : t('驗收成功'));
		arriveJobDialogRef.value.closeDialog();
		getTableData();
		ElMessageBox.confirm(`請至簽核平台提交簽核，簽核通過后才會生效`, '提示', {
			confirmButtonText: '確 定',
			showCancelButton: false,
			showClose: false,
			type: 'warning',
			draggable: true,
		});
	}
	loadingBtn.value = false;
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value && tableRef.value?.pageReset();
};
const onSearch2 = (data: EmptyObjectType) => {
	secondState.tableData.search.forEach((item) => {
		if (item.prop === 'signStatus') {
			item.options?.forEach((option) => {
				if (data.signStatus === option.text) {
					data.signStatus = option.value;
				}
			});
		}
	});
	secondState.tableData.form = Object.assign({}, secondState.tableData.form, { ...data });
	tableRef2.value && tableRef2.value?.pageReset();
};

// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType, tableData: EmptyObjectType) => {
	tableData.page.pageNum = page.pageNum;
	tableData.page.pageSize = page.pageSize;
	getTableData();
};
// 拖动显示列排序回调
const onSortHeader = (data: TableHeaderType[], tableData: EmptyObjectType) => {
	tableData.header = data;
};

// 页面加载时
onMounted(() => {
	getTableData();
	getFailReason();
});
</script>

<style scoped lang="scss">
:deep(.el-tabs__content) {
	height: 100% !important;
}
:deep(.el-tabs__item) {
	font-weight: 700;
	font-size: 14px;
}
.table-container {
	.table-padding {
		padding: 15px;
		display: flex;
		.table {
			flex: 1;
			overflow: hidden;
		}
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
:deep(.el-dialog__body .el-button) {
	margin-left: 47px !important;
}
.header {
	display: flex;
	align-items: center;
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
