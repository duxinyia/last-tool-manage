<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="需求請購單" name="first">
			<div class="title">需求請購單</div>

			<div @click="onImportTable" style="position: absolute; right: 20px">
				<el-button size="default" type="primary" plain> 批量導入 </el-button>
			</div>
			<el-form ref="tableSearchRef" size="default" label-width="auto" class="table-form">
				<el-row>
					<el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4" class="mb20 mr20" v-for="(val, key) in state.tableData.search" :key="key">
						<el-form-item :label="$t(val.label)" :prop="val.prop">
							<el-input
								:maxlength="val.maxlength"
								v-model="state.tableData.form[val.prop]"
								:placeholder="`請輸入${$t(val.label)}`"
								clearable
								v-if="val.type === 'input'"
								style="width: 150px"
							/>
							<span v-else style="color: red; width: 100%">
								{{ state.tableData.form[val.prop] }}
							</span>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<!-- 表格 -->
			<el-form ref="tableFormRef" :model="state.tableData" size="default">
				<Table
					ref="tableRef"
					v-bind="state.tableData"
					class="table"
					@delRow="(row: EmptyObjectType, i: number)=>onDelRow(row,i,state.tableData)"
					@addrow="onAddRow(state.tableData)"
					@remoteMethod="(index: number, query: string)=>remoteMethod(index, query,state.tableData)"
					@selectBlur="(scope: EmptyObjectType)=>onSelectBlur(scope,state.tableData)"
					@changeselect="changeSelect"
					@selectFocus="onSelectFocus"
				/>
			</el-form>
			<div class="describe">
				<span>備註：</span>
				<el-input
					class="input-textarea"
					show-word-limit
					v-model="state.tableData.form['describe']"
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
					<el-input v-model="attachmentName" :placeholder="$t('點擊選擇附件')" :readonly="true" :suffix-icon="FolderOpened">
						<template #append v-if="attachmentName">
							<text class="look-file mr10" @click.stop="clearUpload">清空文件</text>
							<text class="look-file" @click.stop="lookUpload">查看文件</text>
						</template>
						>
					</el-input>
				</el-upload>
			</div>

			<!-- 提交按钮 -->
			<span class="table-bottom">
				<el-button :loading="saveLoading" type="info" @click="onClearData" size="default">重置</el-button>
				<el-button :loading="saveLoading" type="success" @click="onSubmit(tableFormRef, 1, state.tableData)" size="default">保存</el-button>
				<el-button :loading="subLoading" type="primary" @click="onSubmit(tableFormRef, 2, state.tableData)" size="default">提交</el-button>
			</span>
		</el-tab-pane>
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="請購單記錄" name="second">
			<TableSearch :search="secondState.tableData.search" @search="onSearch" :searchConfig="secondState.tableData.searchConfig" labelWidth="70px" />
			<Table
				ref="tableRef2"
				v-bind="secondState.tableData"
				class="table"
				@sortHeader="onSortHeader"
				@pageChange="onTablePageChange"
				@onOpenOtherDialog="openDetailDialog"
			/>
		</el-tab-pane>
		<!-- 上传进度条弹窗 -->
		<el-dialog v-model="showProgress" title="上傳進度" width="30%" :close-on-click-modal="false" :modal="false" :show-close="false">
			<div>
				<div>
					<!-- 进度条百分比 -->
					<el-progress :percentage="uploadPercentage" :format="format" max="100"></el-progress>
				</div>
			</div>
		</el-dialog>
		<!-- 彈窗 -->
		<el-dialog draggable :close-on-click-modal="false" :destroy-on-close="true" v-model="detailDialogVisible" title="詳情" width="95%">
			<el-form ref="dialogFormRef" :model="dialogState.tableData.form" size="default" label-width="100px">
				<el-row>
					<el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6" class="mb10" v-for="(val, key) in dialogState.tableData.dialogConfig" :key="key">
						<el-form-item :label="val.type === 'status' ? (isDraft ? $t(val.label) : '') : $t(val.label)" :prop="val.prop">
							<el-input
								v-if="val.type === 'input'"
								:maxlength="val.maxlength"
								v-model="dialogState.tableData.form[val.prop]"
								:placeholder="`請輸入${$t(val.label)}`"
								clearable
								style="width: 150px"
							/>
							<!-- <el-date-picker
								v-if="val.type === 'dateRange'"
								value-format="YYYY-MM-DD"
								v-model="dialogState.tableData.form[val.prop]"
								type="daterange"
								range-separator="-"
								start-placeholder="開始日期"
								end-placeholder="結束日期"
								style="width: 100%"
							/> -->
							<span v-if="val.type === 'text'" style="color: #1890ff; font-weight: 700; line-height: 30px" class="ml10">{{
								dialogState.tableData.form[val.prop]
							}}</span>
							<template v-if="val.type === 'status' && dialogState.tableData.form[val.prop]">
								<el-tag size="large" type="warning">草稿</el-tag>
							</template>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<el-form ref="dialogtableFormRef" :model="dialogState.tableData" size="default">
				<Table
					ref="dialogTableRef"
					v-bind="dialogState.tableData"
					class="table"
					@delRow="(row: EmptyObjectType, i: number)=>onDelRow(row,i,dialogState.tableData)"
					@addrow="onAddRow(dialogState.tableData)"
					@remoteMethod="(index: number, query: string)=>remoteMethod(index, query,dialogState.tableData)"
					@changeselect="changeSelect"
					@selectFocus="onSelectFocus"
					@toggleRowExpansion="toggleRowExpansion"
					@rowClick="toggleRowExpansion"
					:expandedRowKeys="expandedRowKeys"
					:row-style="tableRowClassName"
				>
					<template #expand="{ expandProps }">
						<h4 class="pt20 pb10">收貨記錄</h4>
						<el-table
							ref="singleTableRef"
							style="padding-bottom: 30px; border: 2px solid #a2d2ff"
							:data="expandProps.row.child"
							v-loading="loading"
							:cell-style="cellStyle"
							:header-cell-style="headerCellStyle"
							empty-text="暫無收貨記錄"
						>
							<el-table-column
								align="center"
								v-for="(item, index) in setExpandHeader"
								:key="index"
								show-overflow-tooltip
								:prop="item.key"
								:width="item.colWidth"
								:label="$t(item.title)"
							>
								<template v-slot="scope">
									<el-popover v-if="item.type === 'popover' && scope.row.failQty > 0" placement="bottom-start" width="2%" trigger="hover">
										<span>跳轉到二次收貨</span>
										<template #reference>
											<span
												style="text-align: center; width: 100%; cursor: pointer; color: red"
												@click="transSecond(scope, dialogState.tableData.data)"
											>
												{{ scope.row.failQty }}
											</span>
										</template>
									</el-popover>
								</template>
							</el-table-column>
							<el-table-column align="right" header-align="center" :label="$t('message.pages.operation')" :width="140">
								<template v-slot="scope">
									<el-button
										:disabled="scope.row.disabled || false"
										class="button"
										type="primary"
										plain
										size="default"
										@click="openQrcodeDialog(scope.row)"
										><el-icon class="mr5"><ele-View /></el-icon>查看二維碼</el-button
									>
								</template>
							</el-table-column>
						</el-table>
					</template>
				</Table>
			</el-form>
			<div class="describe">
				<span>備註：</span>
				<el-input
					v-if="isDraft"
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
			<div class="describe" v-if="isDraft">
				<span>附件：</span>
				<el-upload
					style="width: 100%"
					v-model:file-list="fileDetail"
					:auto-upload="false"
					ref="inputuploadDetailRefs"
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
			<el-button class="mt5" v-else size="default" type="success" auto-insert-space @click="lookUpload"> 查看附件 </el-button>
			<template #footer>
				<span class="dialog-footer" v-if="isDraft">
					<el-button size="default" auto-insert-space @click="detailDialogVisible = false">取 消</el-button>
					<el-button size="default" type="danger" auto-insert-space :loading="delLoading" @click="onDelData"> 刪除草稿 </el-button>
					<el-button
						size="default"
						type="success"
						auto-insert-space
						@click="onSubmit(dialogtableFormRef, 1, dialogState.tableData)"
						:loading="saveLoading"
					>
						保 存
					</el-button>
					<el-button
						size="default"
						type="primary"
						auto-insert-space
						@click="onSubmit(dialogtableFormRef, 2, dialogState.tableData)"
						:loading="subLoading"
					>
						提 交
					</el-button>
				</span>
			</template>
		</el-dialog>
		<!-- 上传文件弹窗 -->
		<el-dialog draggable :close-on-click-modal="false" v-model="upLoadDialogVisible" title="上传文件" width="40%">
			<el-form label-width="100px">
				<el-button size="default" class="buttonBorder mb10" @click="onDownloadTemp" type="primary" plain>{{ $t('下載模板') }}</el-button>
				<div class="download-form">
					<el-input :readonly="true" v-model="fileListName" placeholder="請點擊瀏覽文件按鈕" />
					<el-upload
						v-model:file-list="fileList"
						:auto-upload="false"
						ref="uploadRefs"
						action=""
						class="upload"
						drag
						accept=".xlsx, .xls"
						:limit="1"
						:show-file-list="false"
						:on-exceed="handleExceed"
						:on-change="handleChange"
					>
						<el-button type="primary" size="default" class="ml10 buttonBorder bottonDownload" plain>瀏覽文件</el-button>
					</el-upload>
					<el-button
						:disabled="fileListName && uploadForm ? false : true"
						size="default"
						class="ml10 buttonBorder bottonDownload"
						type="primary"
						plain
						@click="submitUpload(tableFormRef)"
						>{{ $t('開始上傳') }}</el-button
					>
				</div>
			</el-form>
		</el-dialog>
		<!-- 二維碼 -->
		<qrCodeDialog ref="qrcodeDialogRef" :tags="tags" dialogTitle="庫存條碼" />
	</el-tabs>
</template>

<script setup lang="ts" name="requistManagepresentation">
import { defineAsyncComponent, reactive, ref, onMounted, watch, nextTick } from 'vue';
import { FolderOpened } from '@element-plus/icons-vue';
import {
	ElMessage,
	ElMessageBox,
	ElTable,
	genFileId,
	TabsPaneContext,
	UploadInstance,
	UploadProps,
	UploadRawFile,
	UploadUserFile,
} from 'element-plus';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const qrCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/qrCodeDialog.vue'));
// 接口
import {
	getApplyRecordDetailApi,
	getCreateOrUpdateDraftApi,
	getDeleteDraftApi,
	getProgressOfApplyRecordDetailApi,
	getQueryApplyRecordApi,
	getQueryNoPageApi,
	getSubmitDraftApi,
} from '/@/api/requistManage/presentation';
import { getMachineTypesOfMatApi } from '/@/api/partno/noSearch';
import { getImportApplyDetailsApi, getUploadFileApi } from '/@/api/global';
import { useRoute } from 'vue-router';
import { getCodesOfApplyPutStorageApi } from '/@/api/requistManage/entryJob';
const route = useRoute();
// 定义变量内容
const { t } = useI18n();
const tableRef = ref();
const dialogTableRef = ref();
const qrcodeDialogRef = ref();
// tags的数据
let tags = ref<EmptyArrayType>([]);
const tableRef2 = ref();
const tableFormRef = ref();
const dialogtableFormRef = ref();
const resDataRef = ref([]);
const subLoading = ref(false);
const saveLoading = ref(false);
const delLoading = ref(false);
const detailDialogVisible = ref(false);
const upLoadDialogVisible = ref(false);
const fileListName = ref();
const loading = ref(false);
const fileList = ref<UploadUserFile[]>([]);
const uploadRefs = ref<UploadInstance>();
const inputuploadRefs = ref<UploadInstance>();
const inputuploadDetailRefs = ref<UploadInstance>();
const singleTableRef = ref();
const attachmentName = ref('');
const file = ref();
const fileDetail = ref();
const activeName = ref<string | number>((route.query.page as string) || 'first');
const uploadForm = ref();
const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	// activeName.value === 'first' ? 0 : getTableData();
};
const setExpandHeader = ref([
	{ key: 'status', colWidth: '', title: '狀態', type: 'text', isCheck: true, isRequired: false },
	{ key: 'applyReceiveId', colWidth: '', title: '收貨單號', type: 'text', isCheck: true, isRequired: false },
	{ key: 'receiveSubmitTime', colWidth: '110', title: '收貨提交時間', type: 'text', isCheck: true, isRequired: false },
	{ key: 'receiveDate', colWidth: '', title: '收貨日期', type: 'text', isCheck: true, isRequired: false },
	{ key: 'receiveQty', colWidth: '', title: '收貨數量', type: 'text', isCheck: true, isRequired: false },
	{ key: 'receiveDescribe', colWidth: '', title: '收貨備註', type: 'text', isCheck: true, isRequired: false },

	{ key: 'engineer', colWidth: '100', title: '工程驗收人', type: 'text', isCheck: true, isRequired: false },
	{ key: 'applyCheckId', colWidth: '', title: '驗收單號', type: 'text', isCheck: true, isRequired: false },
	{ key: 'checkSubmitTime', colWidth: '110', title: '驗收提交時間', type: 'text', isCheck: true, isRequired: false },
	{ key: 'checkDate', colWidth: '', title: '驗收日期', type: 'text', isCheck: true, isRequired: false },
	{ key: 'passQty', colWidth: '110', title: '驗收通過數量', type: 'text', isCheck: true, isRequired: false },
	{ key: 'failQty', colWidth: '130', title: '驗收不通過數量', type: 'popover', isCheck: true, isRequired: false },
	{ key: 'checkDescribe', colWidth: '', title: '驗收備註', type: 'text', isCheck: true, isRequired: false },
	{ key: 'checkSignStatus', colWidth: '110', title: '驗收簽核狀態', type: 'text', isCheck: true, isRequired: false },

	{ key: 'dispatchTime', colWidth: '', title: '發料時間', type: 'text', isCheck: true, isRequired: false },
	{ key: 'storageType', colWidth: '', title: '倉庫類型', type: 'text', isCheck: true, isRequired: false },
	{ key: 'sLocation', colWidth: '', title: '倉庫位置', type: 'text', isCheck: true, isRequired: false },

	{ key: 'applyPutStorageId', colWidth: '', title: '入庫單號', type: 'text', isCheck: true, isRequired: false },
	{ key: 'putStorageTime', colWidth: '', title: '入庫時間', type: 'text', isCheck: true, isRequired: false },
	{ key: 'putStorageDescribe', colWidth: '', title: '入庫備註', type: 'text', isCheck: true, isRequired: false },
]);
// 彈窗form數據
const state = reactive<EmptyObjectType>({
	tableData: {
		// 列表数据（必传）
		data: [{}],
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: true, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			height: 470,
			isAddRowBtn: true, //是否有添加行按钮
		},
		// 表头内容（必传，注意格式）
		header: [
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
			{ key: 'drawNo', colWidth: '100', title: '圖紙編號', type: 'text', isCheck: true, isRequired: false },
			{ key: 'reqMatNo', colWidth: '150', title: '請購料號', type: 'text', isCheck: true, isRequired: false },
			{ key: 'nameCh', colWidth: '110', title: '品名-中文', type: 'text', isCheck: true, isRequired: false },
			{ key: 'nameEn', colWidth: '110', title: '品名-英文', type: 'text', isCheck: true, isRequired: false },
			{
				key: 'machineType',
				colWidth: '150',
				title: '機種',
				type: 'select',
				isCheck: true,
				isRequired: true,
				collapseTags: true,
				collapseTagsTooltip: true,
				clearable: true,
				rowOption: true,
			},
			{ key: 'line', colWidth: '', title: '線體', type: 'input', isCheck: true, isRequired: true },
			{ key: 'reqQty', colWidth: '150', title: 'PR數量', type: 'number', isCheck: true, isRequired: true, min: 0 },
			{ key: 'reqDate', colWidth: '150', title: '需求時間', type: 'time', isCheck: true, isRequired: true, isdisabledDate: false },
			{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'input', isCheck: true, isRequired: false, maxlength: 20 },
		],
		// 弹窗表单
		dialogConfig: [],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		searchConfig: {
			isSearchBtn: false, //搜索框
		},
		search: [
			{ label: '申請單號：', prop: 'reqNo', placeholder: '', type: 'text' },
			{ label: 'PR單號', prop: 'prNo', placeholder: '请输入PR單號', type: 'input', maxlength: 20 },
		],
		// 给后端的数据
		form: {
			reqNo: '',
		},
	},
});
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'reqNo', colWidth: '', title: '申請單號', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR單號', type: 'text', isCheck: true },
			{ key: 'statusStr', colWidth: '', title: '狀態', type: 'text', isCheck: true },
			{ key: 'submitTime', colWidth: '', title: '提交時間', type: 'text', isCheck: true },
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
			{ label: '申請單號', prop: 'reqNo', required: false, type: 'input' },
			{ label: 'PR單號', prop: 'prNo', required: false, type: 'input' },
			{ label: '提交時間', prop: 'submitTime', required: false, type: 'dateRange' },
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
const dialogState = reactive<EmptyObjectType>({
	tableData: {
		// 列表数据（必传）
		data: [{}],
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: false, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: true, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			height: 500,
			isAddRowBtn: true, //是否有添加行按钮
			expand: true,
		},
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'input', othersType: 'input', isCheck: true, isRequired: false, maxlength: 20 },
			{
				key: 'applyCheckId',
				colWidth: '',
				title: ' ',
				type: 'status',
				isCheck: true,
				successText: '二次收貨',
				infoText: '否',
				color: 'danger',
			},
			{
				key: 'matNo',
				colWidth: '250',
				title: 'message.pages.matNo',
				type: 'select',
				othersType: 'select',
				isCheck: true,
				isRequired: true,
				loading: false,
				option: [],
				isfilterable: true,
			},
			{ key: 'drawNo', colWidth: '100', title: '圖紙編號', type: 'text', isCheck: true, isRequired: false },
			{ key: 'reqMatNo', colWidth: '150', title: '請購料號', type: 'text', isCheck: true, isRequired: false },
			{ key: 'nameCh', colWidth: '110', title: '品名-中文', type: 'text', isCheck: true, isRequired: false },
			{ key: 'nameEn', colWidth: '110', title: '品名-英文', type: 'text', isCheck: true, isRequired: false },
			{
				key: 'machineType',
				colWidth: '150',
				title: '機種',
				type: 'select',
				othersType: 'select',
				isCheck: true,
				isRequired: true,
				collapseTags: true,
				collapseTagsTooltip: true,
				clearable: true,
				rowOption: true,
			},
			{ key: 'line', colWidth: '', title: '線體', type: 'input', othersType: 'input', isCheck: true, isRequired: true },
			{ key: 'reqQty', colWidth: '150', title: 'PR數量', type: 'number', othersType: 'number', isCheck: true, isRequired: true, min: 0 },
			{
				key: 'reqDate',
				colWidth: '150',
				title: '需求時間',
				type: 'time',
				othersType: 'time',
				isCheck: true,
				isRequired: true,
				isdisabledDate: false,
			},

			// { key: 'describe', colWidth: '150', title: '備註', type: 'textarea', othersType: 'textarea', isCheck: true, isRequired: false },
			{ key: 'receivedQty', colWidth: '110', title: '已收貨數量', type: 'text', isCheck: true, isRequired: false },
			{ key: 'checkPassQty', colWidth: '120', title: '驗收通過數量', type: 'text', isCheck: true, isRequired: false },
			{ key: 'checkFailQty', colWidth: '130', title: '驗收不通過數量', type: 'text', isCheck: true, isRequired: false },
			{ key: 'dispatchedQty', colWidth: '110', title: '已發料數量', type: 'text', isCheck: true, isRequired: false },
			{ key: 'storedQty', colWidth: '110', title: '已入庫數量', type: 'text', isCheck: true, isRequired: false },
		],
		// 弹窗表单
		dialogConfig: [
			{ label: '申請單號:', prop: 'reqNo', placeholder: '', required: false, type: 'text' },
			{ label: 'PR單號:', prop: 'prNo', placeholder: '', required: false, type: 'text', othersType: 'input' },
			// { label: '提交時間:', prop: 'submitTime', placeholder: '', required: false, type: 'text', othersType: 'dateRange' },
			{ label: '狀態:', prop: 'isDraft', placeholder: '', required: false, type: 'status' },
		],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		searchConfig: {
			isSearchBtn: false, //搜索框
		},
		search: [],
		// 给后端的数据
		form: {},
	},
});

// 初始化列表数据
const getTableData = async () => {
	{
		secondState.tableData.config.loading = true;
		const form = secondState.tableData.form;
		form.startSubmitTime = (form.submitTime && form.submitTime[0]) || null;
		form.endSubmitTime = (form.submitTime && form.submitTime[1]) || null;
		delete form.submitTime;
		const data = { ...form, page: secondState.tableData.page };
		const res = await getQueryApplyRecordApi(data);
		secondState.tableData.data = res.data.data;
		secondState.tableData.config.total = res.data.total;
		if (res.status) {
			secondState.tableData.config.loading = false;
		}
	}
};
// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType) => {
	secondState.tableData.page.pageNum = page.pageNum;
	secondState.tableData.page.pageSize = page.pageSize;
	getTableData();
};
// 拖动显示列排序回调
const onSortHeader = (data: TableHeaderType[]) => {
	secondState.tableData.header = data;
};
const onSearch = (data: EmptyObjectType) => {
	secondState.tableData.form = Object.assign({}, secondState.tableData.form, { ...data });
	tableRef2.value && tableRef2.value?.pageReset();
};
const isDraft = ref();
// 打開詳情彈窗
const openDetailDialog = async (scope: EmptyObjectType, type: string, reqNo?: string) => {
	expandedRowKeys.value = [];
	dialogState.tableData.config.loading = true;
	const res = await getApplyRecordDetailApi(Object.keys(scope).length > 0 ? scope.row.reqNo : reqNo);
	dialogState.tableData.form = res.data;
	dialogState.tableData.data = res.data.details;
	isDraft.value = res.data.isDraft;
	dialogState.tableData.dialogConfig.forEach((item: any) => {
		if (item.prop === 'prNo') {
			item.type = res.data.isDraft ? item.othersType || item.type : 'text';
		}
	});
	dialogState.tableData.header.forEach((item: any) => {
		item.type = res.data.isDraft ? item.othersType || item.type : 'text';
		if (item.key == 'applyCheckId') {
			item.type = 'status';
		}
		const hideArr = ['receivedQty', 'checkPassQty', 'checkFailQty', 'dispatchedQty', 'storedQty', 'applyCheckId'];
		if (hideArr.includes(item.key)) {
			item.isCheck = res.data.isDraft ? false : true;
		}
		const requiredArr = ['matNo', 'machineType', 'line', 'reqQty', 'reqDate'];
		if (requiredArr.includes(item.key)) {
			item.isRequired = res.data.isDraft ? true : false;
		}
	});
	dialogState.tableData.config.isAddRowBtn = res.data.isDraft ? true : false;
	dialogState.tableData.config.isOperate = res.data.isDraft ? true : false;
	dialogState.tableData.config.expand = res.data.isDraft ? false : true;
	// dialogState.tableData.config.isSerialNo = res.data.isDraft ? true : false;
	detailDialogVisible.value = true;
	if (res.status) {
		dialogState.tableData.config.loading = false;
	}
};
const remoteMethod = (index: number, query: string, datas: EmptyObjectType) => {
	if (query) {
		datas.header.forEach((item: any) => {
			if (item.key === 'matNo') {
				item.loading = true;
			}
		});
		setTimeout(async () => {
			const res = await getQueryNoPageApi(query);
			resDataRef.value = res.data;
			datas.header.forEach((item: any) => {
				if (item.key === 'matNo') {
					item.loading = false;
					item.option = res.data.map((item: EmptyObjectType) => {
						return { ...item, value: `${item.matNo}`, label: `${item.matNo}` };
					});
				}
			});
			const matNos: EmptyArrayType = [];
			res.data.forEach((item: any) => {
				matNos.push(item.matNo);
			});
			if (res.data.length === 1 && matNos.includes(query)) {
				datas.data[index].matNo = query;
				changeSelect(index, query);
			}
			// datas.header[0].option = option.filter((item: EmptyObjectType, index) => {
			// 	return item.label.toLowerCase().includes(query.toLowerCase());
			// });
		}, 500);
	} else {
		datas.header.forEach((item: any) => {
			if (item.key === 'matNo') {
				item.option = [];
			}
		});
	}
};
// let links = ref([]);
// // 获取输入建议的方法， 仅当你的输入建议数据 resolve 时，通过调用 callback(data:[])  来返回它
// const querySearchAsync = async (queryString: string, cb: (arg: any) => void) => {
// 	if (queryString) {
// 		let res = await getQueryNoPageApi(queryString);
// 		res.data.forEach((item: any) => {
// 			item['value'] = item.matNo;
// 		});
// 		links.value = res.data;
// 		const results = links.value;
// 		cb(results);
// 	} else {
// 		links.value = [];
// 		cb(links.value);
// 	}
// };
// // 	点击选中建议项时触发 清空数据
// const handleChange = (i: number) => {
// 	let data = state.tableData.data[i];
// 	data.nameCh = '';
// 	data.nameEn = '';
// };
// 下拉失去焦點
const onSelectBlur = (scope: EmptyObjectType, datas: EmptyObjectType) => {};
// // 	在 Input 值改变时触发
const changeSelect = async (i: number, query: any) => {
	resDataRef.value.forEach(async (item: any) => {
		if (item.matNo === query) {
			let data = activeName.value === 'first' ? state.tableData.data[i] : dialogState.tableData.data[i];
			data.nameCh = item.nameCh;
			data.nameEn = item.nameEn;
			data.drawNo = item.drawNo;
			data.reqMatNo = item.reqMatNo;
			data.machineType = item.machineType;
			// const res = await getMachineTypesOfMatApi(item.matNo);
			// data.machineTypeoption = res.data.map((item: EmptyObjectType) => {
			// 	return { value: `${item}`, label: `${item}` };
			// });
		}
	});
};
// 查看二維碼
const openQrcodeDialog = async (row: EmptyObjectType) => {
	let res = await getCodesOfApplyPutStorageApi(row.applyPutStorageId);
	if (res.data.length == 0) {
		ElMessage.error('暫無條碼數據');
	} else if (res.status) {
		tags.value = res.data;
		qrcodeDialogRef.value?.openDialog();
	}
};
// 右邊框
const cellStyle = ({ column }: any) => {
	const col = ['receiveDescribe', 'checkSignStatus', 'sLocation'];
	if (col.includes(column.property)) {
		return { borderRight: '1px solid #a2d2ff' };
	}
};
const headerCellStyle = ({ column }: any) => {
	const col = ['receiveDescribe', 'checkSignStatus', 'sLocation'];
	let sty: EmptyObjectType = { backgroundColor: 'white', color: '#438df5' };
	if (col.includes(column.property)) {
		sty.borderRight = '1px solid #a2d2ff';
	}
	return sty;
};
const tableRowClassName = ({ row, rowIndex }: any) => {
	if (row.flag) {
		return { 'background-color': '#d5e8fa', transition: 'all 1s  ease-in-out' };
	}
};
// 跳轉到二次收貨
const transSecond = (scope: EmptyObjectType, data: EmptyArrayType) => {
	data.forEach((item: any) => {
		item.flag = 0;
		if (item.applyDetailId === scope.row.reapplyDetailId) {
			item.flag = 1;
			item.expand = true;
			toggleRowExpansion(item, 1);
			nextTick(() => {
				dialogTableRef.value.setScrollTop();
			});
		}
	});
};
const remove = (array: any[], val: any) => {
	const index = array.indexOf(val);
	if (index > -1) {
		array.splice(index, 1);
		return true;
	}
	return false;
};
// 展開行
const expandedRowKeys = ref<string[]>([]);
const toggleRowExpansion = async (row: EmptyObjectType, falg?: number) => {
	if (row.applyDetailId && !remove(expandedRowKeys.value, row.applyDetailId)) {
		expandedRowKeys.value.push(row.applyDetailId);
	}
	// 先判断该行是否已经展开了
	if (!row.expand && !isDraft.value) {
		loading.value = true;
		const res = await getProgressOfApplyRecordDetailApi(row.applyDetailId);
		loading.value = false;
		dialogState.tableData.data.forEach((item: any, index: any) => {
			// 找到当前点击的行，把动态获取到的数据赋值进去
			if (item.applyDetailId === row.applyDetailId) {
				dialogState.tableData.data[index].child = res.data;
				const signStatusMap: EmptyObjectType = {
					0: '簽核撤回',
					1: '簽核中',
					2: '簽核完成',
				};

				res.data.forEach((item: any) => {
					item.checkSignStatus = signStatusMap[item.checkSignStatus];
					if (item.applyPutStorageId) {
						item.disabled = item.codeManageMode;
					} else {
						item.disabled = true;
					}
					item.engineer = `${item.engineer} / ${item.engineerName}`;
				});
				row.expand = true;
			}
		});
	} else if (falg === 1) {
		expandedRowKeys.value = [];
	} else {
		row.expand = false;
	}
};
const onSelectFocus = async (scope: EmptyObjectType) => {
	if (scope.column.property === 'machineType') {
		const res = await getMachineTypesOfMatApi(scope.row.matNo);
		scope.row.machineTypeoption = res.data.map((item: EmptyObjectType) => {
			return { value: `${item}`, label: `${item}` };
		});
	}
};
// 刪除草稿
const onDelData = async () => {
	ElMessageBox.confirm('確定刪除草稿嗎?', '提示', {
		confirmButtonText: '確 定',
		cancelButtonText: '取 消',
		type: 'warning',
		draggable: true,
	})
		.then(async () => {
			delLoading.value = true;
			const res = await getDeleteDraftApi(dialogState.tableData.form.reqNo);
			if (res.status) {
				ElMessage.success(t('刪除草稿成功'));
				detailDialogVisible.value = false;
				getTableData();
			}
			delLoading.value = false;
		})
		.catch(() => {});
};
// 增加一行数据
const onAddRow = (datas: EmptyObjectType) => {
	datas.data.push({});
	// 新增的时候超过表格了跟着移动
	nextTick(() => {
		tableRef.value.setScrollTop();
	});
	// 对 Table 进行重新布局。 当表格可见性变化时，您可能需要调用此方法以获得正确的布局
	// tableRef.value.doLayout();
};
// 新增的时候超过表格了跟着移动
// watch(
// 	() => state.tableData.data,
// 	() => {
// 		nextTick(() => {
// 			tableRef.value.setScrollTop();
// 		});
// 	},
// 	{ deep: true }
// );
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
//删除
const onDelRow = (row: EmptyObjectType, i: number, datas: EmptyObjectType) => {
	datas.data.splice(i, 1);
};
// 清空數據 重置
const onClearData = () => {
	const tableData = state.tableData;
	if (Object.keys(tableData.form).length <= 0 && tableData.data.length <= 1 && Object.entries(tableData.data[0]).length === 0)
		return ElMessage.warning(t('數據已經重置了，請勿繼續點擊重置按鈕'));
	ElMessageBox.confirm('確定重置嗎?', '提示', {
		confirmButtonText: '確 定',
		cancelButtonText: '取 消',
		type: 'warning',
		draggable: true,
	})
		.then(async () => {
			// 清空
			tableData.form = {};
			tableFormRef.value.resetFields();
			tableData.data = [{}];
		})
		.catch(() => {});
};
// 1.保存，2.提交
const onSubmit = async (formEl: EmptyObjectType | undefined, type: number, datas: EmptyObjectType) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格項必填未填'));
		const typeMap: EmptyObjectType = {
			1: '保存',
			2: '提交',
		};
		let allData: EmptyObjectType = {};
		allData = { ...datas.form };
		const data = datas.data.map((item: any) => {
			return {
				matNo: item.matNo,
				machineType: item.machineType,
				line: item.line,
				reqQty: item.reqQty,
				reqDate: item.reqDate,
				prItemNo: item.prItemNo,
				describe: item.describe,
			};
		});
		allData['details'] = data;
		if (datas.data.length <= 0) {
			ElMessage.warning(t(`${typeMap[type]}數據為空，請新增數據`));
		} else {
			if (type === 1) {
				saveLoading.value = true;
				const res = await getCreateOrUpdateDraftApi(allData);
				saveLoading.value = false;
				if (res.status) {
					datas.form.reqNo = res.data;
					ElMessage.success(t('保存草稿成功'));
				}
				getTableData();
			} else {
				if (!datas.form.reqNo) return ElMessage.warning(t(`請先保存數據，得到申請單號再提交`));
				ElMessageBox.confirm('確定提交嗎?', '提示', {
					confirmButtonText: '確 定',
					cancelButtonText: '取 消',
					type: 'warning',
					draggable: true,
				})
					.then(async () => {
						const res1 = await getCreateOrUpdateDraftApi(allData);
						if (res1.status) {
							subLoading.value = true;
							const res = await getSubmitDraftApi({ reqNo: datas.form.reqNo });
							subLoading.value = false;
							if (res.status) {
								ElMessage.success(t('提交成功'));
							}
							if (activeName.value !== 'first') {
								detailDialogVisible.value = false;
							}
							getTableData();
							// 清空
							const tableData = state.tableData;
							tableData.form = {};
							tableFormRef.value.resetFields();
							tableData.data = [{}];
						}
					})
					.catch(() => {});
			}
		}
	});
};
// 打开导入弹窗
const onImportTable = () => {
	upLoadDialogVisible.value = true;
	fileListName.value = '';
	uploadForm.value = '';
};
// 模板下载 /Template/請購單身導入模板.xlsx
const onDownloadTemp = () => {
	window.open(
		`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}/Template/請購單身導入模板.xlsx`,
		'_blank'
	);
};
// 改變文件
const inputHandleExceed: UploadProps['onExceed'] = (files) => {
	let inputRef = activeName.value === 'first' ? inputuploadRefs.value : inputuploadDetailRefs.value;
	inputRef!.clearFiles();
	const file = files[0] as UploadRawFile;
	file.uid = genFileId();
	inputRef!.handleStart(file);
};
// 文件input框里面的数据
const inputHandleChange: UploadProps['onChange'] = (uploadFile) => {
	if (activeName.value === 'first') {
		attachmentName.value = uploadFile.name;
	}
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
		if (activeName.value === 'first') {
			state.tableData.form['attachmentUrl'] = res.data;
		} else {
			dialogState.tableData.form['attachmentUrl'] = res.data;
		}
		showProgress.value = false;
	} else {
		attachmentName.value = '';
		file.value = [];
		showProgress.value = false;
	}
};
// 查看上传的文件
const lookUpload = () => {
	if (state.tableData.form['attachmentUrl'] || dialogState.tableData.form['attachmentUrl']) {
		window.open(
			`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${
				activeName.value === 'first' ? state.tableData.form['attachmentUrl'] : dialogState.tableData.form['attachmentUrl']
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
			if (activeName.value === 'first') {
				attachmentName.value = '';
				file.value = [];
				state.tableData.form['attachmentUrl'] = '';
			} else {
				fileDetail.value = [];
				dialogState.tableData.form['attachmentUrl'] = '';
			}
			ElMessage.success(`清空文件成功`);
		})
		.catch(() => {});
};
//可以在选中时自动替换上一个文件
const handleExceed: UploadProps['onExceed'] = (files) => {
	uploadRefs.value!.clearFiles();
	const file = files[0] as UploadRawFile;
	file.uid = genFileId();
	uploadRefs.value!.handleStart(file);
};
const handleChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
	fileListName.value = uploadFile.name;
	uploadForm.value = uploadFile;
};
// 上传文件
const submitUpload = async (formEl: EmptyObjectType | undefined) => {
	// uploadRefs.value!.submit();
	const res = await getImportApplyDetailsApi(uploadForm.value.raw);
	if (res.status) {
		if (state.tableData.data.length <= 1 && Object.entries(state.tableData.data[0]).length === 0) {
			state.tableData.data = res.data;
		} else {
			state.tableData.data.push(...res.data);
		}
		ElMessage.success('導入數據成功！');
		upLoadDialogVisible.value = false;
		if (!formEl) return;
		formEl.validate();
	}
};
// 页面加载时
onMounted(() => {
	getTableData();
	if (route.query.reqNo) {
		openDetailDialog({}, '', route.query.reqNo as string);
	}
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
.title {
	font-size: 20px;
	display: flex;
	justify-content: center;
	margin-bottom: 10px;
}
.describe {
	display: flex;
	margin-top: 10px;
	span {
		width: 50px;
	}
}
.table-bottom {
	display: flex;
	justify-content: flex-end;
	margin-top: 10px;
}
:deep(.el-tabs__content) {
	height: 100% !important;
}
:deep(.el-tabs__item) {
	font-weight: 700;
	font-size: 14px;
}
.bottonDownload {
	margin-top: 5px;
}
.download-form {
	display: flex;
	margin-bottom: 50px;
}
:deep(.el-upload-dragger) {
	border: 0;
	padding: 0;
	background-color: transparent;
	border-radius: unset;
}
// :deep(.ep-table__body tr.current-row > td.ep-table__cell) {
// 	background-color: #0887bd !important;
// }
@keyframes back-color {
	0% {
		opacity: 0;
	}
	100% {
		opacity: 1;
	}
}
.look-file {
	color: var(--el-color-primary) !important;
}
</style>
