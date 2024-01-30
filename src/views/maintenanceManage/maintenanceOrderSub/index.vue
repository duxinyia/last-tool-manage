<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="維修單提報" name="first">
			<TableSearch
				:search="state.tableData.search"
				@search="(data) => onSearch(data, state.tableData)"
				:searchConfig="state.tableData.searchConfig"
				labelWidth=" "
			/>
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="(page) => onTablePageChange(page, state.tableData)"
				@sortHeader="(data) => onSortHeader(data, state.tableData)"
				@cellclick="matNoClick"
				:cellStyle="cellStyle"
				@onOpentopBtnOther="onOpenSendRepair"
			/>
		</el-tab-pane>
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="維修記錄" name="second">
			<TableSearch
				:search="secondState.tableData.search"
				@search="(data) => onSearch(data, secondState.tableData)"
				:searchConfig="secondState.tableData.searchConfig"
				labelWidth=" "
			/>
			<Table
				ref="tableRef"
				v-bind="secondState.tableData"
				class="table"
				@pageChange="(page) => onTablePageChange(page, secondState.tableData)"
				@sortHeader="(data) => onSortHeader(data, secondState.tableData)"
				@onOpenOtherDialog="openDetailDialog"
			/>
		</el-tab-pane>
		<el-dialog
			draggable
			:close-on-click-modal="false"
			ref="presentationDialogRef"
			v-model="presentationDialogVisible"
			:title="dilogTitle"
			width="60%"
		>
			<el-row v-if="activeName === 'first'">
				<el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6" class="mb10 mr20" v-for="(val, key) in dialogState.tableData.search" :key="key">
					<div v-if="val.type === 'text'">
						{{ val.label }}<span style="color: red" class="ml10">{{ dialogState.tableData.form[val.prop] }}</span>
					</div>
					<template v-if="val.type === 'input'">
						<span class="mr10">{{ val.label }}</span>
						<el-input
							size="default"
							v-model="dialogState.tableData.form[val.prop]"
							:placeholder="`請輸入${$t(val.label)}`"
							clearable
							style="width: 100%; max-width: 167px"
						/>
					</template>
					<div v-if="val.type === 'time'">
						<span v-if="val.isRequired" class="color-danger mr5">*</span>
						<span style="width: 96px" class="mr10">{{ val.label }}</span>
						<el-date-picker
							v-model="dialogState.tableData.form[val.prop]"
							:placeholder="`請選擇時間`"
							:disabled-date="disabledDate"
							clearable
							value-format="YYYY-MM-DD"
							type="date"
							style="height: 30px; max-width: 167px"
						/>
					</div>
				</el-col>
			</el-row>

			<!-- 表格 -->
			<el-form ref="tableFormRef" :model="dialogState.tableData">
				<Table ref="dialogtableRef" v-bind="dialogState.tableData" class="table" @delRow="onDelRow" />
			</el-form>
			<div class="describe" style="line-height: 30px">
				<span>備註：</span>
				<el-input
					v-if="activeName === 'first'"
					class="input-textarea"
					show-word-limit
					v-model="dialogState.tableData.form['describe']"
					type="textarea"
					placeholder="請輸入"
					maxlength="150"
				></el-input>
				<span v-else style="color: #1890ff; font-weight: 700; width: 100%">{{ dialogState.tableData.form['describe'] }}</span>
			</div>
			<!-- 提交按钮 -->
			<template #footer>
				<span class="dialog-footer" v-if="activeName === 'first'">
					<el-button size="default" auto-insert-space @click="presentationDialogVisible = false">取消</el-button>
					<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)" :loading="loadingBtn"> 確定 </el-button>
				</span>
			</template>
		</el-dialog>
		<Dialog ref="matnoDetailDialogRef" :isFootBtn="false" :dialogConfig="dialogMatnoDetail" />
		<qrCodeDialog ref="inventoryDialogRef" :tags="tags" dialogTitle="庫存條碼" />
	</el-tabs>
</template>
<!-- <el-dialog v-model="inventoryDialogRef" title="庫存條碼" width="30%" draggable>
				<el-tag v-for="tag in tags" :key="tag.code" class="mr10 mb10" :type="tag.runstatus === 1 ? '' : 'danger'">
					{{ tag.code }}
				</el-tag>
			</el-dialog> -->
<script setup lang="ts" name="maintenanceOrderSub">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch } from 'vue';
import { ElMessage, ElMessageBox, FormInstance, TabsPaneContext } from 'element-plus';
const presentationDialogVisible = ref(false);
// 引入接口
import {
	getQueryExitPageApi,
	getSubmitRepairOrderApi,
	GetExitStoreQrCodeListApi,
	getQueryRepairRecordApi,
	getRepairRecordDetailApi,
} from '/@/api/maintenanceManage/maintenanceOrderSub';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入组件
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
const qrCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/qrCodeDialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const matnoDetailDialogRef = ref();
const inventoryDialogRef = ref();
const loadingBtn = ref(false);
const tableRef = ref<RefType>();
const dialogtableRef = ref<RefType>();
const presentationDialogRef = ref();
// 单元格样式
// const cellStyle = ref();
// tags的数据
let tags = ref<EmptyArrayType>([]);

// 送修弹窗标题
const dilogTitle = ref();
const activeName = ref<string | number>('first');
const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	getTableData(activeName.value === 'first' ? state.tableData : secondState.tableData);
};
const header = ref([
	{
		key: 'matno',
		colWidth: '150',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
	{ key: 'machine', colWidth: '', title: '機種', type: 'text', isCheck: true },
	{ key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameen', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'exitqty', colWidth: '', title: '維修數量', type: 'text', isCheck: true },
	{ key: 'exitreason', colWidth: '', title: '維修原因', type: 'text', isCheck: true },
	{ key: 'prItemNo', colWidth: '', title: 'pr項次', type: 'input', isCheck: true, isRequired: false },
]);
const header1 = ref([
	{ key: 'prItemNo', colWidth: '', title: 'pr項次', type: 'text', isCheck: true },
	{
		key: 'matNo',
		colWidth: '250',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'nameCh', colWidth: '100', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '100', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'qty', colWidth: '100', title: '維修數量', type: 'text', isCheck: true },
	{ key: 'reason', colWidth: '100', title: '維修原因', type: 'text', isCheck: true },
	{ key: 'exitStoreOperator', colWidth: '', title: '發起人', type: 'text', isCheck: true },
	{ key: 'pendingReceiptQty', colWidth: '110', title: '待收貨數量', type: 'text', isCheck: true },
	{ key: 'pendingCheckQty', colWidth: '110', title: '待驗收數量', type: 'text', isCheck: true },
	{ key: 'pendingStorageQty', colWidth: '110', title: '待入庫數量', type: 'text', isCheck: true },
	{ key: 'storedQty', colWidth: '110', title: '已入庫數量', type: 'text', isCheck: true },
	{ key: 'checkUnqualifiedQty', colWidth: '140', title: '驗收不合格數量', type: 'text', isCheck: true },
]);
const state = reactive<TableDemoState>({
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
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameen', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			// { key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
			// { key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
			{ key: 'storageType', colWidth: '', title: '倉庫類型', type: 'text', isCheck: true },
			{ key: 'sLocation', colWidth: '', title: '倉庫位置', type: 'text', isCheck: true },
			{ key: 'exitqty', colWidth: '', title: '退庫數量', type: 'text', isCheck: true },
			{ key: 'exitreason', colWidth: '', title: '退庫原因', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '發起人', type: 'text', isCheck: true },
			{ key: 'createtime', colWidth: '', title: '退庫時間', type: 'text', isCheck: true },
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
		topBtnConfig: [
			{ type: 'other', name: '送修', defaultColor: 'primary', isSure: true, disabled: true, icon: 'ele-Edit', isNoSelcetDisabled: true },
		],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
			{ label: '發起人', prop: 'creator', required: false, type: 'input' },
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
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR單號', type: 'text', isCheck: true },
			{ key: 'sendRepairDate', colWidth: '', title: '送修時間', type: 'text', isCheck: true },
			{ key: 'createTime', colWidth: '', title: '提交時間', type: 'text', isCheck: true },
			{ key: 'isAllReceived', colWidth: '', title: '是否全部收貨', type: 'text', isCheck: true },
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
			{ label: '維修單號', prop: 'repairNo', required: false, type: 'input' },
			{ label: 'PR單號', prop: 'prNo', required: false, type: 'input' },
			{ label: '提交時間', prop: 'createTime', required: false, type: 'dateRange' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'detail', name: '查看詳情', color: '#1890ff', isSure: false, icon: 'ele-View' }],
		// 给后端的数据
		form: {},
		dialogConfig: [],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
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
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: true, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			isDialogTab: true, //是否是弹窗里面的表格
			height: 300,
		},
		// 给后端的数据
		form: {},
		searchConfig: {
			isSearchBtn: false,
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '維修單號', prop: 'matNo', placeholder: '請輸入維修單號', type: 'text', required: false, isRequired: false },
			{ label: 'PR單號', prop: 'prNo', placeholder: '請輸入PR單號', type: 'input', required: false, isRequired: false },
			{ label: '送修時間:', prop: 'sendRepairDate', placeholder: '請選擇送修時間', type: 'time', required: false, isRequired: true },
		],
		// 弹窗表单
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true, disabled: false }],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
const dialogMatnoDetail = ref([
	{ label: '料號:', prop: 'matno', type: 'text' },
	{ label: '圖紙編號:', prop: 'drawNo', type: 'text' },
	{ label: '品名-中文:', prop: 'namech', type: 'text' },
	{ label: '品名-英文:', prop: 'nameen', type: 'text' },
	// { label: '厂商代码:', prop: 'vendorcode', type: 'text' },
	// { label: '厂商名称:', prop: 'vendorname', type: 'text' },
	{ label: '退庫類型:', prop: 'exittype', type: 'text' },
	{ label: '退庫原因:', prop: 'exitreason', type: 'text' },
	{ label: '退庫數量:', prop: 'exitqty', type: 'text' },
	{ label: '備註:', prop: 'describe', type: 'text', lg: 24, xl: 24 },
]);
const exitTypeMap: EmptyObjectType = {
	1: '維修',
	2: '閒置',
	3: '報廢',
};
watch(
	() => presentationDialogVisible.value,
	(val) => {
		if (val == false) {
			tableRef.value.clearSelection();
		}
	}
);
// 日期只能選擇今天之前
const disabledDate = (time: Date) => {
	return time.getTime() > Date.now();
};
// 刪除按鈕狀態
dialogState.tableData.btnConfig![0].disabled = computed(() => {
	return dialogState.tableData.data.length <= 1 ? true : false;
});
// 单元格字体颜色
const cellStyle = ({ row, column }: EmptyObjectType) => {
	const property = column.property;
	if (property === 'matno' || (property === 'exitqty' && row.codeManageMode === 0)) {
		return { color: 'var(--el-color-primary)', cursor: 'pointer' };
	}
};
// 初始化列表数据
const getTableData = async (datas: EmptyObjectType) => {
	const form = datas.form;
	let res = null;
	if (activeName.value === 'first') {
		let data = {
			...form,
			exitType: 1,
			page: datas.page,
		};
		res = await getQueryExitPageApi(data);
		res.data.data.forEach((item: any) => {
			item.creator = `${item.creator} / ${item.creatorName}`;
		});
	} else {
		let data = {
			...form,
			page: datas.page,
			createTime: form.createTime,
			startCreateTime: form.createTime && form.createTime[0],
			endCreateTime: form.createTime && form.createTime[1],
		};
		delete data.createTime;
		res = await getQueryRepairRecordApi(data);
		res.data.data.forEach((item: any) => {
			item.isAllReceived = item.isAllReceived === true ? '是' : '否';
		});
	}
	datas.data = res!.data.data;
	datas.config.total = res!.data.total;
	if (res!.status) {
		datas.config.loading = false;
	}
};
//删除
const onDelRow = (row: EmptyObjectType, i: number) => {
	dialogState.tableData.data.splice(i, 1);
};
// 查看詳情
const openDetailDialog = async (row: EmptyObjectType) => {
	dilogTitle.value = '詳情';
	presentationDialogVisible.value = true;
	let tableData = dialogState.tableData;
	changeDialogStatus(false);
	tableData.header = header1.value;
	const res = await getRepairRecordDetailApi(row.row.repairNo);
	res.data.details.forEach((item: any) => {
		item.exitStoreOperator = `${item.exitStoreOperator} / ${item.exitStoreOperatorName}`;
	});
	tableData.data = res.data.details;
	tableData.form['describe'] = res.data.describe;
	if (res.status) {
		tableData.config.loading = false;
	}
};
// 点击送修按钮
const onOpenSendRepair = (row: EmptyObjectType[]) => {
	loadingBtn.value = false;
	dialogState.tableData.form = {};
	presentationDialogVisible.value = true;
	let tableData = dialogState.tableData;
	tableData.header = header.value;
	tableData.data = row;
	changeDialogStatus(true);
	tableData.config.loading = false;
	dilogTitle.value = '維修單提報';
};
const changeDialogStatus = (isShow: boolean) => {
	let tableData = dialogState.tableData;
	tableData.config.isSerialNo = tableData.config.isOperate = isShow;
};
// 点击料号弹出详情
const matNoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'matno') {
		row.exittype = exitTypeMap[row.exittype];
		matnoDetailDialogRef.value.openDialog('matno', row, '退庫詳情');
	} else if (column.property === 'exitqty' && row.codeManageMode === 0) {
		let res = await GetExitStoreQrCodeListApi(row.runid);
		if (res.data.length == 0) {
			ElMessage.error('暫無條碼數據');
		} else {
			tags.value = res.data;
			inventoryDialogRef.value?.openDialog();
		}
	}
};
// 提交
const onSubmit = async (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格項必填未填'));
		if (!dialogState.tableData.form['sendRepairDate']) return ElMessage.warning(t('請填寫收貨時間'));
		loadingBtn.value = true;
		let allData: EmptyObjectType = {};
		dialogState.tableData.data.forEach((item) => {
			item['exitStoreId'] = item.runid;
		});
		allData = { ...dialogState.tableData.form };
		allData['details'] = dialogState.tableData.data;
		const res = await getSubmitRepairOrderApi(allData);
		if (res.status) {
			ElMessage.success(t('送修成功'));
			ElMessageBox.confirm(`維修單號：${res.data}`, '提示', {
				confirmButtonText: '確 定',
				showCancelButton: false,
				showClose: false,
				type: 'success',
				draggable: true,
			})
				.then(async () => {
					presentationDialogVisible.value = false;
				})
				.catch(() => {});
			getTableData(state.tableData);
		}

		loadingBtn.value = false;
	});
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType, tableData: EmptyObjectType) => {
	tableData.form = Object.assign({}, tableData.form, { ...data });
	tableRef.value?.pageReset();
};

// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType, tableData: EmptyObjectType) => {
	tableData.page.pageNum = page.pageNum;
	tableData.page.pageSize = page.pageSize;
	getTableData(tableData);
};
// 拖动显示列排序回调
const onSortHeader = (data: TableHeaderType[], tableData: EmptyObjectType) => {
	tableData.header = data;
};
// 页面加载时
onMounted(() => {
	getTableData(state.tableData);
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
		width: 50px;
	}
}
.buttonBorder {
	border: 0px !important;
}
</style>
