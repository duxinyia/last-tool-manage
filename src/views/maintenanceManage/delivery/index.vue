<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="維修單收貨" name="first">
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
				@pageChange="(page) => onTablePageChange(page, state.tableData)"
				@sortHeader="(data) => onSortHeader(data, state.tableData)"
				@cellclick="reqNoClick"
				:cellStyle="cellStyle"
				@onOpenOtherDialog="openArriveJobDialog"
			/>
		</el-tab-pane>
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="收貨記錄" name="second">
			<TableSearch
				:search="secondState.tableData.search"
				@search="(data) => onSearch(data, secondState.tableData)"
				:searchConfig="secondState.tableData.searchConfig"
				labelWidth="90px"
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
		<el-dialog draggable :close-on-click-modal="false" v-model="deliveryDialogVisible" :title="dilogTitle" width="65%" destroy-on-close>
			<el-row v-if="dilogTitle == '收貨'">
				<el-col :xs="24" :sm="12" :md="11" :lg="11" :xl="11" class="mb10" v-for="(val, key) in dialogState.tableData.search" :key="key">
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
							placeholder="請選擇"
							style="height: 30px; max-width: 167px"
						/>
					</div>
					<div v-if="val.type === 'select'">
						<span v-if="val.isRequired" class="color-danger mr5">*</span>
						<span style="width: 96px" class="mr10">{{ val.label }}</span>
						<el-select
							size="default"
							v-model="dialogState.tableData.form[val.prop]"
							filterable
							remote
							:reserve-keyword="false"
							placeholder="請選擇工程驗收人"
							remote-show-suffix
							:remote-method="selectChange"
							:loading="loading"
						>
							<el-option v-for="item in val.options" :key="item.label" :label="item.value" :value="item.value"
								><span style="float: left">{{ item.label }}</span>
								<span style="float: right; color: var(--el-text-color-secondary)">{{ item.value }}</span>
							</el-option>
						</el-select>
					</div>
				</el-col>
			</el-row>
			<el-form ref="tableFormRef" :model="dialogState.tableData" size="default">
				<Table
					v-bind="dialogState.tableData"
					class="table"
					@delRow="onDelRow"
					@handleNumberInputChange="changeInput"
					:cellStyle="cellStyle"
					@selectionChange="onSelectionChange"
				/>
			</el-form>
			<div class="describe" v-if="dilogTitle == '收貨' || dilogTitle == '詳情'">
				<span>備註：</span>
				<el-input
					v-if="dilogTitle == '收貨'"
					class="input-textarea"
					show-word-limit
					v-model="dialogState.tableData.form['headDescribe']"
					type="textarea"
					placeholder="請輸入"
					maxlength="150"
				></el-input>
				<span v-else style="color: #1890ff; font-weight: 700; width: 100%">{{ dialogState.tableData.form['headDescribe'] }}</span>
			</div>
			<!-- 上傳文件優化 -->
			<div class="describe" v-if="dilogTitle == '收貨'">
				<span>附件：</span>
				<el-upload
					style="width: 100%"
					v-model:file-list="file"
					:auto-upload="false"
					ref="inputuploadRefs"
					action="#"
					class="upload"
					drag
					:limit="1"
					:show-file-list="false"
					:on-exceed="inputHandleExceed"
					:on-change="inputHandleChange"
				>
					<el-input v-model="attachmentName" :placeholder="$t('點擊選擇附件')" :readonly="true" :suffix-icon="FolderOpened">
						<template #append v-if="attachmentName">
							<text class="look-file mr10" @click.stop="clearUpload">清空文件</text>
							<text class="look-file" @click.stop="lookUpload">查看文件</text>
						</template>
						>
					</el-input>
				</el-upload>
			</div>
			<el-button class="mt5" v-if="dilogTitle == '詳情'" size="default" type="success" auto-insert-space @click="lookAttachments">
				查看附件
			</el-button>
			<template #footer>
				<span class="dialog-footer" v-if="dilogTitle == '收貨'">
					<el-button size="default" auto-insert-space @click="deliveryDialogVisible = false">取消</el-button>
					<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)" :loading="loadingBtn"> 確定 </el-button>
				</span>
			</template>
		</el-dialog>
		<!-- 上传进度条弹窗 -->
		<el-dialog v-model="showProgress" title="上傳進度" width="30%" :close-on-click-modal="false" :modal="false" :show-close="false">
			<div>
				<div>
					<!-- 进度条百分比 -->
					<el-progress :percentage="uploadPercentage" :format="format" max="100"></el-progress>
				</div>
			</div>
		</el-dialog>
	</el-tabs>
</template>

<script setup lang="ts" name="/requistManage/arriveJob">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch } from 'vue';
import { FolderOpened } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, FormInstance, genFileId, TabsPaneContext, UploadInstance, UploadProps, UploadRawFile } from 'element-plus';
import { getEngieerGroupApi, getOperAttachmentApi, getUploadFileApi } from '/@/api/global/index';
const deliveryDialogVisible = ref(false);
// 引入接口
import {
	getQueryReceivableRepairOrdersApi,
	getRepariDetailsForReceiveApi,
	getReceiveApi,
	getQueryRepairReceiveRecordApi,
	getRepairReceiveRecordDetailApi,
} from '/@/api/maintenanceManage/delivery';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const loading = ref(false);
const loadingBtn = ref(false);
const attachmentName = ref('');
const inputuploadRefs = ref<UploadInstance>();
const file = ref();
// 弹窗标题
const dilogTitle = ref();
import { useRoute } from 'vue-router';
const route = useRoute();
const activeName = ref<string | number>((route.query.page as string) || 'first');
const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	getTableData(activeName.value === 'first' ? state.tableData : secondState.tableData);
};
const header = ref<deliveryDialogHeader>([
	{ key: 'matNo', colWidth: '250', title: 'message.pages.matNo', type: 'text', isCheck: true },
	{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
	// { key: 'machinetype', colWidth: '', title: '机种', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	// { key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	// { key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
	// { key: 'vendorName', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
	{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'text', isCheck: true },
	{ key: 'qty', colWidth: '', title: '維修數量', type: 'text', isCheck: true },
	{ key: 'pendingReceiptQty', colWidth: '', title: '可收貨數量', type: 'text', isCheck: true },
	{ key: 'reason', colWidth: '', title: '維修原因', type: 'text', isCheck: true },
	{ key: 'receiptQty', colWidth: '100', title: '收貨數量', type: 'number', isCheck: true, min: 1, isRequired: true },
	{ key: 'receiptDate', colWidth: '150', title: '收貨時間', type: 'time', isCheck: true, isRequired: true, isdisabledDate: true },
]);
const header1 = ref<deliveryDialogHeader>([
	{
		key: 'matNo',
		colWidth: '250',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	// { key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
	// { key: 'vendorName', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
	{ key: 'qty', colWidth: '', title: '維修數量', type: 'text', isCheck: true },
	{ key: 'reason', colWidth: '150', title: '維修原因', type: 'text', isCheck: true },
	{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'text', isCheck: true },
]);
const header2 = ref<deliveryDialogHeader>([
	{
		key: 'matNo',
		colWidth: '250',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'nowreceiptQty', colWidth: '', title: '本次收貨數量', type: 'text', isCheck: true },
	{ key: 'receiptDate', colWidth: '150', title: '收貨日期', type: 'text', isCheck: true },
	{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'text', isCheck: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR單號', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '提報人', type: 'text', isCheck: true },
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
			{ label: 'PR單號', prop: 'prNo', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '收貨', color: '#e6a23c', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			repairNo: '',
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
			{ key: 'repairReceiveNo', colWidth: '', title: '收貨單號', type: 'text', isCheck: true },
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR單號', type: 'text', isCheck: true },
			{ key: 'receiptTime', colWidth: '', title: '收貨時間', type: 'text', isCheck: true },
			{ key: 'engineer', colWidth: '', title: '工程驗收人', type: 'text', isCheck: true },
			{ key: 'isChecked', colWidth: '120', title: '是否已驗收', type: 'text', isCheck: true },
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
			{ label: '收貨單號', prop: 'repairReceiveNo', required: false, type: 'input' },
			{ label: 'PR單號', prop: 'prNo', required: false, type: 'input' },
			{ label: '工程驗收人', prop: 'engineer', required: false, type: 'input' },
			{
				label: '是否已驗收',
				prop: 'isChecked',
				required: false,
				clearable: false,
				type: 'select',
				placeholder: '',
				options: [
					{ value: true, label: '是', text: '是' },
					{ value: false, label: '否', text: '否' },
				],
			},
			{ label: '收貨日期', prop: 'receiveDate', required: false, type: 'dateRange' },
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
			isSelection: true, // 是否显示表格多选
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
			{ label: '收貨單號', prop: 'sendNo', required: false, type: 'text' },
			{ label: '維修單號', prop: 'repairNo', required: false, type: 'text' },
			{ label: 'PR單號', prop: 'prNo', required: false, type: 'text' },
			{ label: '工程驗收人', prop: 'engineer', required: false, type: 'select', options: [], placeholder: '', isRequired: true },
			// { label: '收货时间', prop: 'sendTime', required: false, type: 'time', isRequired: true },
		],
		btnConfig: [],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// 上传百分比
const uploadPercentage = ref(0);
watch(
	() => uploadPercentage.value,
	() => {
		if (uploadPercentage.value >= 90) clearInterval(times!);
	},
	{
		deep: true,
	}
);
// 改變文件
const inputHandleExceed: UploadProps['onExceed'] = (files) => {
	let inputRef = inputuploadRefs.value;
	inputRef!.clearFiles();
	const file = files[0] as UploadRawFile;
	file.uid = genFileId();
	inputRef!.handleStart(file);
};
// 文件input框里面的数据
const inputHandleChange: UploadProps['onChange'] = (uploadFile) => {
	attachmentName.value = uploadFile.name;
	getFileData(uploadFile.raw);
};
const showProgress = ref(false);
// 格式化进度，使用百分比进行展示
const format = (percentage: any) => `${percentage}%`;
let times = null;
const getFileData = async (uploadFileRaw: UploadRawFile | undefined) => {
	// 打开进度条弹窗
	showProgress.value = true;
	uploadPercentage.value = 0;
	times = setInterval(() => {
		uploadPercentage.value = (uploadPercentage.value % 100) + 10;
	}, 1000);

	const res = await getUploadFileApi(6, uploadFileRaw);
	if (res.status) {
		uploadPercentage.value = 100;
		ElMessage.success(`上傳成功`);
		dialogState.tableData.form['attachmentUrl'] = res.data;
		showProgress.value = false;
	} else {
		attachmentName.value = '';
		file.value = [];
		dialogState.tableData.form['attachmentUrl'] = '';
		showProgress.value = false;
	}
};
// 查看上传的文件
const lookUpload = () => {
	if (dialogState.tableData.form['attachmentUrl']) {
		window.open(
			`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${
				dialogState.tableData.form['attachmentUrl']
			}`,
			'_blank'
		);
	} else {
		ElMessage.warning(`暫無附件`);
	}
};
// 清除文件
const clearUpload = () => {
	ElMessageBox.confirm('確定清除文件嗎?', '提示', {
		confirmButtonText: '確 定',
		cancelButtonText: '取 消',
		type: 'warning',
		draggable: true,
	})
		.then(async () => {
			attachmentName.value = '';
			file.value = [];
			dialogState.tableData.form['attachmentUrl'] = '';
			ElMessage.success(`清空文件成功`);
		})
		.catch(() => {});
};
// 查看附件
const lookAttachments = async () => {
	const res = await getOperAttachmentApi(13, detailRows.repairReceiveNo);
	if (res.status) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${res.data}`, '_blank');
	}
};
const selectList = ref([] as EmptyObjectType[]);
// 控制收货数量<=可收货数量
const changeInput = (val: number, i: number) => {
	const data = dialogState.tableData.data[i];
	data.receiptQtymin = 1;
	data.receiptQtymax = data.pendingReceiptQty;
	if (data.receiptQty > data.pendingReceiptQty) {
		data.receiptQty = data.pendingReceiptQty;
	}
};
// 单元格字体颜色
const cellStyle = ({ column }: EmptyObjectType) => {
	const property = column.property;
	if (property === 'repairNo') {
		return { color: 'var(--el-color-primary)', cursor: 'pointer' };
	} else if (property === 'pendingReceiptQty') {
		return { color: 'red' };
	}
};
// 只有一行数据不允许删除
// if (dialogState.tableData.btnConfig)
// 	dialogState.tableData.btnConfig[0].disabled = computed(() => {
// 		return dialogState.tableData.data.length <= 1 ? true : false;
// 	});
// 初始化列表数据
const getTableData = async (datas: EmptyObjectType) => {
	datas.config.loading = true;
	let res = null;
	const form = datas.form;
	if (activeName.value === 'first') {
		let data = {
			repairNo: form.repairNo,
			prNo: form.prNo,
			page: datas.page,
		};
		res = await getQueryReceivableRepairOrdersApi(data);
	} else {
		if (form.isChecked === '') form.isChecked = null;
		let data = {
			...form,
			page: datas.page,
			receiveDate: form.receiveDate,
			startReceiveTime: form.receiveDate && form.receiveDate[0],
			endReceiveTime: form.receiveDate && form.receiveDate[1],
		};
		delete data.receiveDate;
		res = await getQueryRepairReceiveRecordApi(data);
		res.data.data.forEach((item: any) => {
			item.isChecked = item.isChecked ? '是' : '否';
			item.engineer = `${item.engineer} / ${item.engineerName}`;
		});
	}
	datas.data = res!.data.data;
	datas.config.total = res!.data.total;
	if (res!.status) {
		datas.config.loading = false;
	}
};
// 搜索下拉选择
const selectChange = (query: string) => {
	if (query) {
		loading.value = true;
		setTimeout(async () => {
			const res = await getEngieerGroupApi(query);
			loading.value = false;
			let options = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.userid}`, label: `${item.username}` };
			});
			dialogState.tableData.search.forEach((item) => {
				if (item.prop === 'engineer') {
					item.options = options.filter((item: EmptyObjectType) => {
						return item.label.toLowerCase().includes(query.toLowerCase()) || item.value.toLowerCase().includes(query.toLowerCase());
					});
				}
			});
		}, 500);
	} else {
		dialogState.tableData.search.forEach((item) => {
			if (item.prop === 'engineer') {
				item.options = [];
			}
		});
	}
};
//删除一行
const onDelRow = (row: EmptyObjectType, i: number) => {
	dialogState.tableData.data.splice(i, 1);
};
// 点击收货弹窗
const openArriveJobDialog = (scope: EmptyObjectType) => {
	dialogState.tableData.form = scope.row;
	dialogState.tableData.form['headDescribe'] = '';
	getDetailData(scope.row.repairNo);
	dilogTitle.value = '收貨';
	changeStatus(header.value, 300, true);
	selectList.value = [];
};
// 点击申请单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'repairNo') {
		dilogTitle.value = '維修單號:' + row.repairNo;
		changeStatus(header1.value, 500, false);
		// let data = { repairNo: row.repairNo };
		getDetailData(row.repairNo);
	}
};
// 點擊第二個頁面詳情彈窗按鈕
let detailRows: EmptyObjectType = {};
const openSecondDetailDialog = async (scope: EmptyObjectType) => {
	dilogTitle.value = '詳情';
	changeStatus(header2.value, 400, false);
	detailRows = scope.row;
	const res = await getRepairReceiveRecordDetailApi(scope.row.repairReceiveNo);
	if (res.status) {
		dialogState.tableData.form['headDescribe'] = res.data.describe;
		res.data.details.forEach((item: any) => {
			item.nowreceiptQty = item.receiptQty;
			delete item.receiptQty;
		});
		dialogState.tableData.data = res.data.details;
		deliveryDialogVisible.value = true;
		dialogState.tableData.config.loading = false;
	}
};
// 详情接口
const getDetailData = async (data: string) => {
	const res = await getRepariDetailsForReceiveApi(data);
	dialogState.tableData.data = res.data.details;
	deliveryDialogVisible.value = true;
	if (res.status) {
		dialogState.tableData.config.loading = false;
	}
};
// 根据弹出窗不一样展现的配置不一样
const changeStatus = (header: EmptyArrayType, height: number, isShow: boolean) => {
	let tableData = dialogState.tableData;
	let config = tableData.config;
	loadingBtn.value = false;
	tableData.header = header;
	config.height = height;
	config.isSelection = isShow;
	config.isInlineEditing = isShow;
};
let validateFieldList: EmptyArrayType = [];
// 選中行
const onSelectionChange = (selectlist: EmptyArrayType) => {
	selectList.value = selectlist;
	validateFieldList = [];
	dialogState.tableData.data.forEach((item: any, index: number) => {
		selectlist.forEach((list) => {
			if (item.matNo === list.matNo) {
				validateFieldList.push(`data.${index}.receiptQty`);
				validateFieldList.push(`data.${index}.receiptDate`);
			} else {
				tableFormRef.value.clearValidate(`data.${index}.receiptQty`);
				tableFormRef.value.clearValidate(`data.${index}.receiptDate`);
			}
		});
	});
};

// 提交
const onSubmit = async (formEl: EmptyObjectType | undefined) => {
	if (!dialogState.tableData.form['engineer']) return ElMessage.warning(t('請選擇工程驗收人'));
	let data = selectList.value;
	if (data.length <= 0) return ElMessage.warning(t('請選擇要收貨的數據'));
	if (!formEl) return;
	formEl.validateField(validateFieldList, async (errorMessage: any) => {
		if (errorMessage) {
			// 验证失败
			let allData: EmptyObjectType = {};
			allData = { ...dialogState.tableData.form };
			let data = selectList.value;
			if (data.length <= 0) return ElMessage.warning(t('請選擇要收貨的數據'));
			data = data.map((item) => {
				return {
					repairDetailId: item.repairDetailId,
					receiptQty: item.receiptQty,
					receiptDate: item.receiptDate,
				};
			});
			allData['details'] = data;
			// console.log(allData);
			loadingBtn.value = true;
			const res = await getReceiveApi(allData);
			if (res.status) {
				ElMessage.success(t('收貨成功'));
				deliveryDialogVisible.value = false;
				getTableData(state.tableData);
			}
			loadingBtn.value = false;
		} else {
			// 验证成功
			ElMessage.warning(t('表格項必填未填'));
		}
	});

	// if (!valid) return ElMessage.warning(t('表格項必填未填'));
	// if (!dialogState.tableData.form['engineer']) return ElMessage.warning(t('請選擇工程驗收人'));
	// let allData: EmptyObjectType = {};
	// allData = { ...dialogState.tableData.form };
	// let data = selectList.value;
	// if (data.length <= 0) return ElMessage.warning(t('請選擇要收貨的數據'));
	// // let isValid = true;
	// // data.forEach((item) => {
	// // 	if (!item.receiptQty || !item.receiptDate) {
	// // 		isValid = false;
	// // 	}
	// // });
	// // if (!isValid) return ElMessage.warning(t('選中的表格項必填未填'));
	// data = data.map((item) => {
	// 	return {
	// 		repairDetailId: item.repairDetailId,
	// 		receiptQty: item.receiptQty,
	// 		receiptDate: item.receiptDate,
	// 	};
	// });
	// allData['details'] = data;
	// console.log(allData);
	// loadingBtn.value = true;
	// // const res = await getReceiveApi(allData);
	// // if (res.status) {
	// // 	ElMessage.success(t('收貨成功'));
	// // 	deliveryDialogVisible.value = false;
	// // 	getTableData(state.tableData);
	// // }
	// loadingBtn.value = false;
	// });
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

// 页面加载时
onMounted(() => {
	getTableData(activeName.value === 'first' ? state.tableData : secondState.tableData);
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
		width: 50px;
	}
}
:deep(.el-upload-dragger) {
	border: 0;
	padding: 0;
	background-color: transparent;
	border-radius: unset;
}
.look-file {
	color: var(--el-color-primary) !important;
}
</style>
