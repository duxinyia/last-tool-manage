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
				@onOpenOtherDialog="openArriveJobDialog"
			/>
			<el-dialog ref="arriveJobDialogRef" v-model="arriveJobDialogVisible" :title="dilogTitle" width="85%">
				<el-row v-if="dilogTitle == '验收'">
					<el-col :xs="24" :sm="12" :md="11" :lg="11" :xl="11" class="mb10" v-for="(val, key) in dialogState.tableData.search" :key="key">
						<div v-if="val.type === 'text'">
							{{ val.label }}：<span style="color: red" class="ml10">{{ dialogState.tableData.form[val.prop] }}</span>
						</div>
						<div v-if="val.type === 'time'">
							<span v-if="val.isRequired" class="color-danger mr5">*</span>
							<span style="width: 96px" class="mr10">{{ val.label }}</span>
							<el-date-picker
								value-format="YYYY-MM-DD"
								v-model="dialogState.tableData.form[val.prop]"
								type="date"
								placeholder="请选择"
								style="height: 30px; max-width: 167px"
							/>
						</div>
					</el-col>
				</el-row>

				<el-form ref="tableFormRef" :model="dialogState.tableData" size="default">
					<Table v-bind="dialogState.tableData" class="table" @delRow="onDelRow" />
				</el-form>
				<div class="describe" v-if="dilogTitle == '验收'">
					<span>描述说明：</span>
					<el-input
						class="input-textarea"
						show-word-limit
						v-model="dialogState.tableData.form['describe']"
						type="textarea"
						placeholder="请输入"
						maxlength="150"
					></el-input>
				</div>
				<template #footer v-if="dilogTitle == '验收'">
					<span class="dialog-footer">
						<el-button size="default" auto-insert-space @click="arriveJobDialogVisible = false">取消</el-button>
						<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)"> 确定 </el-button>
					</span>
				</template>
			</el-dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="/requistManage/arrivalAcceptance">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
const arriveJobDialogVisible = ref(false);
// 引入接口
import { getreqNoApi } from '/@/api/requistManage/reportingInquiry';
import { getGetWaitRecievePageListApi, getAddReceiveApi } from '/@/api/requistManage/arriveJob';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const arriveJobDialogRef = ref();
// 单元格样式
const cellStyle = ref();

// 弹窗标题
const dilogTitle = ref();
const header = ref([
	{ key: 'matNo', colWidth: '250', title: 'message.pages.matNo', type: 'text', isCheck: true },
	{ key: 'ji', colWidth: '', title: '机种', type: 'text', isCheck: true },
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
const header1 = ref([
	{
		key: 'matNo',
		colWidth: '250',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
	{ key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
	{ key: 'reqQty', colWidth: '', title: '需求数量', type: 'text', isCheck: true },
	{ key: 'reqDate', colWidth: '150', title: '需求时间', type: 'text', isCheck: true },
	{ key: 'prItemNo', colWidth: '', title: 'PR项次', type: 'text', isCheck: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'reqNo', colWidth: '', title: '申请单号', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR单号', type: 'text', isCheck: true },
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
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '验收', color: '#D3C333', isSure: false, icon: 'ele-EditPen' }],
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
	},
});
const dialogState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [],
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
		search: [
			{ label: '收货单号', prop: 'sendNo', required: false, type: 'text' },
			{ label: '申请单号', prop: 'reqNo', required: false, type: 'text' },
			{ label: 'PR单号', prop: 'prNo', required: false, type: 'text' },
			{ label: '收货时间', prop: 'sendTime', required: false, type: 'time', isRequired: true },
		],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true, disabled: true }],
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
	const form = state.tableData.form;
	let data = {
		reqNo: form.reqNo,
		prNo: form.prNo,
		page: state.tableData.page,
	};
	const res = await getGetWaitRecievePageListApi(data);
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
//删除
const onDelRow = (row: EmptyObjectType, i: number) => {
	dialogState.tableData.data.splice(i, 1);
};
// 点击收货弹窗
const openArriveJobDialog = (scope: EmptyObjectType) => {
	let data = { reqNo: scope.row.reqNo };
	dialogState.tableData.form = scope.row;
	getDetailData(data);
	dilogTitle.value = '验收';
	changeStatus(header.value, 300, true);
};
// 点击申请单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'reqNo') {
		dilogTitle.value = '单号:' + row.reqNo;
		changeStatus(header1.value, 500, false);
		let data = { reqNo: row.reqNo };
		getDetailData(data);
	}
};
// 详情接口
const getDetailData = async (data: Object) => {
	const res = await getreqNoApi(data);
	dialogState.tableData.data = res.data.applyDetails;
	arriveJobDialogVisible.value = true;
	if (res.status) {
		dialogState.tableData.config.loading = false;
	}
};
// 根据弹出窗不一样展现的配置不一样
const changeStatus = (header: EmptyArrayType, height: number, isShow: boolean) => {
	let tableData = dialogState.tableData;
	let config = tableData.config;
	tableData.header = header;
	config.height = height;
	config.isOperate = isShow;
	config.isInlineEditing = isShow;
};
// 提交
const onSubmit = async (formEl: EmptyObjectType | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格项必填未填'));
		if (!dialogState.tableData.form['sendTime']) return ElMessage.warning(t('请填写收货时间'));
		let allData: EmptyObjectType = {};
		allData = { ...dialogState.tableData.form };
		allData['details'] = dialogState.tableData.data;
		const res = await getAddReceiveApi(allData);
		if (res.status) {
			ElMessage.success(t('收货成功'));
			arriveJobDialogVisible.value = false;
		}
	});
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
if (dialogState.tableData.btnConfig)
	dialogState.tableData.btnConfig[0].disabled = computed(() => {
		return dialogState.tableData.data.length <= 1 ? true : false;
	});
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
