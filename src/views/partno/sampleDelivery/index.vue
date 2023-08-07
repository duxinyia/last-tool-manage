<template>
	<div class="table-demo-container layout-padding">
		<div class="table-demo-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table-demo"
				@pageChange="onTablePageChange"
				@onOpenOtherDialog="openSampleDialog"
				@cellclick="matnoClick"
				:cellStyle="state.tableData.cellStyle"
			/>
			<Dialog ref="sampleDialogRef" v-bind="state.dialogData" />
		</div>
	</div>
</template>

<script setup lang="ts" name="partnoSampleDelivery">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getMaterialListApi, getGetSampleApi } from '/@/api/partno/sampleDelivery.ts';
import { useI18n } from 'vue-i18n';

// 引入表格组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
// 引入上面的表单组件
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入送样和点击料号弹窗组件
const Dialog = defineAsyncComponent(() => import('./dialog.vue'));
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
			{ key: 'nameEn', colWidth: '', title: 'NameEn', type: 'text', isCheck: true },
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
		},

		btnConfig: [{ type: 'sample', name: '送样', color: '#D3C333', isSure: false }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [{ label: '料号', prop: 'matNo', placeholder: '请输入料号', required: false, type: 'input' }],
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
	dialogData: {
		// 点击料号弹窗表格数据
		headerData: [
			{ key: 'matNo', colWidth: '', title: '送样单号', type: 'text', isCheck: true },
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
		// 单元格样式
		cellStyle: null,
	},
});
const changeToStyle = (data: any[], keyList: string[], indList: number[]) => {
	return ({ row, column, rowIndex, columnIndex }) => {
		for (let j = 0; j < keyList.length; j++) {
			let i = keyList[j];
			let ind = indList[j];
			if (columnIndex === ind) {
				return { color: 'var(--el-color-primary)', cursor: 'pointer' };
			}
		}
	};
};
state.tableData.cellStyle = changeToStyle(state.tableData.data, ['matNo'], [2]);
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data = {
		matNo: form.matNo,
		page: state.tableData.page,
	};
	const res = await getMaterialListApi(data);
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
// const cellStyle = (rows) => {
// 	if (rows.columnIndex === 2) {
// 		return { color: 'red' };
// 	}
// };
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
	sampleDialogRef.value.openDialog(scope, 1);
};
// 点击料号 2
const matnoClick = async (row, column) => {
	const res = await getGetSampleApi(row.matNo);
	console.log(res);

	console.log(row);
	console.log(column);
	if (column.property === 'matNo') {
		sampleDialogRef.value.openDialog(row, 2);
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
