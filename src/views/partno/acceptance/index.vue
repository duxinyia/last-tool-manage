<template>
	<div class="table-demo-container layout-padding">
		<div class="table-demo-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table-demo"
				@pageChange="onTablePageChange"
				@onOpenOtherDialog="openSampleDialog"
				@cellclick="matnoClick"
				:cellStyle="cellStyle"
			/>
			<Dialog ref="acceptanceDialogRef" v-bind="dialogData" />
		</div>
	</div>
</template>

<script setup lang="ts" name="partnoAcceptance">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getMaterialListApi } from '/@/api/partno/sendReceive';
import { useI18n } from 'vue-i18n';

// 引入表格组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
// 引入上面的表单组件
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入收货弹窗组件
const Dialog = defineAsyncComponent(() => import('../sampleDelivery/component/dialog.vue'));
// 定义变量内容
const { t } = useI18n();
const acceptanceDialogRef = ref();
const tableRef = ref<RefType>();
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'simpleNo', colWidth: '', title: '收货单号', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: 'message.pages.creator', type: 'text', isCheck: true },
			{ key: 'createtime', title: 'message.pages.creationTime', type: 'text', isCheck: true },
		],
		// 表格配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: true, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isEditBtn: false,
		},

		btnConfig: [{ type: 'sendReceive', name: '验收', color: '#D3C333', isSure: false }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [{ label: '收货单号', prop: 'simpleNo', placeholder: '请输入送样单号', required: false, type: 'input' }],
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
	// 点击料号弹窗表格数据
	headerData: [
		{ key: 'simpleNo', colWidth: '', title: '送样单号', type: 'text', isCheck: true },
		{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
		{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
		{ key: 'sampleQty', colWidth: '', title: '送样数量', type: 'text', isCheck: true },
		{ key: 'sampleTime', colWidth: '', title: '送样时间', type: 'text', isCheck: true },
		{ key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
		{ key: 'vendorName', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
	],
	// 点击送料表格数据
	otherHeaderData: [
		{ key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'input', isCheck: true },
		{ key: 'vendorName', colWidth: '', title: '厂商名称', type: 'input', isCheck: true },
		{ key: 'sampleQty', colWidth: '', title: '送样数量', type: 'input', isCheck: true },
		{ key: 'sampleTime', colWidth: '', title: '送样时间', type: 'time', isCheck: true },
		{ key: 'needsQty', colWidth: '', title: '需求送样数量', type: 'input', isCheck: true },
	],
});
const changeToStyle = (data: any[], keyList: string[], indList: number[]) => {
	return ({ row, column, rowIndex, columnIndex }: any) => {
		for (let j = 0; j < keyList.length; j++) {
			let i = keyList[j];
			let ind = indList[j];
			if (columnIndex === ind) {
				return { color: 'var(--el-color-primary)', cursor: 'pointer' };
			}
		}
	};
};
cellStyle.value = changeToStyle(state.tableData.data, ['matNo'], [2]);
// 初始化列表数据
const getTableData = async () => {
	// state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data = {
		matNo: form.matNo,
		page: state.tableData.page,
	};
	// const res = await getMaterialListApi(data);
	// state.tableData.data = res.data.data;
	// state.tableData.config.total = res.data.total;
	// res.status&&	state.tableData.config.loading = false;
};

// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value.pageReset();
};

// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType) => {
	state.tableData.page.pageNum = page.pageNum;
	state.tableData.page.pageSize = page.pageSize;
	getTableData();
};

// 打开收货弹窗 1
const openSampleDialog = (scope: Object) => {
	acceptanceDialogRef.value.openDialog(scope, 1);
};
// 点击料号 2
const matnoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	// const res = await getGetSampleApi(row.matNo);
	// if (column.property === 'matNo') {
	// 	acceptanceDialogRef.value.openDialog(row, 2, res.data);
	// }
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
