<template>
	<div class="table-demo-container layout-padding">
		<div class="table-demo-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table-demo"
				@delRow="onTableDelRow"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@importTable="onImportTableData"
				@openAdd="openDialog"
			/>
			<Dialog ref="codeDialogRef" :dialogConfig="state.tableData.dialogConfig" @addData="addData" />
		</div>
	</div>
</template>

<script setup lang="ts" name="/basics/code">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { getSearchBaseMachine, getBaseMachineAddApi, getBaseMachineUpdateApi, getBaseMachineDeleteApi } from '/@/api/basics/code';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入组件
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
// 定义变量内容
const { t } = useI18n();
const codeDialogRef = ref();
const tableRef = ref<RefType>();
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'area', colWidth: '', title: '厂区', type: 'text', isCheck: true },
			{ key: 'bu', colWidth: '', title: 'BU', type: 'text', isCheck: true },
			{ key: 'machinetype', colWidth: '', title: '机种', type: 'text', isCheck: true },
			{ key: 'stage', colWidth: '', title: '阶段', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: 'message.pages.creator', type: 'text', isCheck: true },
			{ key: 'createtime', title: 'message.pages.creationTime', type: 'text', isCheck: true },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: true, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: true, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: true, //是否有分页
		},
		btnConfig: [
			{ type: 'edit', name: 'message.allButton.editBtn', color: '#39D339', isSure: false },
			{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true },
		],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{
				label: '专案代码',
				prop: 'projectcode',
				placeholder: '请输入专案代码',
				required: false,
				type: 'input',
			},
		],
		searchConfig: {
			isSearchBtn: true,
		},
		// 给后端的数据
		form: {
			projectcode: '',
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
			{ label: '专案代码', prop: 'projectcode', placeholder: '请输入专案代码', required: true, type: 'input' },
			{ label: '厂区', prop: 'area', placeholder: '请输入厂区', required: true, type: 'input' },
			{ label: 'BU', prop: 'bu', placeholder: '请输入BU', required: true, type: 'input' },
			{ label: '机种', prop: 'machinetype', placeholder: '请输入机种', required: true, type: 'input' },
			{ label: '阶段', prop: 'stage', placeholder: '请输入阶段', required: true, type: 'input' },
		],
	},
});

// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data = {
		projectcode: form.projectcode,
		page: state.tableData.page,
	};
	const res = await getSearchBaseMachine(data);
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
	codeDialogRef.value.openDialog(type, row);
};

// 新增数据  修改数据
const addData = async (ruleForm: object, type: string) => {
	const res = type === 'add' ? await getBaseMachineAddApi(ruleForm) : await getBaseMachineUpdateApi(ruleForm);
	if (res.status) {
		type === 'add' ? ElMessage.success(`新增成功`) : ElMessage.success(`修改成功`);
		codeDialogRef.value.closeDialog();
		getTableData();
	}
};
// 删除当前项回调
const onTableDelRow = async (row: EmptyObjectType, type: string) => {
	let rows = [];
	if (type === 'bulkDel') {
		Object.keys(row).forEach((key) => {
			rows.push(row[key].runid);
		});
	} else {
		rows.push(row.runid);
	}
	const res = await getBaseMachineDeleteApi(rows);
	if (res.status) {
		ElMessage.success(`${t('message.allButton.deleteBtn')}${row.dataname}${t('message.hint.success')}`);
		getTableData();
	}
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
// 导出
const onImportTableData = async () => {
	// const res = await getBaseDownloadApi();
	// let blob = new Blob([res], {
	// 	// 这里一定要和后端对应，不然可能出现乱码或者打不开文件
	// 	type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	// });
	// if (window.navigator.msSaveOrOpenBlob) {
	// 	navigator.msSaveBlob(blob, fileName);
	// } else {
	// 	const link = document.createElement('a');
	// 	link.href = window.URL.createObjectURL(blob);
	// 	link.download = `${t('message.router.basicsBasic')} ${new Date().toLocaleString()}.xls`; // 在前端也可以设置文件名字
	// 	link.click();
	// 	//释放内存
	// 	window.URL.revokeObjectURL(link.href);
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
</style>
