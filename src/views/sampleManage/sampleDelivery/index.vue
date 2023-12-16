<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="送樣需求提報" name="first">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" labelWidth="70px" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="onTablePageChange"
				@onOpenOtherDialog="openSampleDialog"
				@cellclick="matnoClick"
				:cellStyle="cellStyle"
			/>

			<el-dialog draggable :close-on-click-modal="false" v-model="matNoDetaildialogVisible" title="料號詳情" width="50%">
				<Table v-bind="dialogState.tableData" :objectSpanMethod="objectSpanMethod" />
			</el-dialog>
		</el-tab-pane>
		<el-tab-pane label="送樣需求記錄" name="second" class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="secondState.tableData.search" @search="onSearch2" :searchConfig="secondState.tableData.searchConfig" labelWidth="70px" />
			<Table ref="tableRef2" v-bind="secondState.tableData" class="table" @pageChange="onTablePageChange" @onOpenOtherDialog="openSampleDialog" />
		</el-tab-pane>
		<Dialog
			ref="sampleDialogRef"
			:dialogConfig="state.tableData.dialogConfig"
			@addData="onSubmit"
			@remoteMethod="remoteMethod"
			:loadingBtn="loadingBtn"
			:footBtnDisabled="footBtnDisabled"
		>
			<template #optionFat="{ row }">
				<span style="float: left">{{ row.text }}</span>
				<span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ row.label }}</span>
			</template>
			<template #dialogBtn="{ data, ref }">
				<el-button
					:disabled="activeName === 'first' || data.formData.status === 0 ? false : true"
					:loading="loadingSaveBtn"
					type="success"
					@click="onSave(data, ref)"
					size="default"
					>保 存</el-button
				>
			</template>
		</Dialog>
	</el-tabs>
</template>
<script setup lang="ts" name="partnoSampleDelivery">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox, TabsPaneContext } from 'element-plus';
import {
	getMaterialListApi,
	getGetSampleApi,
	getAddSampleNeedsApi,
	getPurchaserGroupApi,
	getSubmitSampleNeedsApi,
} from '/@/api/partno/sampleDelivery';
import { useI18n } from 'vue-i18n';
import { getQuerySampleNeedsApi } from '/@/api/partno/sampleRequirement';

// 引入表格组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
// 引入上面的表单组件
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入送样和点击料号弹窗组件
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
// 定义变量内容
const { t } = useI18n();
const sampleDialogRef = ref();
const tableRef = ref<RefType>();
const tableRef2 = ref<RefType>();
const matNoDetaildialogVisible = ref(false);
const loadingBtn = ref(false);
const loadingSaveBtn = ref(false);
const activeName = ref<string>('first');
const footBtnDisabled = ref(false);
const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string;
	activeName.value === 'first' ? 0 : 1;
	getTableData();
};
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matNo', colWidth: '', title: 'message.pages.matNo', type: 'text', isCheck: true },
			{ key: 'depart', colWidth: '', title: '段位', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: 'message.pages.drawNo', type: 'text', isCheck: true },
			{ key: 'specs', colWidth: '', title: 'message.pages.specs', type: 'text', isCheck: true },
		],
		// 表格配置项（必传）
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
			operateWidth: 150,
		},

		btnConfig: [{ type: 'sample', name: '樣品需求', color: '#e6a23c', isSure: false }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料號', prop: 'matNo', placeholder: '請輸入料號', required: false, type: 'input' },
			// { label: 'BU', prop: 'bu', placeholder: '', required: false, type: 'input' },
			{
				label: '段位',
				prop: 'depart',
				placeholder: '',
				required: false,
				type: 'select',
				options: [
					{ value: 'FOL', label: 'FOL', text: 'FOL' },
					{ value: 'EOL', label: 'EOL', text: 'EOL' },
					{ value: 'SMT', label: 'SMT', text: 'SMT' },
				],
			},
			{ label: '品名', prop: 'name', placeholder: '', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', placeholder: '', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		dialogConfig: [
			{ type: 'text', label: '送樣單號', placeholder: '', prop: 'sampleNo', required: false },
			{ type: 'text', label: '料號', prop: 'matNo', required: false, placeholder: '' },
			{ type: 'text', label: '品名-中文', prop: 'nameCh', placeholder: '', required: false },
			{ type: 'text', label: '品名-英文', prop: 'nameEn', required: false, placeholder: '' },
			{ type: 'text', label: '圖紙編號', prop: 'drawNo', required: false, placeholder: '' },
			{ type: 'text', label: '規格', prop: 'specs', required: false, placeholder: '' },
			{ type: 'number', label: '需求數量', prop: 'needsQty', required: true, placeholder: '', min: 1 },
			{ type: 'date', label: '需求時間', prop: 'needsDate', required: true, placeholder: '', isdisabledDate: true },
			{
				label: '採購人員',
				prop: 'purchaserName',
				placeholder: '請輸入選擇採購人員',
				required: true,
				type: 'select',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
			},
			{ type: 'input', label: '需求人', prop: 'needor', required: true, placeholder: '請輸入需求人', maxlength: 20 },
			{
				type: 'input',
				label: '需求人電話',
				prop: 'needorTel',
				required: true,
				placeholder: '請輸入需求人電話',
				validateForm: 'number',
				message: '請輸入正確的電話格式',
				maxlength: 20,
			},
		],
		// 给后端的数据
		form: {},
		// printName: '表格打印演示',
		// 页码
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matNo', colWidth: '200', title: '料號', type: 'text', isCheck: true },
			{ key: 'sampleNo', colWidth: '180', title: '送樣單號', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'runStatus', colWidth: '', title: '狀態', type: 'text', isCheck: true },
			{ key: 'needsQty', colWidth: '', title: '需求數量', type: 'text', isCheck: true },
			{ key: 'needor', colWidth: '', title: '需求人', type: 'text', isCheck: true },
			{ key: 'needorTel', colWidth: '', title: '需求人電話', type: 'text', isCheck: true },
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
			isPage: true, //是否有分页
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料號', prop: 'matNo', required: false, type: 'input', lg: 6, xl: 6 },
			{ label: '送樣單號', prop: 'sampleNo', required: false, type: 'input' },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
			{ label: '需求人', prop: 'needor', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '提交送樣', color: '#e6a23c', isSure: false }],
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
		header: [
			{ key: 'sampleNo', colWidth: '200', title: '送樣單號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true },
			{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true },
			{ key: 'needsQty', colWidth: '', title: '需求送樣數量', type: 'text', isCheck: true },
			{ key: 'needsTime', colWidth: '', title: '需求送樣時間', type: 'text', isCheck: true },
		],
		// 表格配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: true, // 是否显示表格边框
			isSerialNo: false, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: false, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isAddRowBtn: false, //行内编辑时是否有表格上面的新增按钮
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			isDialogTab: true,
			height: 500,
		},
		btnConfig: [], // 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）

		search: [],
		searchConfig: {
			isSearchBtn: false,
		},
		// 给后端的数据
		form: {},
		// 页码
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// const changeToStyle = (data: any[], keyList: string[], indList: number[]) => {
// 	return ({ row, column, rowIndex, columnIndex }: any) => {
// 		for (let j = 0; j < keyList.length; j++) {
// 			let i = keyList[j];
// 			let ind = indList[j];
// 			if (columnIndex === ind) {
// 				return { color: 'var(--el-color-primary)', cursor: 'pointer' };
// 			}
// 		}
// 	};
// };
// cellStyle.value = changeToStyle(state.tableData.data, ['matNo'], [1]);
// 单元格字体颜色
const cellStyle = ({ column }: EmptyObjectType) => {
	// const property = column.property;
	// if (property === 'matNo' && activeName.value === 'first') {
	// 	return { color: 'var(--el-color-primary)', cursor: 'pointer' };
	// }
};
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data = {
		...form,
		page: state.tableData.page,
		queryType: 2,
		isContainsOther: 1,
	};
	const form2 = secondState.tableData.form;
	let data2 = {
		...form2,
		page: secondState.tableData.page,
		isQueryCurUser: 1,
	};
	if (activeName.value === 'first') {
		const res = await getMaterialListApi(data);
		state.tableData.data = res.data.data;
		state.tableData.config.total = res.data.total;
		if (res.status) {
			state.tableData.config.loading = false;
		}
	} else {
		const res = await getQuerySampleNeedsApi(data2);
		secondState.tableData.data = res.data.data;
		secondState.tableData.config.total = res.data.total;
		if (res.status) {
			secondState.tableData.config.loading = false;
		}
	}
};
// 选择下拉
let options: EmptyArrayType = [];
const remoteMethod = (query: string) => {
	let dialogConfig = state.tableData.dialogConfig;
	dialogConfig?.forEach((item) => {
		if (item.prop === 'purchaserName') item.loading = true;
	});
	if (query) {
		setTimeout(async () => {
			const res = await getPurchaserGroupApi(query);
			options = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.userid}`, label: `${item.userid}`, text: `${item.username}` };
			});
			dialogConfig?.forEach((item) => {
				if (item.prop === 'purchaserName') item.loading = false;
				item.options = options.filter((item: EmptyObjectType) => {
					return item.text.toLowerCase().includes(query.toLowerCase()) || item.label.toLowerCase().includes(query.toLowerCase());
				});
			});
		}, 500);
	} else {
		dialogConfig?.forEach((item) => {
			if (item.prop === 'purchaserName') item.options = [];
		});
	}
};
// 保存
const onSave = async (data: any, formEl: EmptyObjectType | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格項必填未填'));
		loadingSaveBtn.value = true;
		const formData = data.formData;
		const getData: { [key: string]: any } = {
			sampleNo: formData.sampleNo,
			matNo: formData.matNo,
			needsQty: formData.needsQty,
			needsDate: formData.needsDate,
			purchaser: formData.purchaser,
			purchaserName: formData.purchaserName,
			needor: formData.needor,
			needorTel: formData.needorTel,
		};
		options.forEach((item) => {
			if (item.value === formData.purchaserName) {
				getData['purchaser'] = item.label;
				getData['purchaserName'] = item.text;
			}
		});
		const res = await getAddSampleNeedsApi(getData);
		if (res.status) {
			ElMessage.success(t('保存成功'));
			data.formData.sampleNo = res.data;
			// sampleDialogRef.value.closeDialog();
			getTableData();
		}
		loadingSaveBtn.value = false;
	});
};
// 提交
const onSubmit = (formData: any) => {
	if (!formData.sampleNo) return ElMessage.warning(t('請按保存按鈕得到送樣單號'));
	ElMessageBox.confirm('確定提交嗎?', '提示', {
		confirmButtonText: '確 定',
		cancelButtonText: '取 消',
		type: 'warning',
		draggable: true,
	})
		.then(async () => {
			loadingBtn.value = true;
			const getData = {
				sampleNo: formData.sampleNo,
				matNo: formData.matNo,
				needsQty: formData.needsQty,
				needsDate: formData.needsDate,
				purchaser: formData.purchaser,
				purchaserName: formData.purchaserName,
				needor: formData.needor,
				needorTel: formData.needorTel,
			};
			options.forEach((item) => {
				if (item.value === formData.purchaserName) {
					getData['purchaser'] = item.label;
					getData['purchaserName'] = item.text;
				}
			});
			await getAddSampleNeedsApi(getData);
			const res = await getSubmitSampleNeedsApi({ SampleNo: formData.sampleNo });
			if (res.status) {
				ElMessage.success(t('提交成功'));
				sampleDialogRef.value.closeDialog();
				getTableData();
			}
			loadingBtn.value = false;
		})
		.catch(() => {});
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value && tableRef.value?.pageReset();
};
const onSearch2 = (data: EmptyObjectType) => {
	secondState.tableData.form = Object.assign({}, secondState.tableData.form, { ...data });
	tableRef2.value && tableRef2.value?.pageReset();
};
// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType) => {
	if (activeName.value === 'first') {
		state.tableData.page.pageNum = page.pageNum;
		state.tableData.page.pageSize = page.pageSize;
	} else {
		secondState.tableData.page.pageNum = page.pageNum;
		secondState.tableData.page.pageSize = page.pageSize;
	}
	getTableData();
};

// 打开样品需求弹窗 1
const openSampleDialog = (scope: EmptyObjectType, type: string) => {
	loadingBtn.value = false;
	footBtnDisabled.value = activeName.value === 'first' || scope.row.status === 0 ? false : true;
	sampleDialogRef.value.openDialog('samp', scope.row, activeName.value === 'first' ? '樣品需求' : '提交送樣');
};
// 点击料号 2
const matnoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	// if (column.property === 'matNo') {
	// 	const res = await getGetSampleApi(row.matNo);
	// 	dialogState.tableData.data = res.data;
	// 	matNoDetaildialogVisible.value = true;
	// }
};
// /**合并表格的第一列，处理表格数据 */
const flitterData = (arr: EmptyObjectType, columnI: number, property: string) => {
	let spanOneArr: EmptyArrayType = [];
	let concatOne = 0;
	arr.forEach((item: EmptyObjectType, index: number) => {
		if (index === 0) {
			spanOneArr.push(1);
		} else {
			// 注意这里的data是表格绑定的字段，根据自己的需求来改
			if (item[property] === arr[index - 1][property] && item['sampleNo'] === arr[index - 1]['sampleNo']) {
				//列需合并相同内容的判断条件
				spanOneArr[concatOne] += 1;
				spanOneArr.push(0);
			} else {
				spanOneArr.push(1);
				concatOne = index;
			}
		}
	});
	return {
		one: spanOneArr,
	};
};
const objectSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
	let arr = ['nameCh', 'nameEn', 'sampleNo'];
	if (~arr.indexOf(column.property)) {
		const _row = flitterData(dialogState.tableData.data, columnIndex, column.property).one[rowIndex];
		const _col = _row > 0 ? 1 : 0;
		return {
			rowspan: _row,
			colspan: _col,
		};
	}
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
:deep(.el-tabs__content) {
	height: 100% !important;
}
:deep(.el-tabs__item) {
	font-weight: 700;
	font-size: 14px;
}
</style>
