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
				@onOpentopBtnOther="onOpenSendRepair"
				@onOpenOtherDialog="openArriveJobDialog"
			/>
			<el-dialog ref="presentationDialogRef" v-model="presentationDialogVisible" :title="dilogTitle" width="85%">
				<div class="title">维修单提报</div>
				<el-form ref="tableSearchRef" size="default" label-width="auto" class="table-form">
					<el-row>
						<el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4" class="mb20 mr20" v-for="(val, key) in dialogState.tableData.search" :key="key">
							<el-form-item :label="$t(val.label)" :prop="val.prop">
								<el-input
									v-model="dialogState.tableData.form[val.prop]"
									:placeholder="`请输入${$t(val.label)}`"
									clearable
									v-if="val.type === 'input'"
									style="width: 100%"
								/>
								<el-date-picker
									v-if="val.type === 'time'"
									v-model="dialogState.tableData.form[val.prop]"
									:placeholder="`请选择时间`"
									clearable
									value-format="YYYY-MM-DD"
									type="date"
									style="height: 30px; max-width: 167px"
								/>
							</el-form-item>
						</el-col>
					</el-row>
				</el-form>
				<!-- 表格 -->
				<el-form ref="tableFormRef" :model="dialogState.tableData" size="default">
					<Table ref="tableRef" v-bind="dialogState.tableData" class="table" @delRow="onDelRow" @addrow="onAddRow" />
				</el-form>
				<div class="describe">
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
				<!-- 提交按钮 -->
				<template #footer>
					<span class="dialog-footer">
						<el-button size="default" auto-insert-space @click="presentationDialogVisible = false">取消</el-button>
						<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)"> 确定 </el-button>
					</span>
				</template>

				<!-- <el-row v-if="dilogTitle == '收货'">
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
				<div class="describe" v-if="dilogTitle == '收货'">
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
				<template #footer v-if="dilogTitle == '收货'">
					<span class="dialog-footer">
						<el-button size="default" auto-insert-space @click="presentationDialogVisible = false">取消</el-button>
						<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)"> 确定 </el-button>
					</span>
				</template> -->
			</el-dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="presentation">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, FormInstance } from 'element-plus';
const presentationDialogVisible = ref(false);
// 引入接口
import { getreqNoApi } from '/@/api/requistManage/reportingInquiry';
import { getGetWaitRecievePageListApi, getAddReceiveApi } from '/@/api/requistManage/arriveJob';
import { getQueryNoPageApi, getToolApplyInsertApi, getQueryExitPageApi } from '/@/api/requistManage/presentation';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const presentationDialogRef = ref();
// 单元格样式
const cellStyle = ref();

// 弹窗标题
const dilogTitle = ref();
const header = ref([
	{
		key: 'matNo',
		colWidth: '250',
		title: 'message.pages.matNo',
		type: 'autocomplete',
		isCheck: true,
	},
	{ key: 'machine', colWidth: '', title: '机种', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'input', isCheck: true },
	{ key: 'vendorName', colWidth: '', title: '厂商名称', type: 'input', isCheck: true },
	{ key: 'pr', colWidth: '', title: 'PR项次', type: 'input', isCheck: true },
	{ key: 'sampleQty', colWidth: '', title: '送修数量', type: 'input', isCheck: true },
	{ key: 'sampleQty1', colWidth: '', title: '送修原因', type: 'input', isCheck: true },
	{ key: 'pr', colWidth: '', title: 'pr项次', type: 'input', isCheck: true },
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
			{ key: 'vendorname1', colWidth: '', title: '退库数量', type: 'text', isCheck: true },
			{ key: 'vendorname2', colWidth: '', title: '退库原因', type: 'text', isCheck: true },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: true, // 是否显示表格多选
			isOperate: false, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: true, //是否有分页
		},
		topBtnConfig: [{ type: 'other', name: '送修', defaultColor: 'primary', isSure: true, disabled: true, icon: 'ele-Edit' }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料号', prop: 'matNo', required: false, type: 'input' },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},

		// 给后端的数据
		form: {
			matNo: '',
			matName: '',
			exitType: 0,
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
			loading: false, // loading 加载
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
			{ label: '维修单号：', prop: 'matNo', placeholder: '请输入维修单号', type: 'text', required: false },
			// { label: '需求单号：', prop: 'matNo', placeholder: '请输入需求单号', type: 'text', required: false },
			{ label: 'PR单号:', prop: 'prNo', placeholder: '请输入PR单号', type: 'text', required: false },
			{ label: '收货时间:', prop: 'time', placeholder: '请选择收货时间', type: 'time', required: false },

			// { label: '收货单号', prop: 'sendNo', required: false, type: 'text' },
			// { label: '申请单号', prop: 'reqNo', required: false, type: 'text' },
			// { label: 'PR单号', prop: 'prNo', required: false, type: 'text' },
			// { label: '收货时间', prop: 'sendTime', required: false, type: 'time', isRequired: true },
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
		matName: form.matName,
		matNo: form.matNo,
		exitType: 0,
		page: state.tableData.page,
	};
	const res = await getQueryExitPageApi(data);
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
// 增加一行数据
const onAddRow = () => {
	state.tableData.data.push({
		matNo: '',
		nameCh: '',
		nameEn: '',
		vendorCode: '',
		vendorName: '',
		sampleQty: '',
		sampleTime: '',
		pr: '',
	});
};

// 点击送修按钮
const onOpenSendRepair = (row: EmptyObjectType) => {
	presentationDialogVisible.value = true;
	let tableData = dialogState.tableData;
	tableData.header = header.value;
	dilogTitle.value = '送修';
};
// 点击收货弹窗
const openArriveJobDialog = (scope: EmptyObjectType) => {
	// let data = { reqNo: scope.row.reqNo };
	// dialogState.tableData.form = scope.row;
	// getDetailData(data);
	// dilogTitle.value = '收货';
	// changeStatus(header.value, 300, true);
};
// 点击申请单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	// if (column.property === 'reqNo') {
	// 	dilogTitle.value = '单号:' + row.reqNo;
	// 	changeStatus(header1.value, 500, false);
	// 	let data = { reqNo: row.reqNo };
	// 	getDetailData(data);
	// }
};
// 详情接口
const getDetailData = async (data: Object) => {
	const res = await getreqNoApi(data);
	dialogState.tableData.data = res.data.applyDetails;
	presentationDialogVisible.value = true;
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
const onSubmit = async (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格项必填未填'));
		// if (!dialogState.tableData.form['sendTime']) return ElMessage.warning(t('请填写收货时间'));
		// let allData: EmptyObjectType = {};
		// allData = { ...dialogState.tableData.form };
		// allData['details'] = dialogState.tableData.data;
		// const res = await getAddReceiveApi(allData);
		// if (res.status) {
		// 	ElMessage.success(t('收货成功'));
		// 	presentationDialogVisible.value = false;
		// }
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
.buttonBorder {
	border: 0px !important;
}
.title {
	font-size: 20px;
	display: flex;
	justify-content: center;
	margin-bottom: 10px;
}
</style>
