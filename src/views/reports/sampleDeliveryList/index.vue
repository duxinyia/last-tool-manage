<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table ref="tableRef" v-bind="state.tableData" class="table" @pageChange="onTablePageChange" @sortHeader="onSortHeader" @cellclick="reqNoClick">
				<template #btn="{ row }">
					<el-button type="primary" plain size="default" class="button buttonBorder" @click="onSign(row.sampleNo)"> {{ $t('查看詳情') }}</el-button>
				</template>
			</Table>
			<el-dialog v-model="sampleDeliveryListDialogRef" title="詳情" width="50%" draggable :close-on-click-modal="false">
				<Table v-bind="dialogState.tableData" class="table" />
			</el-dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="sampleDeliveryList">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { getQueryMatSampleInventoryApi, getMatSampleDetailsBySampleNoApi } from '/@/api/reports/sampleDeliveryList';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const matNoDetailDialog = defineAsyncComponent(() => import('/@/views/link/noSearchLink/index.vue'));
// 定义变量内容
const { t } = useI18n();
const tableRef = ref<RefType>();
const matNoRef = ref();
const sampleDeliveryListDialogRef = ref(false);

// 弹窗标题
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'sampleNo', colWidth: '', title: '送樣單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'buCode', colWidth: '', title: 'BU', type: 'text', isCheck: true },
			// { key: 'machineType', colWidth: '', title: '机种', type: 'text', isCheck: true },
			{ key: 'projectCode', colWidth: '', title: '專案代碼', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'needsTotal', colWidth: '', title: '需求送樣數量', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'engineer', colWidth: '', title: '工程窗口', type: 'text', isCheck: true },
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
			operateWidth: 130, //操作栏宽度，如果操作栏有几个按钮就自己定宽度
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料號', prop: 'matNo', required: false, type: 'input', lg: 6, xl: 6 },
			{ label: '送樣單號', prop: 'sampleNo', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		// 给后端的数据
		form: {
			matNo: '',
			sampleNo: '',
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
const dialogState = reactive({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'sampleTime', colWidth: '', title: '送樣時間', type: 'text', isCheck: true },
			{ key: 'sampleQty', colWidth: '', title: '送樣數量', type: 'text', isCheck: true },
			{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true },
			{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true },
			{ key: 'checkTime', colWidth: '', title: '驗證時間', type: 'text', isCheck: true },
			{ key: 'isPassed', colWidth: '', title: '是否通過', type: 'text', isCheck: true },
			{ key: 'checkFailReason', colWidth: '', title: '問題點', type: 'text', isCheck: true },
		],
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
	},
});
const onSign = async (sampleNo: string) => {
	const res = await getMatSampleDetailsBySampleNoApi(sampleNo);
	if (res.data) {
		if (!res.data.length) {
			ElMessage.error('暫無詳情信息');
		} else {
			sampleDeliveryListDialogRef.value = true;
			dialogState.tableData.data = res.data;
			dialogState.tableData.config.loading = false;
		}
	}
};
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data: EmptyObjectType = {};
	data = {
		matNo: form.matNo,
		sampleNo: form.sampleNo,
		page: state.tableData.page,
	};
	const res = await getQueryMatSampleInventoryApi(data);

	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
// 点击料号
const reqNoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	// if (column.property === 'matNo') {
	// 	matNoRef.value = row.matNo;
	// 	setTimeout(() => {
	// 		maintenanceListDialogRef.value = true;
	// 	}, 100);
	// }
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
.buttonBorder {
	border: 0px !important;
}
</style>
