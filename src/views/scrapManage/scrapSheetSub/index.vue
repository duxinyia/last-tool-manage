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
				@cellclick="matNoClick"
				:cellStyle="cellStyle"
				@onOpentopBtnOther="onOpenSendRepair"
				@onOpenOtherDialog="lookReturnAttachment"
			>
				<template #rowIcons="{ row, itemConfig }">
					<div
						class="circle"
						:class="{
							circleRedColor: row.isUnderWarranty === false,
							circleGreenColor: row.isUnderWarranty === true,
						}"
						v-if="itemConfig.key === 'matno' && (row.isUnderWarranty === true || row.isUnderWarranty === false)"
					>
						<span v-if="row.isUnderWarranty === true">保內</span>
						<span v-if="row.isUnderWarranty === false">保外</span>
					</div>
				</template>
			</Table>
			<el-dialog
				:before-close="onClose"
				ref="presentationDialogRef"
				v-model="presentationDialogVisible"
				:title="dilogTitle"
				width="50%"
				:destroy-on-close="true"
				draggable
				:close-on-click-modal="false"
			>
				<el-form ref="dialogFormRef" :model="dialogState.tableData.form" size="default" label-width="100px">
					<el-row>
						<el-col :xs="24" :sm="12" :md="11" :lg="11" :xl="11" class="mb15 mr20" v-for="(val, key) in dialogState.tableData.search" :key="key">
							<el-form-item
								:label="$t(val.label)"
								:prop="val.prop"
								:rules="[
									{
										required: val.isRequired,
										message: `${t(val.label)}不能為空`,
										trigger: val.type === 'input' || val.type === 'time' ? 'blur' : 'change',
									},
								]"
							>
								<span v-if="val.type === 'text'" style="color: red; line-height: 30px" class="ml10">{{ dialogState.tableData.form[val.prop] }}</span>

								<el-input
									v-if="val.type === 'input'"
									size="default"
									v-model="dialogState.tableData.form[val.prop]"
									:placeholder="`請輸入${$t(val.label)}`"
									clearable
									style="width: 100%"
								/>

								<el-date-picker
									v-if="val.type === 'time'"
									v-model="dialogState.tableData.form[val.prop]"
									:placeholder="`請選擇時間`"
									clearable
									value-format="YYYY-MM-DD"
									type="date"
									:disabled-date="disabledDate"
									style="height: 30px; width: 100%"
								/>
							</el-form-item>
						</el-col>
					</el-row>
				</el-form>
				<!-- 表格 -->
				<el-form ref="tableFormRef" :model="dialogState.tableData" size="default">
					<Table ref="dialogtableRef" v-bind="dialogState.tableData" class="table" @delRow="onDelRow" :rowStyle="rowStyle">
						<template #rowIcons="{ row, itemConfig }">
							<div
								class="circle"
								:class="{
									circleRedColor: row.isUnderWarranty === false,
									circleGreenColor: row.isUnderWarranty === true,
								}"
								v-if="itemConfig.key === 'matno'"
							>
								<span v-if="row.isUnderWarranty === true">保內</span>
								<span v-if="row.isUnderWarranty === false">保外</span>
							</div>
						</template>
					</Table>
				</el-form>
				<div class="describe">
					<span>備註：</span>
					<el-input
						class="input-textarea"
						show-word-limit
						v-model="dialogState.tableData.form['describe']"
						type="textarea"
						placeholder="請輸入"
						maxlength="150"
					></el-input>
				</div>
				<!-- 上傳文件優化 -->
				<div class="describe">
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
				<!-- 提交按钮 -->
				<template #footer>
					<span class="dialog-footer">
						<el-button size="default" auto-insert-space @click="onClose">取消</el-button>
						<el-button v-if="isHaveDraft" size="default" type="info" auto-insert-space @click="onReset"> 重置 </el-button>
						<el-button size="default" type="warning" auto-insert-space @click="onSubmit(tableFormRef, 'save')">保存</el-button>
						<el-button size="default" type="primary" auto-insert-space @click="onSubmit(dialogFormRef, 'submit')" :loading="loadingBtn">
							提交
						</el-button>
					</span>
				</template>
			</el-dialog>
			<Dialog ref="matnoDetailDialogRef" :isFootBtn="false" :dialogConfig="dialogMatnoDetail" />
			<qrCodeDialog :color="colorType" ref="inventoryDialogRef" :tags="tags" dialogTitle="庫存條碼" />
			<!-- 上传进度条弹窗 -->
			<el-dialog v-model="showProgress" title="上傳進度" width="30%" :close-on-click-modal="false" :modal="false" :show-close="false">
				<div>
					<div>
						<!-- 进度条百分比 -->
						<el-progress :percentage="uploadPercentage" :format="format" max="100"></el-progress>
					</div>
				</div>
			</el-dialog>
			<!-- <el-dialog v-model="inventoryDialogRef" title="庫存條碼" width="30%" draggable>
				<el-tag v-for="tag in tags" :key="tag.code" class="mr10 mb10" :type="tag.runstatus === 1 ? '' : 'danger'">
					{{ tag.code }}
				</el-tag>
			</el-dialog> -->
		</div>
	</div>
</template>

<script setup lang="ts" name="scrapSheetSub">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox, FormInstance, genFileId, TabsPaneContext, UploadInstance, UploadProps, UploadRawFile } from 'element-plus';
import { FolderOpened } from '@element-plus/icons-vue';
const presentationDialogVisible = ref(false);
// 引入接口
import {
	getQueryExitPageApi,
	getUselessBackStockApi,
	getUselessDraftApi,
	getUselessDraftCreateApi,
	getUselessDraftDeleteApi,
	getUselessDraftUpdateApi,
} from '/@/api/scrapManage/scrapSheetSub';
import { GetExitStoreQrCodeListApi } from '/@/api/maintenanceManage/maintenanceOrderSub';

import { useI18n } from 'vue-i18n';
import { getOperAttachmentApi, getUploadFileApi } from '/@/api/global';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
const qrCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/qrCodeDialog.vue'));
// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const matnoDetailDialogRef = ref();
const inventoryDialogRef = ref();
const loadingBtn = ref(false);
const tableRef = ref<RefType>();
const dialogtableRef = ref<RefType>();
const presentationDialogRef = ref();
const file = ref();
const inputuploadRefs = ref<UploadInstance>();
// tags的数据
let tags = ref<EmptyArrayType>([]);
const dialogFormRef = ref();
const isHaveDraft = ref(false);
// 送修弹窗标题
const dilogTitle = ref();
const header = ref([
	{
		key: 'matno',
		colWidth: '150',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
	// { key: 'machine', colWidth: '', title: '機種', type: 'text', isCheck: true },
	{ key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameen', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	// { key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
	// { key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
	{ key: 'exitqty', colWidth: '', title: '報廢數量', type: 'text', isCheck: true },
	{ key: 'exitreason', colWidth: '', title: '報廢原因', type: 'text', isCheck: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{
				key: 'matno',
				colWidth: '250',
				title: 'message.pages.matNo',
				type: 'text',
				isCheck: true,
			},
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameen', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			// { key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
			// { key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
			{ key: 'storageType', colWidth: '', title: '倉庫類型', type: 'text', isCheck: true },
			{ key: 'sLocation', colWidth: '', title: '倉庫位置', type: 'text', isCheck: true },
			{ key: 'exitqty', colWidth: '', title: '報廢數量', type: 'text', isCheck: true },
			{ key: 'exitreason', colWidth: '', title: '報廢原因', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '發起人', type: 'text', isCheck: true },
			{ key: 'createtime', colWidth: '', title: '報廢時間', type: 'text', isCheck: true },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: true, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: true, //是否有分页
		},
		btnConfig: [{ type: 'attachmentUrl', name: '退庫附件', color: '#e6a23c', isSure: false, icon: '' }],
		topBtnConfig: [
			{ type: 'other', name: '提單', defaultColor: 'primary', isSure: true, disabled: true, icon: 'ele-Edit', isNoSelcetDisabled: true },
			{ type: 'addData', name: '添加數據', defaultColor: 'primary', isSure: false, disabled: true, icon: 'ele-Plus', isNoSelcetDisabled: true },
			{ type: 'continueEdit', name: '繼續編輯', defaultColor: 'primary', isSure: false, disabled: true, icon: 'ele-Edit' },
		],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料號', prop: 'matNo', required: false, type: 'input' },
			{ label: '圖紙編號', prop: 'drawNo', required: false, type: 'input' },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
			{ label: '發起人', prop: 'creator', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},

		// 给后端的数据
		form: {
			matNo: '',
			matName: '',
			exitType: 0,
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
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			isDialogTab: true, //是否是弹窗里面的表格
			height: 300,
		},
		// 给后端的数据
		form: {},
		searchConfig: {
			isSearchBtn: false,
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			// { label: '報廢單號', prop: 'matNo', placeholder: '請輸入報廢單號', type: 'text', required: false, isRequired: false },
			{ label: '報廢時間', prop: 'uselessDate', type: 'time', required: false, isRequired: true },
			// { label: '班別', prop: 'classes', type: 'input', required: false, isRequired: false },
			// { label: '站位', prop: 'state', type: 'input', required: false, isRequired: false },
		],
		// 弹窗表单
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true, disabled: false }],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
const dialogMatnoDetail = ref([
	{ label: '料號:', prop: 'matno', type: 'text' },
	{ label: '圖紙編號:', prop: 'drawNo', type: 'text' },
	{ label: '品名-中文:', prop: 'namech', type: 'text' },
	{ label: '品名-英文:', prop: 'nameen', type: 'text' },
	// { label: '厂商代码:', prop: 'vendorcode', type: 'text' },
	// { label: '厂商名称:', prop: 'vendorname', type: 'text' },
	{ label: '退庫類型:', prop: 'exittype', type: 'text' },
	{ label: '退庫原因:', prop: 'exitreason', type: 'text' },
	{ label: '退庫數量:', prop: 'exitqty', type: 'text' },
	{ label: '備註:', prop: 'describe', type: 'text', lg: 24, xl: 24 },
]);
const exitTypeMap: EmptyObjectType = {
	1: '維修',
	2: '閒置',
	3: '報廢',
};
let isChange = false;
let num = 0;
watch(
	() => presentationDialogVisible.value,
	(val) => {
		if (val == false) {
			tableRef.value.clearSelection();
		} else {
			watch(
				[dialogState.tableData.data, dialogState.tableData.form],
				(val) => {
					// console.log(num);
					if (num === 0 && dialogType != 'other') {
						isChange = false;
					} else {
						isChange = true;
					}
					num++;
					// console.log('监听到了');
				},
				{ deep: true }
			);
		}
	}
);
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

	const res = await getUploadFileApi('', uploadFileRaw);
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
// 只能選擇今天日期之前的日期
const disabledDate = (time: Date) => {
	return time.getTime() > Date.now();
};
// 刪除按鈕狀態
dialogState.tableData.btnConfig![0].disabled = computed(() => {
	return dialogState.tableData.data.length <= 1 ? true : false;
});
// 選中的要編輯的數據變成藍色
const rowStyle = ({ row, column }: EmptyObjectType) => {
	if (row.isBorder) {
		return { color: 'var(--el-color-primary)' };
	}
};
// 单元格字体颜色
const cellStyle = ({ row, column }: EmptyObjectType) => {
	const property = column.property;
	if (property === 'matno') {
		return { color: 'var(--el-color-primary)', cursor: 'pointer' };
	} else if (property === 'exitqty' && row.codeManageMode === 0) {
		let color = '';
		color = row.isUnderWarranty ? '#67c23a' : 'red';
		return { color: color, cursor: 'pointer' };
	}
};
// const changeToStyle = (indList: number[]) => {
// 	return ({ columnIndex }: any) => {
// 		for (let j = 0; j < indList.length; j++) {
// 			let ind = indList[j];
// 			if (columnIndex === ind) {
// 				return { color: 'var(--el-color-primary)', cursor: 'pointer' };
// 			}
// 		}
// 	};
// };
// cellStyle.value = changeToStyle([2, 7]);
// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	let data = {
		...form,
		exitType: 3,
		page: state.tableData.page,
	};
	const res = await getQueryExitPageApi(data);
	res.data.data.forEach((item: any) => {
		item.creator = `${item.creator} / ${item.creatorName}`;
		item.exittype = exitTypeMap[item.exittype];
	});
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
//获取報廢单草稿
const getRepairDraftData = async () => {
	const res = await getUselessDraftApi();
	if (res.code !== 404) {
		isHaveDraft.value = true;
		state.tableData.topBtnConfig?.forEach((item) => {
			item.isSure = item.type === 'other' ? false : true;
		});
		dilogTitle.value = '維修單提報';
		presentationDialogVisible.value = true;
		dialogState.tableData.header = header.value;
		dialogState.tableData.config.loading = false;
		dialogState.tableData.data = res.data.details;
		dialogState.tableData.form = Object.assign(dialogState.tableData.form, res.data);
	} else {
		isHaveDraft.value = false;
		state.tableData.topBtnConfig?.forEach((item) => {
			item.isSure = item.type === 'other' ? true : false;
		});
	}
};
//删除
const onDelRow = (row: EmptyObjectType, i: number) => {
	dialogState.tableData.data.splice(i, 1);
};
// 查看退庫附件
const lookReturnAttachment = async (scope: any, type: string) => {
	const res = await getOperAttachmentApi(17, scope.row.runid);
	if (res.status) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${res.data}`, '_blank');
	}
};
let dialogType = '';
// 点击报废按钮
const onOpenSendRepair = async (row: EmptyObjectType[], type: string) => {
	num = 0;

	loadingBtn.value = false;
	dialogState.tableData.form = {};
	presentationDialogVisible.value = true;
	let tableData = dialogState.tableData;
	tableData.header = header.value;
	tableData.data = [];
	tableData.data = row;
	tableData.config.loading = false;
	dilogTitle.value = '報廢單提報';
	dialogType = type;
	if (type === 'addData') {
		const res = await getUselessDraftApi();
		dialogState.tableData.form = Object.assign(dialogState.tableData.form, res.data);
		dialogState.tableData.data.forEach((item) => {
			item.isBorder = true;
		});
		nextTick(() => {
			dialogtableRef.value.tableScrollToRow(res.data.details.length, true);
		});
		dialogState.tableData.data = res.data.details.concat(dialogState.tableData.data);
	} else if (type === 'continueEdit') {
		getRepairDraftData();
	}
};
const colorType = ref();
// 点击料号弹出详情
const matNoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	colorType.value = '';
	if (column.property === 'matno') {
		matnoDetailDialogRef.value.openDialog('matno', row, '退庫詳情');
	} else if (column.property === 'exitqty' && row.codeManageMode === 0) {
		if (row.isUnderWarranty === true) {
			colorType.value = 'success';
		} else if (row.isUnderWarranty === false) {
			colorType.value = 'danger';
		}
		let res = await GetExitStoreQrCodeListApi(row.runid);
		if (res.data.length == 0) {
			ElMessage.error('暫無條碼數據');
		} else {
			tags.value = res.data;
			inventoryDialogRef.value?.openDialog();
		}
	}
};
// 重置
const onReset = async () => {
	ElMessageBox.confirm(`確定重置數據嗎？`, '提示', {
		confirmButtonText: '確 定',
		cancelButtonText: '取 消',
		type: 'warning',
		draggable: true,
	})
		.then(async () => {
			const res = await getUselessDraftDeleteApi();
			dialogState.tableData.form = {};
			dialogState.tableData.data = [];
			getRepairDraftData();
			getTableData();
			presentationDialogVisible.value = false;
		})
		.catch(() => {});
};
// 保存或者提交
const onSubmit = async (formEl: FormInstance | undefined, type: string) => {
	if (type !== 'submit') {
		// 提交按鈕要必填送修時間，保存按鈕不用，如果先點了提交按鈕出現了校驗提示，再點保存按鈕清除校驗提示
		dialogFormRef.value.clearValidate(`uselessDate`);
	}
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid && type === 'submit') return ElMessage.warning(t('請填寫報廢時間'));
		// if (!dialogState.tableData.form['uselessdate']) return ElMessage.warning(t('請填寫報廢時間'));
		let allData: EmptyObjectType = {};
		let exitstoreid: EmptyArrayType = [];
		let data = dialogState.tableData.data;
		data.forEach((item) => {
			exitstoreid.push(item.runid || item.exitStoreId);
		});
		allData = { ...dialogState.tableData.form };
		allData['exitStoreIds'] = exitstoreid;
		if (type === 'save') {
			if (!isHaveDraft.value) {
				// 草稿創建
				const res = await getUselessDraftCreateApi(allData);
				if (res.status) {
					ElMessage.success(t('保存成功'));
					isChange = false;
					state.tableData.topBtnConfig?.forEach((item) => {
						item.isSure = item.type === 'other' ? false : true;
					});
					isHaveDraft.value = true;
				}
			} else {
				// 草稿更新
				const res = await getUselessDraftUpdateApi(allData);
				if (res.status) {
					isChange = false;
					ElMessage.success(t('保存成功'));
				}
			}
			getTableData();
		} else {
			loadingBtn.value = true;
			allData['uselessdate'] = allData.uselessDate;
			delete allData.uselessDate;
			const res = await getUselessBackStockApi(allData);
			if (res.status) {
				ElMessage.success(t('報廢成功'));

				if (isHaveDraft.value) {
					const res1 = await getUselessDraftDeleteApi();
				}
				state.tableData.topBtnConfig?.forEach((item) => {
					item.isSure = item.type === 'other' ? true : false;
				});
				isHaveDraft.value = false;
				getTableData();
				presentationDialogVisible.value = false;
			}
			loadingBtn.value = false;
		}
	});
};
// 取消
const onClose = () => {
	if (dialogType != 'other') {
		dialogState.tableData.data.forEach((item) => {
			item.prItemNo = '';
		});
	}

	num = 0;
	// console.log(isChange);
	if (isChange) {
		ElMessageBox.confirm(`未保存確定退出嗎？`, '提示', {
			confirmButtonText: '確 定',
			cancelButtonText: '取 消',
			type: 'warning',
			draggable: true,
		})
			.then(async () => {
				presentationDialogVisible.value = false;
				isChange = false;
			})
			.catch(() => {});
	} else {
		presentationDialogVisible.value = false;
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
// 拖动显示列排序回调
const onSortHeader = (data: TableHeaderType[]) => {
	state.tableData.header = data;
};
// 页面加载时
onMounted(() => {
	getTableData();
	getRepairDraftData();
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
.buttonBorder {
	border: 0px !important;
}
.circle {
	display: inline-block;
	width: 26px;
	height: 26px;
	border-radius: 50%;
	margin-right: 3px;
}
.circleRedColor {
	border: 1px solid red;
	color: red;
}
.circleGreenColor {
	border: 1px solid #67c23a;
	color: #67c23a;
}
.circleBlueColor {
	border: 1px solid #1890ff;
	color: #1890ff;
}
.circle span {
	font-size: 10px;
	padding: 0 1px;
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
