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
			<el-dialog v-model="matNoDetaildialogVisible" title="料号详情" width="50%">
				<matNoDetailDialog :isDialog="true" :matNoRef="matNoRef"
			/></el-dialog>
			<el-dialog v-model="inventoryDialogRef" title="库存条码" width="30%" draggable>
				<el-tag v-for="tag in tags" :key="tag.code" class="mr10 mb10" :type="tag.runStatus === 1 ? '' : 'danger'">
					{{ tag.code }}
				</el-tag>
			</el-dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="/toolsReturn/inventoryQuery">
import { defineAsyncComponent, reactive, ref, onMounted, computed, nextTick } from 'vue';
import type { FormInstance } from 'element-plus';

import { ElMessage, ElMessageBox } from 'element-plus';
// 引入接口
import { GetStockQrListApi } from '/@/api/toolsReturn/inventoryQuery';
import { getStockListApi, ExitStoreApi, getExitReasonApi } from '/@/api/toolsReturn/maintentanceTools';
import { getLegalStoreTypesApi, getQueryStoreHouseNoPageApi } from '/@/api/global';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const matNoDetailDialog = defineAsyncComponent(() => import('/@/views/link/noSearchLink/index.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const repairReturnDialogRef = ref();
const inventoryDialogRef = ref();
const matNoDetaildialogVisible = ref(false);
const matNoRef = ref();
// tags的数据
let tags = ref<EmptyArrayType>([]);
// 单元格样式
const cellStyle = ref();
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
			{ key: 'matno', colWidth: '250', title: '料号', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
			{ key: 'depart', colWidth: '', title: '部门', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '图纸编号', type: 'text', isCheck: true },
			// { key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
			// { key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
			{ key: 'storageType', colWidth: '', title: '倉庫類型', type: 'text', isCheck: true },
			{ key: 'sLocation', colWidth: '', title: '倉庫位置', type: 'text', isCheck: true },
			{ key: 'stockqty', colWidth: '', title: '库存总量', type: 'text', isCheck: true },
			{ key: 'qrstockqty', colWidth: '', title: '有码库存量', type: 'text', isCheck: true },
			{ key: 'notqrstockqty', colWidth: '', title: '无码库存量', type: 'text', isCheck: true },
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
			{ label: '料号', prop: 'matNo', required: false, type: 'input', lg: 6, xl: 6 },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
			{ label: '仓库类型', prop: 'storeType', required: false, type: 'select', options: [] },
			{
				label: '仓库位置',
				prop: 'storageId',
				required: false,
				type: 'select',
				placeholder: '请输入选择仓库位置',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
			},
			{ label: '部门', prop: 'depart', required: false, type: 'input' },
			{ label: '图纸编号', prop: 'drawNo', required: false, type: 'input', lg: 6, xl: 6 },
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
			storageId: '',
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
		search: [],
		btnConfig: [],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		//退库弹窗
		dialogConfig: [
			{ label: '料号', prop: 'matno', placeholder: '', required: false, type: 'text', xs: 24, sm: 24, md: 12, lg: 8, xl: 8 },
			{ label: '品名-中文', prop: 'nameCh', placeholder: '', required: false, type: 'text', xs: 24, sm: 8, md: 12, lg: 8, xl: 8 },
			{ label: '品名-英文', prop: 'nameEn', placeholder: '', required: false, type: 'text', xs: 24, sm: 8, md: 12, lg: 8, xl: 8 },
			{ label: '厂商代码', prop: 'vendorcode', placeholder: '', required: false, type: 'text', xs: 24, sm: 8, md: 12, lg: 8, xl: 8 },
			{ label: '厂商名称', prop: 'vendorname', placeholder: '', required: false, type: 'text', xs: 24, sm: 12, md: 12, lg: 12, xl: 12 },
			{
				label: '退库类型',
				prop: 'exitType',
				placeholder: '请选择退库类型',
				required: true,
				bindOthers: 'reasonId',
				type: 'select',
				options: [
					{ value: 1, label: '维修', text: '维修' },
					{ value: 2, label: '闲置', text: '闲置' },
					{ value: 3, label: '报废', text: '报废' },
				],
				xs: 24,
				sm: 12,
				md: 12,
				lg: 8,
				xl: 8,
			},
			{
				label: '退库原因',
				prop: 'reasonId',
				placeholder: '请选择退库原因',
				required: true,
				type: 'select',
				options: [],
				xs: 24,
				sm: 16,
				md: 12,
				lg: 9,
				xl: 9,
			},
			{
				label: '退库数量',
				prop: 'exitQty',
				placeholder: '请输入退库数量',
				validateForm: 'number',
				message: '请输入正整数',
				required: true,
				type: 'input',
				xs: 24,
				sm: 8,
				md: 8,
				lg: 8,
				xl: 8,
			},
			{
				label: '扫码录入',
				prop: 'scan',
				placeholder: '请输入入库数量',
				required: false,
				type: 'button',
				xs: 4,
				sm: 4,
				md: 4,
				lg: 4,
				xl: 4,
			},
		],
		innerDialogConfig: [
			{
				label: '扫码退库:',
				prop: 'sacnexitqty',
				placeholder: '请将光标放到此处扫码',
				required: false,
				type: 'input',
				xs: 12,
				sm: 12,
				md: 12,
				lg: 12,
				xl: 12,
			},
			{
				label: '扫码数量:',
				prop: 'exitQty',
				placeholder: '1',
				required: false,
				type: 'text',
				xs: 12,
				sm: 12,
				md: 12,
				lg: 12,
				xl: 12,
			},
			{
				label: '扫码信息:',
				prop: 'codeList',
				placeholder: '请输入扫码信息',
				required: false,
				type: 'tagsarea',
				tag: true,
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
		],
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
cellStyle.value = changeToStyle([1, 9]);
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
	console.log(option);

	option.forEach((item) => {
		if (item.value === form.sLocation) {
			// form.sLocation = item.text;
			form.storageId = item.value;
		}
	});

	let data = {
		...form,
		page: state.tableData.page,
	};

	const res = await getStockListApi(data);
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
const exitTypeMap: EmptyObjectType = {
	1: 'RepairReason',
	2: 'IdleReason',
	3: 'UselessReason',
};
//退库弹窗里的退库类型和退库原因选择时的操作
const selectChange = async (val: string, name: string, formData: EmptyObjectType) => {
	let exitReasonMap: any = [];
	if (name == 'exitType') {
		formData.reasonId = '';
		dialogState.tableData.dialogConfig?.forEach(async (item, index) => {
			if (item.prop == 'reasonId') {
				let res = await getExitReasonApi(exitTypeMap[val]);
				item.options = res.data.map((val: EmptyObjectType) => {
					return { value: val.runid, label: val.dataname, text: val.dataname };
				});
			}
		});
	}
	//根据原因id获取原因名称
	if (name == 'reasonId' && dialogState.tableData.dialogConfig) {
		dialogState.tableData.dialogConfig?.forEach(async (item, index) => {
			if (item.prop == 'reasonId') {
				item.options?.forEach((item) => {
					if (item.value == formData.reasonId) {
						formData['exitReason'] = item.label;
					}
				});
			}
		});
	}
};

// 点击退库弹窗
const openReturnDialog = (scope: EmptyObjectType) => {
	repairReturnDialogRef.value.openDialog('return', scope.row);
};
const scanCodeEntry = () => {
	repairReturnDialogRef.value.openInnerDialog('扫码录入');
};
// 嵌套弹窗提交
const innnerDialogSubmit = (formInnerData: any, formData: any) => {
	// 防止用户用扫码枪扫数据之后又手动修改数量
	if (formInnerData.codeList.length != 0) {
		formInnerData.exitQty = formInnerData.codeList.length;
	}
	//如果存在需要存放扫码枪输入信息的字段
	state.tableData.innerDialogConfig &&
		state.tableData.innerDialogConfig.forEach((item: any) => {
			if (item.tag) {
				// formInnerData[item.prop] = [];
				formInnerData.codeList = formInnerData.codeList.map((item: any) => {
					return item;
				});
			}
		});
};
// 打开嵌套弹窗
const openInnerDialog = (state: any) => {
	let { formInnerData, formData } = state;
	formInnerData['exitQty'] = formInnerData.codeList.length;
	formData['exitQty'] = formInnerData.codeList.length;
};
// 关闭tag标签
const handleTagClose = (tag: any, state: EmptyObjectType) => {
	let { formInnerData, formData } = state;
	formInnerData.codeList.splice(formInnerData.codeList.indexOf(tag), 1);
	formInnerData['exitQty'] = formInnerData.codeList.length;
	formData['exitQty'] = formInnerData.codeList.length;
};
// change
const change = (val: any, prop: string, state: any) => {
	let { formInnerData, formData } = state;
	if (prop == 'sacnexitqty') {
		if (formInnerData.codeList.length + 1 > formData.stockqty) {
			ElMessage.error(`扫码数量超过库存总量，请勿继续扫码`);
			formInnerData['sacnexitqty'] = null;
		} else if (formInnerData.codeList.includes(val)) {
			ElMessage.warning(`该条码已存在，请勿重复扫码`);
			formInnerData['sacnexitqty'] = null;
		} else {
			formInnerData.codeList.push(val);
			formInnerData['sacnexitqty'] = null;
			formInnerData['exitQty'] = formInnerData.codeList.length;
			formData['exitQty'] = formInnerData.codeList.length;
		}
	}
};
const innnerDialogCancel = (formData: EmptyObjectType, formInnerData: EmptyObjectType) => {
	formInnerData.codeList = [];
	formInnerData['exitQty'] = 0;
	formData['exitQty'] = 0;
};
// 点击料号,暂时不做
const matnoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'matno') {
		matNoRef.value = row.matno;
		setTimeout(() => {
			matNoDetaildialogVisible.value = true;
		}, 100);
	} else if (column.property === 'qrstockqty') {
		let res = await GetStockQrListApi(row.runid);
		if (res.data.length == 0) {
			ElMessage.error('暂无条码数据');
		} else {
			tags = res.data;
			inventoryDialogRef.value = true;
		}
	}
};

// 提交 确认退库
const returnSubmit = async (ruleForm: EmptyObjectType, type: string, formInnerData: EmptyObjectType) => {
	// if (!dialogState.tableData.form['sendTime']) return ElMessage.warning(t('请填写收货时间'));
	let allData: EmptyObjectType = { ...ruleForm };
	let submitData = {
		stockId: allData.runid,
		exitType: allData.exitType,
		reasonId: allData.reasonId,
		exitReason: allData.exitReason,
		exitQty: allData.exitQty,
		describe: allData.describe,
		codeList: formInnerData.codeList,
	};

	if (submitData.exitQty > ruleForm.stockqty) {
		ElMessage.error(`退库数量大于库存总量`);
	} else if (submitData.exitQty < submitData.codeList.length) {
		ElMessage.error(`退库数量小于扫码数量`);
	} else {
		const res = await ExitStoreApi(submitData);
		if (res.status) {
			ElMessage.success(t('退库成功'));
			repairReturnDialogRef.value.closeDialog();
			getTableData();
		}
	}
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
</style>
