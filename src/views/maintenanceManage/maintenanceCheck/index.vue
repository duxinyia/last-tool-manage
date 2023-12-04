<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="維修單驗收" name="first">
			<TableSearch
				:search="state.tableData.search"
				@search="(data) => onSearch(data, state.tableData)"
				:searchConfig="state.tableData.searchConfig"
				labelWidth=" "
			/>
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
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="驗收記錄" name="second">
			<TableSearch
				:search="secondState.tableData.search"
				@search="(data) => onSearch(data, secondState.tableData)"
				:searchConfig="secondState.tableData.searchConfig"
				labelWidth=" "
			/>
			<Table
				ref="tableRef"
				v-bind="secondState.tableData"
				class="table"
				@onOpenOtherDialog="openSecondDetailDialog"
				@pageChange="(page) => onTablePageChange(page, secondState.tableData)"
				@sortHeader="(data) => onSortHeader(data, secondState.tableData)"
			/>
		</el-tab-pane>
		<el-dialog
			draggable
			:close-on-click-modal="false"
			v-model="maintenanceCheckDialogVisible"
			:title="dilogTitle"
			:width="dilogTitle == '驗收' ? '69%' : '50%'"
		>
			<el-row v-if="dilogTitle == '驗收'">
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
			<template v-if="dilogTitle == '驗收' || dilogTitle == '詳情'">
				<div class="describe" v-if="dilogTitle == '驗收'">
					<span>收貨描述說明：</span>
					<div style="font-weight: 700; color: #1890ff">{{ dialogState.tableData.form['describe'] }}</div>
				</div>
				<div class="describe up-file" v-if="dilogTitle == '驗收'">
					<span>驗收報告：</span>
					<el-upload
						style="width: 99%"
						v-model:file-list="inputfileList"
						:auto-upload="false"
						ref="inputuploadRefs"
						action="#"
						class="upload ml5"
						drag
						:limit="1"
						:show-file-list="false"
						:on-exceed="inputHandleExceed"
						:on-change="inputHandleChange"
					>
						<el-input style="height: 35px" v-model="dialogState.tableData.form['accepReportUrl']" placeholder="請點擊此處上傳文件"> > </el-input>
					</el-upload>
					<el-button size="default" plain @click="onClearFile" type="primary" class="ml10">清空驗收報告</el-button>
					<el-button size="default" plain type="primary" @click="lookUpload">查看驗收報告</el-button>
					<!-- <el-input disabled v-model="dialogState.tableData.form['accepReportUrl']" clearable>
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
									<el-button type="primary" class="btn ml1">瀏覽文件</el-button>
								</el-upload></template
							>
							<template #append v-if="dialogState.tableData.form['accepReportUrl']"
								><el-button @click="inputsubmitUpload" type="primary" class="ml1">上傳文件</el-button>
								<el-button v-if="dialogState.tableData.form['accepReportUrl'].includes('/')" class="look-file" @click="lookUpload"
									>查看文件</el-button
								>
							</template>
						</el-input> -->
				</div>
				<el-button class="mt5" v-if="dilogTitle == '詳情'" size="default" plain type="primary" @click="lookUpload">查看驗收報告</el-button>
				<div class="describe">
					<span>描述說明：</span>
					<el-input
						v-if="dilogTitle == '驗收'"
						class="input-textarea"
						show-word-limit
						v-model="dialogState.tableData.form['describe1']"
						type="textarea"
						placeholder="請輸入"
						maxlength="150"
					></el-input>
					<span v-else style="color: #1890ff; font-weight: 700; width: 100%">{{ dialogState.tableData.form['describe1'] }}</span>
				</div>
			</template>

			<template #footer>
				<span class="dialog-footer" v-if="dilogTitle == '驗收'">
					<el-button size="default" auto-insert-space @click="maintenanceCheckDialogVisible = false">取消</el-button>
					<el-button :disabled="isSureDisabled" size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)" :loading="loadingBtn">
						確定
					</el-button>
				</span>
			</template>
		</el-dialog>
	</el-tabs>
</template>

<script setup lang="ts" name="/maintenanceManage/maintenanceCheck">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch } from 'vue';
import { ElMessage, UploadInstance, UploadProps, UploadUserFile, genFileId, UploadRawFile, FormInstance, TabsPaneContext } from 'element-plus';
const maintenanceCheckDialogVisible = ref(false);
// 引入接口
import {
	getQueryCheckableRepairReceiveHeadApi,
	getRepariReceiveDetailsForCheckApi,
	getCheckApi,
	getQueryRepairCheckRecordApi,
	getRepairCheckRecordDetailApi,
} from '/@/api/maintenanceManage/maintenanceCheck';
import { getExitReasonApi } from '/@/api/toolsReturn/maintentanceTools';
import { getUploadFileApi } from '/@/api/global/index';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const loadingBtn = ref(false);
const tableRef = ref<RefType>();
const inputfileList = ref<UploadUserFile[]>([]);
const inputuploadRefs = ref<UploadInstance>();
const inputuploadForm = ref();
// 单元格样式
const cellStyle = ref();
const isSureDisabled = ref(true);
// 弹窗标题
const dilogTitle = ref();
const activeName = ref<string | number>('first');
const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	getTableData(activeName.value === 'first' ? state.tableData : secondState.tableData);
};
const header = ref<EmptyArrayType>([
	{ key: 'matNo', colWidth: '250', title: 'message.pages.matNo', type: 'text', isCheck: true },
	// { key: 'machinetype', colWidth: '', title: '机种', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	// { key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	// { key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
	{ key: 'receiptQty', colWidth: '', title: '收貨數量', type: 'text', isCheck: true },
	{ key: 'receiptDate', colWidth: '', title: '收貨時間', type: 'text', isCheck: true },
	{ key: 'checkQty', colWidth: '100', title: '驗收數量', type: 'text', isCheck: true, isRequired: false, min: 0 },
	{ key: 'passQty', colWidth: '100', title: '合格數量', type: 'number', isCheck: true, isRequired: true, min: 0 },
	{ key: 'failqty', colWidth: '', title: '不合格數量', type: 'text', isCheck: true, isRequired: true },
	{ key: 'failReasonIds', colWidth: '180', title: '驗收不合格原因', type: 'multipleSelect', isCheck: true, options: [] },
	{ key: 'checkDate', colWidth: '150', title: '驗收時間', type: 'time', isCheck: true, isRequired: true },
]);
const header1 = ref([
	{
		key: 'matNo',
		colWidth: '250',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	// { key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
	// { key: 'vendorName', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
	{ key: 'receiptQty', colWidth: '', title: '收貨數量', type: 'text', isCheck: true },
	{ key: 'receiptDate', colWidth: '150', title: '收貨時間', type: 'text', isCheck: true },
]);
const header2 = ref([
	{
		key: 'matNo',
		colWidth: '240',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'checkDate', colWidth: '', title: '驗收日期', type: 'text', isCheck: true },
	{ key: 'checkQty', colWidth: '', title: '驗收數量', type: 'text', isCheck: true },
	{ key: 'passQty', colWidth: '', title: '通過數量', type: 'text', isCheck: true },
	{ key: 'failQty', colWidth: '100', title: '未通過數量', type: 'text', isCheck: true },
	{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'text', isCheck: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'repairReceiveNo', colWidth: '', title: '收貨單號', type: 'text', isCheck: true },
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '收貨人', type: 'text', isCheck: true },
			{ key: 'receiptTime', colWidth: '', title: '收貨時間', type: 'text', isCheck: true },
			// { key: 'runstatus', colWidth: '', title: '状态', type: 'status', isCheck: true },
			// { key: 'companyId', colWidth: '', title: '法人', type: 'text', isCheck: true },
			{ key: 'buCode', colWidth: '', title: 'BU', type: 'text', isCheck: true },
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
			{ label: '收貨單號', prop: 'repairReceiveNo', required: false, type: 'input' },
			{ label: '維修單號', prop: 'repairNo', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '驗收', color: '#e6a23c', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			repairReceiveNo: '',
			repairNo: '',
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
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			{ key: 'repairCheckNo', colWidth: '', title: '驗收單號', type: 'text', isCheck: true },
			{ key: 'repairReceiveNo', colWidth: '', title: '收貨單號', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR單號', type: 'text', isCheck: true },
			{ key: 'receiver', colWidth: '', title: '收貨人', type: 'text', isCheck: true },
			{ key: 'createTime', colWidth: '', title: '提交時間', type: 'text', isCheck: true },
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
			{ label: '驗收單號', prop: 'repairCheckNo', required: false, type: 'input' },
			{ label: '收貨單號', prop: 'repairReceiveNo', required: false, type: 'input' },
			{ label: '提交時間', prop: 'createTime', required: false, type: 'dateRange' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'detail', name: '查看詳情', color: '#1890ff', isSure: false, icon: 'ele-View' }],
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
			{ label: '驗收單號', prop: 'checkno', required: false, type: 'text' },
			{ label: '收貨單號', prop: 'repairReceiveNo', required: false, type: 'text' },
		],
		// btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true, disabled: true }],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});

const changeInput = (val: number, i: number) => {
	const data = dialogState.tableData.data[i];
	data.passQtymin = 0;
	data.passQtymax = data.checkQty;
	data.failqty = data.checkQty - data.passQty || 0;
	if (data.checkQty && data.passQty && data.checkQty < data.passQty) {
		data.passQty = data.checkQty;
		data.failqty = data.checkQty - data.passQty;
	} else if (!data.checkQty) {
		data.passQty = 0;
		data.failqty = 0;
	}
	data.failReasonIdsdisabled = data.failqty === 0 ? true : false;
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
const getTableData = async (datas: EmptyObjectType) => {
	datas.config.loading = true;
	let res = null;
	const form = datas.form;
	if (activeName.value === 'first') {
		let data = {
			repairReceiveNo: form.repairReceiveNo,
			repairNo: form.repairNo,
			page: datas.page,
		};
		res = await getQueryCheckableRepairReceiveHeadApi(data);
		res.data.data.forEach((item: any) => {
			item.creator = `${item.creator} / ${item.receiverName}`;
		});
	} else {
		let data = {
			...form,
			page: datas.page,
			createTime: form.createTime,
			startCreateTime: form.createTime && form.createTime[0],
			endCreateTime: form.createTime && form.createTime[1],
		};
		delete data.createTime;
		res = await getQueryRepairCheckRecordApi(data);
		res.data.data.forEach((item: any) => {
			item.receiver = `${item.receiver} / ${item.receiverName}`;
		});
	}

	datas.data = res!.data.data;
	datas.config.total = res!.data.total;
	if (res!.status) {
		datas.config.loading = false;
	}
};
// input框里面的数据
const inputHandleChange: UploadProps['onChange'] = async (uploadFile) => {
	dialogState.tableData.form['accepReportUrl'] = uploadFile.name;
	inputuploadForm.value = uploadFile;
	const res = await getUploadFileApi(3, inputuploadForm.value.raw);
	dialogState.tableData.form['fileUrl'] = res.data;
	res.status && ElMessage.success(`上傳成功`);
};
//可以在选中时自动替换上一个文件
const inputHandleExceed: UploadProps['onExceed'] = (files) => {
	inputuploadRefs.value!.clearFiles();
	const file = files[0] as UploadRawFile;
	file.uid = genFileId();
	inputuploadRefs.value!.handleStart(file);
};
// 清空文件
const onClearFile = () => {
	if (!dialogState.tableData.form['fileUrl'] && !dialogState.tableData.form['accepReportUrl']) {
		ElMessage.warning(t('沒有清空內容，請選擇文件'));
	} else {
		dialogState.tableData.form['fileUrl'] = '';
		dialogState.tableData.form['accepReportUrl'] = '';
		ElMessage.success(t('清空成功'));
	}
};
// 查看上传的文件
const lookUpload = () => {
	const url = dialogState.tableData.form['fileUrl'];
	if (url) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${url}`, '_blank');
	} else {
		ElMessage.warning(t('沒有驗收報告'));
	}
};
//删除
const onDelRow = (row: EmptyObjectType, i: number) => {
	dialogState.tableData.data.splice(i, 1);
};
// 點擊第二個頁面詳情彈窗按鈕
const openSecondDetailDialog = async (scope: EmptyObjectType) => {
	dilogTitle.value = '詳情';
	maintenanceCheckDialogVisible.value = true;
	changeStatus(header2.value, 300, false);
	const res = await getRepairCheckRecordDetailApi(scope.row.repairCheckNo);
	if (res.status) {
		dialogState.tableData.form['describe1'] = res.data.describe;
		dialogState.tableData.form['fileUrl'] = res.data.accepReportUrl;
		dialogState.tableData.data = res.data.details;
		dialogState.tableData.config.loading = false;
	}
};
// 点击验收按钮
const openArriveJobDialog = async (scope: EmptyObjectType) => {
	dialogState.tableData.form = scope.row;
	getDetailData(scope.row.repairReceiveNo);
	isSureDisabled.value = true;
	dilogTitle.value = '驗收';
	changeStatus(header.value, 300, true);
	// 获取验收不合格原因
	let res1 = await getExitReasonApi('CheckFail');
	dialogState.tableData.header[7].options = res1.data.map((item: any) => {
		return { value: item.runid, label: item.dataname };
	});
};
// 点击收货单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'repairReceiveNo') {
		dilogTitle.value = '收貨單號:' + row.repairReceiveNo;
		getDetailData(row.repairReceiveNo);
		changeStatus(header1.value, 300, false);
	}
};
// 详情接口
const getDetailData = async (data: string) => {
	dialogState.tableData.config.loading = true;
	maintenanceCheckDialogVisible.value = true;
	const res = await getRepariReceiveDetailsForCheckApi(data);
	dialogState.tableData.form = res.data.head;
	dialogState.tableData.data = res.data.details;
	dialogState.tableData.data.forEach((item) => {
		item.checkQty = item.receiptQty;
	});
	if (res.status) {
		dialogState.tableData.config.loading = false;
		isSureDisabled.value = false;
	} else {
		isSureDisabled.value = true;
	}
};
// 根据弹出窗不一样展现的配置不一样
const changeStatus = (header: EmptyArrayType, height: number, isShow: boolean) => {
	loadingBtn.value = false;
	let tableData = dialogState.tableData;
	let config = tableData.config;
	tableData.header = header;
	config.height = height;
	// config.isOperate = isShow;
	config.isInlineEditing = isShow;
};
// 提交
const onSubmit = async (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格項必填未填'));
		let allData: EmptyObjectType = {};
		const form = dialogState.tableData.form;
		allData = { repairReceiveNo: form.repairReceiveNo, accepReportUrl: form.fileUrl || '', headDescribe: form.describe1 || '' };
		let data = dialogState.tableData.data;
		data = data.map((item) => {
			return {
				repairReceiveDetailId: item.repairReceiveDetailId,
				// checkQty: item.checkQty,
				passQty: item.passQty,
				checkDate: item.checkDate,
				failReasonIds: item.failReasonIds,
			};
		});
		allData['details'] = data;
		loadingBtn.value = true;
		// console.log(allData);
		const res = await getCheckApi(allData);
		if (res.status) {
			ElMessage.success(t('驗收成功'));
			maintenanceCheckDialogVisible.value = false;
			getTableData(state.tableData);
		}
		loadingBtn.value = false;
	});
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType, tableData: EmptyObjectType) => {
	tableData.form = Object.assign({}, tableData.form, { ...data });
	tableRef.value?.pageReset();
};

// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType, tableData: EmptyObjectType) => {
	tableData.page.pageNum = page.pageNum;
	tableData.page.pageSize = page.pageSize;
	getTableData(tableData);
};
// 拖动显示列排序回调
const onSortHeader = (data: TableHeaderType[], tableData: EmptyObjectType) => {
	tableData.header = data;
};
if (dialogState.tableData.btnConfig)
	dialogState.tableData.btnConfig[0].disabled = computed(() => {
		return dialogState.tableData.data.length <= 1 ? true : false;
	});
// 页面加载时
onMounted(() => {
	getTableData(state.tableData);
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
		width: 100px;
	}
}
.up-file {
	display: flex;
	span {
		width: 122px;
		// align-items: center;
		line-height: 30px;
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
