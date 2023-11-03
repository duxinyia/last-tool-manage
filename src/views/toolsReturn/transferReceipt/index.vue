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
				@cellclick="reqNoClick"
				:cellStyle="cellStyle"
				@onOpenOtherDialog="openTransDialog"
			/>
			<Dialog ref="transDialogRef" :dialogConfig="state.tableData.dialogConfig" @addData="onSubmit" :loadingBtn="loadingBtn" />
		</div>
	</div>
</template>

<script setup lang="ts" name="transferReceipt">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
// 引入接口
import { getQueryTransferPageApi, getReceiveTransferApi } from '/@/api/toolsReturn/transferReceipt';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableRef = ref<RefType>();
const transDialogRef = ref();
const loadingBtn = ref(false);
// 单元格样式
const cellStyle = ref();
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matno', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			// { key: 'nameen', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'outStorageType', colWidth: '', title: '傳出倉庫類型', type: 'text', isCheck: true },
			{ key: 'outSLocation', colWidth: '', title: '轉出倉庫位置', type: 'text', isCheck: true },
			{ key: 'outdate', colWidth: '', title: '轉出日期', type: 'text', isCheck: true },
			{ key: 'inStorageType', colWidth: '', title: '接收倉庫類型', type: 'text', isCheck: true },
			{ key: 'inSLocation', colWidth: '', title: '接收倉庫位置', type: 'text', isCheck: true },
			{ key: 'transferqty', colWidth: '', title: '轉移總數量', type: 'text', isCheck: true },
			{ key: 'qrqty', colWidth: '', title: '有碼數量', type: 'text', isCheck: true },
			{ key: 'notqrqty', colWidth: '', title: '無碼數量', type: 'text', isCheck: true },
			{ key: 'describe', colWidth: '', title: '描述說明', type: 'text', isCheck: true },
			{ key: 'runstatus', colWidth: '', title: '狀態', type: 'text', isCheck: true },
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
		search: [{ label: '料號', prop: 'matNo', required: false, type: 'input' }],
		searchConfig: {
			isSearchBtn: true,
		},
		// 弹窗表单
		dialogConfig: [
			{ label: '料號', prop: 'matno', placeholder: '', required: false, type: 'text' },
			{ label: '品名-中文', prop: 'namech', placeholder: '', required: false, type: 'text' },
			// { label: '品名-英文', prop: 'nameen', placeholder: '', required: false, type: 'text' },
			{ label: '轉出倉庫類型', prop: 'outStorageType', placeholder: '', required: false, type: 'text' },
			{ label: '轉出倉庫位置', prop: 'outSLocation', placeholder: '', required: false, type: 'text' },
			{ label: '轉出日期', prop: 'outdate', placeholder: '', required: false, type: 'text' },
			{ label: '接收倉庫類型', prop: 'inStorageType', placeholder: '', required: false, type: 'text' },
			{ label: '接收倉庫位置', prop: 'inSLocation', placeholder: '', required: false, type: 'text' },
			{ label: '轉移總數量', prop: 'transferqty', placeholder: '', required: false, type: 'text' },
			{ label: '有碼數量', prop: 'qrqty', placeholder: '', required: false, type: 'text' },
			{ label: '無碼數量', prop: 'notqrqty', placeholder: '', required: false, type: 'text' },
			{ label: '描述說明', prop: 'describe', placeholder: '', required: false, type: 'text', xs: 24, sm: 24, md: 24, lg: 24, xl: 24 },
			{ label: '接收日期', prop: 'receiveDate', placeholder: '', required: true, type: 'date' },
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
// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	let data = {
		matNo: form.matNo,
		page: state.tableData.page,
	};
	const res = await getQueryTransferPageApi(data);
	res.data.data.forEach((item: any) => {
		item.runstatus = runstatusMap[item.runstatus];
	});
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};

// 点击接收弹窗
const openTransDialog = (scope: EmptyObjectType) => {
	transDialogRef.value.openDialog('trans', scope.row, '接收');
};
// 点击申请单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {};
// 提交
const onSubmit = async (formData: any) => {
	loadingBtn.value = true;
	const getData = { receiveDate: formData.receiveDate, operateType: 1, transferId: formData.runid };
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
