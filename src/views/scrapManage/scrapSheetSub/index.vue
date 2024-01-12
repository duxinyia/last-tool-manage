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
				@cellclick="matNoClick"
				:cellStyle="cellStyle"
				@onOpentopBtnOther="onOpenSendRepair"
			/>
			<el-dialog
				ref="presentationDialogRef"
				v-model="presentationDialogVisible"
				:title="dilogTitle"
				width="50%"
				:destroy-on-close="true"
				draggable
				:close-on-click-modal="false"
			>
				<el-form ref="dialogFormRef" :model="dialogState.tableData.form" size="default" label-width="100px">
					<el-row>
						<el-col :xs="24" :sm="12" :md="11" :lg="11" :xl="11" class="mb15 mr20" v-for="(val, key) in dialogState.tableData.search" :key="key">
							<el-form-item
								:label="$t(val.label)"
								:prop="val.prop"
								:rules="[
									{
										required: val.isRequired,
										message: `${t(val.label)}不能為空`,
										trigger: val.type === 'input' || val.type === 'time' ? 'blur' : 'change',
									},
								]"
							>
								<span v-if="val.type === 'text'" style="color: red; line-height: 30px" class="ml10">{{ dialogState.tableData.form[val.prop] }}</span>

								<el-input
									v-if="val.type === 'input'"
									size="default"
									v-model="dialogState.tableData.form[val.prop]"
									:placeholder="`請輸入${$t(val.label)}`"
									clearable
									style="width: 100%"
								/>

								<el-date-picker
									v-if="val.type === 'time'"
									v-model="dialogState.tableData.form[val.prop]"
									:placeholder="`請選擇時間`"
									clearable
									value-format="YYYY-MM-DD"
									type="date"
									:disabled-date="disabledDate"
									style="height: 30px; width: 100%"
								/>
							</el-form-item>
						</el-col>
					</el-row>
				</el-form>
				<!-- 表格 -->
				<el-form ref="tableFormRef" :model="dialogState.tableData" size="default">
					<Table ref="dialogtableRef" v-bind="dialogState.tableData" class="table" @delRow="onDelRow" />
				</el-form>
				<div class="describe">
					<span>備註：</span>
					<el-input
						class="input-textarea"
						show-word-limit
						v-model="dialogState.tableData.form['describe']"
						type="textarea"
						placeholder="請輸入"
						maxlength="150"
					></el-input>
				</div>
				<!-- 提交按钮 -->
				<template #footer>
					<span class="dialog-footer">
						<el-button size="default" auto-insert-space @click="presentationDialogVisible = false">取消</el-button>
						<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)" :loading="loadingBtn"> 確定 </el-button>
					</span>
				</template>
			</el-dialog>
			<Dialog ref="matnoDetailDialogRef" :isFootBtn="false" :dialogConfig="dialogMatnoDetail" />
			<el-dialog v-model="inventoryDialogRef" title="庫存條碼" width="30%" draggable>
				<el-tag v-for="tag in tags" :key="tag.code" class="mr10 mb10" :type="tag.runstatus === 1 ? '' : 'danger'">
					{{ tag.code }}
				</el-tag>
			</el-dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="scrapSheetSub">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch } from 'vue';
import { ElMessage, FormInstance } from 'element-plus';
const presentationDialogVisible = ref(false);
// 引入接口
import { getQueryExitPageApi, getUselessBackStockApi } from '/@/api/scrapManage/scrapSheetSub';
import { GetExitStoreQrCodeListApi } from '/@/api/maintenanceManage/maintenanceOrderSub';

import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入组件
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const matnoDetailDialogRef = ref();
const inventoryDialogRef = ref();
const loadingBtn = ref(false);
const tableRef = ref<RefType>();
const dialogtableRef = ref<RefType>();
const presentationDialogRef = ref();
// tags的数据
let tags = ref<EmptyArrayType>([]);

// 送修弹窗标题
const dilogTitle = ref();
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
	// { key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
	// { key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
	{ key: 'exitqty', colWidth: '', title: '報廢數量', type: 'text', isCheck: true },
	{ key: 'exitreason', colWidth: '', title: '報廢原因', type: 'text', isCheck: true },
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
			{ key: 'exitqty', colWidth: '', title: '報廢數量', type: 'text', isCheck: true },
			{ key: 'exitreason', colWidth: '', title: '報廢原因', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '發起人', type: 'text', isCheck: true },
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
			{ type: 'other', name: '報廢', defaultColor: 'primary', isSure: true, disabled: true, icon: 'ele-Edit', isNoSelcetDisabled: true },
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
			{ label: '報廢單號', prop: 'matNo', placeholder: '請輸入報廢單號', type: 'text', required: false, isRequired: false },
			{ label: '報廢時間', prop: 'uselessdate', type: 'time', required: false, isRequired: true },
			// { label: '班別', prop: 'classes', type: 'input', required: false, isRequired: false },
			// { label: '站位', prop: 'state', type: 'input', required: false, isRequired: false },
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
// 只能選擇今天日期之前的日期
const disabledDate = (time: Date) => {
	return time.getTime() > Date.now();
};
// 刪除按鈕狀態
dialogState.tableData.btnConfig![0].disabled = computed(() => {
	return dialogState.tableData.data.length <= 1 ? true : false;
});
// 单元格字体颜色
const cellStyle = ({ column }: EmptyObjectType) => {
	const property = column.property;
	if (property === 'matno' || property === 'exitqty') {
		return { color: 'var(--el-color-primary)', cursor: 'pointer' };
	}
};
// const changeToStyle = (indList: number[]) => {
// 	return ({ columnIndex }: any) => {
// 		for (let j = 0; j < indList.length; j++) {
// 			let ind = indList[j];
// 			if (columnIndex === ind) {
// 				return { color: 'var(--el-color-primary)', cursor: 'pointer' };
// 			}
// 		}
// 	};
// };
// cellStyle.value = changeToStyle([2, 7]);
// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	let data = {
		...form,
		exitType: 3,
		page: state.tableData.page,
	};
	const res = await getQueryExitPageApi(data);
	res.data.data.forEach((item: any) => {
		item.creator = `${item.creator} / ${item.creatorName}`;
	});
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

// 点击报废按钮
const onOpenSendRepair = (row: EmptyObjectType[]) => {
	loadingBtn.value = false;
	dialogState.tableData.form = {};
	presentationDialogVisible.value = true;
	let tableData = dialogState.tableData;
	tableData.header = header.value;
	tableData.data = [];
	tableData.data = row;
	tableData.config.loading = false;
	dilogTitle.value = '報廢單提報';
};

// 点击料号弹出详情
const matNoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'matno') {
		row.exittype = exitTypeMap[row.exittype];
		matnoDetailDialogRef.value.openDialog('matno', row, '退庫詳情');
	} else if (column.property === 'exitqty') {
		let res = await GetExitStoreQrCodeListApi(row.runid);
		if (res.data.length == 0) {
			ElMessage.error('暫無條碼數據');
		} else {
			tags = res.data;
			inventoryDialogRef.value = true;
		}
	}
};
// 提交
const onSubmit = async (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格項必填未填'));
		if (!dialogState.tableData.form['uselessdate']) return ElMessage.warning(t('請填寫報廢時間'));
		loadingBtn.value = true;
		let allData: EmptyObjectType = {};
		let exitstoreid: EmptyArrayType = [];
		let data = dialogState.tableData.data;
		data.forEach((item) => {
			exitstoreid.push(item.runid);
		});
		allData = { ...dialogState.tableData.form };
		allData['exitStoreIds'] = exitstoreid;
		const res = await getUselessBackStockApi(allData);
		if (res.status) {
			ElMessage.success(t('報廢成功'));
			presentationDialogVisible.value = false;
			getTableData();
		}
		loadingBtn.value = false;
	});
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value?.pageReset();
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
