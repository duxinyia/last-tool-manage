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
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@cellclick="matnoClick"
				:cellStyle="cellStyle"
				@onOpenOtherDialog="openReturnDialog"
			/>
			<el-dialog draggable :close-on-click-modal="false" v-model="matNoDetaildialogVisible" title="料號詳情" width="50%">
				<matNoDetailDialog :isDialog="true" :matNoRef="matNoRef"
			/></el-dialog>
			<qrCodeDialog ref="inventoryDialogRef" :tags="tags" dialogTitle="庫存條碼" />
			<!-- <el-dialog :destroy-on-close="true" v-model="inventoryDialogRef" title="庫存條碼" width="30%" draggable>
				<div class="infinite-list-wrapper" style="overflow: auto">
					<ul v-infinite-scroll="load" class="list" :infinite-scroll-disabled="disabled" infinite-scroll-immediate>
						<li v-for="i in count" :key="i.runId" class="list-item">{{ i.code }}</li>
					</ul>
					<p v-if="loading">數據過多，加載中...</p>
					<p v-if="noMore && tags.length >= 20">數據加載完畢</p>
				</div>
			</el-dialog> -->
		</div>
	</div>
</template>

<script setup lang="ts" name="/toolsReturn/inventoryQuery">
import { defineAsyncComponent, reactive, ref, onMounted, computed, nextTick } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
// 引入接口
import { GetStockQrListApi } from '/@/api/toolsReturn/inventoryQuery';
import { getStockListApi, ExitStoreApi, getExitReasonApi } from '/@/api/toolsReturn/maintentanceTools';
import { getLegalStoreTypesApi, getQueryStoreHouseNoPageApi } from '/@/api/global';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));

const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const matNoDetailDialog = defineAsyncComponent(() => import('/@/views/link/noSearchLink/index.vue'));
const qrCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/qrCodeDialog.vue'));
// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const repairReturnDialogRef = ref();
const inventoryDialogRef = ref();
const matNoDetaildialogVisible = ref(false);
const matNoRef = ref();
const count = ref<any>([]);
const loading = ref(false);

const noMore = computed(() => count.value.length >= tags.value.length);
const disabled = computed(() => loading.value || noMore.value);

// tags的数据
let tags = ref<EmptyArrayType>([]);
// const load = () => {
// 	let num = 0;
// 	loading.value = true;
// 	setTimeout(() => {
// 		for (let i = count.value.length; i < count.value.length + 20; i++) {
// 			if (tags.value[i]?.runId) {
// 				count.value.push(tags.value[i]);
// 				num++;
// 			}
// 			if (num > 20) break;
// 			loading.value = false;
// 		}
// 	}, 2000);
// };
// 弹窗标题
const dilogTitle = ref();
const header = ref([]);
const header1 = ref([
	{ key: 'matNo', colWidth: '', title: 'message.pages.matNo', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
	{ key: 'drawNo', colWidth: '', title: 'message.pages.drawNo', type: 'text', isCheck: true },
	{ key: 'specs', colWidth: '', title: 'message.pages.specs', type: 'text', isCheck: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matno', colWidth: '250', title: '料號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
			{ key: 'depart', colWidth: '', title: '段位', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			// { key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
			// { key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
			{ key: 'storageType', colWidth: '', title: '倉庫類型', type: 'text', isCheck: true },
			{ key: 'sLocation', colWidth: '', title: '倉庫位置', type: 'text', isCheck: true },
			{ key: 'stockqty', colWidth: '', title: '庫存總量', type: 'text', isCheck: true },
			// { key: 'qrstockqty', colWidth: '', title: '有碼庫存量', type: 'text', isCheck: true },
			// { key: 'notqrstockqty', colWidth: '', title: '無碼庫存量', type: 'text', isCheck: true },
			{ key: 'codeManageModeText', colWidth: '', title: '二維碼管理模式', type: 'text', isCheck: true },
		],
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
			isTopTool: true, //是否有表格右上角工具
			isPage: true, //是否有分页
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料號', prop: 'matNo', required: false, type: 'input', lg: 6, xl: 6 },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
			{ label: '倉庫類型', prop: 'storeType', required: false, type: 'select', options: [] },
			{
				label: '倉庫位置',
				prop: 'sLocation',
				required: false,
				type: 'input',
				placeholder: '請輸入倉庫位置',
			},
			// options: [],
			// 	loading: true,
			// 	filterable: true,
			// 	remote: true,
			// 	remoteShowSuffix: true,
			{
				label: '段位',
				prop: 'depart',
				required: false,
				type: 'select',
				options: [
					{ value: 'FOL', label: 'FOL', text: 'FOL' },
					{ value: 'EOL', label: 'EOL', text: 'EOL' },
					{ value: 'SMT', label: 'SMT', text: 'SMT' },
				],
			},
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input', lg: 6, xl: 6 },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [],
		// 给后端的数据
		form: {
			matNo: '',
			matName: '',
			storeType: '',
			// storageId: '',
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
const cellStyle = ({ row, column }: EmptyObjectType) => {
	const property = column.property;
	if (property === 'stockqty' && row.codeManageMode === 0) {
		return { color: 'var(--el-color-primary)', cursor: 'pointer' };
	}
};

// 下拉框数据
const getSelect = async () => {
	const res = await getLegalStoreTypesApi();
	const option = res.data.map((item: any) => {
		return { label: item, text: item, value: item };
	});
	state.tableData.search[2].options = option;
};
// 改变仓库类型下拉
const selectChangeStoreType = (vals: string, prop: string, form: EmptyObjectType) => {
	if (prop === 'storeType') {
		form.storageId = '';
	}
};
let option: EmptyArrayType = [];
const remoteMethod = (query: string, form: EmptyObjectType) => {
	if (query) {
		state.tableData.search[3].loading = true;
		setTimeout(async () => {
			const res = await getQueryStoreHouseNoPageApi(form.storeType, query);
			state.tableData.search[3].loading = false;
			option = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.storeId}`, label: `${item.storeType}`, text: `${item.sLocation}` };
			});
			state.tableData.search[3].options = option.filter((item: EmptyObjectType) => {
				return item.text.toLowerCase().includes(query.toLowerCase()) || item.label.toLowerCase().includes(query.toLowerCase());
			});
		}, 500);
	} else {
		state.tableData.search[3].options = [];
	}
};
// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	option.forEach((item) => {
		if (item.value === form.sLocation) {
			// form.sLocation = item.text;
			// form.storageId = item.value;
		}
	});

	let data = {
		...form,
		page: state.tableData.page,
	};
	const codeManageModeMap: EmptyObjectType = {
		0: '有碼管理',
		1: '無碼管理',
	};
	const res = await getStockListApi(data);
	res.data.data.forEach((item: any) => {
		item.codeManageModeText = codeManageModeMap[item.codeManageMode];
	});
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};

// 点击退库弹窗
const openReturnDialog = (scope: EmptyObjectType) => {
	// repairReturnDialogRef.value.openDialog('return', scope.row);
};

// 点击料号,暂时不做
const matnoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	if (row.codeManageMode === 1) return;
	if (column.property === 'stockqty') {
		let res = await GetStockQrListApi(row.runid);
		if (res.data.length == 0) {
			ElMessage.error('暫無條碼數據');
		} else if (res.status) {
			tags.value = res.data;
			inventoryDialogRef.value?.openDialog();
			// inventoryDialogRef.value = true;
			// tags.value = res.data;
			// if (tags.value.length >= 20) {
			// 	for (let i = 0; i < 20; i++) {
			// 		count.value.push(tags.value[i]);
			// 	}
			// } else {
			// 	count.value = tags.value;
			// }
		}
	}
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
.describe {
	display: flex;
	margin-top: 10px;
	span {
		width: 90px;
	}
}
.dialog-input {
	display: flex;
	align-items: center;
	.el-input {
		width: 90%;
	}
	.el-select {
		width: 90%;
	}
}
:deep(.el-dialog__body) {
	min-height: 150px;
}
.infinite-list-wrapper {
	height: 500px;
	text-align: center;
}
.infinite-list-wrapper .list {
	padding: 0;
	margin: 0;
	list-style: none;
}

.infinite-list-wrapper .list-item {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 50px;
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
}
.infinite-list-wrapper .list-item + .list-item {
	margin-top: 10px;
}
</style>
