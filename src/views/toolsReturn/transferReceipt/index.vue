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
				:cellStyle="cellStyle"
				@cellclick="qrCodeClick"
				@onOpenOtherDialog="openTransDialog"
			/>
			<Dialog
				ref="transDialogRef"
				:dialogConfig="state.tableData.dialogConfig"
				@addData="onSubmit"
				:loadingBtn="loadingBtn"
				@dailogFormButton="onFormButton"
			>
				<template #dialogBtn="{ data }">
					<el-button type="warning" size="default" @click="onNullify(data)">退 回</el-button>
				</template>
			</Dialog>
			<qrCodeDialog ref="inventoryDialogRef" :tags="tags" dialogTitle="庫存條碼" />
		</div>
	</div>
</template>

<script setup lang="ts" name="transferReceipt">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
// 引入接口
import { getQueryTransferPageApi, getReceiveTransferApi, getRejectTransferStorageApi } from '/@/api/toolsReturn/transferReceipt';
import { useI18n } from 'vue-i18n';
import { getStockTransferCodesApi } from '/@/api/toolsReturn/maintentanceTools';
import { getOperAttachmentApi } from '/@/api/global';
const qrCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/qrCodeDialog.vue'));

// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableRef = ref<RefType>();
const transDialogRef = ref();
const loadingBtn = ref(false);
// tags的数据
const tags = ref<EmptyArrayType>([]);
const inventoryDialogRef = ref();
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matno', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			// { key: 'nameen', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'outStorageType', colWidth: '120', title: '傳出倉庫類型', type: 'text', isCheck: true },
			{ key: 'outSLocation', colWidth: '120', title: '轉出倉庫位置', type: 'text', isCheck: true },
			{ key: 'outdate', colWidth: '', title: '轉出日期', type: 'text', isCheck: true },
			{ key: 'inStorageType', colWidth: '120', title: '接收倉庫類型', type: 'text', isCheck: true },
			{ key: 'inSLocation', colWidth: '120', title: '接收倉庫位置', type: 'text', isCheck: true },
			{ key: 'transferqty', colWidth: '110', title: '轉移總數量', type: 'text', isCheck: true },
			// { key: 'qrqty', colWidth: '', title: '有碼數量', type: 'text', isCheck: true },
			// { key: 'notqrqty', colWidth: '', title: '無碼數量', type: 'text', isCheck: true },
			{ key: 'describe', colWidth: '', title: '備註', type: 'text', isCheck: true },
			{ key: 'runstatus', colWidth: '', title: '狀態', type: 'text', isCheck: true },
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
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		// 弹窗表单
		dialogConfig: [
			{ label: '料號', prop: 'matno', placeholder: '', required: false, type: 'text' },
			{ label: '圖紙編號', prop: 'drawNo', placeholder: '', required: false, type: 'text' },
			{ label: '品名-中文', prop: 'namech', placeholder: '', required: false, type: 'text' },
			{ label: '品名-英文', prop: 'nameen', placeholder: '', required: false, type: 'text' },
			{ label: '轉出倉庫類型', prop: 'outStorageType', placeholder: '', required: false, type: 'text' },
			{ label: '轉出倉庫位置', prop: 'outSLocation', placeholder: '', required: false, type: 'text' },
			{ label: '轉出日期', prop: 'outdate', placeholder: '', required: false, type: 'text' },
			{ label: '轉移總數量', prop: 'transferqty', placeholder: '', required: false, type: 'text' },
			{ label: '接收倉庫類型', prop: 'inStorageType', placeholder: '', required: false, type: 'text' },
			{ label: '接收倉庫位置', prop: 'inSLocation', placeholder: '', required: false, type: 'text' },
			// { label: '有碼數量', prop: 'qrqty', placeholder: '', required: false, type: 'text' },
			// { label: '無碼數量', prop: 'notqrqty', placeholder: '', required: false, type: 'text' },
			{ label: '備註', prop: 'describe', placeholder: '', required: false, type: 'text', xs: 24, sm: 24, md: 24, lg: 24, xl: 24 },
			{ label: '接收日期', prop: 'receiveDate', placeholder: '', required: true, type: 'date', isdisabledDate: true },
			{
				label: '查看轉倉轉出附件',
				prop: 'attachmentUrl',
				placeholder: 'message.pages.placeDrawPath',
				required: false,
				type: 'button',
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
			{
				label: '轉倉接收附件',
				prop: 'attachmentUrl',
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
		btnConfig: [{ type: 'sendReceive', name: '接收', color: '#36C78B', isSure: false, icon: 'ele-Handbag' }],
		// 给后端的数据
		form: {
			matNo: '',
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
// 单元格字体颜色
const cellStyle = ({ row, column }: EmptyObjectType) => {
	const property = column.property;
	if (property === 'transferqty' && row.codeManageMode === 0) {
		return { color: 'var(--el-color-primary)', cursor: 'pointer' };
	}
};
// 单元格字体颜色
const changeToStyle = (indList: number[]) => {
	return ({ columnIndex, column }: any) => {
		for (let j = 0; j < indList.length; j++) {
			let ind = indList[j];
			if (columnIndex === ind && column.property === 'reqNo') {
				return { color: 'var(--el-color-primary)', cursor: 'pointer' };
			} else if (column.property === 'receiveQty') {
				return { color: 'red' };
			}
		}
	};
};
// cellStyle.value = changeToStyle([1, 7]);
const runstatusMap: EmptyObjectType = {
	1: '待接收',
	2: '已接收',
	3: '退回',
};
const codeManageModeMap: EmptyObjectType = {
	0: '有碼管理',
	1: '無碼管理',
};
// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	let data = {
		...form,
		page: state.tableData.page,
	};
	const res = await getQueryTransferPageApi(data);
	res.data.data.forEach((item: any) => {
		item.runstatus = runstatusMap[item.runstatus];
		item.codeManageModeText = codeManageModeMap[item.codeManageMode];
	});
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};

// 点击接收弹窗
const openTransDialog = (scope: EmptyObjectType) => {
	loadingBtn.value = false;
	transDialogRef.value.openDialog('trans', scope.row, '接收');
};
// 点击申请单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {};
// 點擊轉移總數量
const qrCodeClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'transferqty' && row.codeManageMode === 0) {
		let res = await getStockTransferCodesApi(row.runid);
		if (res.data.length == 0) {
			ElMessage.error('暫無條碼數據');
		} else {
			tags.value = res.data;
			inventoryDialogRef.value?.openDialog();
		}
	}
};
// 點擊查看轉倉轉出附件
const onFormButton = async (formData: EmptyObjectType) => {
	const res = await getOperAttachmentApi(18, formData.runid);
	if (res.status) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${res.data}`, '_blank');
	}
};
// 退回
const onNullify = (data: EmptyObjectType) => {
	ElMessageBox.prompt('請輸入退回原因', '提示', {
		confirmButtonText: '確定',
		cancelButtonText: '取消',
		draggable: true,
	}).then(async ({ value }) => {
		const res = await getRejectTransferStorageApi({ transferId: data.formData.runid, rejectReason: value });
		if (res.status) {
			ElMessage.success(t('退回成功'));
			transDialogRef.value.closeDialog();
			getTableData();
		}
	});
};
// 提交
const onSubmit = async (formData: any) => {
	loadingBtn.value = true;
	const getData = { receiveDate: formData.receiveDate, operateType: 1, transferId: formData.runid, attachmentUrl: formData.attachmentUrlfileUrl };
	const res = await getReceiveTransferApi(getData);
	if (res.status) {
		ElMessage.success(t('接收成功'));
		transDialogRef.value.closeDialog();
		getTableData();
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
</style>
