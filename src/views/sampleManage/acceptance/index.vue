<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="樣品驗收" name="first">
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
				@onOpenOtherDialog="openAcceptanceDialog"
				:cellStyle="cellStyle"
				@sortHeader="(data) => onSortHeader(data, state.tableData)"
			/>
		</el-tab-pane>
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="驗收記錄" name="second">
			<TableSearch
				:search="secondState.tableData.search"
				@search="(data) => onSearch(data, secondState.tableData)"
				:searchConfig="secondState.tableData.searchConfig"
				labelWidth="70px"
			/>
			<Table
				ref="tableRef"
				v-bind="secondState.tableData"
				class="table"
				@pageChange="(page) => onTablePageChange(page, secondState.tableData)"
				@sortHeader="(data) => onSortHeader(data, secondState.tableData)"
				@onOpenOtherDialog="openDetailDialog"
			/>
		</el-tab-pane>
		<el-dialog draggable :close-on-click-modal="false" v-model="dialogData.dialogVisible" title="驗收" width="70%" destroy-on-close>
			<el-row :gutter="10">
				<el-col
					v-for="item in dialogData.dialogForm"
					:key="item.prop"
					:xs="item.xs || 8"
					:sm="item.sm || 8"
					:md="item.md || 8"
					:lg="item.md || 8"
					:xl="item.xl || 8"
					class="sample-dialog-col mb10"
				>
					<div>
						{{ item.label }}：<span style="color: red" class="ml10">{{ dialogData.formData[item.prop] }}</span>
					</div>
				</el-col>
			</el-row>
			<el-form ref="dialogTableFormRef" :model="dialogState.tableData" size="default">
				<Table
					ref="tableRef2"
					v-bind="dialogState.tableData"
					@delRow="onDelRow"
					class="table-demo"
					@handlestatus1Change="handlestatus1Change"
					@selectionChange="onSelectionChange"
				/>
			</el-form>
			<div class="describe up-file">
				<span>驗收報告：</span>
				<el-upload
					style="width: 100%"
					v-model:file-list="inputfileList"
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
					<el-input style="height: 35px" v-model="dialogData.fileInfo.name" placeholder="請點擊此處上傳文件"> > </el-input>
				</el-upload>
				<el-button size="default" plain @click="onClearFile" type="primary" class="ml10">清空驗收報告</el-button>
				<el-button size="default" plain type="primary" @click="lookUpload">查看驗收報告</el-button>
			</div>
			<div class="describe">
				<span>備註：</span>
				<el-input
					style="width: 130%"
					class="input-textarea"
					show-word-limit
					v-model="dialogData.describe"
					type="textarea"
					placeholder="請輸入備註"
					maxlength="150"
				></el-input>
			</div>
			<template #footer>
				<span class="dialog-footer">
					<el-button @click="dialogData.dialogVisible = false" size="default">取 消</el-button>
					<el-button type="primary" @click="onSubmit(dialogTableFormRef)" size="default" :loading="loadingBtn">確定</el-button>
				</span>
			</template>
		</el-dialog>
		<el-dialog draggable :close-on-click-modal="false" v-model="detaildialogVisible" title="詳情" width="40%"
			><acceptanceDetailDialog :isDialog="true" :checkNoRef="checkNoRef"
		/></el-dialog>
	</el-tabs>
</template>

<script setup lang="ts" name="/partno/acceptance">
import { defineAsyncComponent, reactive, ref, onMounted, watch } from 'vue';
import { getUploadFileApi } from '/@/api/global/index';
import { ElMessage, ElMessageBox, genFileId, TabsPaneContext, UploadRawFile } from 'element-plus';
import { GetCheckTaskApi, SampleCheckApi, GetSampleWaitCheckDetailApi, getQuerySampleCheckRecordApi } from '/@/api/partno/acceptance';
import { getExitReasonApi } from '/@/api/toolsReturn/maintentanceTools';
import { GetSampleDetailApi } from '/@/api/partno/sendReceive';
import { useI18n } from 'vue-i18n';
import type { UploadInstance, UploadProps, UploadUserFile } from 'element-plus';
const acceptanceDetailDialog = defineAsyncComponent(() => import('/@/views/link/acceptanceLink/index.vue'));
// 引入表格组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
// 引入上面的表单组件
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入收货弹窗组件
const Dialog = defineAsyncComponent(() => import('../sampleDelivery/component/dialog.vue'));

// 定义变量内容
const { t } = useI18n();
const detaildialogVisible = ref(false);
const checkNoRef = ref();
const sendReceiveDialogRef = ref();
const loadingBtn = ref(false);
const tableRef = ref<RefType>();
const dialogTableFormRef = ref();
const inputuploadRefs = ref<UploadInstance>();
const inputfileList = ref<UploadUserFile[]>([]);
const inputuploadForm = ref();
const activeName = ref<string | number>('first');
const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	getTableData(activeName.value === 'first' ? state.tableData : secondState.tableData);
};
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matNo', colWidth: '', title: 'message.pages.matNo', type: 'text', isCheck: true },
			{ key: 'sampleNo', colWidth: '', title: 'message.pages.sampleNo', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
			// { key: 'engineer', colWidth: '', title: 'message.pages.engineer', type: 'text', isCheck: true },
			// { key: 'engineerName', colWidth: '', title: 'message.pages.engineerName', type: 'text', isCheck: true },
			{ key: 'needor', colWidth: '', title: '需求人', type: 'text', isCheck: true },
			{ key: 'runStatus', colWidth: '', title: 'message.pages.state', type: 'text', isCheck: true },
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
		},

		btnConfig: [{ type: 'acceptance', name: '驗收', color: '#e6a23c', isSure: false }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '送樣單號', prop: 'sampleNo', placeholder: '請輸入送樣單號', required: false, type: 'input' },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
			{ label: '需求人', prop: 'needor', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
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
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'checkNo', colWidth: '', title: '驗收單號', type: 'text', isCheck: true },
			{ key: 'sampleNo', colWidth: '', title: '送樣單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'receiver', colWidth: '', title: '收貨人', type: 'text', isCheck: true },
			{ key: 'createTime', colWidth: '', title: '提交時間', type: 'text', isCheck: true },
			// { key: 'signStatusStr', colWidth: '', title: '簽核狀態', type: 'text', isCheck: true },
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
			{ label: '送樣單號', prop: 'sampleNo', required: false, type: 'input' },
			{ label: '驗收單號', prop: 'checkNo', required: false, type: 'input' },
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{ label: '收貨人', prop: 'receiver', required: false, type: 'input' },
			{ label: '提交時間', prop: 'createTime', required: false, type: 'dateRange' },
			// {
			// 	label: '簽核狀態',
			// 	prop: 'signStatus',
			// 	required: false,
			// 	clearable: false,
			// 	type: 'select',
			// 	options: [
			// 		{ value: 0, label: '簽核撤回', text: '簽核撤回', selected: false },
			// 		{ value: 1, label: '簽核中', text: '簽核中', selected: false },
			// 		{ value: 2, label: '簽核完成', text: '簽核完成', selected: false },
			// 	],
			// },
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
		header: [
			{ key: 'vendorCode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true },
			{ key: 'vendorName', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true },
			// { key: 'needsTime', colWidth: '', title: '需求送样时间', type: 'text', isCheck: true },
			// { key: 'needsQty', colWidth: '', title: '需求送样数量', type: 'text', isCheck: true },
			{ key: 'sampleTime', colWidth: '', title: '收貨日期', type: 'text', isCheck: true },
			{ key: 'sampleQty', colWidth: '', title: '收貨數量', type: 'text', isCheck: true },
			{ key: 'checkTime', colWidth: '150', title: '驗收時間', type: 'time', isCheck: true, isRequired: true, isdisabledDate: true },
			// { key: 'checkQty', colWidth: '', title: '驗收數量', type: 'input', isCheck: true, isRequired: true },
			{ key: 'isPass', colWidth: '', title: '是否驗收通過', type: 'status1', isCheck: true, isRequired: true },
			{ key: 'failReasonIds', colWidth: '180', title: '驗收失敗原因', type: 'multipleSelect', isCheck: true, options: [] },
			// { key: 'isStorage', colWidth: '', title: '是否入庫', type: 'status1', isCheck: true, isRequired: true },
			{ key: 'isResubmit', colWidth: '', title: '是否重送', type: 'status1', isCheck: true, isRequired: false },
		],
		// 表格配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: false, // 是否显示表格序号
			isSelection: true, // 是否显示表格多选
			isOperate: false, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: true, //是否是行内编辑
			isAddRowBtn: false, //行内编辑时是否有表格上面的新增按钮
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			isDialogTab: true,
			height: 400,
		},
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true, disabled: false }], // 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
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
// 单元格样式
const cellStyle = ref();
const dialogData = reactive<EmptyObjectType>({
	// 点击收货弹窗表格数据
	otherHeaderData: [],
	// 收货弹窗表格顶部数据
	dialogForm: [
		// { type: 'text', label: '驗收單號', prop: 'checkNo', value: '' },
		{ type: 'text', label: '送樣單號', prop: 'sampleNo', value: '' },
		{ type: 'text', label: '料號', prop: 'matNo', value: '' },
		{ type: 'text', label: '驗收人', prop: 'engineerName', value: '', xs: 8, sm: 8, md: 8, lg: 8, xl: 8 },
		{ type: 'text', label: '品名-中文', prop: 'nameCh', value: '' },
		{ type: 'text', label: '品名-英文', prop: 'nameEn', value: '' },
	],
	//
	formData: {},
	//进行送样、收货还是验收操作
	operation: '驗收',
	//弹窗开关
	dialogVisible: false,
	//上传的文件
	fileInfo: {
		name: '',
		drawPath: '',
	},
	describe: '',
});
// watch(
// 	() => dialogState.tableData.data.length,
// 	(newValue) => {
// 		dialogState.tableData.btnConfig![0].disabled = newValue <= 1 ? true : false;
// 	},
// 	{ deep: true }
// );
// 初始化列表数据
const getTableData = async (datas: EmptyObjectType) => {
	datas.config.loading = true;
	const form = datas.form;
	let res = null;
	if (activeName.value === 'first') {
		let data = {
			...form,
			page: datas.page,
		};
		res = await GetCheckTaskApi(data);
	} else {
		let data = {
			...form,
			page: datas.page,
			createTime: form.createTime,
			startCreateTime: form.createTime && form.createTime[0],
			endCreateTime: form.createTime && form.createTime[1],
		};
		delete data.createTime;
		// if (data.signStatus === '') data.signStatus = null;
		res = await getQuerySampleCheckRecordApi(data);
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
//改变是否验收通过
const handlestatus1Change = (value: number, index: number, key: string) => {
	let dataIndex = dialogState.tableData.data[index];
	if (key === 'isPass') {
		if (value === 1) {
			dataIndex.isResubmit = 0;
			dataIndex.isResubmitdisabled = true;
			dataIndex.failReasonIdsdisabled = true;
			dialogState.tableData.data[index].failReasonIds = '';
		} else if (value === 0) {
			dataIndex.isResubmitdisabled = false;
			dataIndex.failReasonIdsdisabled = false;
		}
	}
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

// 打开验收弹窗 1
const openAcceptanceDialog = async (scope: any) => {
	loadingBtn.value = false;
	dialogData.formData = { ...scope.row };
	//清空文件信息
	dialogData.fileInfo = {
		name: '',
		drawPath: '',
	};
	dialogData.dialogVisible = true;

	// let res = {
	// 	status: true,
	// 	code: 0,
	// 	message: 'string',
	// 	data: {
	// 		matNo: 'string',
	// 		sampleNo: 'string',
	// 		nameEn: 'string',
	// 		nameCh: 'string',
	// 		vendorDetails: [
	// 			{
	// 				sampleQty: 0,
	// 				sampleTime: '2023-08-15',
	// 				vendorCode: 'string',
	// 				vendorName: 'string',
	// 				needsTime: '2023-08-15',
	// 				needsQty: 0,
	// 			},
	// 		],
	// 	},
	// };

	const res = await GetSampleWaitCheckDetailApi(scope.row.sampleNo);
	dialogState.tableData.data = res.data.vendorDetails;
	//获取验收失败原因
	let res1 = await getExitReasonApi('CheckFail');
	dialogState.tableData.header[6].options = res1.data.map((item: any) => {
		return { value: item.runid, label: item.dataname };
	});
	dialogState.tableData.data.forEach((item) => {
		if (item.isStorage != 0 || item.isStorage != 1) {
			item.isStorage = 0;
		}
		if (item.isPass != 0 || item.isPass != 1) {
			item.isPass = 0;
		}
	});
};
// 点击查看详情按钮
const openDetailDialog = (scope: EmptyObjectType) => {
	checkNoRef.value = scope.row;
	detaildialogVisible.value = true;
};
//删除表格某一行數據
const onDelRow = (row: EmptyObjectType, i: number) => {
	dialogState.tableData.data.splice(i, 1);
};
//上传文件里面的数据
const inputHandleChange: UploadProps['onChange'] = async (uploadFile, uploadFiles) => {
	dialogData.fileInfo.name = uploadFile.name;
	inputuploadForm.value = uploadFile;
	const res = await getUploadFileApi(4, inputuploadForm.value.raw);
	dialogData.fileInfo['drawPath'] = res.data;
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
const onClearFile = async () => {
	if (!dialogData.fileInfo['drawPath'] && !dialogData.fileInfo.name) {
		ElMessage.warning(t('沒有清空內容，請選擇文件'));
	} else {
		dialogData.fileInfo['drawPath'] = '';
		dialogData.fileInfo.name = '';
		ElMessage.success(t('清空成功'));
	}
};
// 查看上传的文件
const lookUpload = () => {
	const url = dialogData.fileInfo['drawPath'];
	if (url) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${url}`, '_blank');
	} else {
		ElMessage.warning(t('沒有驗收報告'));
	}
};
const selectList = ref([] as EmptyObjectType[]);
let validateFieldList: EmptyArrayType = [];
// 選中行
const onSelectionChange = (selectlist: EmptyArrayType) => {
	console.log(selectlist);
	selectList.value = selectlist;
	validateFieldList = [];
	dialogState.tableData.data.forEach((item: any, index: number) => {
		selectlist.forEach((list) => {
			if (item.runId === list.runId) {
				validateFieldList.push(`data.${index}.checkTime`);
				validateFieldList.push(`data.${index}.checkQty`);
			} else {
				dialogTableFormRef.value.clearValidate(`data.${index}.checkTime`);
				dialogTableFormRef.value.clearValidate(`data.${index}.checkQty`);
			}
		});
	});
};
// 提交
const onSubmit = async (formEl: EmptyObjectType | undefined) => {
	let data = selectList.value;
	if (data.length <= 0) return ElMessage.warning(t('請選擇要驗收的廠商'));
	if (!formEl) return;
	formEl.validateField(validateFieldList, async (errorMessage: any) => {
		if (errorMessage) {
			// 验证失败
			let checkDetails = data.map((item) => {
				return {
					runId: item.runId,
					vendorCode: item.vendorCode,
					vendorName: item.vendorName,
					checkTime: item.checkTime,
					checkQty: item.checkQty,
					isPass: item.isPass,
					isStorage: item.isStorage,
					isResubmit: item.isResubmit,
					failReasonIds: item.failReasonIds || [],
				};
			});
			let submitparams = {
				sampleNo: dialogData.formData.sampleNo,
				matNo: dialogData.formData.matNo,
				describe: dialogData.describe,
				accepReportUrl: dialogData.fileInfo.drawPath,
				checkDetails: checkDetails,
			};
			ElMessageBox.confirm('確定提交嗎?', '提示', {
				confirmButtonText: '確 定',
				cancelButtonText: '取 消',
				type: 'warning',
				draggable: true,
			})
				.then(async () => {
					loadingBtn.value = true;
					// console.log(submitparams);
					let res = await SampleCheckApi(submitparams);
					if (res.status) {
						ElMessage.success('驗收成功');
						ElMessageBox.confirm(`驗收單號：${res.data}`, '提示', {
							confirmButtonText: '確 定',
							showCancelButton: false,
							showClose: false,
							type: 'success',
							draggable: true,
						})
							.then(async () => {
								dialogData.dialogVisible = false;
							})
							.catch(() => {});
						getTableData(state.tableData);
					}
					loadingBtn.value = false;
				})
				.catch(() => {});
		} else {
			// 验证成功
			ElMessage.warning(t('表格項必填未填'));
		}
	});
};
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
:deep(.mb20) {
	margin-bottom: 0px !important;
}
:deep(.el-upload-dragger) {
	border: 0;
	padding: 0;
	background-color: transparent;
	border-radius: unset;
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
		line-height: 30px;
	}
}
</style>
