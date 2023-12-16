<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="到貨驗收" name="first">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" labelWidth="70px" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@onOpenOtherDialog="openArriveJobDialog"
			/>
		</el-tab-pane>
		<el-tab-pane label="驗收記錄" name="second" class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="secondState.tableData.search" @search="onSearch2" :searchConfig="secondState.tableData.searchConfig" labelWidth="90px" />
			<Table
				ref="tableRef2"
				v-bind="secondState.tableData"
				class="table"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
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
						>此處填寫的通過數量都會進入發料入庫流程，若要全部退回通過數量請填0</el-tag
					>
				</div>
			</template>
		</Dialog>
		<!-- 详情 -->
		<Dialog
			ref="detaildialogRef"
			:dialogConfig="secondState.tableData.dialogConfig"
			labelWidth="120px"
			:isFootBtn="false"
			@dailogFormButton="arriveList"
		>
		</Dialog>
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
import { ElMessage, TabsPaneContext } from 'element-plus';

// 引入接口
import { getIToolReceivePageListApi, getTInsertCheckApi, getQueryCheckPageApi, getSubmitSignApi } from '/@/api/requistManage/arrivalAcceptance';
import { getExitReasonApi } from '/@/api/toolsReturn/maintentanceTools';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const checkNoDetailDialog = defineAsyncComponent(() => import('/@/views/link/arrivalAcceptanceLink/index.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
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
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			// { key: 'companyId', colWidth: '', title: '法人', type: 'text', isCheck: true },
			{ key: 'buCode', colWidth: '', title: 'BU', type: 'text', isCheck: true },
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
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '申請單號', prop: 'reqNo', required: false, type: 'input' },
			{ label: '料號', prop: 'matNo', required: false, type: 'input', lg: 5, xl: 5 },
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
			{ type: 'text', label: '品名-中文', placeholder: '', prop: 'nameCh', required: false },
			{ type: 'text', label: '品名-英文', placeholder: '', prop: 'nameEn', required: false },
			{ type: 'text', label: '收貨數量', placeholder: '', prop: 'qty', required: false },
			{ type: 'text', label: '收貨日期', placeholder: '', prop: 'receiveDate', required: false },
			{ type: 'text', label: '驗收數量', placeholder: '', prop: 'checkqty', required: true },
			{ type: 'date', label: '驗收時間', placeholder: '', prop: 'checkDate', required: true, isdisabledDate: true },
			{ type: 'number', label: '通過數量', placeholder: '', prop: 'passqty', required: true },
			{ type: 'text', label: '不通過數量', placeholder: '', prop: 'failqty', required: false },
			{
				label: '驗收不通過原因',
				prop: 'failReasonIds',
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
				prop: 'drawPath',
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
			{ key: 'reqMatNo', colWidth: '', title: '申請料號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'checkDate', colWidth: '', title: '驗收日期', type: 'text', isCheck: true },
			// { key: 'checkQty', colWidth: '', title: '验收数量', type: 'text', isCheck: true },
			// { key: 'passQty', colWidth: '', title: '合格数量', type: 'text', isCheck: true },
			// { key: 'failQty', colWidth: '120', title: '不合格数量', type: 'text', isCheck: true },
			// { key: 'checker', colWidth: '', title: '验收人', type: 'text', isCheck: true },
			// { key: 'createTime', colWidth: '120', title: '实际提交日期', type: 'text', isCheck: true },
			{ key: 'isDispatched', colWidth: '120', title: '是否已發料', type: 'text', isCheck: true },
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
			{ label: '料號', prop: 'matNo', required: false, type: 'input', lg: 5, xl: 5 },
			{ label: '申請料號', prop: 'reqMatNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{
				label: '是否已發料',
				prop: 'isDispatched',
				required: false,
				clearable: false,
				type: 'select',
				options: [
					{ value: true, label: '是', text: '是' },
					{ value: false, label: '否', text: '否' },
				],
			},
			{ label: '驗收日期', prop: 'checkDate', required: false, type: 'dateRange' },

			// {
			// 	label: '签核状态',
			// 	prop: 'signStatus',
			// 	required: false,
			// 	clearable: true,
			// 	type: 'select',
			// 	options: [
			// 		{ value: 0, label: '未送签', text: '未送签', selected: true },
			// 		{ value: 1, label: '签核中', text: '签核中', selected: false },
			// 		{ value: 2, label: '签核完成', text: '签核完成', selected: false },
			// 	],
			// },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '查看詳情', color: '#1890ff', isSure: false, icon: 'ele-View' }],
		// 给后端的数据
		form: {
			// checkNo: '',
			// signStatus: 0,
		},
		dialogConfig: [
			{ type: 'text', label: '驗收單號', placeholder: '', prop: 'applyCheckId', required: false },
			{ type: 'text', label: '申請單號', placeholder: '', prop: 'reqNo', required: false },
			{ type: 'text', label: '收貨單號', placeholder: '', prop: 'applyReceiveId', required: false },
			{ type: 'text', label: 'message.pages.matNo', placeholder: '', prop: 'matNo', required: false },
			{ type: 'text', label: '申請單號', placeholder: '', prop: 'reqMatNo', required: false },
			{ type: 'text', label: '品名-中文', placeholder: '', prop: 'nameCh', required: false },
			{ type: 'text', label: '品名-英文', placeholder: '', prop: 'nameEn', required: false },
			{ type: 'text', label: '驗收日期', placeholder: '', prop: 'checkDate', required: false },
			{ type: 'text', label: '驗收數量', placeholder: '', prop: 'checkQty', required: false },
			{ type: 'text', label: '通過數量', placeholder: '', prop: 'passQty', required: false },
			{ type: 'text', label: '不通過數量', placeholder: '', prop: 'failQty', required: false },
			{ type: 'text', label: '驗收人', placeholder: '', prop: 'checker', required: false },
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
// 点击验收按钮
const openArriveJobDialog = (scope: EmptyObjectType) => {
	loadingBtn.value = false;
	arriveJobDialogRef.value.openDialog('samp', scope.row, '收貨');
	// 此處填寫的通過數量都會進入發料入庫流程，若要全部退回通過數量請填0
	scope.row.checkqty = scope.row.qty;
	state.tableData.dialogConfig![8].max = scope.row.qty;
	currentData.value = scope.row;
};
// 點擊按鈕
const onButton = (formData: EmptyObjectType, btnConfig: EmptyObjectType) => {
	// 清空報告
	if (btnConfig.prop === 'clearUrl') {
		if (!formData.drawPath && !formData.fileUrl) {
			ElMessage.warning(t('沒有清空內容，請選擇文件'));
		} else {
			formData.drawPath = '';
			formData.fileUrl = '';
			ElMessage.success(t('清空成功'));
		}
	} else {
		// 查看報告
		arriveList(formData);
	}
};
const changeInput = (val: number, formData: EmptyObjectType) => {
	// const dialogData = currentData.value;
	if (val > formData.qty) {
		formData.passqty = formData.checkqty;
	}
	formData.failqty = formData.checkqty - formData.passqty;
	formData.failReasonIdsdisabled = formData.failqty === 0 ? true : false;
	if (formData.failReasonIdsdisabled) formData.failReasonIds = [];
};
// 获取验收不通過原因下拉
const getFailReason = async () => {
	let res = await getExitReasonApi('CheckFail');
	state.tableData.dialogConfig![10].options = res.data.map((item: any) => {
		return { text: item.dataname, value: item.runid };
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
	let data2 = {
		...form2,
		checkDate: form2.checkDate,
		startCheckDate: form2.checkDate && form2.checkDate[0],
		endCheckDate: form2.checkDate && form2.checkDate[1],
		page: secondState.tableData.page,
	};
	delete data2.checkDate;
	if (activeName.value === 'first') {
		const res = await getIToolReceivePageListApi(data);
		res.data.data.forEach((item: any) => {
			item.receiver = `${item.receiver} / ${item.receiverName}`;
		});
		state.tableData.data = res.data.data;
		state.tableData.config.total = res.data.total;
		if (res.status) {
			state.tableData.config.loading = false;
		}
	} else {
		// const signStatusMap: EmptyObjectType = {
		// 	0: '未送签',
		// 	1: '签核中',
		// 	2: '签核完成',
		// };
		const res = await getQueryCheckPageApi(data2);
		// res.data.data.forEach((item: any) => {
		// item.signstatus1 = item.signstatus;
		// item.signstatus = signStatusMap[item.signstatus];
		// });
		res.data.data.forEach((item: any) => {
			item.isDispatched = item.isDispatched ? '是' : '否';
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
	detaildialogRef.value.openDialog('detail', scope.row, '詳情');
	// checkNoRef.value = scope.row.checkno;
	// detaildialogVisible.value = true;
	// // isSendBtn.value = scope.row.signstatus === '未送签' ? true : false;
	// dilogTitle.value = '詳情';
	// sendDisabled.value = scope.row.signstatus1 ? true : false;
};
// 查看验收报告单
const arriveList = (formData: EmptyObjectType) => {
	const url = formData.accepReportUrl || formData.fileUrl;
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
	loadingBtn.value = true;
	const getData = {
		applyReceiveId: formData.applyReceiveId,
		failQty: formData.failqty,
		describe: formData.checkDescribe,
		checkDate: formData.checkDate,
		accepReportUrl: formData.fileUrl,
		failReasonIds: formData.failReasonIds,
	};
	// console.log(getData);
	const res = await getTInsertCheckApi(getData);
	if (res.status) {
		ElMessage.success(t('驗收成功'));
		arriveJobDialogRef.value.closeDialog();
		getTableData();
	}
	loadingBtn.value = false;
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value && tableRef.value?.pageReset();
};
const onSearch2 = (data: EmptyObjectType) => {
	// secondState.tableData.search[1].options?.forEach((item) => {
	// 	if (data.signStatus === item.text) {
	// 		data.signStatus = item.value;
	// 	}
	// });
	secondState.tableData.form = Object.assign({}, secondState.tableData.form, { ...data });
	tableRef2.value && tableRef2.value?.pageReset();
};

// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType) => {
	if (activeName.value === 'first') {
		state.tableData.page.pageNum = page.pageNum;
		state.tableData.page.pageSize = page.pageSize;
	} else {
		secondState.tableData.page.pageNum = page.pageNum;
		secondState.tableData.page.pageSize = page.pageSize;
	}

	getTableData();
};
// 拖动显示列排序回调
const onSortHeader = (data: TableHeaderType[]) => {
	state.tableData.header = data;
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
.header {
	display: flex;
	align-items: center;
}
</style>
