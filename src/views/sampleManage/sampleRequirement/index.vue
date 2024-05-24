<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="採購送樣" name="first">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" labelWidth=" " />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@sortHeader="onSortHeader"
				@cellclick="reqNoClick"
				:cellStyle="cellStyle"
				@onOpenOtherDialog="openArriveJobDialog"
				@pageChange="onTablePageChange"
			/>
		</el-tab-pane>
		<el-tab-pane label="採購送樣記錄" name="second" class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="secondState.tableData.search" @search="onSearch2" :searchConfig="secondState.tableData.searchConfig" labelWidth="70px" />
			<Table
				ref="tableRef2"
				v-bind="secondState.tableData"
				class="table"
				@sortHeader="onSortHeader"
				@pageChange="onTablePageChange"
				@onOpenOtherDialog="openArriveJobDialog"
			/>
		</el-tab-pane>
		<el-dialog
			draggable
			:close-on-click-modal="false"
			v-model="deliveryDialogVisible"
			:title="dilogTitle"
			:width="dilogTitle == '料號送樣' ? '60%' : '87%'"
		>
			<el-row>
				<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb15" v-for="(val, key) in dialogState.tableData.search" :key="key">
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
					</div>
					<div v-if="val.type === 'button' && !val.isCheck">
						<el-button class="buttonBorder" type="primary" size="default" @click="downLoadFile(val.prop)"
							><el-icon><ele-Download /></el-icon>{{ val.label }}
						</el-button>
					</div>
				</el-col>
			</el-row>

			<el-form ref="tableFormRef" :model="dialogState.tableData" size="default">
				<Table
					ref="dialogTableRef"
					v-bind="dialogState.tableData"
					class="table"
					@delRow="onDelRow"
					@addrow="onAddrow"
					@handleNumberInputChange="changeInput"
					:cellStyle="cellStyle"
					:headerCellStyle="cellStyle"
				>
					<template #topOptions>
						<el-select
							style="width: 500px"
							:clearable="true"
							v-model="dialogSelect"
							:filterable="true"
							placeholder="請輸入廠商代碼或者廠商名稱進行搜索增加"
							remote
							:reserve-keyword="false"
							@change="changeSelect"
							remote-show-suffix
							:remote-method="remoteMethod"
							:loading="loading"
						>
							<template v-if="dialogSelectOption">
								<el-option v-for="i in dialogSelectOption" :key="i.label" :label="i.label" :value="i.value" />
							</template>
						</el-select>
					</template>
				</Table>
			</el-form>
			<!-- 上傳文件優化 -->
			<div class="describe" v-if="dilogType == 'sendReceive'">
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
					<el-input
						v-model="dialogState.tableData.form['attachmentUrl']"
						:placeholder="$t('點擊選擇附件')"
						:readonly="true"
						:suffix-icon="FolderOpened"
					>
						<template #append v-if="dialogState.tableData.form['attachmentUrl']">
							<text class="look-file mr10" @click.stop="clearUpload">清空文件</text>
							<text class="look-file" @click.stop="lookUpload">查看文件</text>
						</template>
						>
					</el-input>
				</el-upload>
			</div>
			<template #footer v-if="dilogTitle == '料號送樣'">
				<span class="dialog-footer">
					<el-button size="default" auto-insert-space @click="deliveryDialogVisible = false">取 消</el-button>
					<el-button size="default" type="success" auto-insert-space @click="onSubmit(tableFormRef, 1)" :loading="loadingSaveBtn"> 保 存 </el-button>
					<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef, 2)" :loading="loadingBtn"> 提 交 </el-button>
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

<script setup lang="ts" name="sampleRequirement">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox, FormInstance, genFileId, TabsPaneContext, UploadInstance, UploadProps, UploadRawFile } from 'element-plus';
import { FolderOpened } from '@element-plus/icons-vue';
const deliveryDialogVisible = ref(false);
import {
	getQuerySampleNeedsApi,
	getQueryTakeSampleApi,
	getSampleDetailProgressApi,
	getSampleDetailsForTakeSampleApi,
	getVendorsApi,
} from '/@/api/partno/sampleRequirement';
// 送样
import { getTakeSampleApi, getSaveTakeSampleApi, getSubmitTaskSampleApi } from '/@/api/partno/sampleDelivery';
import { useI18n } from 'vue-i18n';
import { getOperAttachmentApi, getUploadFileApi } from '/@/api/global';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const tableRef2 = ref<RefType>();
const loadingBtn = ref(false);
const loadingSaveBtn = ref(false);
const dialogTableRef = ref<RefType>();
const dialogSelect = ref();
const dialogSelectOption = ref();
const loading = ref(false);
// 单元格样式
const cellStyle = ref();
// 弹窗标题
const dilogTitle = ref();
const inputuploadRefs = ref<UploadInstance>();
const file = ref();
const activeName = ref<string | number>('first');
const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	activeName.value === 'first' ? 0 : 1;
	getTableData();
};
const header = ref<deliveryDialogHeader>([
	{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'input', isCheck: true, isRequired: true, sampleType: 'input' },
	{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'input', isCheck: true, isRequired: true, sampleType: 'input' },
	{ key: 'needsQty', colWidth: '120', title: '數量', type: 'number', isCheck: true, isRequired: true, sampleType: 'number' },
	{ key: 'describe', colWidth: '', title: '備註', type: 'textarea', isCheck: true, isRequired: false, sampleType: 'textarea' },
]);
const header1 = ref<deliveryDialogHeader>([
	{ key: 'status', colWidth: '', title: '狀態', type: 'text', isCheck: true, isRequired: false },
	{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true, isRequired: false },
	{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true, isRequired: false },
	{ key: 'needsQty', colWidth: '', title: '數量', type: 'text', isCheck: true, isRequired: false },
	{ key: 'describe', colWidth: '', title: '採購備註', type: 'text', isCheck: true, isRequired: false },
	{ key: 'receiveSubmitTime', colWidth: '', title: '收貨提交時間', type: 'text', isCheck: true, isRequired: false },
	{ key: 'engineer', colWidth: '', title: '工程驗收人', type: 'text', isCheck: true, isRequired: false },
	{ key: 'checkSubmitTime', colWidth: '', title: '驗收提交時間', type: 'text', isCheck: true, isRequired: false },
	{ key: 'ispass', colWidth: '', title: '是否驗收通過', type: 'text', isCheck: true, isRequired: false },
	{ key: 'dispatchTime', colWidth: '', title: '發料時間', type: 'text', isCheck: true, isRequired: false },
	{ key: 'receiveStorageType', colWidth: '', title: '領用倉庫類型', type: 'text', isCheck: true, isRequired: false },
	{ key: 'receiveSLocation', colWidth: '', title: '領用倉庫位置', type: 'text', isCheck: true, isRequired: false },
	{ key: 'putStorageTime', colWidth: '', title: '入庫時間', type: 'text', isCheck: true, isRequired: false },
	{ key: 'putStorageOperator', colWidth: '', title: '入庫人', type: 'text', isCheck: true, isRequired: false },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matNo', colWidth: '180', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'sampleNo', colWidth: '', title: '送樣單號', type: 'text', isCheck: true },
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
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '送樣單號', prop: 'sampleNo', required: false, type: 'input' },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
			{ label: '需求人', prop: 'needor', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '送樣', color: '#e6a23c', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {},
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
			{ key: 'matNo', colWidth: '200', title: '料號', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'sampleNo', colWidth: '', title: '送樣單號', type: 'text', isCheck: true },
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
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '送樣單號', prop: 'sampleNo', required: false, type: 'input' },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
			{ label: '需求人', prop: 'needor', required: false, type: 'input' },
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
		data: [{ vendorCode: '', vendorName: '' }],
		// 表头内容（必传，注意格式）
		header: [],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: false, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: true, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			isDialogTab: false, //是否是弹窗里面的表格
			height: 500,
			isAddRowBtn: true,
		},
		// 给后端的数据
		form: {},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '送樣單號', prop: 'sampleNo', required: false, type: 'text' },
			{ label: '料號', prop: 'matNo', required: false, type: 'text' },
			{ label: '图纸编号', prop: 'drawNo', required: false, type: 'text' },
			{ label: '品名-英文', prop: 'nameEn', required: false, type: 'text' },
			{ label: '品名-中文', prop: 'nameCh', required: false, type: 'text' },
			// { label: '规格', prop: 'specs', required: false, type: 'text' },
			{ label: '需求數量', prop: 'needsQty', required: false, type: 'text' },
			{ label: '需求時間', prop: 'needsDate', required: false, type: 'text' },
			{ label: '需求人', prop: 'needor', required: false, type: 'text' },
			{ label: '需求人電話', prop: 'needorTel', required: false, type: 'text' },
			{ label: '開單人', prop: 'creator', required: false, type: 'text' },
			{ label: '下載查看圖紙', prop: 'drawPathProp', required: false, type: 'button' },
			{ label: '下載查看3d圖紙', prop: 'draw3dPathProp', required: false, type: 'button' },
			{ label: '送樣需求附件', prop: 'requireAtt', required: false, type: 'button', isCheck: false },
			{ label: '採購送樣附件', prop: 'deliveryAtt', required: false, type: 'button', isCheck: true },
		],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true }],
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
	dialogState.tableData.form['attachmentUrl'] = uploadFile.name;
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
			file.value = [];
			dialogState.tableData.form['attachmentUrl'] = '';
			ElMessage.success(`清空文件成功`);
		})
		.catch(() => {});
};
// 得到下拉框數據
const remoteMethod = async (query: string) => {
	if (query) {
		loading.value = true;
		setTimeout(async () => {
			const res = await getVendorsApi(query);
			loading.value = false;
			dialogSelectOption.value = res.data.map((item: EmptyObjectType) => {
				return { ...item, value: `${item.vendorCode},${item.vendorName}`, label: `廠商代碼：${item.vendorCode}，廠商名稱：${item.vendorName}` };
			});
		}, 500);
	} else {
		dialogSelectOption.value = [];
	}
};
// 下拉框改變
const changeSelect = (val: string) => {
	if (val) {
		const data = val.split(',');
		dialogState.tableData.data.push({
			vendorCode: data[0],
			vendorName: data[1],
			needsQtymin: 1,
			vendorCodedisabled: false,
			vendorNamedisabled: false,
		});
		// dialogSelect.value = '';
		// 新增的时候超过表格了跟着移动
		nextTick(() => {
			dialogTableRef.value.setScrollTop();
		});
	}
};
// 控制收货数量<=可收货数量
const changeInput = (val: number, i: number) => {
	const data = dialogState.tableData.data[i];
	data.receiptQtymin = 0;
	data.receiptQtymax = data.pendingReceiptQty;
	if (data.receiptQty > data.pendingReceiptQty) {
		data.receiptQty = data.pendingReceiptQty;
	}
};
// 单元格字体颜色
const changeToStyle = (indList: number[]) => {
	return ({ columnIndex, column }: any) => {
		for (let j = 0; j < indList.length; j++) {
			let ind = indList[j];
			if (columnIndex === ind && column.property === 'repairNo') {
				return { color: 'var(--el-color-primary)', cursor: 'pointer' };
			} else if (column.property === 'pendingReceiptQty') {
				return { color: 'red' };
			}
		}
		const col = ['describe', 'engineer', 'ispass', 'receiveSLocation'];
		if (col.includes(column.property) && activeName.value !== 'first') {
			return { borderRight: '1px solid #a2d2ff' };
		}
	};
};
cellStyle.value = changeToStyle([1, 7]);
// 初始化列表数据
const getTableData = async () => {
	if (activeName.value === 'first') {
		state.tableData.config.loading = true;
		const form = state.tableData.form;
		const data = { ...form, page: state.tableData.page, isQueryCurUser: 0 };
		const res = await getQuerySampleNeedsApi(data);
		res.data.data.forEach((item: any) => {
			item.creator = item.creatorName ? item.creator + ' / ' + item.creatorName : item.creator;
		});
		state.tableData.data = res.data.data;
		state.tableData.config.total = res.data.total;
		if (res.status) {
			state.tableData.config.loading = false;
		}
	} else {
		secondState.tableData.config.loading = true;
		const form2 = secondState.tableData.form;
		const data = { ...form2, page: secondState.tableData.page };
		const res = await getQueryTakeSampleApi(data);
		secondState.tableData.data = res.data.data;
		secondState.tableData.config.total = res.data.total;
		if (res.status) {
			secondState.tableData.config.loading = false;
		}
	}
};
//删除一行
const onDelRow = (row: EmptyObjectType, i: number) => {
	// if (row.runId) {
	// 	ElMessage.error(t('不能刪除已有的廠商信息'));
	// } else {
	dialogState.tableData.data.splice(i, 1);
	// }
};
// 增加一行
const onAddrow = () => {
	dialogState.tableData.data.push({ needsQtymin: 1, vendorCodedisabled: false, vendorNamedisabled: false });
	// 新增的时候超过表格了跟着移动
	nextTick(() => {
		dialogTableRef.value.setScrollTop();
	});
};
// 点击送样按钮弹窗  點擊查看詳情彈窗
let dilogType = ref('');
let dialogScope: EmptyObjectType = {};
const openArriveJobDialog = async (scope: EmptyObjectType, type: string) => {
	loadingBtn.value = false;
	dilogType.value = type;
	dialogScope = scope;
	dialogState.tableData.search[13].isCheck = type === 'sendReceive' ? true : false;
	if (activeName.value === 'first') {
		dialogState.tableData.form['attachmentUrl'] = '';
		file.value = [];
		dialogState.tableData.form['attachmentUrl'] = '';
		const res = await getSampleDetailsForTakeSampleApi(scope.row.sampleNo);
		dialogSelect.value = '';
		res.data.forEach((item: any) => {
			item.vendorCodedisabled = item.isReSubmit === 1 ? true : false;
			item.vendorNamedisabled = item.isReSubmit === 1 ? true : false;
		});
		header.value.forEach((item) => {
			if (item.type === 'text') {
				item.type = item.sampleType;
			}
		});
		dilogTitle.value = '料號送樣';
		changeStatus(header.value, 300, true);
		dialogState.tableData.data = res.data;
	} else {
		const res = await getSampleDetailProgressApi(scope.row.sampleNo);
		// header.value.forEach((item) => {
		// 	item.type = 'text';
		// });
		dilogTitle.value = '詳情';
		changeStatus(header1.value, 400, false);
		dialogState.tableData.data = res.data;
		dialogState.tableData.data.forEach((item) => {
			if (item.ispass) item.ispass = item.ispass === true ? '是' : '否';
			item.engineer = item.engineer ? `${item.engineer} / ${item.engineerName}` : '';
			item.putStorageOperator = item.putStorageOperator ? `${item.putStorageOperator} / ${item.putStorageOperatorName}` : '';
		});
	}
	dialogState.tableData.form = scope.row;
	deliveryDialogVisible.value = true;
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
// 查看图纸
const downLoadFile = async (prop: string) => {
	if (prop === 'drawPathProp' || prop === 'draw3dPathProp') {
		const drawPath = dialogState.tableData.form.drawPath;
		const draw3dPath = dialogState.tableData.form.draw3dPath;
		const drawMap: EmptyObjectType = {
			drawPathProp: drawPath,
			draw3dPathProp: draw3dPath,
		};
		if (drawMap[prop]) {
			window.open(
				`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${drawMap[prop]}`,
				'_blank'
			);
		} else {
			prop === 'drawPathProp' ? ElMessage.warning(t('沒有圖紙')) : ElMessage.warning(t('沒有3d圖紙'));
		}
	} else {
		const res = await getOperAttachmentApi(prop === 'requireAtt' ? 1 : 2, dialogScope.row.sampleNo);
		if (res.status) {
			window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${res.data}`, '_blank');
		}
	}
};
// 点击申请单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	// if (column.property === 'repairNo') {
	// 	dilogTitle.value = '维修单号:' + row.repairNo;
	// 	changeStatus(header1.value, 500, false);
	// 	// let data = { repairNo: row.repairNo };
	// 	getDetailData(row.repairNo);
	// }
};
// 详情接口
const getDetailData = async (data: string) => {
	// const res = await getRepariDetailsForReceiveApi(data);
	// dialogState.tableData.data = res.data.details;
	// deliveryDialogVisible.value = true;
	// if (res.status) {
	// 	dialogState.tableData.config.loading = false;
	// }
};

// 提交
const onSubmit = async (formEl: FormInstance | undefined, type: number) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格項必填未填'));
		let allData: EmptyObjectType = {};
		let form = dialogState.tableData.form;
		allData = { sampleNo: form.sampleNo, matNo: form.matNo, attachmentUrl: form.attachmentUrl };
		let data = dialogState.tableData.data;
		data = data.map((item) => {
			return {
				vendorName: item.vendorName,
				vendorCode: item.vendorCode,
				needsQty: item.needsQty,
				runId: item.isReSubmit ? item.runId : '',
				describe: item.describe,
			};
		});
		allData['vendors'] = data;
		if (allData['vendors'].length <= 0) {
			ElMessage.warning(t('請新增廠商數據'));
		} else if (type === 1) {
			loadingSaveBtn.value = true;
			// console.log(allData);
			const res = await getSaveTakeSampleApi(allData);
			if (res.status) {
				ElMessage.success(t('保存成功'));
				// deliveryDialogVisible.value = false;
				getTableData();
			}
			loadingSaveBtn.value = false;
		} else if (type === 2) {
			ElMessageBox.confirm('確定提交嗎?', '提示', {
				confirmButtonText: '確 定',
				cancelButtonText: '取 消',
				type: 'warning',
				draggable: true,
			})
				.then(async () => {
					await getSaveTakeSampleApi(allData);
					loadingBtn.value = true;
					const res = await getSubmitTaskSampleApi({ sampleNo: form.sampleNo });
					if (res.status) {
						ElMessage.success(t('提交成功'));
						deliveryDialogVisible.value = false;
						getTableData();
					}
					loadingBtn.value = false;
				})
				.catch(() => {});
		}
	});
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
// 拖动显示列排序回调
const onSortHeader = (data: TableHeaderType[]) => {
	if (activeName.value === 'first') {
		state.tableData.header = data;
	} else {
		secondState.tableData.header = data;
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
.describe {
	display: flex;
	align-items: center;
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
.buttonBorder {
	border: 0px !important;
}
:deep(.el-tabs__content) {
	height: 100% !important;
}
:deep(.el-tabs__item) {
	font-weight: 700;
	font-size: 14px;
}
</style>
