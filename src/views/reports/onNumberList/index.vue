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
				:objectSpanMethod="objectSpanMethod"
				:indexMethod="indexMethod"
			>
				<template #btn="{ row }">
					<el-button type="primary" plain size="default" class="button buttonBorder" @click="onSign(row.stockId)">
						{{ $t('查看二維碼編號') }}</el-button
					>
				</template>
			</Table>
			<qrCodeDialog ref="onNumberListDialogRef" :tags="tags" />
			<!-- <el-dialog v-model="onNumberListDialogRef" title="二維碼編號" width="30%" draggable>
				<el-tag v-for="tag in tags" :key="tag.code" class="mr10 mb10">
					{{ tag }}
				</el-tag>
			</el-dialog> -->
		</div>
	</div>
</template>

<script setup lang="ts" name="onNumberList">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { getQueryStoredInventoryApi, getCodesByStockIdApi } from '/@/api/reports/onNumberList';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const qrCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/qrCodeDialog.vue'));
// 定义变量内容
const { t } = useI18n();
const tableRef = ref<RefType>();
const matNoRef = ref();
const onNumberListDialogRef = ref();
// tags的数据
let tags = ref<EmptyArrayType>([]);
const matNoDetaildialogVisible = ref(false);
const mergeArr: EmptyObjectType = ref({});
const indexNum: EmptyObjectType = ref({});
// 单元格样式
const cellStyle = ref();
// 弹窗标题
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
			{ key: 'buCode', colWidth: '', title: 'BU', type: 'text', isCheck: true },
			// { key: 'machineType', colWidth: '', title: '机种', type: 'text', isCheck: true },
			{ key: 'projectCode', colWidth: '', title: '專案代碼', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'applyQty', colWidth: '', title: '請購總數', type: 'text', isCheck: true },
			{ key: 'uselessQty', colWidth: '', title: '報廢總數', type: 'text', isCheck: true },
			{ key: 'repairQty', colWidth: '', title: '維修總數', type: 'text', isCheck: true },
			{ key: 'idleQty', colWidth: '', title: '閒置總數', type: 'text', isCheck: true },
			{ key: 'storedQty', colWidth: '', title: '庫存總數', type: 'text', isCheck: true },
			{ key: 'storeLocation', colWidth: '', title: '倉庫位置', type: 'text', isCheck: true },
			{ key: 'stockQty', colWidth: '', title: '庫存數量', type: 'text', isCheck: true },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: true, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: true, //是否有分页
			operateWidth: 170, //操作栏宽度，如果操作栏有几个按钮就自己定宽度
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: 'BU', prop: 'buCode', required: false, type: 'input' },
			// { label: '机种', prop: 'machineType', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			// { label: '品名-英文', prop: 'nameEn', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		// btnConfig: [{ type: 'send', name: '送签', color: '#D3C333', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			// buCode: '',
			// machineType: '',
			// nameEn: '',
			// nameCh: '',
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
// 表格调用的合并方法
const objectSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
	let arr = mergeArr.value[column.property] || [];
	if (column.type == 'index' && mergeArr.value['matNo']) return mergeArr.value['matNo'][rowIndex];
	else if (arr.length) return arr[rowIndex];
	else [1, 1];
};
// 封装一个需要合并的行方法
const colMethod = (columnArr: EmptyArrayType, data: EmptyArrayType) => {
	// columnArr 合并行所在的列字段
	// data 需要合并的表格数据
	let column: EmptyObjectType = {};
	let position = 0;
	// 遍历合并的列数据
	columnArr.forEach((prop: any) => {
		column[prop] = [];
		//  遍历合并的行数据
		data.forEach((row, rowIndex) => {
			// 第N列第一行
			column[prop][rowIndex] = [1, 1];
			if (rowIndex === 0) {
				// 记录当前行号
				position = 0;
			} else if (row[prop] === data[rowIndex - 1][prop] && row.matNo === data[rowIndex - 1].matNo) {
				// 当前行数据等于上一行，根据记录的行号，计算需要合并几行。
				column[prop][position][0] += 1;
				// 当前行 隐藏不显示
				column[prop][rowIndex][0] = 0;
			} else {
				// 不相等之后，重置记录行号
				position = rowIndex;
			}
		});
	});
	return column;
};
// 排列序号
const indexobj = () => {
	let num = 0;
	mergeArr.value['matNo'].forEach((item: any, index: number) => {
		if (item[0] != 0) {
			indexNum.value[index] = num += 1;
		}
	});
};

// 自定义序号
const indexMethod = (index: number) => {
	return indexNum.value[index];
};
// 点击按钮
const onSign = async (stockId: string) => {
	if (!stockId) return ElMessage.warning('該料號沒有庫存，二維碼編碼不存在');
	const res = await getCodesByStockIdApi(stockId);
	if (res.data) {
		if (!res.data.length) {
			ElMessage.warning('暫無二維碼編碼');
		} else {
			// onNumberListDialogRef.value = true;
			tags.value = res.data;
			onNumberListDialogRef.value?.openDialog();
		}
	}
};
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data: EmptyObjectType = {};
	data = {
		...form,
		page: state.tableData.page,
	};
	const res = await getQueryStoredInventoryApi(data);
	state.tableData.data = [];
	res.data.data.forEach((item: any) => {
		if (!item.stocks.length) state.tableData.data.push(item);
		item.stocks.forEach((stock: any) => {
			state.tableData.data.push({ ...item, storeLocation: stock.storeLocation, stockQty: stock.stockQty, stockId: stock.stockId });
		});
	});
	state.tableData.config.total = res.data.total;
	// 计算合并的行
	mergeArr.value = colMethod(
		['matNo', 'buCode', 'machineType', 'projectCode', 'nameCh', 'nameEn', 'applyQty', 'uselessQty', 'repairQty', 'idleQty', 'storedQty'],
		state.tableData.data
	);
	indexobj(); //排列序号
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
// 点击料号
const reqNoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	// if (column.property === 'matNo') {
	// 	matNoRef.value = row.matNo;
	// 	setTimeout(() => {
	// 		matNoDetaildialogVisible.value = true;
	// 	}, 100);
	// }
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
.buttonBorder {
	border: 0px !important;
}
</style>
