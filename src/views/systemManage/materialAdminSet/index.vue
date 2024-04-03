<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@delRow="onTableDelRow"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@openAdd="openDialog"
				@onOpenOtherDialog="openAdminDialog"
			/>
			<!-- 新增编辑弹窗 -->
			<Dialog
				ref="warehouseDialogRef"
				:dialogConfig="state.tableData.dialogConfig"
				@addData="addData"
				:loadingBtn="loadingBtn"
				labelWidth="50px"
				dialogWidth="20%"
			/>
			<!-- 管理员设定弹窗 -->
			<el-dialog
				draggable
				:close-on-click-modal="false"
				ref="warehouseAdminDialogRef"
				v-model="warehouseDialogVisible"
				:title="$t('message.allButton.administratorSettings')"
				width="40%"
			>
				<el-form ref="tableFormRef" :model="dialogState.tableData">
					<Table
						ref="dialogTableRef"
						v-bind="dialogState.tableData"
						class="table-dialog"
						@delRow="onDelRow"
						@addrow="onAddrow"
						@inputBlur="onInputBlur"
					/>
				</el-form>
				<template #footer>
					<span class="dialog-footer">
						<el-button size="default" auto-insert-space @click="warehouseDialogVisible = false">{{ t('message.allButton.cancel') }}</el-button>
						<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)" :loading="loadingBtn">
							{{ t('message.allButton.ok') }}</el-button
						>
					</span>
				</template>
			</el-dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="materialAdminSet">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch, nextTick } from 'vue';
import { ElMessage, FormInstance } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { getAddAdminsToStoreHouseApi } from '/@/api/basics/warehouseManage';
import {
	deleteBuMatManagerApi,
	deleteRemoveBuMatManagersApi,
	getBuMatManagerBUsApi,
	getBuMatManagerGetMatManagersOfBuApi,
	postBuMatManagerAddMatManagersToBuBuApi,
	postBuMatManagerCreateBuApi,
} from '/@/api/systemManage/materialAdminSet';
import { getUserNameApi } from '/@/api/global';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
// 引入组件
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
// 定义变量内容
const { t } = useI18n();
const warehouseDialogRef = ref();
const tableRef = ref<RefType>();
const dialogTableRef = ref<RefType>();
const warehouseDialogVisible = ref(false);
const tableFormRef = ref();
const loadingBtn = ref(false);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [{ key: 'buCode', colWidth: '', title: 'BU', type: 'text', isCheck: true }],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: true, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: false, //是否有分页
			operateWidth: 300,
			isBulkDeletionBtn: false,
		},
		topBtnConfig: [{ type: 'add', name: '新增', defaultColor: 'primary', isSure: true, disabled: true }],
		btnConfig: [
			{ type: 'admin', name: 'message.allButton.administratorSettings', color: '#438df5', isSure: false, icon: 'ele-Setting' },
			{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true },
		],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [],
		searchConfig: {
			isSearchBtn: false,
		},
		// 给后端的数据
		form: {},
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '',
		// 弹窗表单
		dialogConfig: [
			{ label: 'BU', prop: 'buCode', placeholder: '', required: true, type: 'input', maxlength: 5, xs: 24, sm: 24, md: 24, lg: 24, xl: 24 },
		],
	},
});
// 管理员设定弹窗
const dialogState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matManager', colWidth: '250', title: 'message.pages.workno', type: 'input', isCheck: true, isRequired: true },
			{ key: 'matManagerName', colWidth: '', title: 'message.pages.name', type: 'text', isCheck: true, isRequired: false },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: true, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			height: 380,
			isAddRowBtn: true,
		},
		// 给后端的数据
		form: {},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true }],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// 獲取管理員數據
const getAdminData = async (buCode: string) => {
	const tableData = dialogState.tableData;
	tableData.config.loading = true;
	const res = await getBuMatManagerGetMatManagersOfBuApi(buCode);
	tableData.config.loading = false;
	res.data.forEach((item: any) => {
		item.matManagerdisabled = true;
	});
	tableData.data = res.data;
};
// 打开管理员设定弹窗
let openAdminDialogRow: EmptyObjectType = {};
const openAdminDialog = async (scope: EmptyObjectType) => {
	openAdminDialogRow = scope.row;
	loadingBtn.value = false;
	warehouseDialogVisible.value = true;
	getAdminData(scope.row.buCode);
};
// 輸入工號得到姓名
const onInputBlur = async (index: number, formData: EmptyObjectType) => {
	const row = formData.row;
	if (row.matManager) {
		const res = await getUserNameApi(row.matManager);
		if (res.status) {
			row.matManagerName = res.message;
		} else {
			row.matManager = '';
			row.matManagerName = '';
			ElMessage.warning(t('message.hint.reEnterNumber'));
		}
	} else {
		row.matManagerName = '';
	}
};
//删除
const onDelRow = async (row: EmptyObjectType, i: number) => {
	let deleteData: EmptyObjectType = {};
	deleteData = {
		buCode: openAdminDialogRow.buCode,
		matManagers: [row.matManager],
	};
	if (row.matManagerdisabled) {
		const res = await deleteRemoveBuMatManagersApi(deleteData);
		if (res.status) {
			ElMessage.success(`${t('message.allButton.deleteBtn')}${t('message.hint.success')}`);
			getAdminData(openAdminDialogRow.buCode);
		}
	} else {
		dialogState.tableData.data.splice(i, 1);
	}
};
// 增加一行
const onAddrow = () => {
	dialogState.tableData.data.push({
		matManager: '',
		matManagerName: '',
		matManagerdisabled: false,
	});
	// 新增的时候超过表格了跟着移动
	nextTick(() => {
		dialogTableRef.value.setScrollTop();
	});
};
// 提交
const onSubmit = async (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('message.hint.formRequired'));
		loadingBtn.value = true;
		let allData: EmptyObjectType = {};
		let userIdsArr: EmptyArrayType = [];
		dialogState.tableData.data.forEach((item) => {
			if (!item.matManagerdisabled) {
				userIdsArr.push(item.matManager);
			}
		});
		allData = {
			buCode: openAdminDialogRow.buCode,
			matManagers: userIdsArr,
		};
		if (allData.matManagers.length <= 0) {
			ElMessage.warning(t(`message.hint.info`));
		} else {
			const res = await postBuMatManagerAddMatManagersToBuBuApi(allData);
			if (res.status) {
				ElMessage.success(t(`message.hint.addedSuccess`));
				warehouseDialogVisible.value = false;
			}
		}
		loadingBtn.value = false;
	});
};
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const res = await getBuMatManagerBUsApi();
	const datas = res.data.map((item: any, index: number) => {
		return { buCode: item, index: index };
	});
	state.tableData.data = datas;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
// 打开弹窗
const openDialog = (type: string, row: Object) => {
	loadingBtn.value = false;
	warehouseDialogRef.value.openDialog(type, row);
};
// 新增数据  修改数据
const addData = async (ruleForm: EmptyObjectType, type: string) => {
	loadingBtn.value = true;
	const res = await postBuMatManagerCreateBuApi(ruleForm.buCode);
	if (res.status) {
		ElMessage.success(t(`message.hint.addedSuccess`));
		warehouseDialogRef.value.closeDialog();
		getTableData();
	}
	loadingBtn.value = false;
};
// 删除当前项回调
const onTableDelRow = async (row: EmptyObjectType) => {
	const res = await deleteBuMatManagerApi(row.buCode);
	if (res.status) {
		ElMessage.success(`${t('message.allButton.deleteBtn')}${t('message.hint.success')}`);
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
