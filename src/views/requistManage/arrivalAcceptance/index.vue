<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="到貨驗收" name="first">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@cellclick="reqNoClick"
				:cellStyle="cellStyle"
				@onOpenOtherDialog="openArriveJobDialog"
			/>
		</el-tab-pane>
		<el-tab-pane label="驗收記錄" name="second" class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch
				v-if="secondState.tableData.search[1].options && secondState.tableData.search[1].options.length > 0"
				:search="secondState.tableData.search"
				@search="onSearch2"
				:searchConfig="secondState.tableData.searchConfig"
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
		<el-dialog ref="arriveJobDialogRef" v-model="arriveJobDialogVisible" :title="dilogTitle" width="60%">
			<el-row v-if="dilogTitle == '验收' || dilogTitle == '詳情'">
				<el-col :xs="24" :sm="12" :md="11" :lg="11" :xl="11" class="mb10" v-for="(val, key) in dialogState.tableData.search" :key="key">
					<div v-if="val.type === 'text'">
						{{ val.label }}：<span style="color: red" class="ml10">{{ dialogState.tableData.form[val.prop] }}</span>
					</div>
					<div v-if="val.type === 'time'">
						<span v-if="val.isRequired" class="color-danger mr5">*</span>
						<span style="width: 96px" class="mr10">{{ val.label }}</span>
						<!-- <el-date-picker
								value-format="YYYY-MM-DD"
								v-model="dialogState.tableData.form[val.prop]"
								type="date"
								placeholder="请选择"
								style="height: 30px; max-width: 167px"
							/> -->
					</div>
				</el-col>
			</el-row>

			<el-form ref="tableFormRef" :model="dialogState.tableData" size="default">
				<Table v-bind="dialogState.tableData" class="table" @delRow="onDelRow" @handleNumberInputChange="changeInput" />
			</el-form>
			<template v-if="dilogTitle == '验收' || dilogTitle == '詳情'">
				<div class="describe up-file" v-if="dilogTitle == '验收'">
					<span>收货报告url：</span>
					<el-input disabled v-model="dialogState.tableData.form['accepreporturl']" clearable>
						<template #prepend
							><el-upload
								v-model:file-list="inputfileList"
								:auto-upload="false"
								ref="inputuploadRefs"
								action=""
								class="upload"
								drag
								:limit="1"
								:show-file-list="false"
								:on-exceed="inputHandleExceed"
								:on-change="inputHandleChange"
							>
								<el-button type="primary" class="btn ml1">浏览文件</el-button>
							</el-upload></template
						>
						<template #append v-if="dialogState.tableData.form['accepreporturl']"
							><el-button @click="inputsubmitUpload" type="primary" class="ml1">上传文件</el-button>
							<el-button v-if="dialogState.tableData.form['accepreporturl'].includes('/')" class="look-file" @click="lookUpload">查看文件</el-button>
						</template>
					</el-input>
				</div>
				<div class="describe">
					<span>描述说明：</span>
					<el-input
						class="input-textarea"
						show-word-limit
						v-model="dialogState.tableData.form['describe']"
						type="textarea"
						placeholder="请输入"
						maxlength="150"
					></el-input>
				</div>
			</template>

			<template #footer v-if="dilogTitle == '验收'">
				<span class="dialog-footer">
					<el-button size="default" auto-insert-space @click="arriveJobDialogVisible = false">取消</el-button>
					<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)"> 确定 </el-button>
				</span>
			</template>
			<template #footer v-if="isSendBtn && dilogTitle == '詳情'">
				<span class="dialog-footer">
					<el-button size="default" auto-insert-space @click="arriveJobDialogVisible = false">取消</el-button>
					<el-button size="default" type="primary" auto-insert-space @click="onSend"> 送 簽 </el-button>
				</span>
			</template>
		</el-dialog>
	</el-tabs>
</template>

<script setup lang="ts" name="/requistManage/arrivalAcceptance">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch } from 'vue';
import { ElMessage, UploadInstance, UploadProps, UploadUserFile, genFileId, UploadRawFile, FormInstance, TabsPaneContext } from 'element-plus';

// 引入接口
import {
	getIToolReceivePageListApi,
	getReceiveApi,
	getTInsertCheckApi,
	getQueryCheckPageApi,
	getSubmitSignApi,
	getCheckdetailApi,
} from '/@/api/requistManage/arrivalAcceptance';
import { getUploadFileApi } from '/@/api/global/index';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const tableRef2 = ref<RefType>();
const arriveJobDialogRef = ref();
const inputfileList = ref<UploadUserFile[]>([]);
const inputuploadRefs = ref<UploadInstance>();
const inputuploadForm = ref();
const arriveJobDialogVisible = ref(false);
const isSendBtn = ref(false);
// 单元格样式
const cellStyle = ref();
const activeName = ref<string | number>('first');

const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	getTableData();
	console.log(tab.paneName);

	// console.log(tab, event);
};

// 弹窗标题
const dilogTitle = ref();
const header = ref<EmptyArrayType>([
	{ key: 'matno', colWidth: '250', title: 'message.pages.matNo', type: 'text', isCheck: true },
	// { key: 'machinetype', colWidth: '', title: '机种', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	// { key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	// { key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
	{ key: 'receiveqty', colWidth: '', title: '收货数量', type: 'text', isCheck: true },
	{ key: 'receiptdate', colWidth: '', title: '收货时间', type: 'text', isCheck: true },
	{ key: 'checkqty', colWidth: '100', title: '验收数量', type: 'number', isCheck: true, isRequired: true },
	{ key: 'passqty', colWidth: '100', title: '合格数量', type: 'number', isCheck: true, isRequired: true },
	{ key: 'failqty', colWidth: '', title: '不合格数量', type: 'text', isCheck: true, isRequired: true },
	{ key: 'checkDate', colWidth: '150', title: '验收时间', type: 'time', isCheck: true, isRequired: true },
]);
const header1 = ref([
	{
		key: 'matno',
		colWidth: '250',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	// { key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
	// { key: 'vendorName', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
	{ key: 'receiveqty', colWidth: '', title: '收货数量', type: 'text', isCheck: true },
	{ key: 'receiptdate', colWidth: '150', title: '收货时间', type: 'text', isCheck: true },
	{ key: 'describe', colWidth: '', title: '描述说明', type: 'text', isCheck: true },
]);
const header2 = ref([
	{ key: 'matno', colWidth: '250', title: 'message.pages.matNo', type: 'text', isCheck: true },
	{ key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'checkqty', colWidth: '100', title: '验收数量', type: 'number', isCheck: true, isRequired: true },
	{ key: 'passqty', colWidth: '100', title: '合格数量', type: 'text', isCheck: true, isRequired: true },
	{ key: 'failqty', colWidth: '', title: '不合格数量', type: 'text', isCheck: true, isRequired: true },
	{ key: 'checkdate', colWidth: '150', title: '验收时间', type: 'text', isCheck: true, isRequired: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'receiptno', colWidth: '', title: '收货单号', type: 'text', isCheck: true },
			{ key: 'reqno', colWidth: '', title: '申请单号', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '收货人', type: 'text', isCheck: true },
			{ key: 'receipttime', colWidth: '', title: '收货时间', type: 'text', isCheck: true },
			// { key: 'runstatus', colWidth: '', title: '状态', type: 'status', isCheck: true },
			{ key: 'companyid', colWidth: '', title: '法人', type: 'text', isCheck: true },
			{ key: 'bucode', colWidth: '', title: 'BU', type: 'text', isCheck: true },
			// { key: 'costcode', colWidth: '', title: '费用代码', type: 'text', isCheck: true },
			// { key: 'createtime', colWidth: '', title: '创建时间', type: 'text', isCheck: true },
			// { key: 'modifier', colWidth: '', title: '修改人', type: 'text', isCheck: true },
			// { key: 'modifytime', colWidth: '', title: '修改时间', type: 'text', isCheck: true },
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
			{ label: '收货单号', prop: 'receiptNo', required: false, type: 'input' },
			{ label: '申请单号', prop: 'reqNo', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '验收', color: '#D3C333', isSure: false, icon: 'ele-EditPen' }],
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
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'checkno', colWidth: '', title: '验收单号', type: 'text', isCheck: true },
			{ key: 'receiptno', colWidth: '', title: '收货单号', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '收货人', type: 'text', isCheck: true },
			{ key: 'signstatus', colWidth: '', title: '签核状态', type: 'text', isCheck: true },
			{ key: 'companyid', colWidth: '', title: '法人', type: 'text', isCheck: true },
			{ key: 'bucode', colWidth: '', title: 'BU', type: 'text', isCheck: true },
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
			{ label: '验收单号', prop: 'checkNo', required: false, type: 'input' },
			{
				label: '签核状态',
				prop: 'signStatus',
				required: false,
				type: 'select',
				options: [
					{ value: 0, label: '未送签', text: '未送签', selected: true },
					{ value: 1, label: '签核中', text: '签核中', selected: false },
					{ value: 2, label: '签核完成', text: '签核完成', selected: false },
				],
			},
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '详情', color: '#1890ff', isSure: false, icon: 'ele-View' }],
		// 给后端的数据
		form: {
			checkNo: '',
			signStatus: 0,
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
		search: [
			{ label: '验收单号', prop: 'checkno', required: false, type: 'text' },
			{ label: '收货单号', prop: 'receiptno', required: false, type: 'text' },
		],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true, disabled: true }],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});

const changeInput = (val: number, i: number) => {
	const data = dialogState.tableData.data[i];
	data.passqtymin = 0;
	data.failqty = data.checkqty - data.passqty || 0;
	data.passqtymax = data.checkqty;
	if (data.checkqty && data.passqty && data.checkqty < data.passqty) {
		data.passqty = data.checkqty;
		data.failqty = data.checkqty - data.passqty;
	} else if (!data.checkqty) {
		data.passqty = 0;
		data.failqty = 0;
	}
};
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
	const form = state.tableData.form;
	let data = {
		reqNo: form.reqNo,
		receiptNo: form.receiptNo,
		page: state.tableData.page,
	};

	const form2 = secondState.tableData.form;
	let data2 = {
		checkNo: form2.checkNo,
		signStatus: form2.signStatus,
		page: state.tableData.page,
	};
	if (activeName.value === 'first') {
		const res = await getIToolReceivePageListApi(data);
		state.tableData.data = res.data.data;
		state.tableData.config.total = res.data.total;
		if (res.status) {
			state.tableData.config.loading = false;
		}
	} else {
		const signStatusMap: EmptyObjectType = {
			0: '未送签',
			1: '签核中',
			2: '签核完成',
		};
		const res = await getQueryCheckPageApi(data2);
		res.data.data.forEach((item: any) => {
			item.signstatus = signStatusMap[item.signstatus];
		});
		secondState.tableData.data = res.data.data;
		secondState.tableData.config.total = res.data.total;
		if (res.status) {
			secondState.tableData.config.loading = false;
		}
	}
};
// input框里面的数据
const inputHandleChange: UploadProps['onChange'] = (uploadFile) => {
	dialogState.tableData.form['accepreporturl'] = uploadFile.name;
	inputuploadForm.value = uploadFile;
};
//可以在选中时自动替换上一个文件
const inputHandleExceed: UploadProps['onExceed'] = (files) => {
	inputuploadRefs.value!.clearFiles();
	const file = files[0] as UploadRawFile;
	file.uid = genFileId();
	inputuploadRefs.value!.handleStart(file);
};
// 上传文件
const inputsubmitUpload = async () => {
	const res = await getUploadFileApi(0, inputuploadForm.value.raw);
	dialogState.tableData.form['accepreporturl'] = res.data;
	res.status && ElMessage.success(`上传成功`);
};
// 查看上传的文件
const lookUpload = () => {
	window.open(`${import.meta.env.VITE_API_URL}${dialogState.tableData.form['accepreporturl']}`, '_blank');
};
//删除
const onDelRow = (row: EmptyObjectType, i: number) => {
	dialogState.tableData.data.splice(i, 1);
};
// 点击验收按钮
const openArriveJobDialog = (scope: EmptyObjectType) => {
	let data = { receiptNo: scope.row.receiptno };
	dialogState.tableData.form = scope.row;
	getDetailData(data);
	dilogTitle.value = '验收';
	changeStatus(header.value, 300, true);
};
// 点击详情按钮
const openDetailDialog = (scope: EmptyObjectType) => {
	isSendBtn.value = scope.row.signstatus === '未送签' ? true : false;
	dilogTitle.value = '詳情';
	dialogState.tableData.form = scope.row;
	changeStatus(header2.value, 300, false);
	let data = { checkNo: scope.row.checkno };
	getDetailData(data, scope.row.checkno);
};
// 点击收货单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'receiptno') {
		dilogTitle.value = '收货单号:' + row.receiptno;
		changeStatus(header1.value, 500, false);
		let data = { receiptNo: row.receiptno };
		getDetailData(data);
	}
};
// 详情接口
const getDetailData = async (data: EmptyObjectType, checkno?: string) => {
	dialogState.tableData.form = {};
	dialogState.tableData.data = [];
	arriveJobDialogVisible.value = true;
	const res = checkno ? await getCheckdetailApi(data) : await getReceiveApi(data);
	dialogState.tableData.form = res.data;
	dialogState.tableData.form.checkno = checkno;
	dialogState.tableData.data = res.data.receiveDetails;
	if (res.status) {
		dialogState.tableData.config.loading = false;
	}
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
// 送簽
const onSend = async () => {
	const res = await getSubmitSignApi(dialogState.tableData.form.checkno);
	if (res.status) {
		ElMessage.success(t('送签成功'));
		arriveJobDialogVisible.value = false;
		getTableData();
	}
};
// 提交
const onSubmit = async (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格项必填未填'));
		let allData: EmptyObjectType = {};
		const form = dialogState.tableData.form;
		allData = { receiptno: form.receiptno, accepreporturl: form.accepreporturl || '', describe: form.describe || '' };
		let data = dialogState.tableData.data;
		data = data.map((item) => {
			return { receivedetailid: item.runid, checkqty: item.checkqty, failqty: item.failqty, passqty: item.passqty, checkDate: item.checkDate };
		});
		allData['checkdetial'] = data;
		const res = await getTInsertCheckApi(allData);
		if (res.status) {
			ElMessage.success(t('收货成功'));
			arriveJobDialogVisible.value = false;
			getTableData();
		}
	});
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value && tableRef.value.pageReset();
};
const onSearch2 = (data: EmptyObjectType) => {
	secondState.tableData.search[1].options?.forEach((item) => {
		if (data.signStatus === item.text) {
			data.signStatus = item.value;
		}
	});
	secondState.tableData.form = Object.assign({}, secondState.tableData.form, { ...data });
	tableRef2.value && tableRef2.value.pageReset();
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
if (dialogState.tableData.btnConfig)
	dialogState.tableData.btnConfig[0].disabled = computed(() => {
		return dialogState.tableData.data.length <= 1 ? true : false;
	});
// 页面加载时
onMounted(() => {
	getTableData();
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
.describe {
	display: flex;
	margin-top: 10px;
	span {
		width: 100px;
	}
}
.up-file {
	height: 40px;
	span {
		align-items: center;
		line-height: 40px;
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
.look-file {
	color: var(--el-color-primary) !important;
}
</style>
