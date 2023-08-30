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
				@onOpenOtherDialog="openEntryDialog"
			/>
			<Dialog
				ref="entryJobDialogRef"
				:dialogConfig="state.tableData.dialogConfig"
				:innerDialogConfig="state.tableData.innerDialogConfig"
				dialogWidth="50%"
				@addData="entrySubmit"
				@dailogFormButton="scanCodeEntry"
			/>
		</div>
	</div>
</template>

<script setup lang="ts" name="/toolsReturn/entryJob">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
// 引入接口
import { GetTStockInputPageListApi, GetUserManagedStoreHouseApi, GetTStockAddApi } from '/@/api/requistManage/entryJob';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const entryJobDialogRef = ref();
// 单元格样式
const cellStyle = ref();
// 弹窗标题
const dilogTitle = ref();
const header = ref([
	{ key: 'matNo', colWidth: '250', title: 'message.pages.matNo', type: 'text', isCheck: true },
	{ key: 'machinetype', colWidth: '', title: '机种', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
	{ key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
	{ key: 'prItemNo', colWidth: '', title: 'PR项次', type: 'text', isCheck: true },
	{ key: 'reqQty', colWidth: '', title: '需求数量', type: 'text', isCheck: true },
	{ key: 'reqDate', colWidth: '', title: '需求时间', type: 'text', isCheck: true },
	{ key: 'receiptQty', colWidth: '', title: '收货数量', type: 'input', isCheck: true, isRequired: true },
	{ key: 'receiptDate', colWidth: '150', title: '收货时间', type: 'time', isCheck: true, isRequired: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'checkno', colWidth: '', title: '验收单号', type: 'text', isCheck: true },
			{ key: 'receiptno', colWidth: '', title: '收货单号', type: 'text', isCheck: true },
			// { key: 'reqno', colWidth: '', title: '申请单号', type: 'text', isCheck: true },
			{ key: 'matno', colWidth: '', title: '料号', type: 'text', isCheck: true },
			// { key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			// { key: 'nameen', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'checkqty', colWidth: '', title: '验收数量', type: 'text', isCheck: true },
			{ key: 'passqty', colWidth: '', title: '合格数量', type: 'text', isCheck: true },
			{ key: 'failqty', colWidth: '', title: '不合格数量', type: 'text', isCheck: true },
			// { key: 'runstatus', colWidth: '', title: '状态', type: 'status', isCheck: true },
			// { key: 'isstorage', colWidth: '', title: '是否入库', type: 'text', isCheck: true },
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
		search: [{ label: '验收单号', prop: 'checkno', required: false, type: 'input' }],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '入库', color: '#D3C333', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			reqNo: '',
			prNo: '',
		},
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '表格打印演示',
		//入库弹窗
		dialogConfig: [
			{ label: '入库单号:', prop: 'putno', placeholder: '请输入入库单号', required: false, type: 'text', xs: 24, sm: 8, md: 8, lg: 8, xl: 8 },
			{ label: '验收单号:', prop: 'checkno', placeholder: '请输入验收单号', required: false, type: 'text', xs: 24, sm: 12, md: 12, lg: 8, xl: 8 },
			//这个字段待定
			{ label: '验收人:', prop: 'creator', placeholder: '请输入验收人', required: false, type: 'text', xs: 24, sm: 8, md: 8, lg: 8, xl: 8 },
			{ label: '料号:', prop: 'matno', placeholder: '请输入料号', required: false, type: 'text', xs: 24, sm: 12, md: 12, lg: 8, xl: 8 },
			{ label: '品名-中文:', prop: 'namech', placeholder: '请输入品名-中文', required: false, type: 'text', xs: 24, sm: 8, md: 8, lg: 8, xl: 8 },
			{ label: '品名-英文:', prop: 'nameen', placeholder: '请输入品名-英文', required: false, type: 'text', xs: 24, sm: 8, md: 8, lg: 8, xl: 8 },
			{ label: '厂商代码:', prop: 'vendorcode', placeholder: '请输入厂商代码', required: false, type: 'text', xs: 24, sm: 8, md: 8, lg: 8, xl: 8 },
			{
				label: '厂商名称:',
				prop: 'vendorname',
				placeholder: '请输入厂商名称',
				required: false,
				type: 'text',
				xs: 24,
				sm: 8,
				md: 8,
				lg: 16,
				xl: 16,
			},
			{ label: '验收数量:', prop: 'checkqty', placeholder: '请输入验收数量', required: false, type: 'text', xs: 24, sm: 8, md: 8, lg: 8, xl: 8 },
			// 这个字段待定
			{
				label: '验收时间:',
				prop: 'checkdate',
				placeholder: '请输入验收时间',
				required: false,
				type: 'text',
				xs: 24,
				sm: 8,
				md: 8,
				lg: 16,
				xl: 16,
			},
			{
				label: '入库数量:',
				prop: 'stockqty',
				placeholder: '请输入入库数量',
				required: true,
				type: 'input',
				validateForm: 'number',
				message: '请输入正整数',
				xs: 24,
				sm: 12,
				md: 8,
				lg: 8,
				xl: 8,
			},
			{
				label: '扫码录入',
				prop: 'scan',
				placeholder: '请输入入库数量',
				required: false,
				type: 'button',
				xs: 6,
				sm: 6,
				md: 6,
				lg: 6,
				xl: 6,
			},
			{
				label: '收货仓库:',
				prop: 'storageId',
				placeholder: '请选择收货仓库',
				required: true,
				type: 'select',
				options: [],
				xs: 24,
				sm: 12,
				md: 8,
				lg: 8,
				xl: 8,
			},
		],
		innerDialogConfig: [
			{
				label: '扫码入库:',
				prop: 'sacnstockqty',
				placeholder: '请将光标放到此处扫码',
				required: false,
				type: 'input',
				xs: 12,
				sm: 12,
				md: 12,
				lg: 12,
				xl: 12,
			},
			{
				label: '扫码数量:',
				prop: 'sacnqty',
				placeholder: '1',
				required: false,
				type: 'text',
				xs: 12,
				sm: 12,
				md: 12,
				lg: 12,
				xl: 12,
			},
			{
				label: '扫码信息:',
				prop: 'codeList',
				placeholder: '请输入扫码信息',
				required: false,
				type: 'tagsarea',
				tag: true,
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
		],
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
// cellStyle.value = changeToStyle([1]);
// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	let data = {
		checkno: form.checkno,
		page: state.tableData.page,
	};
	const res = await GetTStockInputPageListApi(data);
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};

// 打开入库弹窗
const openEntryDialog = async (scope: any) => {
	let res = await GetUserManagedStoreHouseApi();
	if (state.tableData.dialogConfig) {
		state.tableData.dialogConfig[12].options = res.data.map((item: any) => {
			return { label: item.storeId, text: item.storeName, value: item.storeId };
		});
	}
	entryJobDialogRef.value.openDialog('entry', scope.row);
};
const scanCodeEntry = () => {
	console.log('点击按钮');
	entryJobDialogRef.value.openInnerDialog('扫码录入');
};
//点击确认入库
const entrySubmit = async (ruleForm: object, type: string) => {
	let obj: EmptyObjectType = { ...ruleForm };
	state.tableData.dialogConfig &&
		state.tableData.dialogConfig[12].options?.forEach((item) => {
			if (item.value == obj.storageId) {
				obj.storageName = item.text;
			}
		});
	if (!obj.codeList) {
		obj.codeList = [];
	}
	let submitData = {
		runId: obj.runid,
		checkno: obj.checkno,
		creator: obj.creator,
		matno: obj.matno,
		namech: obj.namech,
		nameen: obj.nameen,
		vendorcode: obj.vendorcode,
		vendorname: obj.vendorname,
		checkqty: obj.checkqty,
		stockqty: obj.stockqty,
		stockcode: obj.stockcode,
		storageId: obj.storageId,
		storageName: obj.storageName,
		codeList: obj.codeList,
	};
	console.log('填写的信息', submitData.codeList);
	if (submitData.stockqty > submitData.checkqty) {
		ElMessage.error(`入库数量大于验收数量`);
	} else if (submitData.codeList && submitData.stockqty < submitData.codeList.length) {
		ElMessage.error(`入库数量小于扫码数量`);
	} else if (submitData.stockqty != submitData.checkqty) {
		ElMessageBox.confirm('入库数量与验收数量不一致，是否继续提交', '提示', {
			confirmButtonText: '确认',
			cancelButtonText: '取消',
			type: 'warning',
			buttonSize: 'default',
		})
			.then(async () => {
				const res = await GetTStockAddApi(submitData);
				if (res.status) {
					ElMessage.success(`入库成功`);
					entryJobDialogRef.value.closeDialog();
					getTableData();
				}
			})
			.catch(() => {
				// ElMessage({
				// 	type: 'info',
				// 	message: 'Delete canceled',
				// });
			});
	} else {
		const res = await GetTStockAddApi(submitData);
		if (res.status) {
			ElMessage.success(`入库成功`);
			entryJobDialogRef.value.closeDialog();
			getTableData();
		}
	}
};
// 点击收货单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	// if (column.property === 'checkno') {
	// 	dilogTitle.value = '单号:' + row.reqNo;
	// 	changeStatus(header1.value, 500, false);
	// 	let data = { reqNo: row.reqNo };
	// 	getDetailData(data);
	// }
};
// 详情接口
const getDetailData = async (data: Object) => {
	console.log('data', data);

	// const res = await GetTStockDetailApi(data);
	// dialogState.tableData.data = res.data.applyDetails;
	// arriveJobDialogVisible.value = true;
	// if (res.status) {
	// 	dialogState.tableData.config.loading = false;
	// }
};
// 根据弹出窗不一样展现的配置不一样
// const changeStatus = (header: EmptyArrayType, height: number, isShow: boolean) => {
// 	let tableData = dialogState.tableData;
// 	let config = tableData.config;
// 	tableData.header = header;
// 	config.height = height;
// 	config.isOperate = isShow;
// 	config.isInlineEditing = isShow;
// };
// 提交
// const onSubmit = async (formEl: FormInstance | undefined) => {
// 	if (!formEl) return;
// 	await formEl.validate(async (valid: boolean) => {
// 		if (!valid) return ElMessage.warning(t('表格项必填未填'));
// 		// if (!dialogState.tableData.form['sendTime']) return ElMessage.warning(t('请填写收货时间'));
// 		let allData: EmptyObjectType = {};
// 		allData = { ...dialogState.tableData.form };
// 		allData['details'] = dialogState.tableData.data;
// 		const res = await getAddReceiveApi(allData);
// 		if (res.status) {
// 			ElMessage.success(t('收货成功'));
// 			arriveJobDialogVisible.value = false;
// 		}
// 	});
// };
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
