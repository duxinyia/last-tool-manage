<template>
	<div class="table-demo-container layout-padding">
		<div class="table-demo-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table-demo"
				@pageChange="onTablePageChange"
				@onOpenOtherDialog="openAcceptanceDialog"
				:cellStyle="cellStyle"
			/>
			<!-- <Dialog ref="sendReceiveDialogRef" v-bind="dialogData" /> -->
			<el-dialog draggable :close-on-click-modal="false" v-model="dialogData.dialogVisible" title="驗收" width="70%">
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
					<Table ref="tableRef2" v-bind="dialogState.tableData" @delRow="onDelRow" class="table-demo" @handlestatus1Change="handlestatus1Change" />
				</el-form>
				<el-input disabled v-model="dialogData.fileInfo.name" placeholder="文件" clearable class="mb10">
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
							<el-button type="primary" class="ml1">上傳驗收報告</el-button>
						</el-upload></template
					>
					<template #append v-if="dialogData.fileInfo.name"
						><el-button @click="inputsubmitUpload" type="primary" class="ml1">上傳文件</el-button>
						<el-button v-if="dialogData.fileInfo['drawPath'].includes('/')" class="look-file" @click="lookUpload">查看文件</el-button>
					</template>
				</el-input>
				<div class="describe">
					<el-input
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
		</div>
	</div>
</template>

<script setup lang="ts" name="/partno/acceptance">
import { defineAsyncComponent, reactive, ref, onMounted, watch } from 'vue';
import { getUploadFileApi } from '/@/api/global/index';
import { ElMessage, genFileId, UploadRawFile } from 'element-plus';
import { GetCheckTaskApi, SampleCheckApi, GetSampleWaitCheckDetailApi } from '/@/api/partno/acceptance';
import { getExitReasonApi } from '/@/api/toolsReturn/maintentanceTools';
import { GetSampleDetailApi } from '/@/api/partno/sendReceive';
import { useI18n } from 'vue-i18n';
import type { UploadInstance, UploadProps, UploadUserFile } from 'element-plus';

// 引入表格组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
// 引入上面的表单组件
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入收货弹窗组件
const Dialog = defineAsyncComponent(() => import('../sampleDelivery/component/dialog.vue'));

// 定义变量内容
const { t } = useI18n();
const sendReceiveDialogRef = ref();
const loadingBtn = ref(false);
const tableRef = ref<RefType>();
const dialogTableFormRef = ref();
const inputuploadRefs = ref<UploadInstance>();
const inputfileList = ref<UploadUserFile[]>([]);
const inputuploadForm = ref();
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
			{ key: 'engineer', colWidth: '', title: 'message.pages.engineer', type: 'text', isCheck: true },
			{ key: 'engineerName', colWidth: '', title: 'message.pages.engineerName', type: 'text', isCheck: true },
			{ key: 'runStatus', colWidth: '', title: 'message.pages.state', type: 'text', isCheck: true },
		],
		// 表格配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: false, //是否有分页
			height: 750,
		},

		btnConfig: [{ type: 'acceptance', name: '驗收', color: '#e6a23c', isSure: false }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [{ label: '送樣單號', prop: 'simpleNo', placeholder: '請輸入送樣單號', required: false, type: 'input' }],
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
			{ key: 'sampleTime', colWidth: '', title: '實際送樣時間', type: 'text', isCheck: true },
			{ key: 'sampleQty', colWidth: '', title: '實際送樣數量', type: 'text', isCheck: true },
			{ key: 'checkTime', colWidth: '150', title: '驗收時間', type: 'time', isCheck: true, isRequired: true },
			{ key: 'checkQty', colWidth: '', title: '驗收數量', type: 'input', isCheck: true, isRequired: true },
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
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
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
		{ type: 'text', label: '驗收單號', prop: 'checkNo', value: '' },
		{ type: 'text', label: '送樣單號', prop: 'sampleNo', value: '' },
		{ type: 'text', label: '驗收人', prop: 'engineerName', value: '', xs: 8, sm: 8, md: 8, lg: 8, xl: 8 },
		{ type: 'text', label: '料號', prop: 'matNo', value: '' },
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
watch(
	() => dialogState.tableData.data.length,
	(newValue) => {
		dialogState.tableData.btnConfig![0].disabled = newValue <= 1 ? true : false;
	},
	{ deep: true }
);
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	let data = {
		matNo: form.matNo,
		page: state.tableData.page,
	};
	const res = await GetCheckTaskApi();
	state.tableData.data = res.data;
	if (res.status) {
		state.tableData.config.loading = false;
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
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value?.pageReset();
};

// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType) => {
	state.tableData.page.pageNum = page.pageNum;
	state.tableData.page.pageSize = page.pageSize;
	getTableData();
};

// 打开验收弹窗 1
const openAcceptanceDialog = async (scope: any) => {
	loadingBtn.value = false;
	dialogData.dialogVisible = true;
	dialogData.formData = { ...scope.row };
	//清空文件信息
	dialogData.fileInfo = {
		name: '',
		drawPath: '',
	};
	//获取验收失败原因
	let res1 = await getExitReasonApi('CheckFail');
	dialogState.tableData.header[7].options = res1.data.map((item: any) => {
		return { value: item.runid, label: item.dataname };
	});
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

	dialogState.tableData.data.forEach((item) => {
		if (item.isStorage != 0 || item.isStorage != 1) {
			item.isStorage = 0;
		}
		if (item.isPass != 0 || item.isPass != 1) {
			item.isPass = 0;
		}
	});
};
//删除表格某一行數據
const onDelRow = (row: EmptyObjectType, i: number) => {
	dialogState.tableData.data.splice(i, 1);
};
//上传文件里面的数据
const inputHandleChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
	dialogData.fileInfo.name = uploadFile.name;
	inputuploadForm.value = uploadFile;
};
//可以在选中时自动替换上一个文件
const inputHandleExceed: UploadProps['onExceed'] = (files) => {
	let upload_list: any = inputuploadRefs.value;
	upload_list[0]!.clearFiles();
	const file = files[0] as UploadRawFile;
	file.uid = genFileId();
	upload_list[0]!.handleStart(file);
};
// 上传文件
const inputsubmitUpload = async () => {
	const res = await getUploadFileApi(4, inputuploadForm.value.raw);
	dialogData.fileInfo['drawPath'] = res.data;
	res.status && ElMessage.success(`上傳成功`);
};
// 查看上传的文件
const lookUpload = () => {
	window.open(`${import.meta.env.VITE_API_URL}${dialogData.fileInfo['drawPath']}`, '_blank');
};
// 提交
const onSubmit = async (formEl: EmptyObjectType | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格項必填未填'));
		let checkDetails = dialogState.tableData.data.map((item) => {
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
		loadingBtn.value = true;
		let res = await SampleCheckApi(submitparams);
		if (res.status) {
			dialogData.dialogVisible = false;
			ElMessage.success('驗收成功');
			getTableData();
		}
		loadingBtn.value = false;
	});
};
// 页面加载时
onMounted(() => {
	getTableData();
});
</script>

<style scoped lang="scss">
.table-demo-container {
	.table-demo-padding {
		padding: 15px;
		.table-demo {
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
.look-file {
	color: var(--el-color-primary) !important;
}
</style>
