<template>
	<div class="table-demo-container layout-padding">
		<div class="table-demo-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table-demo"
				@pageChange="onTablePageChange"
				@onOpenOtherDialog="openReceiveDialog"
				:cellStyle="cellStyle"
			/>
			<Dialog ref="sendReceiveDialogRef" v-bind="dialogData" @sampleSuccess="getTableData" @selectChange="selectChange" />
		</div>
	</div>
</template>

<script setup lang="ts" name="/partno/sendReceive">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { GetRecieveTaskApi, GetSampleDetailApi } from '/@/api/partno/sendReceive';
import { getEngieerGroupApi } from '/@/api/global/index';
import { useI18n } from 'vue-i18n';

// 引入表格组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
// 引入上面的表单组件
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入收货弹窗组件
const Dialog = defineAsyncComponent(() => import('../sampleDelivery/component/dialog.vue'));
// 定义变量内容
const { t } = useI18n();
const sendReceiveDialogRef = ref();
const tableRef = ref<RefType>();

const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matNo', colWidth: '', title: 'message.pages.matNo', type: 'text', isCheck: true },
			{ key: 'sampleNo', colWidth: '', title: 'message.pages.sampleNo', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
			// { key: 'engineer', colWidth: '', title: 'message.pages.engineer', type: 'text', isCheck: true },
			// { key: 'engineerName', colWidth: '', title: 'message.pages.engineerName', type: 'text', isCheck: true },
			{ key: 'runStatus', colWidth: '', title: 'message.pages.state', type: 'text', isCheck: true },
		],
		// 表格配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: false, //是否有分页
			height: 750,
		},

		btnConfig: [{ type: 'sendReceive', name: '收貨', color: '#D3C333', isSure: false }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [{ label: '送樣單號', prop: 'simpleNo', placeholder: '請輸入送樣單號', required: false, type: 'input' }],
		searchConfig: {
			isSearchBtn: true,
		},
		// 给后端的数据
		form: {
			matNo: '',
		},
		// 页码
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// 单元格样式
const cellStyle = ref();
const dialogData = reactive({
	// 点击收货表格数据
	otherHeaderData: [
		{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true },
		{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true },
		// { key: 'needsTime', colWidth: '', title: '需求送样时间', type: 'text', isCheck: true },
		{ key: 'needsQty', colWidth: '', title: '送樣數量', type: 'text', isCheck: true },
		{ key: 'receiveTime', colWidth: '', title: '收貨時間', type: 'time', isCheck: true, isRequired: true },
		{ key: 'receiveQty', colWidth: '', title: '收貨數量', type: 'input', isCheck: true, isRequired: true },
	],
	// 收货弹窗数据
	dialogForm: [
		{ type: 'text', label: '料號', prop: 'matNo', value: '' },
		{ type: 'text', label: '送樣單號', prop: 'sampleNo', value: '', xs: 10, sm: 11, md: 11, lg: 11, xl: 11 },
		{ type: 'text', label: '品名-中文', prop: 'nameCh', value: '' },
		{ type: 'text', label: '品名-英文', prop: 'nameEn', value: '' },
		{ type: 'select', label: '工程驗收人', prop: 'engineerNo', value: '', options: [], isRequired: true },
		{ type: 'text', label: '送樣時間', prop: 'needsDate', value: '' },
		{ type: 'text', label: '送樣數量', prop: 'needsQty', value: '' },
	],
	//进行送样、收货还是验收操作
	operation: '收貨',
});

// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data = {
		matNo: form.matNo,
		page: state.tableData.page,
	};
	const res = await GetRecieveTaskApi();
	state.tableData.data = res.data;
	// state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
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

// 打开收货弹窗 1
const openReceiveDialog = async (scope: any) => {
	const res = await GetSampleDetailApi(scope.row.sampleNo);
	sendReceiveDialogRef.value.openDialog(scope, 1, '收貨', res.data.vendorDetails);
};
// 搜索下拉选择
const selectChange = (query: string) => {
	if (query) {
		sendReceiveDialogRef.value.loadingOpen();
		setTimeout(async () => {
			const res = await getEngieerGroupApi(query);
			sendReceiveDialogRef.value.loadingClose();
			let options = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.userid}`, label: `${item.username}` };
			});
			dialogData.dialogForm[4].options = options.filter((item: EmptyObjectType) => {
				return item.label.toLowerCase().includes(query.toLowerCase()) || item.value.toLowerCase().includes(query.toLowerCase());
			});
		}, 500);
	} else {
		dialogData.dialogForm[4].options = [];
	}
};

// 页面加载时
onMounted(() => {
	getTableData();
});
</script>

<style scoped lang="scss">
.table-demo-container {
	.table-demo-padding {
		padding: 15px;
		.table-demo {
			flex: 1;
			overflow: hidden;
		}
	}
}
:deep(.mb20) {
	margin-bottom: 0px !important;
}
</style>
