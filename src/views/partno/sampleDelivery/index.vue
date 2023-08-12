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
			<Dialog ref="sampleDialogRef" v-bind="dialogData" />
		</div>
	</div>
</template>

<script setup lang="ts" name="partnoSampleDelivery">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getMaterialListApi, getGetSampleApi } from '/@/api/partno/sampleDelivery';
import { useI18n } from 'vue-i18n';

// 引入表格组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
// 引入上面的表单组件
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入送样和点击料号弹窗组件
const Dialog = defineAsyncComponent(() => import('./component/dialog.vue'));
// 定义变量内容
const { t } = useI18n();
const sampleDialogRef = ref();
const tableRef = ref<RefType>();

const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matNo', colWidth: '', title: 'message.pages.matNo', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: 'message.pages.drawNo', type: 'text', isCheck: true },
			{ key: 'specs', colWidth: '', title: 'message.pages.specs', type: 'text', isCheck: true },
		],
		// 表格配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: true, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isEditBtn: false,
		},

		btnConfig: [{ type: 'sample', name: '送样', color: '#D3C333', isSure: false }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [{ label: '料号', prop: 'matNo', placeholder: '请输入料号', required: false, type: 'input' }],
		searchConfig: {
			isSearchBtn: true,
		},
		// 给后端的数据
		form: {
			matNo: '',
		},
		// printName: '表格打印演示',
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
		{ key: 'sampleNo', colWidth: '', title: '送样单号', isCheck: true },
		{ key: 'nameCh', colWidth: '', title: '品名-中文', isCheck: true },
		{ key: 'nameEn', colWidth: '', title: '品名-英文', isCheck: true },
		{ key: 'sampleQty', colWidth: '', title: '送样数量', isCheck: true },
		{ key: 'sampleTime', colWidth: '', title: '送样时间', isCheck: true },
		{ key: 'vendorCode', colWidth: '', title: '厂商代码', isCheck: true },
		{ key: 'vendorName', colWidth: '', title: '厂商名称', isCheck: true },
	],
	// 点击送料表格数据
	otherHeaderData: [
		{ key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'input', isCheck: true, isRequired: true },
		{ key: 'vendorName', colWidth: '', title: '厂商名称', type: 'input', isCheck: true, isRequired: true },
		{ key: 'sampleQty', colWidth: '', title: '送样数量', type: 'input', isCheck: true, isRequired: true },
		{ key: 'sampleTime', colWidth: '', title: '送样时间', type: 'time', isCheck: true, isRequired: true },
		{ key: 'needsQty', colWidth: '', title: '需求送样数量', type: 'input', isCheck: true, isRequired: true },
	],
	// 送样弹窗数据
	dialogForm: [
		{ type: 'text', lable: '送样单号', prop: 'sampleNo', value: '' },
		{ type: 'text', lable: '料号', prop: 'matNo', value: '', xs: 10, sm: 11, md: 11, lg: 11, xl: 11 },
		{ type: 'text', lable: '品名-中文', prop: 'nameCh', value: '' },
		{ type: 'text', lable: '品名-英文', prop: 'nameEn', value: '' },
		{ type: 'input', lable: '工程验收人', prop: 'engineerName', placeholder: '请输入工程验收人', value: '' },
	],
	//进行送样、收货还是验收操作
	operation: '送样',
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
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data = {
		matNo: form.matNo,
		page: state.tableData.page,
		queryType: 2,
	};
	const res = await getMaterialListApi(data);
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
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

// 打开送样弹窗 1
const openSampleDialog = (scope: Object) => {
	sampleDialogRef.value.openDialog(scope, 1, '送样');
};
// 点击料号 2
const matnoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'matNo') {
		const res = await getGetSampleApi(row.matNo);
		sampleDialogRef.value.openDialog(row, 2, '', res.data);
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
