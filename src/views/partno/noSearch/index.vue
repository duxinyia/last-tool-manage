<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@delRow="onTableDelRow"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@importTable="onExportTableData"
				@openAdd="openDialog"
			/>
			<Dialog
				ref="noSearchDialogRef"
				:dialogConfig="state.tableData.dialogConfig"
				@addData="addData"
				@downloadTemp="ondownloadTemp"
				@importTableData="onImportTable"
			/>
		</div>
	</div>
</template>

<script setup lang="ts" name="/partno/noSearch">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getMaterialListApi, getAddMaterialApi, getModifyMaterialApi, getInvalidMaterialApi } from '/@/api/partno/noSearch';
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
			{ key: 'matNo', colWidth: '', title: 'message.pages.matNo', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: 'NameEn', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: 'message.pages.drawNo', type: 'text', isCheck: true },
			{ key: 'specs', colWidth: '', title: 'message.pages.specs', type: 'text', isCheck: true },
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
			{ type: 'edit', name: 'message.allButton.editBtn', color: '#39D339', isSure: false, icon: 'ele-Edit' },
			{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true },
		],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [{ label: '料号', prop: 'matNo', placeholder: '请输入料号', required: false, type: 'input' }],
		searchConfig: {
			isSearchBtn: true,
		},
		// 给后端的数据
		form: {
			matNo: '',
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
		matNo: form.matNo,
		page: state.tableData.page,
		queryType: 1,
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
// 打开弹窗
const openDialog = (type: string, row: Object) => {
	noSearchDialogRef.value.openDialog(type, row);
};
// 新增数据  修改数据
const addData = async (ruleForm: EmptyObjectType, type: string) => {
	if (ruleForm.drawPath.includes('/')) {
		const res = type === 'add' ? await getAddMaterialApi(ruleForm) : await getModifyMaterialApi(ruleForm);
		if (res.status) {
			type === 'add' ? ElMessage.success(`新增成功`) : ElMessage.success(`修改成功`);
			noSearchDialogRef.value.closeDialog();
			getTableData();
		}
	} else {
		ElMessage.error(`新增失败,请点击上传文件按钮进行上传`);
	}
};

// 删除当前项回调
const onTableDelRow = async (row: EmptyObjectType, type: string) => {
	let rows = [];
	if (type === 'bulkDel') {
		Object.keys(row).forEach((key) => {
			rows.push(row[key].matNo);
		});
	} else {
		rows.push(row.matNo);
	}
	const res = await getInvalidMaterialApi(rows);
	if (res.status) {
		type === 'bulkDel'
			? ElMessage.success(`删除成功`)
			: ElMessage.success(`${t('message.allButton.deleteBtn')}${row.matNo}${t('message.hint.success')}`);
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
const onExportTableData = async (row: EmptyObjectType) => {
	// let rows: EmptyArrayType = [];
	// Object.keys(row).forEach((key) => {
	// 	rows.push(row[key].runid);
	// });
	// const res = await getBaseDownloadApi(rows);
	// let blob = new Blob([res], {
	// 	// 这里一定要和后端对应，不然可能出现乱码或者打不开文件
	// 	type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	// });
	// if (window.navigator.msSaveOrOpenBlob) {
	// 	navigator.msSaveBlob(blob, fileName);
	// } else {
	// 	const link = document.createElement('a');
	// 	link.href = window.URL.createObjectURL(blob);
	// 	link.download = `${t('message.router.basicsBasic')} ${new Date().toLocaleString()}.xlsx`; // 在前端也可以设置文件名字
	// 	link.click();
	// 	//释放内存
	// 	window.URL.revokeObjectURL(link.href);
	// }
};
// 下载模版
const ondownloadTemp = async () => {
	// const res = await getDownloadTemplateApi();
	// let blob = new Blob([res], {
	// 	// 这里一定要和后端对应，不然可能出现乱码或者打不开文件
	// 	type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	// });
	// if (window.navigator.msSaveOrOpenBlob) {
	// 	navigator.msSaveBlob(blob, fileName);
	// } else {
	// 	const link = document.createElement('a');
	// 	link.href = window.URL.createObjectURL(blob);
	// 	link.download = `${t('message.router.basicsBasic')} ${new Date().toLocaleString()}${t('message.pages.template')}.xlsx`; // 在前端也可以设置文件名字
	// 	link.click();
	// 	//释放内存
	// 	window.URL.revokeObjectURL(link.href);
	// }
};

// 导入表格
const onImportTable = async (raw: EmptyObjectType) => {
	// console.log(raw);
	// const res = await getImportDataApi(raw.raw);
	// res.status && ElMessage.success('导入数据成功！');
	// getTableData();
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
