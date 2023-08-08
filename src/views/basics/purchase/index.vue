<template>
	<div class="table-demo-container layout-padding">
		<div class="table-demo-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table-demo"
				@delRow="onTableDelRow"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@openAdd="openDialog"
			/>
			<Dialog ref="purchaseDialogRef" :dialogConfig="state.tableData.dialogConfig" @addData="addData" />
		</div>
	</div>
</template>

<script setup lang="ts" name="basicsPurchase">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
// 接口
import { getGroupListApi, getAddGroupMemberApi, getRemoveGroupMemberApi } from '/@/api/basics/group';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入组件
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
// 定义变量内容
const purchaseDialogRef = ref();
const tableRef = ref<RefType>();
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'grouptype', colWidth: '', title: 'message.pages.groupType', type: 'text', isCheck: true },
			{ key: 'area', colWidth: '', title: 'message.pages.factoryarea', type: 'text', isCheck: true },
			{ key: 'bucode', colWidth: '', title: 'message.pages.bu', type: 'text', isCheck: true },
			{ key: 'username', colWidth: '', title: 'message.pages.name', type: 'text', isCheck: true },
			{ key: 'userid', colWidth: '', title: 'message.pages.workno', type: 'text', isCheck: true },
			{ key: 'runstatus', colWidth: '', title: 'message.pages.state', type: 'status', isCheck: true },
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
			isEditBtn: false,
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: 'message.pages.workno', prop: 'userid', placeholder: 'message.account.accountPlaceholder1', required: false, type: 'input' },
			{ label: 'message.pages.name', prop: 'username', placeholder: 'message.pages.placename', required: false, type: 'input' },
		],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true }],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 给后端的数据
		form: {
			userid: '',
		},
		// 打印标题
		printName: '表格打印演示',
		// 弹窗表单
		dialogConfig: [{ label: '工号', prop: 'UserId', placeholder: '请输入工号', required: true, type: 'input' }],
	},
});

// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data = {
		groupType: 1,
		userId: form.userid,
		page: state.tableData.page,
	};
	const res = await getGroupListApi(data);
	res.data.data.forEach((item: EmptyObjectType) => {
		item.grouptype = '采购';
	});
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
	purchaseDialogRef.value.openDialog(type, row);
};
// 新增数据  修改数据
const addData = async (ruleForm: EmptyObjectType) => {
	ruleForm['GroupType'] = 1;
	const res = await getAddGroupMemberApi(ruleForm);
	if (res.status) {
		ElMessage.success(`新增成功`);
		purchaseDialogRef.value.closeDialog();
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
	const res = await getRemoveGroupMemberApi(rows);
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
