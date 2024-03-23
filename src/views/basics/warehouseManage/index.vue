<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch
				:search="state.tableData.search"
				@search="onSearch"
				:searchConfig="state.tableData.searchConfig"
				@remoteMethod="remoteMethod"
				@selectChange="selectChangeStoreType"
			/>
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
			<Dialog ref="warehouseDialogRef" :dialogConfig="state.tableData.dialogConfig" @addData="addData" :loadingBtn="loadingBtn" />
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

<script setup lang="ts" name="warehouse">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch, nextTick } from 'vue';
import { ElMessage, FormInstance } from 'element-plus';
import { useI18n } from 'vue-i18n';
import {
	getAddStoreHouseApi,
	getUpdateStoreHouseApi,
	getQueryStoreHouseInfo,
	getDeleteStoreHouseApi,
	getAdminsInfosOfStoreHouseApi,
	getAddAdminsToStoreHouseApi,
	getRemoveAdminFromStoreHouseApi,
} from '/@/api/basics/warehouseManage';
import { getLegalStoreTypesApi, getQueryStoreHouseNoPageApi, getUserNameApi } from '/@/api/global';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
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
		header: [
			{ key: 'storeType', colWidth: '', title: 'message.pages.warehouseType', type: 'text', isCheck: true },
			{ key: 'sLocation', colWidth: '', title: 'message.pages.warehouseLocation', type: 'text', isCheck: true },
			// { key: 'runstatus', colWidth: '', title: 'message.pages.state', type: 'status', isCheck: true },
		],
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
			isPage: true, //是否有分页
			operateWidth: 350,
			isBulkDeletionBtn: false,
		},
		topBtnConfig: [{ type: 'add', name: '新增', defaultColor: 'primary', isSure: true, disabled: true }],
		btnConfig: [
			{ type: 'admin', name: 'message.allButton.administratorSettings', color: '#438df5', isSure: false, icon: 'ele-Setting' },
			{ type: 'edit', name: 'message.allButton.editBtn', color: '#39D339', isSure: false, icon: 'ele-Edit' },
			{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true },
		],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{
				label: 'message.pages.warehouseType',
				prop: 'storeType',
				required: false,
				type: 'select',
				options: [],
				placeholder: '',
			},
			{
				label: 'message.pages.warehouseLocation',
				prop: 'sLocation',
				required: false,
				type: 'select',
				placeholder: 'message.pages.wareLocaPlaceholder',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
			},
		],
		searchConfig: {
			isSearchBtn: true,
		},
		// 给后端的数据
		form: {
			storeType: '',
			sLocation: '',
		},
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '',
		// 弹窗表单
		dialogConfig: [
			{ label: 'message.pages.warehouseType', prop: 'storeType', placeholder: '', required: true, type: 'select', options: [] },
			{ label: 'message.pages.warehouseLocation', prop: 'sLocation', placeholder: '', required: true, type: 'input' },
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
			{ key: 'userId', colWidth: '250', title: 'message.pages.workno', type: 'input', isCheck: true, isRequired: true },
			{ key: 'username', colWidth: '', title: 'message.pages.name', type: 'text', isCheck: true, isRequired: false },
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

const getAdminData = async (runId: string) => {
	const res = await getAdminsInfosOfStoreHouseApi(runId);
	res.data.forEach((item: any) => {
		item.userIddisabled = true;
	});
	const tableData = dialogState.tableData;
	tableData.form['runId'] = runId;
	tableData.data = res.data;
};
// 打开管理员设定弹窗
const openAdminDialog = async (scope: EmptyObjectType) => {
	loadingBtn.value = false;
	warehouseDialogVisible.value = true;
	getAdminData(scope.row.storeId);
};
// 輸入工號得到姓名
const onInputBlur = async (index: number, formData: EmptyObjectType) => {
	const row = formData.row;
	if (row.userId) {
		const res = await getUserNameApi(row.userId);
		if (res.status) {
			row.username = res.message;
		} else {
			row.userId = '';
			row.username = '';
			ElMessage.warning(t('message.hint.reEnterNumber'));
		}
	} else {
		row.username = '';
	}
};
//删除
const onDelRow = async (row: EmptyObjectType, i: number) => {
	let deleteData: EmptyObjectType = {};
	deleteData = {
		storeHouseId: dialogState.tableData.form.runId,
		adminId: row.userId,
	};
	if (row.userId && row.runid) {
		const res = await getRemoveAdminFromStoreHouseApi(deleteData);
		if (res.status) {
			ElMessage.success(`${t('message.allButton.deleteBtn')}${t('message.hint.success')}`);
			getAdminData(dialogState.tableData.form.runId);
		}
	} else {
		dialogState.tableData.data.splice(i, 1);
	}
};

const onAddrow = () => {
	dialogState.tableData.data.push({
		userId: '',
		username: '',
		userIddisabled: false,
	});
	//超过设置的高度出现滚动条，添加行定位到底部
	//  1.先拿到设置table的最大高度【滚动条的高度】的元素，获取元素的clientHeight
	//     2.在拿到table的所有行的高度的元素，获取元素的clientHeight
	//     3，当他们相减就是滚动条距离底部的间距，在设置scrollTop
	// const el: any = document.querySelector('.table-dialog .el-scrollbar__wrap');
	// const el2: any = document.querySelector('.table-dialog .el-table__body tbody');
	// setTimeout(() => {
	// 	const height = el2.clientHeight - el.clientHeight;
	// 	if (height > 0) {
	// 		el.scrollTop = height;
	// 	}
	// }, 200);
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
			userIdsArr.push({ runId: item.runid, userId: item.userId });
		});
		allData = {
			storeId: dialogState.tableData.form.runId,
			adminUserInfos: userIdsArr,
		};
		if (allData.adminUserInfos.length <= 0) {
			ElMessage.warning(t(`message.hint.info`));
		} else {
			const res = await getAddAdminsToStoreHouseApi(allData);
			if (res.status) {
				ElMessage.success(t(`message.hint.addedSuccess`));
				warehouseDialogVisible.value = false;
			}
		}
		loadingBtn.value = false;
	});
};
// 改变仓库类型下拉
const selectChangeStoreType = (vals: string, prop: string, form: EmptyObjectType) => {
	if (prop === 'storeType') {
		form.sLocation = '';
	}
};
let option: EmptyArrayType = [];
const remoteMethod = (query: string, form: EmptyObjectType) => {
	if (query) {
		state.tableData.search[1].loading = true;
		setTimeout(async () => {
			const res = await getQueryStoreHouseNoPageApi(form.storeType, query);
			state.tableData.search[1].loading = false;
			option = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.storeId}`, label: `${item.storeType}`, text: `${item.sLocation}` };
			});
			state.tableData.search[1].options = option.filter((item: EmptyObjectType) => {
				return item.text.toLowerCase().includes(query.toLowerCase()) || item.label.toLowerCase().includes(query.toLowerCase());
			});
		}, 500);
	} else {
		state.tableData.search[1].options = [];
	}
};
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	option.forEach((item) => {
		if (item.value === form.sLocation) {
			form.sLocation = item.text;
		}
	});
	let data = {
		sLocation: form.sLocation,
		storeType: form.storeType,
		page: state.tableData.page,
	};
	const res = await getQueryStoreHouseInfo(data);
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
// 下拉框数据
const getSelect = async () => {
	const res = await getLegalStoreTypesApi();
	const option = res.data.map((item: any) => {
		return { label: item, text: item, value: item };
	});
	state.tableData.search[0].options = option;
	if (state.tableData.dialogConfig) {
		state.tableData.dialogConfig[0].options = option;
	}
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value?.pageReset();
};
// 打开弹窗
const openDialog = (type: string, row: Object) => {
	loadingBtn.value = false;
	warehouseDialogRef.value.openDialog(type, row);
};
// 新增数据  修改数据
const addData = async (ruleForm: EmptyObjectType, type: string) => {
	loadingBtn.value = true;
	ruleForm['storeLocation'] = ruleForm.location;
	ruleForm['storeId'] = ruleForm.storeId;
	const res = type === 'add' ? await getAddStoreHouseApi(ruleForm) : await getUpdateStoreHouseApi(ruleForm);
	if (res.status) {
		type === 'add' ? ElMessage.success(t(`message.hint.addedSuccess`)) : ElMessage.success(t(`message.hint.editSuccess`));
		warehouseDialogRef.value.closeDialog();
		getTableData();
	}
	loadingBtn.value = false;
};
// 删除当前项回调
const onTableDelRow = async (row: EmptyObjectType, type: string) => {
	const res = await getDeleteStoreHouseApi(row.storeId);
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
// watch(
// 	() => dialogState.tableData.data,
// 	() => {
// 		nextTick(() => {
// 			dialogTableRef.value.setScrollTop();
// 		});
// 	},
// 	{ deep: true }
// );
// 页面加载时
onMounted(() => {
	getTableData();
	getSelect();
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
