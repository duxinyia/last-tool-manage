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
				@openAdd="openDialog"
			/>
			<el-dialog ref="reportInquiryDialogRef" v-model="reportInquiryDialogVisible" :title="dilogTitle" width="60%">
				<el-row v-if="dilogTitle == '修改'">
					<el-col :xs="24" :sm="12" :md="9" :lg="9" :xl="9" class="mb10" v-for="(val, key) in dialogState.tableData.search" :key="key">
						<div v-if="val.type === 'text'">
							{{ val.label }}：<span style="color: red; text-align: center; line-height: 32px" class="ml10">{{
								dialogState.tableData.form[val.prop]
							}}</span>
						</div>
						<div v-if="val.type === 'input'">
							<span v-if="val.isRequired" class="color-danger mr5">*</span>
							<span style="width: 96px" class="mr10">{{ val.label }}:</span>
							<el-input size="default" v-model="dialogState.tableData.form[val.prop]" :placeholder="$t('请输入')" clearable style="width: 250px">
							</el-input>
						</div>
					</el-col>
				</el-row>
				<el-form ref="tableFormRef" :model="dialogState.tableData" size="default">
					<Table
						ref="dialogTableRef"
						v-bind="dialogState.tableData"
						class="table"
						@remoteMethod="remoteMethod"
						@changeselect="changeSelect"
						@addrow="onAddrow"
						@delRow="onDelRow"
					/>
				</el-form>
				<div class="describe" v-if="dilogTitle == '修改'">
					<span>描述说明：</span>
					<el-input
						class="input-textarea"
						show-word-limit
						v-model="dialogState.tableData.form['describe']"
						type="textarea"
						placeholder="请输入"
						maxlength="300"
					></el-input>
				</div>
				<template #footer v-if="dilogTitle == '修改'">
					<span class="dialog-footer">
						<el-button size="default" auto-insert-space @click="reportInquiryDialogVisible = false">取消</el-button>
						<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)"> 确定 </el-button>
					</span>
				</template>
			</el-dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="/requistManage/reportingInquiry">
import { defineAsyncComponent, reactive, ref, onMounted, watch, nextTick } from 'vue';
import { ElMessage, FormInstance } from 'element-plus';
const reportInquiryDialogVisible = ref(false);
import { getToolApplyHeadPageApi, getreqNoApi, getModifyApplyReqApi, getDeleApplyItemApi } from '/@/api/requistManage/reportingInquiry';
import { getQueryNoPageApi } from '/@/api/requistManage/presentation';
import { useI18n } from 'vue-i18n';
import { getMachineTypesOfMatApi } from '/@/api/partno/noSearch';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));

// 定义变量内容
const { t } = useI18n();
const tableRef = ref<RefType>();
const reportInquiryDialogRef = ref();
const dialogTableRef = ref<RefType>();
const tableFormRef = ref();
const resDataRef = ref([]);
// 单元格样式
const cellStyle = ref();
// 弹窗标题
const dilogTitle = ref();
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'reqNo', colWidth: '', title: '申请单号', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR单号', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '提报人', type: 'text', isCheck: true },
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
			{ label: '申请单号', prop: 'reqNo', required: false, type: 'input' },
			{ label: 'PR单号', prop: 'prNo', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'edit', name: 'message.allButton.editBtn', color: '#39D339', isSure: false, icon: 'ele-Edit' }],
		// 给后端的数据
		form: {
			reqNo: '',
			prNo: '',
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
const header = ref<deliveryDialogHeader>([
	{
		key: 'matNo',
		colWidth: '250',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	// { key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
	// { key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
	{ key: 'reqQty', colWidth: '', title: '需求数量', type: 'text', isCheck: true },
	{ key: 'reqDate', colWidth: '150', title: '需求时间', type: 'text', isCheck: true },
	{ key: 'prItemNo', colWidth: '', title: 'PR项次', type: 'text', isCheck: true },
	// { key: 'describe', colWidth: '150', title: '描述说明', type: 'text', isCheck: true },
]);
const header1 = ref<deliveryDialogHeader>([
	{
		key: 'matNo',
		colWidth: '250',
		title: 'message.pages.matNo',
		type: 'select',
		isCheck: true,
		isRequired: true,
		loading: false,
		option: [],
		isfilterable: true,
	},
	{ key: 'reqMatNo', colWidth: '', title: '请购料号', type: 'text', isCheck: true, isRequired: false },
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{
		key: 'machineType',
		colWidth: '150',
		title: '機種',
		type: 'select',
		isCheck: true,
		isRequired: false,
		collapseTags: true,
		collapseTagsTooltip: true,
		rowOption: true,
		clearable: true,
	},
	{ key: 'line', colWidth: '', title: '線體', type: 'input', isCheck: true, isRequired: true },
	{ key: 'reqQty', colWidth: '100', title: '需求数量', type: 'number', isCheck: true, isRequired: true, min: 0 },
	{ key: 'reqDate', colWidth: '150', title: '需求时间', type: 'time', isCheck: true, isRequired: true },
	{ key: 'prItemNo', colWidth: '', title: 'PR项次', type: 'input', isCheck: true, isRequired: false },
	// { key: 'describe', colWidth: '150', title: '描述说明', type: 'text', isCheck: true },
]);
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
			isAddRowBtn: false,
		},
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true, disable: true }],
		// 给后端的数据
		form: {},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '申请单号', prop: 'reqNo', required: false, type: 'text' },
			{ label: 'PR单号', prop: 'prNo', required: false, type: 'input' },
		],
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
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data = {
		reqNo: form.reqNo,
		prNo: form.prNo,
		page: state.tableData.page,
	};
	const res = await getToolApplyHeadPageApi(data);
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
// 打开修改弹窗
const openDialog = async (type: string, row: EmptyObjectType) => {
	dialogState.tableData.form = row;
	// dialogState.tableData.form['describe'] = '';
	let data = { reqNo: row.reqNo };
	getDetailData(data);
	dilogTitle.value = '修改';
	changeStatus(header1.value, 300, true);
};
// 点击申请单号
const reqNoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'reqNo') {
		dilogTitle.value = '单号:' + row.reqNo;
		let data = { reqNo: row.reqNo };
		changeStatus(header.value, 500, false);
		getDetailData(data);
	}
};
// 详情接口
const getDetailData = async (data: EmptyObjectType) => {
	const res = await getreqNoApi(data);
	dialogState.tableData.data = res.data.applyDetails;
	dialogState.tableData.form['describe'] = res.data.describe;
	reportInquiryDialogVisible.value = true;
	if (res.status) {
		dialogState.tableData.config.loading = false;
	}
	dialogState.tableData.data.forEach(async (item, index) => {
		const res1 = await getMachineTypesOfMatApi(item.matNo);
		dialogState.tableData.data[index].machineTypeoption = res1.data.map((item: EmptyObjectType) => {
			return { value: `${item}`, label: `${item}` };
		});
	});
	// const res1 = await getMachineTypesOfMatApi();
	// dialogState.tableData.header[4].option = res.data.map((item: EmptyObjectType) => {
	// 	return { value: `${item}`, label: `${item}` };
	// });
};
// 根据弹出窗不一样展现的配置不一样
const changeStatus = (header: EmptyArrayType, height: number, isShow: boolean) => {
	let tableData = dialogState.tableData;
	let config = tableData.config;
	tableData.header = header;
	config.height = height;
	config.isOperate = isShow;
	config.isInlineEditing = isShow;
	config.isAddRowBtn = isShow;
	config.isDialogTab = !isShow;
};
const remoteMethod = (index: number, query: string) => {
	if (query) {
		let loading = dialogState.tableData.header[0].loading;
		loading = true;
		setTimeout(async () => {
			const res = await getQueryNoPageApi(query);
			loading = false;
			resDataRef.value = res.data;
			let option = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.matNo}`, label: `${item.matNo}` };
			});
			dialogState.tableData.header[0].option = option.filter((item: EmptyObjectType) => {
				return item.label.toLowerCase().includes(query.toLowerCase());
			});
		}, 500);
	} else {
		dialogState.tableData.header[0].option = [];
	}
};
// // 	在 Input 值改变时触发
const changeSelect = async (i: number, query: any) => {
	resDataRef.value.forEach(async (item: any) => {
		if (item.matNo === query) {
			let data = dialogState.tableData.data[i];
			data.nameCh = item.nameCh;
			data.nameEn = item.nameEn;
			data.drawNo = item.drawNo;
			data.machineType = item.machineType;
			const res = await getMachineTypesOfMatApi(item.matNo);
			dialogState.tableData.data[i].machineTypeoption = res.data.map((item: EmptyObjectType) => {
				return { value: `${item}`, label: `${item}` };
			});
		}
	});
};
// 增加一行
const onAddrow = () => {
	dialogState.tableData.data.push({});
};
//删除
const onDelRow = async (row: EmptyObjectType, i: number) => {
	let deleteData: EmptyObjectType = {};
	deleteData = {
		reqNo: dialogState.tableData.form.reqNo,
		itemId: row.runId,
	};
	if (row.runId) {
		const res = await getDeleApplyItemApi(deleteData);
		if (res.status) {
			ElMessage.success(t('删除成功'));
			let data = { reqNo: dialogState.tableData.form.reqNo };
			getDetailData(data);
		}
	} else {
		dialogState.tableData.data.splice(i, 1);
	}
};
watch(
	() => dialogState.tableData.data,
	() => {
		nextTick(() => {
			dialogTableRef.value.setScrollTop(500);
		});
	},
	{ deep: true }
);
// 提交修改
const onSubmit = async (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格项必填未填'));
		let allData: EmptyObjectType = {};
		let form = dialogState.tableData.form;
		allData = { reqNo: form.reqNo, prNo: form.prNo, describe: form.describe };
		let data = dialogState.tableData.data;
		data = data.map((item) => {
			return {
				runId: item.runId,
				matNo: item.matNo,
				nameCh: item.nameCh,
				nameEn: item.nameEn,
				prItemNo: item.prItemNo,
				reqQty: item.reqQty,
				reqDate: item.reqDate,
				reqMatNo: item.reqMatNo,
				machineType: item.machineType,
			};
		});
		allData['reqDetails'] = data;
		console.log(allData);
		const res = await getModifyApplyReqApi(allData);
		if (res.status) {
			getTableData();
			ElMessage.success(t('修改成功'));
			reportInquiryDialogVisible.value = false;
		}
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
</style>
