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
			/>
			<el-dialog ref="reportInquiryDialogRef" v-model="reportInquiryDialogVisible" :title="dilogTitle" width="80%">
				<Table v-bind="dialogState.tableData" class="table" />
			</el-dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="scrapBillQuery">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { getQueryExitPageApi, getUselessDetailApi } from '/@/api/scrapManage/scrapBillQuery';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));

// 定义变量内容
const reportInquiryDialogVisible = ref(false);
const { t } = useI18n();
const tableRef = ref<RefType>();
const reportInquiryDialogRef = ref();
// 单元格样式
const cellStyle = ref();
// 弹窗标题
const dilogTitle = ref();
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'uselessno', colWidth: '', title: '报废单号', type: 'text', isCheck: true },
			{ key: 'uselessdate', colWidth: '', title: '报废时间', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '操作人', type: 'text', isCheck: true },
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
			{ label: '报废单号', prop: 'uselessno', required: false, type: 'input' },
			{ label: '报废时间', prop: 'uselessdate', required: false, type: 'dateRange' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		// btnConfig: [{ type: 'send', name: '送签', color: '#D3C333', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			uselessno: '',
			uselessdate: '',
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
const dialogState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{
				key: 'matno',
				colWidth: '250',
				title: 'message.pages.matNo',
				type: 'text',
				isCheck: true,
			},
			// { key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			// { key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			// { key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
			// { key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
			{ key: 'qty', colWidth: '', title: '报废数量', type: 'text', isCheck: true },
			{ key: 'reason', colWidth: '', title: '报废原因', type: 'text', isCheck: true },
			{ key: 'state', colWidth: '', title: '站位', type: 'text', isCheck: true },
			{ key: 'stage', colWidth: '', title: '阶段', type: 'text', isCheck: true },
			{ key: 'classes', colWidth: '', title: '班次', type: 'text', isCheck: true },
			{ key: 'me', colWidth: '', title: 'ME负责人', type: 'text', isCheck: true },
			{ key: 'pm', colWidth: '', title: 'PM确认人', type: 'text', isCheck: true },
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
		// 给后端的数据
		form: {},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// 单元格字体颜色
const changeToStyle = (indList: number[]) => {
	return ({ columnIndex }: any) => {
		for (let j = 0; j < indList.length; j++) {
			let ind = indList[j];
			if (columnIndex === ind) {
				return { color: 'var(--el-color-primary)', cursor: 'pointer' };
			}
		}
	};
};
cellStyle.value = changeToStyle([1]);
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data: EmptyObjectType = {};
	if (form.uselessdate) {
		data = {
			uselessno: form.uselessno,
			uselessdateStart: form.uselessdate[0],
			uselessdateEnd: form.uselessdate[1],
			page: state.tableData.page,
		};
	} else {
		data = {
			uselessno: form.uselessno,
			uselessdateStart: '',
			uselessdateEnd: '',
			page: state.tableData.page,
		};
	}
	const res = await getQueryExitPageApi(data);
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
// 点击申请单号
const reqNoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'uselessno') {
		dilogTitle.value = '报废单号:' + row.uselessno;
		const res = await getUselessDetailApi(row.uselessno);
		dialogState.tableData.data = res.data.uselessdetaillist;
		reportInquiryDialogVisible.value = true;
		if (res.status) {
			dialogState.tableData.config.loading = false;
		}
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
