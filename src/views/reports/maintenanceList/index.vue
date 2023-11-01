<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table ref="tableRef" v-bind="state.tableData" class="table" @pageChange="onTablePageChange" @sortHeader="onSortHeader" @cellclick="reqNoClick">
				<template #btn="{ row }">
					<el-button type="primary" plain size="default" class="button buttonBorder" @click="onSign(row.exitStoreId)">
						{{ $t('查看二維碼編號') }}</el-button
					>
				</template>
			</Table>
			<qrCodeDialog ref="maintenanceListDialogRef" :tags="tags" />
			<!-- <el-dialog v-model="maintenanceListDialogRef" title="二維碼編號" width="30%" draggable>
				<el-tag v-for="tag in tags" :key="tag.code" class="mr10 mb10">
					{{ tag.code }}
				</el-tag>
			</el-dialog> -->
		</div>
	</div>
</template>

<script setup lang="ts" name="maintenanceList">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { getQueryRepairInventoryApi } from '/@/api/reports/maintenanceList';
import { GetExitStoreQrCodeListApi } from '/@/api/maintenanceManage/maintenanceOrderSub';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const matNoDetailDialog = defineAsyncComponent(() => import('/@/views/link/noSearchLink/index.vue'));
const qrCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/qrCodeDialog.vue'));
// 定义变量内容
const { t } = useI18n();
const tableRef = ref<RefType>();
const matNoRef = ref();
const maintenanceListDialogRef = ref();
// tags的数据
let tags = ref<EmptyArrayType>([]);
// 弹窗标题
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{
				key: 'matNo',
				colWidth: '',
				title: 'message.pages.matNo',
				type: 'text',
				isCheck: true,
			},
			{ key: 'buCode', colWidth: '', title: 'BU', type: 'text', isCheck: true },
			// { key: 'machineType', colWidth: '', title: '机种', type: 'text', isCheck: true },
			{ key: 'projectCode', colWidth: '', title: '專案代碼', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'repairReason', colWidth: '', title: '維修原因', type: 'text', isCheck: true },
			{ key: 'repairQty', colWidth: '', title: '維修數量', type: 'text', isCheck: true },
			{ key: 'sendRepairDate', colWidth: '', title: '維修日期', type: 'text', isCheck: true },
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
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
			operateWidth: 150, //操作栏宽度，如果操作栏有几个按钮就自己定宽度
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料號', prop: 'matNo', required: false, type: 'input', lg: 6, xl: 6 },
			// { label: '机种', prop: 'machineType', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			// { label: '品名-英文', prop: 'nameEn', required: false, type: 'input' },
			{ label: '維修日期', prop: 'sendRepairDate', required: false, type: 'dateRange', lg: 6, xl: 6 },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		// 给后端的数据
		form: {
			matNo: '',
			nameEn: '',
			nameCh: '',
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
const onSign = async (exitStoreId: string) => {
	if (!exitStoreId) return ElMessage.warning('該料號沒有庫存，二維碼編碼不存在');
	const res = await GetExitStoreQrCodeListApi(exitStoreId);
	if (res.data) {
		if (!res.data.length) {
			ElMessage.error('暫無二維碼編碼');
		} else {
			tags.value = res.data;
			maintenanceListDialogRef.value?.openDialog();
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
		startDate: form.sendRepairDate && form.sendRepairDate[0],
		endDate: form.sendRepairDate && form.sendRepairDate[1],
		name: form.name,
		page: state.tableData.page,
	};
	const res = await getQueryRepairInventoryApi(data);

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
	tableRef.value.pageReset();
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
