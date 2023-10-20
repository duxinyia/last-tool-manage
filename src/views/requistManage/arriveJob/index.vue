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
				@onOpenOtherDialog="openArriveJobDialog"
			/>
			<Dialog
				ref="arriveJobDialogRef"
				:dialogConfig="state.tableData.dialogConfig"
				@addData="onSubmit"
				@remoteMethod="remoteMethod"
				:loadingBtn="loadingBtn"
				@handleNumberInputChange="changeInput"
			>
				<template #optionFat="{ row }">
					<span style="float: left">{{ row.label }}</span>
					<span style="float: right; color: var(--el-text-color-secondary)">{{ row.value }}</span>
				</template>
			</Dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="/requistManage/arriveJob">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, FormInstance } from 'element-plus';
// 引入接口
import { getGetWaitRecievePageListApi, getAddReceiveApi } from '/@/api/requistManage/arriveJob';
import { getEngieerGroupApi } from '/@/api/global/index';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const arriveJobDialogRef = ref();
const loading = ref(false);
const loadingBtn = ref(false);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'reqNo', colWidth: '', title: '申请单号', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR单号', type: 'text', isCheck: true },
			{ key: 'prItemNo', colWidth: '', title: 'PR项次', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料号', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'reqQty', colWidth: '', title: '需求数量', type: 'text', isCheck: true },
			{ key: 'receiveQty', colWidth: '', title: '已收货数量', type: 'text', isCheck: true },
			{ key: 'reqDate', colWidth: '', title: '需求日期', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '提报人', type: 'text', isCheck: true },
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
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '申请单号', prop: 'reqNo', required: false, type: 'input' },
			{ label: 'PR单号', prop: 'prNo', required: false, type: 'input' },
			{ label: '料号', prop: 'matNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{ label: '需求日期', prop: 'reqDate', required: false, type: 'dateRange', lg: 4, xl: 4 },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '收货', color: '#D3C333', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			// reqNo: '',
			// prNo: '',
		},
		dialogConfig: [
			// { type: 'text', label: '收货单号', placeholder: '', prop: 'sendNo', required: false },
			{ type: 'text', label: '申请单号', placeholder: '', prop: 'reqNo', required: false },
			{ type: 'text', label: 'PR单号', placeholder: '', prop: 'prNo', required: false },
			{ type: 'text', label: 'PR项次', placeholder: '', prop: 'prItemNo', required: false },
			{ type: 'text', label: 'message.pages.matNo', placeholder: '', prop: 'matNo', required: false },
			{ type: 'text', label: '品名-中文', placeholder: '', prop: 'nameCh', required: false },
			{ type: 'text', label: '品名-英文', placeholder: '', prop: 'nameEn', required: false },
			{ type: 'text', label: '需求数量', placeholder: '', prop: 'reqQty', required: false },
			{ type: 'text', label: '已收货数量', placeholder: '', prop: 'receiveQty', required: false },
			{ type: 'text', label: '需求日期', placeholder: '', prop: 'reqDate', required: false },
			{
				label: '工程验收人',
				prop: 'engineer',
				placeholder: '请输入工程验收人',
				required: true,
				type: 'select',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
			},
			{ type: 'number', label: '收货数量', placeholder: '', prop: 'receiptQty', required: true, min: 1 },
			{ type: 'date', label: '收货时间', placeholder: '', prop: 'receiveDate', required: true },
			{
				type: 'textarea',
				label: '描述说明',
				placeholder: '请输入描述说明',
				prop: 'describe',
				required: false,
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
		],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '表格打印演示',
	},
});
// const dialogState = reactive<TableDemoState>({
// 	tableData: {
// 		// 列表数据（必传）
// 		data: [],
// 		// 表头内容（必传，注意格式）
// 		header: [],
// 		// 配置项（必传）
// 		config: {
// 			total: 0, // 列表总数
// 			loading: true, // loading 加载
// 			isBorder: false, // 是否显示表格边框
// 			isSerialNo: true, // 是否显示表格序号
// 			isSelection: false, // 是否显示表格多选
// 			isOperate: false, // 是否显示表格操作栏
// 			isButton: false, //是否显示表格上面的新增删除按钮
// 			isInlineEditing: false, //是否是行内编辑
// 			isTopTool: false, //是否有表格右上角工具
// 			isPage: false, //是否有分页
// 			isDialogTab: true, //是否是弹窗里面的表格
// 			height: 500,
// 		},
// 		// 给后端的数据
// 		form: {},
// 		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
// 		search: [
// 			{ label: '收货单号', prop: 'sendNo', required: false, type: 'text' },
// 			{ label: '申请单号', prop: 'reqNo', required: false, type: 'text' },
// 			{ label: 'PR单号', prop: 'prNo', required: false, type: 'text' },
// 			{ label: '工程验收人', prop: 'engineer', required: false, type: 'select', options: [], isRequired: true },
// 			// { label: '收货时间', prop: 'sendTime', required: false, type: 'time', isRequired: true },
// 		],
// 		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true, disabled: true }],
// 		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
// 		page: {
// 			pageNum: 1,
// 			pageSize: 10,
// 		},
// 	},
// });
// 点击收货弹窗
const currentData = ref<EmptyObjectType>([]);
const openArriveJobDialog = (scope: EmptyObjectType) => {
	arriveJobDialogRef.value.openDialog('samp', scope.row, '收货');
	currentData.value = scope.row;
};
const changeInput = (val: number, formData: EmptyObjectType) => {
	const dialogData = currentData.value;
	if (state.tableData.dialogConfig) {
		state.tableData.dialogConfig[10].max = dialogData.reqQty - dialogData.receiveQty;
		if (val > dialogData.reqQty - dialogData.receiveQty) {
			formData.receiptQty = dialogData.reqQty - dialogData.receiveQty;
		}
	}
};

// 搜索下拉选择
const remoteMethod = (query: string) => {
	let dialogConfig = state.tableData.dialogConfig;
	dialogConfig?.forEach((item) => {
		if (item.prop === 'engineer') item.loading = true;
	});
	if (query) {
		loading.value = true;
		setTimeout(async () => {
			const res = await getEngieerGroupApi(query);
			loading.value = false;
			let options = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.userid}`, label: `${item.username}` };
			});
			dialogConfig?.forEach((item) => {
				if (item.prop === 'engineer') item.loading = false;
				item.options = options.filter((item: EmptyObjectType) => {
					return item.value.toLowerCase().includes(query.toLowerCase()) || item.label.toLowerCase().includes(query.toLowerCase());
				});
			});
		}, 500);
	} else {
		dialogConfig?.forEach((item) => {
			if (item.prop === 'engineer') item.options = [];
		});
	}
};

// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	let data = {
		...form,
		reqDate: form.reqDate,
		startReqDate: form.reqDate && form.reqDate[0],
		endReqDate: form.reqDate && form.reqDate[1],
		page: state.tableData.page,
	};
	delete data.reqDate;
	const res = await getGetWaitRecievePageListApi(data);
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};

// 提交
const onSubmit = async (formData: any) => {
	loadingBtn.value = true;
	const getData = {
		applyDetailId: formData.applyDetailId,
		receiveQty: formData.receiptQty,
		receiveDate: formData.receiveDate,
		engineer: formData.engineer,
		describe: formData.describe,
	};
	// options.forEach((item) => {
	// 	if (item.value === formData.purchaserName) {
	// 		getData['purchaser'] = item.label;
	// 		getData['purchaserName'] = item.text;
	// 	}
	// });
	const res = await getAddReceiveApi(getData);
	if (res.status) {
		ElMessage.success(t('收货成功'));

		arriveJobDialogRef.value.closeDialog();
		getTableData();
	}
	loadingBtn.value = false;
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
// if (dialogState.tableData.btnConfig)
// 	dialogState.tableData.btnConfig[0].disabled = computed(() => {
// 		return dialogState.tableData.data.length <= 1 ? true : false;
// 	});
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
.describe {
	display: flex;
	margin-top: 10px;
	span {
		width: 90px;
	}
}
</style>
