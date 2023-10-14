<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@sortHeader="onSortHeader"
				@cellclick="reqNoClick"
				:cellStyle="cellStyle"
				@onOpenOtherDialog="openArriveJobDialog"
			/>
			<el-dialog v-model="deliveryDialogVisible" :title="dilogTitle" width="40%">
				<el-row v-if="dilogTitle == '料号送样'">
					<el-col :xs="24" :sm="12" :md="11" :lg="11" :xl="11" class="mb20" v-for="(val, key) in dialogState.tableData.search" :key="key">
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
						<div v-if="val.type === 'select'">
							<span v-if="val.isRequired" class="color-danger mr5">*</span>
							<span style="width: 96px" class="mr10">{{ val.label }}</span>
						</div>
					</el-col>
				</el-row>

				<el-form ref="tableFormRef" :model="dialogState.tableData" size="default">
					<Table
						ref="dialogTableRef"
						v-bind="dialogState.tableData"
						class="table"
						@delRow="onDelRow"
						@addrow="onAddrow"
						@handleNumberInputChange="changeInput"
						:cellStyle="cellStyle"
					/>
				</el-form>
				<template #footer v-if="dilogTitle == '料号送样'">
					<span class="dialog-footer">
						<el-button size="default" auto-insert-space @click="deliveryDialogVisible = false">取消</el-button>
						<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)"> 确定 </el-button>
					</span>
				</template>
			</el-dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="sampleRequirement">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch, nextTick } from 'vue';
import { ElMessage, FormInstance } from 'element-plus';
const deliveryDialogVisible = ref(false);
import { getQuerySampleNeedsApi, getSampleDetailsForTakeSampleApi } from '/@/api/partno/sampleRequirement';
// 送样
import { getTakeSampleApi } from '/@/api/partno/sampleDelivery';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const loading = ref(false);
const dialogTableRef = ref<RefType>();
// 单元格样式
const cellStyle = ref();
// 弹窗标题
const dilogTitle = ref();
const header = ref<deliveryDialogHeader>([
	{ key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'input', isCheck: true, isRequired: true },
	{ key: 'vendorName', colWidth: '', title: '厂商名称', type: 'input', isCheck: true, isRequired: true },
	{ key: 'needsQty', colWidth: '', title: '数量', type: 'number', isCheck: true, isRequired: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matNo', colWidth: '200', title: '料号', type: 'text', isCheck: true },
			{ key: 'sampleNo', colWidth: '180', title: '送样单号', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'runStatus', colWidth: '', title: '状态', type: 'text', isCheck: true },
			{ key: 'needsQty', colWidth: '', title: '需求數量', type: 'text', isCheck: true },
			{ key: 'needor', colWidth: '', title: '需求人', type: 'text', isCheck: true },
			{ key: 'needorTel', colWidth: '', title: '需求人电话', type: 'text', isCheck: true },
			{ key: 'needsDate', colWidth: '', title: '需求日期', type: 'text', isCheck: true },
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
			isPage: false, //是否有分页
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [{ label: '料号', prop: 'MatNo', required: false, type: 'input', lg: 6, xl: 6 }],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '送样', color: '#D3C333', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			MatNo: '',
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
		data: [{ vendorCode: '', vendorName: '' }],
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
			isInlineEditing: true, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			isDialogTab: false, //是否是弹窗里面的表格
			height: 500,
			isAddRowBtn: true,
		},
		// 给后端的数据
		form: {},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '送样单号', prop: 'sampleNo', required: false, type: 'text' },
			{ label: '料号', prop: 'matNo', required: false, type: 'text' },
			{ label: '品名-英文', prop: 'nameEn', required: false, type: 'text' },
			{ label: '品名-中文', prop: 'nameCh', required: false, type: 'text' },
			// { label: '图纸编号', prop: 'drawNo', required: false, type: 'text' },
			// { label: '规格', prop: 'specs', required: false, type: 'text' },
			{ label: '需求数量', prop: 'needsQty', required: false, type: 'text' },
			{ label: '需求时间', prop: 'needsDate', required: false, type: 'text' },
		],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true }],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// 控制收货数量<=可收货数量
const changeInput = (val: number, i: number) => {
	const data = dialogState.tableData.data[i];
	data.receiptQtymin = 0;
	data.receiptQtymax = data.pendingReceiptQty;
	if (data.receiptQty > data.pendingReceiptQty) {
		data.receiptQty = data.pendingReceiptQty;
	}
};
// 单元格字体颜色
const changeToStyle = (indList: number[]) => {
	return ({ columnIndex, column }: any) => {
		for (let j = 0; j < indList.length; j++) {
			let ind = indList[j];
			if (columnIndex === ind && column.property === 'repairNo') {
				return { color: 'var(--el-color-primary)', cursor: 'pointer' };
			} else if (column.property === 'pendingReceiptQty') {
				return { color: 'red' };
			}
		}
	};
};
cellStyle.value = changeToStyle([1, 7]);
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	const res = await getQuerySampleNeedsApi(form.MatNo);
	state.tableData.data = res.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
// 新增的时候超过表格了跟着移动
watch(
	() => dialogState.tableData.data,
	() => {
		nextTick(() => {
			dialogTableRef.value.setScrollTop();
		});
	},
	{ deep: true }
);
//删除一行
const onDelRow = (row: EmptyObjectType, i: number) => {
	if (row.runId) {
		ElMessage.error(t('不能删除已有的厂商信息'));
	} else {
		dialogState.tableData.data.splice(i, 1);
	}
};
// 增加一行
const onAddrow = () => {
	dialogState.tableData.data.push({ needsQtymin: 1, vendorCodedisabled: false, vendorNamedisabled: false });
};
// 点击收货弹窗
const openArriveJobDialog = async (scope: EmptyObjectType) => {
	const res = await getSampleDetailsForTakeSampleApi(scope.row.sampleNo);
	res.data.forEach((item: any) => {
		(item.vendorCodedisabled = true), (item.vendorNamedisabled = true);
	});
	dialogState.tableData.data = res.data;
	dialogState.tableData.form = scope.row;
	deliveryDialogVisible.value = true;
	dilogTitle.value = '料号送样';
	changeStatus(header.value, 200, true);
};
// 点击申请单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	// if (column.property === 'repairNo') {
	// 	dilogTitle.value = '维修单号:' + row.repairNo;
	// 	changeStatus(header1.value, 500, false);
	// 	// let data = { repairNo: row.repairNo };
	// 	getDetailData(row.repairNo);
	// }
};
// 详情接口
const getDetailData = async (data: string) => {
	// const res = await getRepariDetailsForReceiveApi(data);
	// dialogState.tableData.data = res.data.details;
	// deliveryDialogVisible.value = true;
	// if (res.status) {
	// 	dialogState.tableData.config.loading = false;
	// }
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
		let allData: EmptyObjectType = {};
		let form = dialogState.tableData.form;
		allData = { sampleNo: form.sampleNo, matNo: form.matNo };
		let data = dialogState.tableData.data;
		data = data.map((item) => {
			return {
				vendorName: item.vendorName,
				vendorCode: item.vendorCode,
				needsQty: item.needsQty,
				runId: item.runId,
			};
		});
		allData['vendors'] = data;
		const res = await getTakeSampleApi(allData);
		if (res.status) {
			ElMessage.success(t('送样成功'));
			deliveryDialogVisible.value = false;
			getTableData();
		}
	});
};

// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
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
