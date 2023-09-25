<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" class="mt15" />
			<Table ref="tableRef" v-bind="state.tableData" class="table" @pageChange="onTablePageChange" @sortHeader="onSortHeader">
				<template #btn="{ row }">
					<el-button type="primary" plain size="default" class="button buttonBorder" @click="drawPathClick(row.drawPath)">
						{{ $t('查看图纸') }}</el-button
					>
				</template>
			</Table>
		</div>
	</div>
</template>

<script setup lang="ts" name="drawingList">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { getQueryDrawInventoryApi } from '/@/api/reports/drawingList';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 定义变量内容
const { t } = useI18n();
const tableRef = ref<RefType>();
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matNo', colWidth: '250', title: '料号', type: 'text', isCheck: true },
			{ key: 'buCode', colWidth: '', title: 'BU', type: 'text', isCheck: true },
			{ key: 'machineType', colWidth: '', title: '机种', type: 'text', isCheck: true },
			{ key: 'projectCode', colWidth: '', title: '专案代码', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '图纸编号', type: 'text', isCheck: true },
			// { key: 'drawPath', colWidth: '', title: '图纸路径', type: 'text', isCheck: true },
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
			// operateWidth: 150, //操作栏宽度，如果操作栏有几个按钮就自己定宽度
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料号', prop: 'matNo', required: false, type: 'input', lg: 6, xl: 6 },
			{ label: 'BU', prop: 'buCode', required: false, type: 'input' },
			{ label: '机种', prop: 'machineType', required: false, type: 'input' },
			{ label: '品名-中文', prop: 'nameCh', required: false, type: 'input' },
			{ label: '品名-英文', prop: 'nameEn', required: false, type: 'input' },
			{ label: '图纸编号', prop: 'drawNo', required: false, type: 'input', lg: 6, xl: 6 },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		// 给后端的数据
		form: {
			// matNo: '',
			// buCode: '',
			// machineType: '',
			// nameEn: '',
			// nameCh: '',
			// drawNo: '',
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
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data: EmptyObjectType = {};
	data = {
		...form,
		page: state.tableData.page,
	};
	const res = await getQueryDrawInventoryApi(data);
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
// 点击查看图纸
const drawPathClick = async (drawPath: string) => {
	// if (drawPath.includes('/')) {
	window.open(`${import.meta.env.VITE_API_URL}${drawPath}`, '_blank');
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
	border: 0rem !important;
}
</style>
