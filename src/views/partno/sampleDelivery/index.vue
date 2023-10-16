<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="onTablePageChange"
				@onOpenOtherDialog="openSampleDialog"
				@cellclick="matnoClick"
				:cellStyle="cellStyle"
			/>
			<Dialog
				ref="sampleDialogRef"
				:dialogConfig="state.tableData.dialogConfig"
				@addData="onSubmit"
				@remoteMethod="remoteMethod"
				:loadingBtn="loadingBtn"
			>
				<template #optionFat="{ row }">
					<span style="float: left">{{ row.text }}</span>
					<span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ row.label }}</span>
				</template>
			</Dialog>
			<el-dialog v-model="matNoDetaildialogVisible" title="料号详情" width="50%">
				<Table v-bind="dialogState.tableData" :objectSpanMethod="objectSpanMethod" />
			</el-dialog>
		</div>
	</div>
</template>
<script setup lang="ts" name="partnoSampleDelivery">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getMaterialListApi, getGetSampleApi, getAddSampleNeedsApi, getPurchaserGroupApi } from '/@/api/partno/sampleDelivery';
import { useI18n } from 'vue-i18n';

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
const matNoDetaildialogVisible = ref(false);
const loadingBtn = ref(false);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matNo', colWidth: '', title: 'message.pages.matNo', type: 'text', isCheck: true },
			{ key: 'depart', colWidth: '', title: '部门', type: 'text', isCheck: true },
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

		btnConfig: [{ type: 'sample', name: '样品需求', color: '#D3C333', isSure: false }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料号', prop: 'matNo', placeholder: '请输入料号', required: false, type: 'input' },
			// { label: 'BU', prop: 'bu', placeholder: '', required: false, type: 'input' },
			{ label: '部门', prop: 'depart', placeholder: '', required: false, type: 'input' },
			{ label: '品名', prop: 'name', placeholder: '', required: false, type: 'input' },
			{ label: '图纸编号', prop: 'drawNo', placeholder: '', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		dialogConfig: [
			{ type: 'text', label: '送样单号', placeholder: '', prop: 'sampleNo', required: false },
			{ type: 'text', label: '料号', prop: 'matNo', required: false, placeholder: '' },
			{ type: 'text', label: '品名-中文', prop: 'nameCh', placeholder: '请输入专案代码', required: false },
			{ type: 'text', label: '品名-英文', prop: 'nameEn', required: false, placeholder: '' },
			{ type: 'text', label: '图纸编号', prop: 'drawNo', required: false, placeholder: '' },
			{ type: 'text', label: '规格', prop: 'specs', required: false, placeholder: '' },
			{ type: 'number', label: '需求数量', prop: 'needsQty', required: true, placeholder: '', min: 1 },
			{ type: 'date', label: '需求时间', prop: 'needsDate', required: true, placeholder: '' },
			{
				label: '采购人员',
				prop: 'purchaserName',
				placeholder: '请输入采购人员',
				required: true,
				type: 'select',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
			},
			{ type: 'input', label: '需求人', prop: 'needor', required: true, placeholder: '请输入需求人', maxlength: 20 },
			{
				type: 'input',
				label: '需求人电话',
				prop: 'needorTel',
				required: true,
				placeholder: '请输入需求人电话',
				validateForm: 'number',
				message: '请输入正确的电话格式',
				maxlength: 20,
			},
		],
		// 给后端的数据
		form: {
			matNo: '',
			// bu: '',
			depart: '',
			name: '',
			drawNo: '',
		},
		// printName: '表格打印演示',
		// 页码
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// 单元格样式
const cellStyle = ref();
const dialogState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'sampleNo', colWidth: '200', title: '送样单号', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
			{ key: 'vendorName', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
			{ key: 'needsQty', colWidth: '', title: '需求送样数量', type: 'text', isCheck: true },
			{ key: 'needsTime', colWidth: '', title: '需求送样时间', type: 'text', isCheck: true },
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
		form: {
			matNo: '',
		},
		// 页码
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
const changeToStyle = (data: any[], keyList: string[], indList: number[]) => {
	return ({ row, column, rowIndex, columnIndex }: any) => {
		for (let j = 0; j < keyList.length; j++) {
			let i = keyList[j];
			let ind = indList[j];
			if (columnIndex === ind) {
				return { color: 'var(--el-color-primary)', cursor: 'pointer' };
			}
		}
	};
};
cellStyle.value = changeToStyle(state.tableData.data, ['matNo'], [1]);
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data = {
		matNo: form.matNo,
		// bu: form.bu,
		depart: form.depart,
		name: form.name,
		drawNo: form.drawNo,
		page: state.tableData.page,
		queryType: 2,
	};
	const res = await getMaterialListApi(data);
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
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
// 提交
const onSubmit = async (formData: any) => {
	loadingBtn.value = true;
	const getData = {
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
		ElMessage.success(t('新增成功'));
		sampleDialogRef.value.closeDialog();
		getTableData();
	}
	loadingBtn.value = false;
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

// 打开样品需求弹窗 1
const openSampleDialog = (scope: EmptyObjectType, type: string) => {
	sampleDialogRef.value.openDialog('samp', scope.row, '样品需求');
};
// 点击料号 2
const matnoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'matNo') {
		const res = await getGetSampleApi(row.matNo);
		dialogState.tableData.data = res.data;
		matNoDetaildialogVisible.value = true;
	}
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
</style>
