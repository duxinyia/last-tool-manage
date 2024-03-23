<template>
	<el-tabs v-model="currName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="維修發料" name="first">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" labelWidth="70px" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@onOpenOtherDialog="openArriveJobDialog"
			/>
		</el-tab-pane>
		<el-tab-pane label="發料記錄" name="second" class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch
				:search="secondState.tableData.search"
				@search="onSearch2"
				:searchConfig="secondState.tableData.searchConfig"
				@remoteMethod="remoteMethod"
				@selectChange="onChangeStoreType"
				labelWidth="100px"
			/>
			<Table
				ref="tableRef2"
				v-bind="secondState.tableData"
				class="table"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@onOpenOtherDialog="openDetailDialog"
			/>
		</el-tab-pane>
		<Dialog
			ref="issueMaterialsDialogRef"
			:dialogConfig="state.tableData.dialogConfig"
			@addData="onSubmit"
			@remoteMethod="remoteMethod"
			:loadingBtn="loadingBtn"
			@dailogFormButton="onDownLoad"
			@selectChange="onChangeStoreType"
		>
			<template #optionFat="{ row, val }">
				<div v-if="val.prop === 'sLocation'">
					<span style="float: left">{{ row.text }}</span>
					<span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ row.label }}</span>
				</div>
			</template>
		</Dialog>
	</el-tabs>
</template>

<script setup lang="ts" name="issueMaterials">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, FormInstance, TabsPaneContext } from 'element-plus';
// 引入接口
import {
	getQueryDispatchedRepairCheckDetailsApi,
	getToolRepairDispatchApi,
	getQueryDispatchRecordApi,
} from '/@/api/maintenanceManage/maintenanceMaterialIssue';
import { getAdminNamesOfStoreHouseApi, getLegalStoreTypesExceptIdleStoreApi, getQueryStoreHouseExceptIdleStoreNoPageApi } from '/@/api/global';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableRef = ref<RefType>();
const tableRef2 = ref<RefType>();
const issueMaterialsDialogRef = ref();
const loadingBtn = ref(false);
const currName = ref<string | number>('first');

const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'checkTimeStr', colWidth: '', title: '驗收時間', type: 'text', isCheck: true },
			{ key: 'checkQty', colWidth: '', title: '驗收數量', type: 'text', isCheck: true },
			{ key: 'passQty', colWidth: '', title: '通过數量', type: 'text', isCheck: true },
			{ key: 'checker', colWidth: '', title: '驗收人', type: 'text', isCheck: true },
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
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{ label: '驗收人', prop: 'checker', required: false, type: 'input' },
			{ label: '驗收日期', prop: 'checkDate', required: false, type: 'dateRange', lg: 4, xl: 4 },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '發料', color: '#67c23a', isSure: false, icon: 'ele-Van' }],
		// 给后端的数据
		form: {},
		dialogConfig: [
			{ type: 'text', label: '維修單號', placeholder: '', prop: 'repairNo', required: false },
			{ type: 'text', label: 'message.pages.matNo', placeholder: '', prop: 'matNo', required: false },
			{ type: 'text', label: '圖紙編號', placeholder: '', prop: 'drawNo', required: false },
			{ type: 'text', label: '品名-中文', placeholder: '', prop: 'nameCh', required: false },
			{ type: 'text', label: '品名-英文', placeholder: '', prop: 'nameEn', required: false },
			{ type: 'text', label: '驗收時間', placeholder: '', prop: 'checkTimeStr', required: false },
			{ type: 'text', label: '驗收數量', placeholder: '', prop: 'checkQty', required: false },
			{ type: 'text', label: '通过數量', placeholder: '', prop: 'passQty', required: false },
			{ type: 'text', label: '驗收人', placeholder: '', prop: 'checker', required: false },

			{ type: 'button', label: '查看驗收報告', placeholder: '', prop: 'accepReportUrl', required: false, xs: 24, sm: 24, md: 24, lg: 24, xl: 24 },
			{
				label: '倉庫類型',
				prop: 'storeType',
				placeholder: '請選擇倉庫類型',
				required: true,
				type: 'select',
				options: [],
				clearable: true,
			},
			{
				label: '倉庫位置',
				prop: 'sLocation',
				placeholder: '請輸入選擇倉庫位置',
				required: true,
				type: 'select',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
			},
			{
				type: 'text',
				label: '接收DRI',
				placeholder: '',
				prop: 'warehouseManager',
				required: false,
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
			// {
			// 	type: 'text',
			// 	label: '描述說明',
			// 	placeholder: '',
			// 	prop: 'describe',
			// 	required: false,
			// 	xs: 24,
			// 	sm: 24,
			// 	md: 24,
			// 	lg: 24,
			// 	xl: 24,
			// },
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
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			// { key: 'repairCheckDetailId', colWidth: '', title: '維修驗收詳情ID', type: 'text', isCheck: true },
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'isStored', colWidth: '', title: '是否已入庫', type: 'text', isCheck: true },
			{ key: 'checker', colWidth: '', title: '驗收人', type: 'text', isCheck: true },
			{ key: 'dispatchTimeStr', colWidth: '', title: '發料時間', type: 'text', isCheck: true },
			{ key: 'qty', colWidth: '', title: '發料數量', type: 'text', isCheck: true },
			{ key: 'receiveStorageType', colWidth: '', title: '領用倉庫類型', type: 'text', isCheck: true },
			{ key: 'receiveSLocation', colWidth: '', title: '領用倉庫位置', type: 'text', isCheck: true },
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
			{ label: '維修單號', prop: 'repairNo', required: false, type: 'input' },
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{
				label: '是否已入庫',
				prop: 'isStored',
				required: false,
				clearable: false,
				type: 'select',
				placeholder: '',
				options: [
					{ value: true, label: '是', text: '是' },
					{ value: false, label: '否', text: '否' },
				],
			},
			{
				label: '領用倉庫類型',
				prop: 'receiveStorageType',
				required: false,
				type: 'select',
				placeholder: '',
				options: [],
			},
			{
				label: '領用倉庫位置',
				prop: 'receiveSLocation',
				required: false,
				type: 'input',
				placeholder: '請輸入倉庫位置',
				// options: [],
				// loading: true,
				// filterable: true,
				// remote: true,
				// remoteShowSuffix: true,
				// lg: 6,
				// xl: 6,
			},
			{ label: '驗收人', prop: 'checker', required: false, type: 'input' },
			{ label: '發料時間', prop: 'dispatchDate', required: false, type: 'dateRange' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [],
		// 给后端的数据
		form: {
			// checkNo: '',
			// signStatus: 0,
		},
		dialogConfig: [
			{ type: 'text', label: '驗收單號', placeholder: '', prop: 'applyCheckId', required: false },
			{ type: 'text', label: '申請單號', placeholder: '', prop: 'reqNo', required: false },
			{ type: 'text', label: '收貨單號', placeholder: '', prop: 'applyReceiveId', required: false },
			{ type: 'text', label: 'message.pages.matNo', placeholder: '', prop: 'matNo', required: false },
			{ type: 'text', label: '申請單號', placeholder: '', prop: 'reqMatNo', required: false },
			{ type: 'text', label: '品名-中文', placeholder: '', prop: 'nameCh', required: false },
			{ type: 'text', label: '品名-英文', placeholder: '', prop: 'nameEn', required: false },
			{ type: 'text', label: '驗收日期', placeholder: '', prop: 'checkDate', required: false },
			{ type: 'text', label: '驗收數量', placeholder: '', prop: 'checkQty', required: false },
			{ type: 'text', label: '合格數量', placeholder: '', prop: 'passQty', required: false },
			{ type: 'text', label: '不合格數量', placeholder: '', prop: 'failQty', required: false },
			{ type: 'text', label: '驗收人', placeholder: '', prop: 'checker', required: false },
			{ type: 'text', label: '實際提交日期', placeholder: '', prop: 'createTime', required: false },
			{ type: 'text', label: '是否已發料', placeholder: '', prop: 'isDispatched', required: false },
			{ type: 'text', label: '備註', placeholder: '', prop: 'describe', required: false, lg: 24, xl: 24 },
			{ type: 'button', label: '查看驗收報告', placeholder: '', prop: 'accepReportUrl', required: false },
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
// 下載驗收報告
const onDownLoad = (formData: EmptyObjectType) => {
	if (formData.accepReportUrl) {
		window.open(
			`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${formData.accepReportUrl}`,
			'_blank'
		);
	} else {
		ElMessage.warning(t('沒有驗收報告單'));
	}
};
const handleClick = (tab: TabsPaneContext, event: Event) => {
	currName.value = tab.paneName as string | number;
	getTableData();
};
// 点击發料按鈕
const currentData = ref<EmptyObjectType>([]);
const openArriveJobDialog = (scope: EmptyObjectType) => {
	loadingBtn.value = false;
	issueMaterialsDialogRef.value.openDialog('samp', scope.row, '發料');
	currentData.value = scope.row;
};
// 點擊詳情
const openDetailDialog = () => {};
// 改變倉庫類型清空倉庫位置
const onChangeStoreType = async (val: string, prop: string, form: EmptyObjectType) => {
	if (prop === 'storeType') {
		form.sLocation = '';
		form.warehouseManager = '';
	} else if (prop === 'sLocation') {
		const res = await getAdminNamesOfStoreHouseApi(form.sLocation);
		form.warehouseManager = res.data;
		if (!form.storeType) {
			option.forEach((item) => {
				if (item.value === form.sLocation) {
					form.storeType = item.label;
				}
			});
		}
	}
};
// 搜索下拉选择
let option: EmptyArrayType = [];
const remoteMethod = (query: string, form: EmptyObjectType) => {
	if (query) {
		state.tableData.dialogConfig?.forEach((item) => {
			if (item.prop === 'sLocation') {
				item.loading = true;
			}
		});
		secondState.tableData.search.forEach((item) => {
			if (item.prop === 'receiveSLocation') {
				item.loading = true;
			}
		});
		setTimeout(async () => {
			const res = await getQueryStoreHouseExceptIdleStoreNoPageApi(form.storeType, query);
			option = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.storeId}`, label: `${item.storeType}`, text: `${item.sLocation}` };
			});
			state.tableData.dialogConfig?.forEach((item) => {
				if (item.prop === 'sLocation') {
					item.loading = false;
					item.options = option.filter((item: EmptyObjectType) => {
						return item.text.toLowerCase().includes(query.toLowerCase()) || item.label.toLowerCase().includes(query.toLowerCase());
					});
				}
			});
			secondState.tableData.search?.forEach((item) => {
				if (item.prop === 'receiveSLocation') {
					item.loading = false;
					item.options = option.filter((item: EmptyObjectType) => {
						return item.text.toLowerCase().includes(query.toLowerCase()) || item.label.toLowerCase().includes(query.toLowerCase());
					});
				}
			});
		}, 500);
	} else {
		state.tableData.dialogConfig?.forEach((item) => {
			if (item.prop === 'sLocation') {
				item.options = [];
			}
		});
		secondState.tableData.search?.forEach((item) => {
			if (item.prop === 'receiveSLocation') {
				item.options = [];
			}
		});
	}
};
// 下拉框数据
const getSelect = async () => {
	const res = await getLegalStoreTypesExceptIdleStoreApi();
	const option = res.data.map((item: any) => {
		return { label: item, text: item, value: item };
	});
	state.tableData.dialogConfig?.forEach((item) => {
		if (item.prop === 'storeType') {
			item.options = option;
		}
	});
	secondState.tableData.search.forEach((item) => {
		if (item.prop === 'receiveStorageType') {
			item.options = option;
		}
	});
};

// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	let data = {
		...form,
		checkDate: form.checkDate,
		startCheckDate: form.checkDate && form.checkDate[0],
		endCheckDate: form.checkDate && form.checkDate[1],
		page: state.tableData.page,
	};
	delete data.checkDate;
	const form2 = secondState.tableData.form;
	if (form2.isStored === '') {
		form2.isStored = null;
	}
	option.forEach((item) => {
		if (item.value === form2.receiveSLocation) {
			form2.receiveSLocation = item.text;
		}
	});
	let data2 = {
		...form2,
		dispatchDate: form2.dispatchDate,
		startDispatchTime: form2.dispatchDate && form2.dispatchDate[0],
		endDispatchTime: form2.dispatchDate && form2.dispatchDate[1],
		page: secondState.tableData.page,
	};
	delete data.checkDate;
	if (currName.value === 'first') {
		const res = await getQueryDispatchedRepairCheckDetailsApi(data);
		res.data.data.forEach((item: any) => {
			item.checker = item.checker + ' / ' + item.checkerName;
		});
		state.tableData.data = res.data.data;
		state.tableData.config.total = res.data.total;
		if (res.status) {
			state.tableData.config.loading = false;
		}
	} else {
		const res = await getQueryDispatchRecordApi(data2);
		res.data.data.forEach((item: any) => {
			item.isStored = item.isStored ? '是' : '否';
			item.checker = `${item.checker} / ${item.checkerName}`;
		});
		secondState.tableData.data = res.data.data;
		secondState.tableData.config.total = res.data.total;
		if (res.status) {
			secondState.tableData.config.loading = false;
		}
	}
};

// 提交發料
const onSubmit = async (formData: any) => {
	loadingBtn.value = true;
	const getData = {
		repairCheckDetailId: formData.repairCheckDetailId,
		storageId: '',
	};
	option.forEach((item) => {
		if (item.value === formData.sLocation) {
			getData['storageId'] = item.value;
		}
	});
	const res = await getToolRepairDispatchApi(getData);
	if (res.status) {
		ElMessage.success(t('發料成功'));
		issueMaterialsDialogRef.value.closeDialog();
		getTableData();
	}
	loadingBtn.value = false;
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value?.pageReset();
};
const onSearch2 = (data: EmptyObjectType) => {
	secondState.tableData.form = Object.assign({}, secondState.tableData.form, { ...data });
	tableRef2.value && tableRef2.value?.pageReset();
};

// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType) => {
	if (currName.value === 'first') {
		state.tableData.page.pageNum = page.pageNum;
		state.tableData.page.pageSize = page.pageSize;
	} else {
		secondState.tableData.page.pageNum = page.pageNum;
		secondState.tableData.page.pageSize = page.pageSize;
	}
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
:deep(.el-tabs__content) {
	height: 100% !important;
}
:deep(.el-tabs__item) {
	font-weight: 700;
	font-size: 14px;
}
.table-container {
	.table-padding {
		padding: 15px;
		display: flex;
		.table {
			flex: 1;
			overflow: hidden;
		}
	}
}
:deep(.el-upload-dragger) {
	border: 0;
	padding: 0;
	background-color: transparent;
	border-radius: unset;
}
:deep(.el-input-group__prepend) {
	padding: 0;
}
</style>
