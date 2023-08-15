<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table ref="tableRef" v-bind="state.tableData" class="table" @pageChange="onTablePageChange" @sortHeader="onSortHeader" @openAdd="openDialog" />
			<Dialog ref="noSearchDialogRef" :dialogConfig="state.tableData.dialogConfig" />
		</div>
	</div>
</template>

<script setup lang="ts" name="/partno/noSearch">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getToolApplyHeadPageApi } from '/@/api/requistManage/reportingInquiry';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
// 定义变量内容
const { t } = useI18n();
const tableRef = ref<RefType>();
const noSearchDialogRef = ref();
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'reqNo', colWidth: '', title: '申请单号', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: 'PR单号', type: 'text', isCheck: true },
			{ key: 'companyId', colWidth: '', title: '提报人', type: 'text', isCheck: true },
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
			isTopTool: true, //是否有表格右上角工具
			isPage: true, //是否有分页
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '申请单号', prop: 'reqNo', required: false, type: 'input' },
			{ label: 'PR单号', prop: 'matNo1', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		// 给后端的数据
		form: {
			reqNo: '',
		},
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '表格打印演示',
		// 弹窗表单
		dialogConfig: [
			{ label: 'message.pages.matNo', prop: 'matNo', placeholder: 'message.pages.placeMatNo', required: true, type: 'input' },
			{ label: 'message.pages.nameCh', prop: 'nameCh', placeholder: 'message.pages.placeNameCh', required: true, type: 'input' },
			{ label: 'NameEn', prop: 'nameEn', placeholder: 'message.pages.placeNameEn', required: true, type: 'input' },
			{ label: 'message.pages.drawNo', prop: 'drawNo', placeholder: 'message.pages.placeDrawNo', required: true, type: 'input' },
			{ label: 'message.pages.specs', prop: 'specs', placeholder: 'message.pages.placeSpecs', required: true, type: 'input' },
			{
				label: 'message.pages.drawPath',
				prop: 'drawPath',
				placeholder: 'message.pages.placeDrawPath',
				required: true,
				type: 'inputFile',
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
			{
				label: 'message.pages.describe',
				prop: 'describe',
				placeholder: 'message.pages.placeDescribe',
				required: false,
				type: 'textarea',
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
		],
	},
});

// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data = {
		reqNo: form.reqNo,
		page: state.tableData.page,
	};
	const res = await getToolApplyHeadPageApi(data);
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
// 打开弹窗
const openDialog = (type: string, row: Object) => {
	noSearchDialogRef.value.openDialog(type, row);
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
</style>
