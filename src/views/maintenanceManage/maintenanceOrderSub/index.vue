<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="維修單提報" name="first">
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
		</el-tab-pane>
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="維修記錄" name="second">
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
				@pageChange="(page) => onTablePageChange(page, secondState.tableData)"
				@sortHeader="(data) => onSortHeader(data, secondState.tableData)"
				@onOpenOtherDialog="openDetailDialog"
			/>
		</el-tab-pane>
		<el-dialog
			:before-close="onClose"
			draggable
			:close-on-click-modal="false"
			ref="presentationDialogRef"
			v-model="presentationDialogVisible"
			:title="dilogTitle"
			width="80%"
			destroy-on-close
		>
			<el-form v-if="activeName === 'first'" ref="dialogFormRef" :model="dialogState.tableData.form" size="default" label-width="110px">
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
							<div v-if="val.type === 'text'">
								{{ val.label }}<span style="color: red" class="ml10">{{ dialogState.tableData.form[val.prop] }}</span>
							</div>
							<template v-if="val.type === 'input'">
								<!-- <span class="mr10">{{ val.label }}</span> -->
								<el-input
									size="default"
									v-model="dialogState.tableData.form[val.prop]"
									:placeholder="`請輸入${$t(val.label)}`"
									clearable
									style="width: 100%; max-width: 167px"
								/>
							</template>
							<div v-if="val.type === 'time'">
								<!-- <span v-if="val.isRequired" class="color-danger mr5">*</span> -->
								<!-- <span style="width: 96px" class="mr10">{{ val.label }}</span> -->
								<el-date-picker
									v-model="dialogState.tableData.form[val.prop]"
									:placeholder="`請選擇時間`"
									:disabled-date="disabledDate"
									clearable
									value-format="YYYY-MM-DD"
									type="date"
									style="height: 30px; max-width: 167px"
								/>
							</div>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>

			<!-- 表格 -->
			<el-form ref="tableFormRef" :model="dialogState.tableData">
				<Table
					ref="dialogtableRef"
					v-bind="dialogState.tableData"
					class="table"
					@delRow="onDelRow"
					:rowStyle="rowStyle"
					:indexMethod="indexMethod"
					:objectSpanMethod="objectSpanMethod"
					@onOpenOtherDialog="openChangeMatno"
					:cellStyle="oldcellStyle"
				>
					<template #rowIcon="{ row, itemConfig }">
						<span class="circleNew" v-if="row.isNew && (itemConfig.key === 'matno' || itemConfig.key === 'matNo')">新</span>
						<span class="circleIn" v-if="(itemConfig.key === 'exitqty' || itemConfig.key === 'qty') && row.isUnderWarranty === true">保內</span>
						<span class="circleOut" v-if="(itemConfig.key === 'exitqty' || itemConfig.key === 'qty') && row.isUnderWarranty === false">保外</span>
					</template>
				</Table>
			</el-form>
			<div class="describe" style="line-height: 30px">
				<span>備註：</span>
				<el-input
					v-if="activeName === 'first'"
					class="input-textarea"
					show-word-limit
					v-model="dialogState.tableData.form['describe']"
					type="textarea"
					placeholder="請輸入"
					maxlength="150"
				></el-input>
				<span v-else style="color: #1890ff; font-weight: 700; width: 100%">{{ dialogState.tableData.form['describe'] }}</span>
			</div>
			<!-- 上傳文件優化 -->
			<div class="describe" v-if="activeName === 'first'">
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
			<el-button class="mt5" v-else size="default" type="success" auto-insert-space @click="lookAttachment"> 查看附件 </el-button>
			<!-- 提交按钮 -->
			<template #footer>
				<span class="dialog-footer" v-if="activeName === 'first'">
					<el-button size="default" auto-insert-space @click="onClose">取消</el-button>
					<el-button v-if="isHaveDraft" size="default" type="info" auto-insert-space @click="onReset"> 重置 </el-button>
					<el-button size="default" type="warning" auto-insert-space @click="onSubmit(tableFormRef, 'save')" :loading="loadingSaveBtn"
						>保存</el-button
					>
					<el-button size="default" type="primary" auto-insert-space @click="onSubmit(dialogFormRef, 'submit')" :loading="loadingBtn">
						提交
					</el-button>
				</span>
			</template>
		</el-dialog>
		<Dialog ref="matnoDetailDialogRef" :isFootBtn="false" :dialogConfig="dialogMatnoDetail" />
		<qrCodeDialog :color="colorType" ref="inventoryDialogRef" :tags="tags" dialogTitle="庫存條碼" />
		<!-- 更改料號彈窗 -->
		<Dialog
			ref="changeMatDialogRef"
			:isFootBtn="true"
			:dialogConfig="dialogMatnoChange"
			@remoteMethod="remoteMethod"
			@selectChange="changeSelect"
			@addData="onSubmitChangeMat"
		>
			<template #dialogBtn="{ data }">
				<el-button v-if="data.formData.isShowDelMatBtn" type="danger" @click="onDelMat(data)" size="default"> 撤回變更料號</el-button>
			</template>
		</Dialog>
		<!-- 返修記錄彈窗 -->
		<Dialog ref="rerepairRecordsDialogRef" :isFootBtn="false" dialogWidth="60%">
			<template #dialogTable="{}">
				<el-form :model="rerepairRecordsdialogState.tableData" size="default">
					<Table v-bind="rerepairRecordsdialogState.tableData" class="table-dialog"> </Table>
				</el-form>
			</template>
		</Dialog>
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
<!-- <el-dialog v-model="inventoryDialogRef" title="庫存條碼" width="30%" draggable>
				<el-tag v-for="tag in tags" :key="tag.code" class="mr10 mb10" :type="tag.runstatus === 1 ? '' : 'danger'">
					{{ tag.code }}
				</el-tag>
			</el-dialog> -->
<script setup lang="ts" name="maintenanceOrderSub">
import { defineAsyncComponent, reactive, ref, onMounted, computed, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox, FormInstance, genFileId, TabsPaneContext, UploadInstance, UploadProps, UploadRawFile } from 'element-plus';
import { FolderOpened } from '@element-plus/icons-vue';
const presentationDialogVisible = ref(false);
// 引入接口
import {
	getQueryExitPageApi,
	getSubmitRepairOrderApi,
	GetExitStoreQrCodeListApi,
	getQueryRepairRecordApi,
	getRepairRecordDetailApi,
	getRepairDraftApi,
	getRepairDraftCreateApi,
	getRepairDraftUpdateApi,
	getRepairDraftDeleteApi,
} from '/@/api/maintenanceManage/maintenanceOrderSub';
import { useI18n } from 'vue-i18n';
import { getQueryNoPageApi } from '/@/api/requistManage/presentation';
import { getOperAttachmentApi, getUploadFileApi } from '/@/api/global';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 引入组件
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
const qrCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/qrCodeDialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const matnoDetailDialogRef = ref();
const inventoryDialogRef = ref();
const loadingBtn = ref(false);
const loadingSaveBtn = ref(false);
const tableRef = ref<RefType>();
const dialogtableRef = ref<RefType>();
const dialogFormRef = ref();
const presentationDialogRef = ref();
const changeMatDialogRef = ref();
// tags的数据
let tags = ref<EmptyArrayType>([]);
const resDataRef = ref([]);
const rerepairRecordsDialogRef = ref();
const file = ref();
const inputuploadRefs = ref<UploadInstance>();
// 送修弹窗标题
const dilogTitle = ref();
const activeName = ref<string | number>('first');
const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	getTableData(activeName.value === 'first' ? state.tableData : secondState.tableData);
	if (activeName.value === 'first') {
		// getRepairDraftData();
	}
};
const isHaveDraft = ref(false);
const header = ref([
	{
		key: 'matno',
		colWidth: '150',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
		icon: 'ele-Van',
	},
	{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
	// { key: 'machine', colWidth: '', title: '機種', type: 'text', isCheck: true },
	{ key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameen', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'exitqty', colWidth: '', title: '維修數量', type: 'text', isCheck: true },
	{ key: 'exitreason', colWidth: '', title: '維修原因', type: 'text', isCheck: true },
	{ key: 'prItemNo', colWidth: '', title: 'pr項次', type: 'input', isCheck: true, isRequired: false },
]);
const header1 = ref([
	{ key: 'prItemNo', colWidth: '', title: 'pr項次', type: 'text', isCheck: true },
	{
		key: 'matNo',
		colWidth: '250',
		title: 'message.pages.matNo',
		type: 'text',
		isCheck: true,
	},
	{ key: 'drawNo', colWidth: '100', title: '圖紙編號', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '100', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '100', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'qty', colWidth: '100', title: '維修數量', type: 'text', isCheck: true },
	{ key: 'reason', colWidth: '100', title: '維修原因', type: 'text', isCheck: true },
	{ key: 'exitStoreOperator', colWidth: '', title: '發起人', type: 'text', isCheck: true },
	{ key: 'pendingReceiptQty', colWidth: '110', title: '待收貨數量', type: 'text', isCheck: true },
	{ key: 'pendingCheckQty', colWidth: '110', title: '待驗收數量', type: 'text', isCheck: true },
	{ key: 'pendingStorageQty', colWidth: '110', title: '待入庫數量', type: 'text', isCheck: true },
	{ key: 'storedQty', colWidth: '110', title: '已入庫數量', type: 'text', isCheck: true },
	{ key: 'uselessQty', colWidth: '140', title: '報廢數量', type: 'text', isCheck: true },
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
			{ key: 'exitqty', colWidth: '', title: '退庫數量', type: 'text', isCheck: true },
			{ key: 'exitreason', colWidth: '', title: '退庫原因', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '發起人', type: 'text', isCheck: true },
			{ key: 'createtime', colWidth: '', title: '退庫時間', type: 'text', isCheck: true },
			{ key: 'describe', colWidth: '', title: '退庫備註', type: 'text', isCheck: true },
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
		topBtnConfig: [
			{ type: 'other', name: '提单', defaultColor: 'primary', isSure: true, disabled: true, icon: 'ele-Edit', isNoSelcetDisabled: true },
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
		btnConfig: [{ type: 'attachmentUrl', name: '退庫附件', color: '#e6a23c', isSure: false, icon: '' }],
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
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR單號', type: 'text', isCheck: true },
			{ key: 'sendRepairDate', colWidth: '', title: '送修時間', type: 'text', isCheck: true },
			{ key: 'createTime', colWidth: '', title: '提交時間', type: 'text', isCheck: true },
			{ key: 'isAllReceived', colWidth: '', title: '是否全部收貨', type: 'text', isCheck: true },
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
			isBorder: true, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: true, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			isDialogTab: true, //是否是弹窗里面的表格
			height: 400,
			operateWidth: 230,
		},
		// 给后端的数据
		form: {},
		searchConfig: {
			isSearchBtn: false,
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			// { label: '維修單號', prop: 'matNo', placeholder: '請輸入維修單號', type: 'text', required: false, isRequired: false },
			{ label: 'PR單號', prop: 'prNo', placeholder: '請輸入PR單號', type: 'input', required: false, isRequired: false },
			{ label: '送修時間:', prop: 'sendRepairDate', placeholder: '請選擇送修時間', type: 'time', required: false, isRequired: true },
		],
		// 弹窗表单
		btnConfig: [
			{ type: 'editMat', name: '變更料號', color: '#e6a23c', isSure: false, disabled: false },
			{ type: 'del', name: '移除', color: '#D33939', isSure: true, disabled: false },
		],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
const dialogMatnoChange = ref([
	{
		label: '料號:',
		prop: 'changedMatNo',
		placeholder: '請輸入選擇料號',
		required: true,
		type: 'select',
		options: <any>[],
		loading: true,
		filterable: true,
		remote: true,
		remoteShowSuffix: true,
	},
	{ label: '圖紙編號:', prop: 'changedDrawNo', type: 'text' },
	{ label: '品名-中文:', prop: 'changedNameCh', type: 'text' },
	{ label: '品名-英文:', prop: 'changedNameEn', type: 'text' },
]);
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
	// { label: '備註:', prop: 'describe', type: 'text', lg: 24, xl: 24 },
]);
const rerepairRecordsdialogState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'effectiveTime', colWidth: '', title: '返修確認時間', type: 'text', isCheck: true },
			{ key: 'rerepairQty', colWidth: '', title: '返修數量', type: 'text', isCheck: true },
			{ key: 'checker', colWidth: '', title: '返修發起人（工程）', type: 'text', isCheck: true },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: false, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			height: 500,
		},
		topBtnConfig: [],
		btnConfig: [],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [],
		searchConfig: {
			isSearchBtn: true,
		},
		// 给后端的数据
		form: {},
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
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
// 查看附件
const lookAttachment = async () => {
	const res = await getOperAttachmentApi(12, detaileRow.repairNo);
	if (res.status) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${res.data}`, '_blank');
	}
};
let openChangeMatRow: EmptyObjectType = {};
// 打開更改料號彈簧
const openChangeMatno = (scope: EmptyObjectType, type: string) => {
	if (type === 'editMat') {
		changeMatDialogRef.value.openDialog(type, scope.row, '變更料號', {}, '修改');
		openChangeMatRow = scope.row;
		scope.row.isShowDelMatBtn = scope.row.changedMatNo ? true : false;
	} else {
		rerepairRecordsDialogRef.value.openDialog(type, {}, '返修記錄', {});
		scope.row.rerepairRecords.forEach((item: any) => {
			item.checker = `${item.checker} / ${item.checkerName}`;
		});
		rerepairRecordsdialogState.tableData.data = scope.row.rerepairRecords;
	}
};
// 改變下拉框的值
const changeSelect = async (query: any, prop: string, data: EmptyObjectType) => {
	resDataRef.value.forEach(async (item: any) => {
		if (item.matNo === query) {
			data.changedNameCh = item.nameCh;
			data.changedNameEn = item.nameEn;
			data.changedDrawNo = item.drawNo;
		}
	});
};
// 撤回變更料號
const onDelMat = (formData: EmptyObjectType) => {
	ElMessageBox.confirm(`確定撤回變更的料號嗎？`, '提示', {
		confirmButtonText: '確 定',
		cancelButtonText: '取 消',
		type: 'warning',
		draggable: true,
	})
		.then(async () => {
			dialogState.tableData.data.forEach((item, index) => {
				if (formData.formData.exitStoreId === item.exitStoreId) {
					item.changedNameCh = '';
					item.changedNameEn = '';
					item.changedDrawNo = '';
					item.changedMatNo = '';
					dialogState.tableData.data.splice(index + 1, 1);
				}
			});
			// 计算合并的行'exitqty', 'exitreason', 'prItemNo',
			mergeArr.value = colMethod(['exitqty', 'exitreason', 'prItemNo', 'exitStoreId', 'operation'], dialogState.tableData.data);
			indexobj(); //排列序号
			changeMatDialogRef.value.closeDialog();
		})
		.catch(() => {});
};
// 更改料號提交
const onSubmitChangeMat = (formData: EmptyObjectType) => {
	dialogState.tableData.data.forEach((item, index) => {
		// 如果已有新的料號就更改新的料號，否則追加一行新的并合併單元格展示（屎一樣的需求,旧的料號有什麼好看的，都修改了，亂七八糟！煩人）
		if (item.isNew && item.exitStoreId === openChangeMatRow.exitStoreId && formData.isShowDelMatBtn) {
			item.namech = formData.changedNameCh;
			item.nameen = formData.changedNameEn;
			item.drawNo = formData.changedDrawNo;
			item.matno = formData.changedMatNo;
			let preData = dialogState.tableData.data[index - 1];
			preData.changedDrawNo = formData.changedDrawNo;
			preData.changedNameCh = formData.changedNameCh;
			preData.changedNameEn = formData.changedNameEn;
			preData.changedMatNo = formData.changedMatNo;
		} else if (
			!item.isNew &&
			item.exitStoreId === openChangeMatRow.exitStoreId &&
			item.runid === openChangeMatRow.runid &&
			!formData.isShowDelMatBtn
		) {
			item.changedDrawNo = formData.changedDrawNo;
			item.changedMatNo = formData.changedMatNo;
			item.changedNameCh = formData.changedNameCh;
			item.changedNameEn = formData.changedNameEn;
			dialogState.tableData.data.splice(index + 1, 0, {
				runid: item.runid,
				exitStoreId: item.exitStoreId,
				exitqty: item.exitqty,
				exitreason: item.exitreason,
				prItemNo: item.prItemNo,
				drawNo: formData.changedDrawNo,
				matno: formData.changedMatNo,
				namech: formData.changedNameCh,
				nameen: formData.changedNameEn,
				isNew: true,
			});
			// 计算合并的行'exitqty', 'exitreason', 'prItemNo',
			mergeArr.value = colMethod(['exitqty', 'exitreason', 'prItemNo', 'exitStoreId', 'operation'], dialogState.tableData.data);
			indexobj(); //排列序号
		}
	});
	changeMatDialogRef.value.closeDialog();
};
// 选择下拉
let options: EmptyArrayType = [];
const remoteMethod = (query: string, datas: EmptyObjectType) => {
	let dialogConfig = dialogMatnoChange.value;
	dialogConfig?.forEach((item) => {
		if (item.prop === 'changedMatNo') item.loading = true;
	});
	if (query) {
		setTimeout(async () => {
			const res = await getQueryNoPageApi(query);
			resDataRef.value = res.data;
			options = res.data.map((item: EmptyObjectType) => {
				return { ...item, value: `${item.matNo}`, label: `${item.matNo}` };
			});
			dialogConfig?.forEach((item) => {
				if (item.prop === 'changedMatNo') {
					item.loading = false;
					item.options = options.filter((item: EmptyObjectType) => {
						return item.value.toLowerCase().includes(query.toLowerCase()) || item.label.toLowerCase().includes(query.toLowerCase());
					});
				}
			});
			const matNos: EmptyArrayType = [];
			res.data.forEach((item: any) => {
				matNos.push(item.matNo);
			});
			if (res.data.length === 1 && matNos.includes(query)) {
				datas.changedMatNo = query;
				changeSelect(query, '', datas);
			}
		}, 500);
	} else {
		dialogConfig?.forEach((item) => {
			if (item.prop === 'changedMatNo') item.options = [];
		});
	}
};
// 日期只能選擇今天之前
const disabledDate = (time: Date) => {
	return time.getTime() > Date.now();
};
// 刪除按鈕狀態
dialogState.tableData.btnConfig![1].disabled = computed(() => {
	return dialogState.tableData.data.length <= 1 ? true : false;
});
// 選中的要編輯的數據變成藍色
const rowStyle = ({ row, column }: EmptyObjectType) => {
	if (row.isBorder) {
		return { color: 'var(--el-color-primary)' };
	}
};
// 舊的料號字體顏色
const oldcellStyle = ({ row, column }: EmptyObjectType) => {
	const property = column.property;
	let changeColorProperty = ['matno', 'namech', 'nameen', 'drawNo'];
	let detailChangeColorProperty = ['matNo', 'nameCh', 'nameEn', 'drawNo'];
	if ((changeColorProperty.includes(property) || detailChangeColorProperty.includes(property)) && !row.isNew && (row.changedMatNo || row.oldManNo)) {
		return { color: '#909399' };
	}
};
// 单元格字体颜色
const cellStyle = ({ row, column }: EmptyObjectType) => {
	const property = column.property;
	// property === 'matno' ||
	let color = '';
	if (property === 'exitqty' && row.codeManageMode === 0) {
		color = row.isUnderWarranty ? '#67c23a' : 'red';
		return { color: color, cursor: 'pointer' };
	}
};
// 初始化列表数据
const getTableData = async (datas: EmptyObjectType) => {
	const form = datas.form;
	let res = null;
	if (activeName.value === 'first') {
		let data = {
			...form,
			exitType: 1,
			page: datas.page,
		};
		res = await getQueryExitPageApi(data);
		res.data.data.forEach((item: any) => {
			item.creator = `${item.creator} / ${item.creatorName}`;
			item.exittype = exitTypeMap[item.exittype];
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
		res = await getQueryRepairRecordApi(data);
		res.data.data.forEach((item: any) => {
			item.isAllReceived = item.isAllReceived === true ? '是' : '否';
		});
	}
	datas.data = res!.data.data;
	datas.config.total = res!.data.total;
	if (res!.status) {
		datas.config.loading = false;
	}
};
const mergeArr: EmptyObjectType = ref({});
const indexNum: EmptyObjectType = ref({});
// 表格调用的合并方法
const objectSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
	let arr = mergeArr.value[column.property] || [];
	if (column.type == 'index' && mergeArr.value['exitStoreId']) return mergeArr.value['exitStoreId'][rowIndex];
	else if (arr.length) return arr[rowIndex];
	else [1, 1];
};
// 封装一个需要合并的行方法
const colMethod = (columnArr: EmptyArrayType, data: EmptyArrayType) => {
	// columnArr 合并行所在的列字段
	// data 需要合并的表格数据
	let column: EmptyObjectType = {};
	let position = 0;
	// 遍历合并的列数据
	columnArr.forEach((prop: any) => {
		column[prop] = [];
		//  遍历合并的行数据
		data.forEach((row, rowIndex) => {
			// 第N列第一行
			column[prop][rowIndex] = [1, 1];
			if (rowIndex === 0) {
				// 记录当前行号
				position = 0;
				// row[prop] === data[rowIndex - 1][prop] &&
			} else if (
				row[prop] === data[rowIndex - 1][prop] &&
				row.exitStoreId === data[rowIndex - 1].exitStoreId &&
				row.runid === data[rowIndex - 1].runid &&
				row.repairDetailId === data[rowIndex - 1].repairDetailId
			) {
				// 当前行数据等于上一行，根据记录的行号，计算需要合并几行。
				column[prop][position][0] += 1;
				// 当前行 隐藏不显示
				column[prop][rowIndex][0] = 0;
			} else {
				// 不相等之后，重置记录行号
				position = rowIndex;
			}
		});
	});
	return column;
};
// 排列序号
const indexobj = () => {
	let num = 0;
	mergeArr.value['exitStoreId'].forEach((item: any, index: number) => {
		if (item[0] != 0) {
			indexNum.value[index] = num += 1;
		}
	});
};

// 自定义序号
const indexMethod = (index: number) => {
	return indexNum.value[index];
};
//获取维修单草稿
const getRepairDraftData = async (selectlist?: EmptyArrayType) => {
	dialogState.tableData.config.loading = true;
	const res = await getRepairDraftApi();
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
		let copy = Object.assign([], res.data.details);
		dialogState.tableData.form = Object.assign(dialogState.tableData.form, res.data);
		// 在這拆了我又要合，合了我又要拆了之後傳給你，就不能一條一條給我嗎，你方便我也方便,煩人
		for (let i = 0; i < copy.length; i++) {
			let cur = copy[i];
			if (cur.changedMatNo) {
				// console.log('dialogState', dialogState.tableData.data.length);
				// console.log('copy', copy.length);
				// console.log('i', i);
				// console.log('合', dialogState.tableData.data.length - (copy.length - i) + 1);
				dialogState.tableData.data.splice(dialogState.tableData.data.length - (copy.length - i) + 1, 0, {
					exitStoreId: cur.exitStoreId,
					exitqty: cur.exitqty,
					exitreason: cur.exitreason,
					prItemNo: cur.prItemNo,
					drawNo: cur.changedDrawNo,
					matno: cur.changedMatNo,
					namech: cur.changedNameCh,
					nameen: cur.changedNameEn,
					isNew: true,
				});
			}
		}
		if (selectlist) {
			dialogState.tableData.data = dialogState.tableData.data.concat(selectlist);
			nextTick(() => {
				dialogtableRef.value.tableScrollToRow(res.data.details.length, true);
			});
		}
		// 计算合并的行'exitqty', 'exitreason', 'prItemNo',
		mergeArr.value = colMethod(['exitqty', 'exitreason', 'prItemNo', 'exitStoreId', 'operation'], dialogState.tableData.data);
		indexobj(); //排列序号
	} else {
		isHaveDraft.value = false;
		state.tableData.topBtnConfig?.forEach((item) => {
			item.isSure = item.type === 'other' ? true : false;
		});
	}
};
//删除
const onDelRow = (row: EmptyObjectType, i: number) => {
	dialogState.tableData.data.splice(i, row.changedMatNo ? 2 : 1);
};
let detaileRow: EmptyObjectType = {};
// 查看詳情（又是不一樣的參數名，煩人）
const openDetailDialog = async (row: EmptyObjectType) => {
	dialogState.tableData.config.loading = true;
	detaileRow = row.row;
	dilogTitle.value = '詳情';
	presentationDialogVisible.value = true;
	let tableData = dialogState.tableData;
	changeDialogStatus(false, [{ type: 'detail', name: '查看返修記錄', color: '#e6a23c', isSure: false, disabled: false }], 160);
	tableData.header = header1.value;
	const res = await getRepairRecordDetailApi(row.row.repairNo);
	res.data.details.forEach((item: any) => {
		item.exitStoreOperator = `${item.exitStoreOperator} / ${item.exitStoreOperatorName}`;
		if (item.rerepairRecords.length <= 0) {
			item.disabled = true;
		}
	});
	tableData.data = res.data.details;
	tableData.form['describe'] = res.data.describe;
	let copy = Object.assign([], res.data.details);
	copy.forEach((item: any, index: number) => {
		if (item.oldManNo) {
			item.isNew = true;
			dialogState.tableData.data.splice(dialogState.tableData.data.length - (copy.length - index), 0, {
				...item,
				drawNo: item.oldDrawNo,
				matNo: item.oldManNo,
				nameCh: item.oldNameCh,
				nameEn: item.oldNameEn,
				isNew: false,
			});
		}
	});
	// 计算合并的行
	mergeArr.value = colMethod(
		[
			'prItemNo',
			'pendingStorageQty',
			'pendingReceiptQty',
			'exitStoreOperator',
			'uselessQty',
			'qty',
			'reason',
			'storedQty',
			'pendingCheckQty',
			'operation',
		],
		dialogState.tableData.data
	);
	if (res.status) {
		tableData.config.loading = false;
	}
};
// 查看附件
const lookReturnAttachment = async (scope: any, type: string) => {
	const res = await getOperAttachmentApi(17, scope.row.runid);
	if (res.status) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${res.data}`, '_blank');
	}
};
let dialogType = '';

// 点击送修按钮
const onOpenSendRepair = async (selectlist: EmptyObjectType[], type: string) => {
	num = 0;
	loadingBtn.value = false;
	dialogState.tableData.form = {};
	presentationDialogVisible.value = true;
	let tableData = dialogState.tableData;
	tableData.header = header.value;
	changeDialogStatus(
		true,
		[
			{ type: 'editMat', name: '變更料號', color: '#e6a23c', isSure: false, disabled: false },
			{ type: 'del', name: '移除', color: '#D33939', isSure: true, disabled: false },
		],
		230
	);
	tableData.config.loading = false;
	dilogTitle.value = '維修單提報';
	dialogType = type;
	tableData.data = selectlist;

	if (type === 'addData') {
		dialogState.tableData.data.forEach((item) => {
			item.isBorder = true;
			item.changedNameCh = '';
			item.changedNameEn = '';
			item.changedDrawNo = '';
			item.changedMatNo = '';
		});
		getRepairDraftData(selectlist);
	} else if (type === 'continueEdit') {
		getRepairDraftData();
	} else {
		dialogState.tableData.data.forEach((item) => {
			item.changedNameCh = '';
			item.changedNameEn = '';
			item.changedDrawNo = '';
			item.changedMatNo = '';
		});
	}
	// 计算合并的行'exitqty', 'exitreason', 'prItemNo',
	mergeArr.value = colMethod(['exitqty', 'exitreason', 'prItemNo', 'exitStoreId', 'operation'], dialogState.tableData.data);
	indexobj(); //排列序号
};
const changeDialogStatus = (isShow: boolean, btn: EmptyArrayType, operateWidth: number) => {
	let tableData = dialogState.tableData;
	tableData.config.isSerialNo = isShow;
	tableData.btnConfig = btn;
	tableData.config.operateWidth = operateWidth;
};
// 点击退庫數量查看二維碼
const colorType = ref();
const matNoClick = async (row: EmptyObjectType, column: EmptyObjectType) => {
	// if (column.property === 'matno') {
	// 	matnoDetailDialogRef.value.openDialog('matno', row, '退庫詳情');
	// } else
	colorType.value = '';
	if (column.property === 'exitqty' && row.codeManageMode === 0) {
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
			const res = await getRepairDraftDeleteApi();
			dialogState.tableData.form = {};
			dialogState.tableData.data = [];
			getRepairDraftData();
			getTableData(state.tableData);
			presentationDialogVisible.value = false;
		})
		.catch(() => {});
};
// 保存或者提交
const onSubmit = async (formEl: FormInstance | undefined, type: string) => {
	if (type !== 'submit') {
		// 提交按鈕要必填送修時間，保存按鈕不用，如果先點了提交按鈕出現了校驗提示，再點保存按鈕清除校驗提示
		dialogFormRef.value.clearValidate(`sendRepairDate`);
	}
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid && type === 'submit') return ElMessage.warning(t('請填寫送修時間'));
		// if (!dialogState.tableData.form['sendRepairDate'] ) return ElMessage.warning(t('請填寫送修時間'));
		let allData: EmptyObjectType = {};
		dialogState.tableData.data.forEach((item, index) => {
			item['exitStoreId'] = item.runid || item.exitStoreId;
		});
		allData = { ...dialogState.tableData.form };
		allData['details'] = Object.assign([], dialogState.tableData.data);
		allData['details'].forEach((item: any, index: number) => {
			if (item.isNew) {
				allData['details'].splice(index, 1);
			}
		});
		if (type === 'save') {
			if (!isHaveDraft.value) {
				// 草稿創建
				const res = await getRepairDraftCreateApi(allData);
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
				const res = await getRepairDraftUpdateApi(allData);
				if (res.status) {
					isChange = false;
					ElMessage.success(t('保存成功'));
				}
			}
			getTableData(state.tableData);
		} else {
			loadingBtn.value = true;
			const res = await getSubmitRepairOrderApi(allData);
			if (res.status) {
				ElMessage.success(t('送修成功'));
				if (isHaveDraft.value) {
					const res1 = await getRepairDraftDeleteApi();
				}
				state.tableData.topBtnConfig?.forEach((item) => {
					item.isSure = item.type === 'other' ? true : false;
				});
				isHaveDraft.value = false;
				getTableData(state.tableData);
				ElMessageBox.confirm(`維修單號：${res.data}`, '提示', {
					confirmButtonText: '確 定',
					showCancelButton: false,
					showClose: false,
					type: 'success',
					draggable: true,
				})
					.then(async () => {
						presentationDialogVisible.value = false;
					})
					.catch(() => {});
			}
			loadingBtn.value = false;
		}
	});
};
// 取消
const onClose = () => {
	num = 0;
	// console.log(isChange);
	if (isChange && activeName.value === 'first') {
		ElMessageBox.confirm(`未保存確定退出嗎？`, '提示', {
			confirmButtonText: '確 定',
			cancelButtonText: '取 消',
			type: 'warning',
			draggable: true,
		})
			.then(async () => {
				presentationDialogVisible.value = false;
				isChange = false;
				if (dialogType != 'other') {
					dialogState.tableData.data.forEach((item) => {
						item.prItemNo = '';
					});
				}
			})
			.catch(() => {});
	} else {
		presentationDialogVisible.value = false;
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
// 页面加载时
onMounted(() => {
	getTableData(state.tableData);
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
.circleNew {
	border: 1px solid red;
	border-radius: 50%;
	color: red;
	font-size: 12px;
	padding: 4px 3px 2px 4px;
}
.circleOut {
	border: 1px solid red;
	border-radius: 50%;
	color: red;
	font-size: 10px;
	padding: 6px 1.5px 5px 2px;
}
.circleIn {
	border: 1px solid #67c23a;
	border-radius: 50%;
	color: #67c23a;
	font-size: 10px;
	padding: 6px 1.5px 5px 2px;
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
