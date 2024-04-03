<template>
	<div class="system-menu-dialog-container">
		<el-dialog
			draggable
			:close-on-click-modal="false"
			:title="state.dialog.title"
			v-model="state.dialog.isShowDialog"
			:width="dialogWidth"
			@close="close"
		>
			<template #header="{}">
				<slot name="Header" :hearName="state.dialog.title" :formData="state.formData"></slot>
			</template>
			<el-form v-if="state.dialog.type !== 'imp'" ref="dialogFormRef" :model="state.formData" size="default" :label-width="labelWidth || '100px'">
				<el-row :gutter="35">
					<el-col
						:xs="item.xs || 24"
						:sm="item.sm || 12"
						:md="item.md || 12"
						:lg="item.lg || 12"
						:xl="item.xl || 12"
						class="mb20"
						v-for="item in dialogConfig"
						:key="item.prop"
					>
						<el-form-item v-if="item.type != 'button' && item.type != 'null'" :label="$t(item.label)" :prop="item.prop" :rules="allRules(item)">
							<el-input
								:maxlength="item.maxlength"
								v-if="item.type === 'input'"
								v-model="state.formData[item.prop]"
								:placeholder="$t(item.placeholder) || `${$t('message.pages.pleaseEnter')} ${$t(item.label)}`"
								clearable
								@blur="(FocusEvent: Event)=>inputBlur(item,FocusEvent)"
								@focus="(FocusEvent: Event)=>inputFocus(item,FocusEvent)"
							></el-input>
							<el-date-picker
								v-if="item.type === 'date'"
								value-format="YYYY-MM-DD"
								v-model="state.formData[item.prop]"
								type="date"
								:disabled-date="(time:Date) => disabledDate(time, item.isdisabledDate)"
								:placeholder="$t(item.placeholder)"
								style="width: 100%"
								@blur="(FocusEvent: Event)=>inputBlur(item,FocusEvent)"
								@focus="(FocusEvent: Event)=>inputFocus(item,FocusEvent)"
							/>
							<!-- 数字输入框 -->
							<el-input-number
								v-if="item.type === 'number'"
								v-model="state.formData[item.prop]"
								:min="item.min || 0"
								:max="item.max"
								size="small"
								@change="(value:number)=>handleNumberInputChange(value)"
							/>
							<!-- 單選按鈕 -->
							<div v-if="item.type === 'radio'" class="mb-2 flex items-center">
								<el-radio-group v-model="state.formData[item.prop]" class="ml-4">
									<el-radio :label="0">有碼管理</el-radio>
									<el-radio :label="1">無碼管理</el-radio>
								</el-radio-group>
							</div>
							<!-- @change=" (val:any) => commonInputHandleChange(val,item.prop)" -->

							<!-- <el-input :width="224" v-if="item.type === 'tagtextarea'" v-model="state.formData[item.prop]">
								<template >
									<el-tag v-for="tag in tags" :key="tag.name" closable :type="tag.type">
										{{ tag.name }}
									</el-tag>
								</template>
							</el-input> -->
							<!-- 上傳文件優化 -->
							<el-upload
								style="width: 100%"
								v-if="item.type === 'optionFile'"
								v-model:file-list="inputfileList"
								:auto-upload="false"
								ref="inputuploadRefs"
								action="#"
								class="upload"
								drag
								:limit="1"
								:show-file-list="false"
								:on-exceed="newInputHandleExceed"
								:on-change="newInputHandleChange"
							>
								<el-input v-model="state.formData[item.prop]" :placeholder="$t(item.placeholder)"> > </el-input>
							</el-upload>
							<!-- 上傳文件優化 -->
							<el-upload
								style="width: 100%"
								v-if="item.type === 'inputFile'"
								v-model:file-list="state.formData[item.prop + 'file']"
								:auto-upload="false"
								ref="inputuploadRefs"
								action="#"
								class="upload"
								drag
								:limit="1"
								:show-file-list="false"
								:on-exceed="(uploadFile:any) => inputHandleExceed(uploadFile, item.prop)"
								:on-change="(uploadFile:any) => inputHandleChange(uploadFile, item.prop)"
							>
								<el-input v-model="state.formData[item.prop]" :placeholder="$t(item.placeholder)" :readonly="true" :suffix-icon="FolderOpened">
									<template #append v-if="state.formData[item.prop]">
										<text v-if="item.prop === 'draw3dPath'" class="look-file mr10" @click.stop="clearUpload(item.prop)">清空文件</text>
										<text class="look-file" @click.stop="lookUpload(item.prop)">查看文件</text>
									</template>
									>
								</el-input>
							</el-upload>
							<!-- 上传进度条弹窗 -->
							<el-dialog v-model="showProgress" title="上传进度" width="30%" :close-on-click-modal="false" :modal="false" :show-close="false">
								<div class="">
									<!-- 上传的文件名字 -->
									<div>{{ state.formData[item.prop] }}</div>
									<div class="">
										<!-- 进度条百分比 -->
										<el-progress :percentage="uploadPercentage" :format="format" max="100"></el-progress>
									</div>
								</div>
							</el-dialog>
							<!-- <el-input disabled v-if="item.type === 'inputFile'" v-model="state.formData[item.prop]" :placeholder="$t(item.placeholder)" clearable>
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
										<el-button type="primary" class="ml1">瀏覽文件</el-button>
									</el-upload></template
								>
								<template #append v-if="state.formData[item.prop]"
									><el-button @click="inputsubmitUpload(item.prop, item.key)" type="primary" class="ml1">上傳文件</el-button>
									<el-button v-if="state.formData['drawPath'].includes('/')" class="look-file" @click="lookUpload(item.prop)">查看文件</el-button>
								</template>
							</el-input> -->
							<div v-if="item.type == 'tagsarea'">
								<el-tag v-for="tag in state.formData[item.prop]" :key="tag" class="mr10">
									{{ tag }}
								</el-tag>
							</div>
							<span v-if="item.type === 'link'">
								<a href="javascript:;" title="請點擊查看文件" @click="clickLink(item.prop)">{{ state.formData[item.prop] }}</a>
							</span>
							<!-- <el-input disabled v-if="item.type === 'input3dFile'" v-model="state.formData[item.prop]" :placeholder="$t(item.placeholder)" clearable>
								<template #prepend
									><el-upload
										v-model:file-list="input3dfileList"
										:auto-upload="false"
										ref="input3duploadRefs"
										action=""
										class="upload"
										drag
										:limit="1"
										:show-file-list="false"
										:on-exceed="input3dHandleExceed"
										:on-change="input3dHandleChange"
									>
										<el-button type="primary" class="ml1">瀏覽文件</el-button>
									</el-upload></template
								>
								<template #append v-if="state.formData[item.prop]"
									><el-button @click="inputsubmitUpload(item.prop)" type="primary" class="ml1">上傳文件</el-button>
									<el-button v-if="state.formData['draw3dPath'].includes('/')" class="look-file" @click="lookUpload(item.prop)">查看文件</el-button>
								</template>
							</el-input> -->

							<!-- 上传图片 -->
							<el-upload
								ref="imageuploadRefs"
								v-model:file-list="imagefileList"
								v-if="item.type === 'uploadImage'"
								action="#"
								class="avatar-uploader"
								:show-file-list="true"
								:on-success="handleAvatarSuccess"
								:before-upload="beforeAvatarUpload"
								:http-request="httpRequest"
								:limit="1"
								:on-exceed="imageHandleExceed"
								:on-change="imageHandleChange"
								:disabled="item.disabled"
							>
								<el-image
									:class="{ uploadImagedisabled: item.disabled }"
									class="avatar"
									v-if="imageUrl"
									:src="imageUrl"
									fit="contain"
									style="width: 148px; height: 148px"
								/>
								<SvgIcon v-else class="avatar-uploader-icon" name="ele-Plus" />
							</el-upload>
							<el-select
								@blur="(FocusEvent: Event)=>inputBlur(item,FocusEvent)"
								@focus="(FocusEvent: Event)=>inputFocus(item,FocusEvent)"
								v-model="state.formData[item.prop]"
								:placeholder="$t(item.placeholder) || `${$t('message.pages.pleaseSelect')} ${$t(item.label)}`"
								:clearable="item.clearable"
								v-if="item.type === 'select'"
								style="width: 100%"
								:disabled="state.dialog.isdisable || state.formData[`${item.prop}disabled`]"
								@change="(val:any) => selectHandelChange(val,item.prop)"
								:filterable="item.filterable"
								:remote="item.remote"
								:remote-show-suffix="item.remoteShowSuffix"
								:remote-method="remoteMethod"
								:loading="item.loading"
								:multiple="item.multiple"
								:max-collapse-tags="item.maxCollapseTags"
								:collapse-tags="item.collapseTags"
								:collapse-tags-tooltip="item.collapseTagsTooltip"
							>
								<el-option v-for="val in item.options" :key="val.value || val.label" :label="val.text" :value="val.value">
									<slot name="optionFat" :row="val" :val="item"></slot>
								</el-option>
							</el-select>
							<el-switch
								v-if="item.type === 'switch'"
								v-model="state.formData[item.prop]"
								inline-prompt
								:active-text="$t('message.allButton.startup')"
								:inactive-text="$t('message.allButton.disable')"
							></el-switch>
							<el-input
								:width="224"
								v-if="item.type === 'textarea'"
								v-model="state.formData[item.prop]"
								type="textarea"
								:placeholder="$t(item.placeholder)"
								:maxlength="item.maxlength || 500"
								@blur="(FocusEvent: Event)=>inputBlur(item,FocusEvent)"
								@focus="(FocusEvent: Event)=>inputFocus(item,FocusEvent)"
							></el-input>
							<span v-if="item.type === 'text'" style="width: 100%; font-weight: 700; color: #1890ff">
								{{ state.formData[item.prop] }}
							</span>
						</el-form-item>

						<span v-if="item.type === 'button'">
							<el-button
								:disabled="item.disabled"
								type="primary"
								style="margin-left: 20px"
								plain
								v-if="item.type === 'button'"
								@click="dailogFormButton(item)"
								>{{ item.label }}</el-button
							>
						</span>
					</el-col>
				</el-row>
			</el-form>
			<slot name="dialogTable" :data="state"></slot>
			<el-form v-if="state.dialog.type === 'imp'" class="drawer-multiColumn-form" label-width="100px">
				<el-button size="default" class="buttonBorder mb10" @click="ondownloadTemp" type="primary" plain>{{ $t('下載模板') }}</el-button>
				<div class="download-form">
					<el-input v-model="fileListName" placeholder="請點擊瀏覽文件按鈕" />
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
						:disabled="fileListName ? false : true"
						size="default"
						class="ml10 buttonBorder bottonDownload"
						type="primary"
						plain
						@click="submitUpload"
						>{{ $t('開始上傳') }}</el-button
					>
				</div>
			</el-form>
			<!-- 嵌套图片弹窗 -->
			<template>
				<el-dialog v-model="dialogVisible" width="50%" title="大圖展示" append-to-body
					><el-image fit="contain" :src="dialogImageUrl" alt="Preview Image"
				/></el-dialog>
			</template>
			<!-- 嵌套弹窗 -->
			<template v-if="dialogType == 'nestDialogConfig'">
				<el-dialog
					draggable
					:close-on-click-modal="false"
					:title="state.innerdialog.title"
					v-model="state.innerdialog.isShowInnerDialog"
					width="40%"
					append-to-body
					:show-close="false"
				>
					<el-form ref="innnerDialogFormRef" :model="state.formInnerData" size="default">
						<el-row :gutter="35">
							<el-col
								:xs="item.xs || 24"
								:sm="item.sm || 12"
								:md="item.md || 12"
								:lg="item.md || 12"
								:xl="item.xl || 12"
								class="mb20"
								v-for="item in innerDialogConfig"
								:key="item.prop"
							>
								<el-form-item v-if="item.type != 'button'" :label="$t(item.label)" :prop="item.prop" :rules="allRules(item)">
									<el-input
										v-if="item.type === 'sacnstockqtyInput'"
										v-model="state.formInnerData[item.prop]"
										:placeholder="$t(item.placeholder)"
										clearable
										:maxlength="item.maxlength"
										@input=" (val:any) => commonInputHandleChange(val,item.prop)"
										@keyup=" (target:any) => inputNum(target,item.prop)"
									></el-input>

									<div v-else-if="item.type == 'tagsarea'">
										<el-tag v-for="tag in state.formInnerData[item.prop]" :key="tag" closable @close="handleTagClose(tag)" class="mr10">
											{{ tag }}
										</el-tag>
									</div>
									<!-- 入库数量 -->
									<span v-else style="width: 100%; font-weight: 700; color: #1890ff">
										{{ state.formInnerData[item.prop] }}
									</span>
								</el-form-item>
								<!-- <span v-else>
									<el-button type="primary" plain v-if="item.type === 'button'" @click="dailogFormButton">{{ item.label }}</el-button>
								</span> -->
								<span v-else>
									<slot name="buttonFooter" :row="item" :data="state"></slot>
								</span>
							</el-col>
						</el-row>
					</el-form>
					<template #footer v-if="isFootBtn">
						<span class="dialog-footer">
							<slot name="dialogFooterBtn" :data="state"></slot>
							<el-button type="warning" plain size="default" @click="onImportQrcodeData"> 導入二維碼 </el-button>
							<input id="uploadFile" v-show="false" @change="handleImportChange" ref="inputImportQrcodeFile" type="file" />
							<!-- <el-upload
								style="display: inline-flex; margin-right: 10px"
								v-model:file-list="fileList"
								:auto-upload="false"
								ref="uploadRefs"
								action=""
								drag
								accept=".xlsx, .xls"
								:limit="1"
								:show-file-list="false"
								:on-exceed="handleImportExceed"
								:on-change="handleImportChange"
							>
								<el-button type="warning" plain size="default" @click="onImportQrcodeData"> 導入二維碼 </el-button>
							</el-upload> -->

							<el-button type="success" plain size="default" @click="onExportQrcodeData"> 導出二維碼 </el-button>
							<el-button @click="innnerDialogCancel" size="default">清 空</el-button>
							<el-button type="primary" @click="innnerDialogSubmit(innnerDialogFormRef)" size="default">確 定</el-button>
						</span>
					</template>
				</el-dialog>
			</template>
			<template #footer v-if="isFootBtn">
				<span class="dialog-footer">
					<el-button @click="onCancel" size="default">{{ $t('message.allButton.cancel') }}</el-button>
					<slot name="dialogBtn" :data="state" :ref="dialogFormRef"></slot>
					<el-button :disabled="footBtnDisabled" :loading="loadingBtn" type="primary" @click="onSubmit(dialogFormRef)" size="default">{{
						state.dialog.submitTxt
					}}</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="systemMenuDialog">
import { defineAsyncComponent, reactive, onMounted, ref, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { debounce } from '/@/utils/debounceAndThrottle';
import { ElMessage, genFileId, UploadRawFile, FormRules, FormInstance, ElMessageBox } from 'element-plus';
import type { UploadInstance, UploadProps, UploadUserFile, UploadRequestOptions, UploadFile } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { getUploadFileApi } from '/@/api/global/index';
import { verifyPhone, verifyTelPhone, verifyEmail, verifiyNumberInteger } from '/@/utils/toolsValidate';
import { useI18n } from 'vue-i18n';
import * as XLSX from 'xlsx';
import table2excel from 'js-table2excel';
import { useRouter } from 'vue-router';
import { FolderOpened } from '@element-plus/icons-vue';
import { getStockOperDraftAddCodesApi } from '/@/api/toolsReturn/sampleStorage';
import { getStockOperDraftAddCodesToExitStoreDraftApi, getStockOperDraftAddCodesToStockTransferDraftApi } from '/@/api/toolsReturn/maintentanceTools';

const router = useRouter();
// 引入组件
const IconSelector = defineAsyncComponent(() => import('/@/components/iconSelector/index.vue'));
const emit = defineEmits([
	'downloadTemp',
	'importTableData',
	'addData',
	'dailogFormButton',
	'innerDialogData',
	'commonInputHandleChange',
	'handleTagClose',
	'innnerDialogCancel',
	'onImportQrcodeData',
	'selectChange',
	'innnerDialogSubmit',
	'openInnerDialog',
	'editDialog',
	'otherDialog',
	'remoteMethod',
	'handleNumberInputChange',
	'inputBlur',
	'inputFocus',
	'inputHandleExceed',
	'inputHandleChange',
	'close',
]);
// 定义父组件传过来的值
const props = defineProps({
	// 弹出框内容
	dialogConfig: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
	innerDialogConfig: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
	dialogType: {
		type: String,
		default: () => '',
	},
	isFootBtn: {
		type: Boolean,
		default: () => true,
	},
	footBtnDisabled: {
		type: Boolean,
		default: () => false,
	},
	dialogWidth: {
		type: String,
		default: () => '769px',
	},
	tagsData: {
		type: Array,
		default: () => [],
	},
	loadingBtn: {
		type: Boolean,
		default: () => false,
	},
	labelWidth: {
		type: String,
		default: () => '100px',
	},
});
const { t } = useI18n();
const uploadRefs = ref<UploadInstance>();
const inputuploadRefs = ref<UploadInstance>();
const input3duploadRefs = ref<UploadInstance>();
const imageuploadRefs = ref<UploadInstance>();
const fileList = ref<UploadUserFile[]>([]);
const inputfileList = ref<UploadUserFile[]>([]);
const input3dfileList = ref<UploadUserFile[]>([]);
const imagefileList = ref<UploadUserFile[]>([]);
const fileListName = ref();
// 定义变量内容
const dialogFormRef = ref();
const inputImportQrcodeFile = ref();
const innnerDialogFormRef = ref();
const uploadForm = ref();
const inputuploadForm = ref();
const input3duploadForm = ref();
const imageUrl = ref('');
const dialogImageUrl = ref('');
const dialogVisible = ref(false);
const iscontu = ref(false);
let rules = reactive<EmptyObjectType>({});
const state = reactive<dialogFormState>({
	formData: {},
	vendors: [],
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
		isdisable: false,
	},
	formInnerData: {},
	innerdialog: {
		isShowInnerDialog: false,
		type: '',
		title: '',
		submitTxt: '',
		isdisable: false,
	},
});
// 關閉彈窗
const close = () => {
	emit('close');
};
// 點擊鏈接
const clickLink = (prop: string) => {
	const path = state.formData[prop];
	if (!path || !path.includes('/')) return ElMessage.warning(`暫無圖紙文件或者圖紙文件路徑錯誤`);
	window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${path}`, '_blank');
};
const ondownloadTemp = () => {
	emit('downloadTemp');
};
const dailogFormButton = (btnConfig: EmptyObjectType) => {
	emit('dailogFormButton', state.formData, btnConfig);
};
// 改变number的值
const handleNumberInputChange = (value: number) => {
	emit('handleNumberInputChange', value, state.formData);
};
// 輸入框失去焦點
const inputBlur = (item: EmptyObjectType, FocusEvent: Event) => {
	emit('inputBlur', state.formData, item, FocusEvent);
};
// 輸入框獲取焦點
const inputFocus = (item: EmptyObjectType, FocusEvent: Event) => {
	emit('inputFocus', state.formData, item, FocusEvent);
};
// 校验表单
const validatePass = (rule: any, value: any, callback: any, item: EmptyObjectType) => {
	const validateForm = item.validateForm;
	if (value === '') {
		callback(new Error(`${t(item.label)}不能為空`));
	} else if (
		(validateForm && validateForm === 'phone' && !verifyPhone(value) && !verifyTelPhone(value)) ||
		(validateForm === 'email' && !verifyEmail(value)) ||
		(validateForm === 'number' && !verifiyNumberInteger(value))
	) {
		callback(new Error(item.message));
	} else {
		callback();
	}
};
const allRules = (item: EmptyObjectType) => {
	rules = {
		default: [
			{
				required: item.required,
				message: `${t(item.label)}不能為空`,
				trigger: item.type === 'input' || item.type === 'inputFile' || item.type === 'textarea' || item.type === 'select' ? 'blur' : 'change',
				// type:'number',
			},
		],
		other: [
			{ validator: (rule: any, value: any, callback: any) => validatePass(rule, value, callback, item), trigger: 'change', required: item.required },
		],
	};
	return item.validateForm ? rules['other'] : rules['default'];
};
// 日期只能選擇今天之前
const disabledDate = (time: Date, isdisabledDate: boolean) => {
	if (isdisabledDate) {
		return time.getTime() > Date.now();
	} else {
		return false;
	}
};
// 打开弹窗
const openDialog = (type: string, row?: any, title?: string, formInnerData?: any, submitTxt?: string) => {
	if (type === 'add') {
		state.dialog.isdisable = false;
		state.dialog.title = t('message.allButton.addBtn') || t('message.allButton.addBtn');
		if (submitTxt) {
			state.dialog.submitTxt = t(submitTxt);
		} else {
			state.dialog.submitTxt = t('message.allButton.addSubmit');
		}
		// 清空表单，此项需加表单验证才能使用
		nextTick(() => {
			if (imageUrl.value) {
				inputuploadForm.value = '';
				// 清除图片
				let upload_list: any = imageuploadRefs.value;
				upload_list[0]!.clearFiles();
				imagefileList.value = [];
				imageUrl.value = '';
			}
			dialogFormRef.value.resetFields();
		});
	} else if (type === 'edit') {
		nextTick(() => {
			dialogFormRef.value?.clearValidate();
		});
		state.dialog.title = t('message.allButton.editBtn') || t('message.allButton.editBtn');
		state.dialog.submitTxt = t('message.allButton.editSubmit');
		// 解决表单重置不成功的问题
		nextTick(() => {
			state.formData = JSON.parse(JSON.stringify(row));
			imagefileList.value = [];
			if (row.picture) imagefileList.value.push({ name: 'figure.png', url: state.formData.picture });
			imageUrl.value = state.formData.picture;
			emit('editDialog', state.formData);
		});
		props.dialogConfig.forEach((v) => {
			if (v.editDisable) {
				state.dialog.isdisable = true;
			}
		});
	} else if (type === 'imp') {
		fileListName.value = '';
		state.dialog.title = '上傳文件';
		state.dialog.submitTxt = '開始上傳';
	} else {
		state.dialog.title = title;
		state.dialog.submitTxt = submitTxt || '提 交';
		nextTick(() => {
			state.formData = JSON.parse(JSON.stringify(row));
			dialogFormRef.value && dialogFormRef.value.resetFields();
			innnerDialogFormRef.value && innnerDialogFormRef.value.resetFields();
			state.formInnerData.codeList = formInnerData?.codeList || [];
		});
		emit('otherDialog', state.formInnerData);
	}
	state.dialog.type = type;
	state.dialog.isShowDialog = true;
};
// 关闭弹窗
const closeDialog = () => {
	state.dialog.isShowDialog = false;
};
// 打开嵌套弹窗
const openInnerDialog = (title?: string) => {
	state.innerdialog.title = title;
	state.innerdialog.isShowInnerDialog = true;
	emit('openInnerDialog', state);
};
const closeInnerDialog = () => {
	state.innerdialog.isShowInnerDialog = false;
};
// 取消
const onCancel = () => {
	closeDialog();
};
// 導出二維碼編碼
const onExportQrcodeData = () => {
	const { meta } = router.currentRoute.value;
	let { formInnerData } = state;
	if (formInnerData.codeList.length <= 0) return ElMessage.warning('請先錄入二維碼');
	let codes = formInnerData.codeList.map((item: any) => {
		return { code: item };
	});
	table2excel(
		[{ key: 'code', title: '二維碼編碼', type: 'text' }],
		codes,
		`${meta.title}- ${state.dialog.title}二維碼 ${new Date().toLocaleString()}.xls`
	);
};
// 導入二維碼
const onImportQrcodeData = () => {
	emit('onImportQrcodeData', state.formInnerData);
	inputImportQrcodeFile.value.click();
};
//导入二维码的改变文件
const handleImportChange = (e: any) => {
	const file = e.target.files[0];
	const fileName = file.name.substring(file.name.lastIndexOf('.') + 1);
	if (fileName !== 'xlsx' && fileName !== 'xls') {
		ElMessage.error('文件格式错误');
		return;
	}
	const reader = new FileReader();
	reader.readAsBinaryString(file);
	reader.onload = (e) => {
		const result = e.target!.result;
		if (!result) {
			ElMessage.error('此文件没有数据');
			return;
		}
		handleSinglePageExcel(result);
	};
	e.target.value = '';
	reader.onerror = (err) => {
		throw new Error('UpLoadError: ' + err);
	};
};
// 单个 sheet
const handleSinglePageExcel = async (data: any) => {
	const wb = XLSX.read(data, {
		type: 'binary',
		cellDates: true,
	});
	const sheet = wb.SheetNames[0];
	const importData: EmptyArrayType = XLSX.utils.sheet_to_json(wb.Sheets[sheet], {
		range: -1,
	});
	// if (importData[0].__EMPTY != '二維碼編碼') {
	// 	ElMessage.warning('文件內容格式錯誤');
	// 	return;
	// }
	// 刪除表头
	// delete importData[0];
	// 将表格对象数组变成数组
	const flatArray = importData.reduce((acc, obj) => {
		const values = Object.values(obj);
		return acc.concat(values);
	}, []);
	// 重复的条码
	let repetitionCode: EmptyArrayType = [];
	// 导入的剩下的不重复的条码
	let importNoRepetitionCode: EmptyArrayType = [];
	for (let i = 0; i < flatArray.length; i++) {
		if (state.formInnerData.codeList.includes(flatArray[i])) {
			repetitionCode.push(flatArray[i]);
		} else {
			importNoRepetitionCode.push(flatArray[i]);
		}
	}
	// 最后去重了条码加上现有的条码集合的长度
	const flatArrayLength = [...new Set(state.formInnerData.codeList.concat(flatArray))].length;
	if (flatArrayLength > state.formData.dispatchQty || flatArrayLength > state.formData.qty) {
		ElMessage.error(`此文件中的條碼數量加上现有的掃碼數量超過發料數量，請勿導入`);
		return;
	} else if (state.formInnerData.different === 1 && flatArrayLength > state.formData.stockqty) {
		ElMessage.error(`此文件中的條碼數量加上现有的掃碼數量超過庫存總量，請勿導入`);
		return;
	}
	if (importNoRepetitionCode.length <= 0) {
		ElMessage.error(`此文件所有條碼與現有條碼全部重複，請勿重複導入`);
		return;
	}
	let res = null;
	// console.log(state.formInnerData);
	if (state.formInnerData.different === 1) {
		if (state.formInnerData.dilogTitle === '退庫') {
			res = await getStockOperDraftAddCodesToExitStoreDraftApi({
				draftId: state.formInnerData.draftId,
				codesToAdd: importNoRepetitionCode,
			});
		}
		// 轉倉
		else {
			res = await getStockOperDraftAddCodesToStockTransferDraftApi({
				draftId: state.formInnerData.draftId,
				codesToAdd: importNoRepetitionCode,
			});
		}
	}
	// 其他
	else {
		res = await getStockOperDraftAddCodesApi({
			draftId: state.formInnerData.draftId,
			codesToAdd: importNoRepetitionCode,
		});
	}
	if (res!.status) {
		if (repetitionCode.length > 0) {
			ElMessageBox.confirm(
				`這些條碼已存在，請勿重複導入：<span style="color:red">${repetitionCode.join(',')}</span>,已給您清除重複的條碼導入了`,
				'注意',
				{
					confirmButtonText: '確 定',
					showCancelButton: false,
					showClose: false,
					dangerouslyUseHTMLString: true, // 注意此属性
					type: 'warning',
					draggable: true,
				}
			)
				.then(async () => {})
				.catch(() => {});
		}
		// 最后去重了条码加上现有的条码集合
		state.formInnerData.codeList = [...new Set(state.formInnerData.codeList.concat(flatArray))];
		// 增加条码后更改数量
		if (state.formInnerData.different === 1) {
			state.formInnerData.exitQty = state.formInnerData.codeList.length;
			state.formData.exitQty = state.formInnerData.codeList.length;
		} else {
			state.formInnerData.stockqty = state.formInnerData.codeList.length;
			state.formData.stockqty = state.formInnerData.codeList.length;
		}
		ElMessage.success(`導入成功，共导入${importNoRepetitionCode.length}条`);
	}
};

const innnerDialogCancel = () => {
	emit('innnerDialogCancel', state.formData, state.formInnerData);
	// closeInnerDialog();
};
//内嵌弹窗提交
const innnerDialogSubmit = (formEl: EmptyObjectType | undefined) => {
	if (!formEl) return;
	formEl.validate((valid: boolean) => {
		if (valid) {
			emit('innnerDialogSubmit', state.formInnerData, state.formData, state.innerdialog.isShowInnerDialog);
			closeInnerDialog();
		} else {
		}
	});
};
// 提交
const onSubmit = (formEl: EmptyObjectType | undefined) => {
	if (!formEl) return;
	formEl.validate((valid: boolean) => {
		if (valid) {
			emit('addData', state.formData, state.dialog.type, state.formInnerData);
		}
	});
};
// 初始化 form 字段，取自父组件 prop
const initFormField = () => {
	if (props.dialogConfig.length <= 0 || props.innerDialogConfig.length <= 0) return false;
	props.dialogConfig.forEach((v) => (state.formData[v.prop] = ''));
	props.innerDialogConfig.forEach((v) => {
		(state.formInnerData[v.prop] = ''), (state.formInnerData['codeList'] = []);
	});
};
// 输入框一输入变化（不需要光标移开）
const commonInputHandleChange = debounce((val: any, prop: string) => {
	emit('commonInputHandleChange', val, prop, state, iscontu.value);
}, 500);
let arr: EmptyArrayType = [];
// 判斷是鍵盤輸入還是掃描槍輸入
const inputNum = (target: EmptyObjectType, prop: string) => {
	// let timenow = target.timeStamp;
	// arr.push(timenow);
	// for (let i in arr) {
	// 	if (Math.ceil(arr[arr.length - 1]) - Math.ceil(arr[arr.length - 2]) >= 30) {
	// 		iscontu.value = false;
	// 	} else {
	// 		iscontu.value = true;
	// 	}
	// 	if (i && arr.length == parseInt(i) + 1) {
	// 		if (iscontu.value == true) {
	// 			return;
	// 		}
	// 	}
	// }
};
// 关闭tag标签
const handleTagClose = (tag: any) => {
	emit('handleTagClose', tag, state);
};
// 下拉框数据变化
const selectHandelChange = (val: string, prop: string) => {
	emit('selectChange', val, prop, state.formData);
};
// 能搜索的下拉框
const remoteMethod = (query: string) => {
	emit('remoteMethod', query, state.formData);
};
// 文件input框里面的数据
const input3dHandleChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
	props.dialogConfig.forEach((v) => {
		if (v.type === 'input3dFile') {
			state.formData[v.prop] = uploadFile.name;
		}
	});
	input3duploadForm.value = uploadFile;
};

//可以在选中时自动替换上一个文件
const input3dHandleExceed: UploadProps['onExceed'] = (files) => {
	let upload_list: any = input3duploadRefs.value;
	upload_list[0]!.clearFiles();
	const file = files[0] as UploadRawFile;
	file.uid = genFileId();
	upload_list[0]!.handleStart(file);
};
// 文件input框里面的数据
const inputHandleChange: UploadProps['onChange'] = (uploadFile, prop) => {
	// props.dialogConfig.forEach((v) => {
	// 	if (v.type === 'inputFile') {
	// 		state.formData[v.prop] = uploadFile.name;
	// 	}
	// });
	// inputuploadForm.value = uploadFile;
	if (!flag) return;
	dialogFormRef.value?.clearValidate();
	emit('inputHandleChange', uploadFile, prop, state.formData, dialogFormRef.value);
	const props = prop + '';
	if (props == 'programFilePath' && state.formData.error === 0) {
		return;
	}
	inputuploadForm.value = uploadFile;
	getFileData(uploadFile, prop);
};
// 優化的
const newInputHandleChange: UploadProps['onChange'] = async (uploadFile, uploadFiles) => {
	props.dialogConfig.forEach((v) => {
		if (v.type === 'optionFile') {
			state.formData[v.prop] = uploadFile.name;
		}
	});
	inputuploadForm.value = uploadFile;
	const res = await getUploadFileApi(2, inputuploadForm.value.raw);
	state.formData['fileUrl'] = res.data;
	res.status && ElMessage.success(`上傳成功`);
};
//可以在选中时自动替换上一个文件
let flag = true;
const showProgress = ref(false);
const inputHandleExceed: UploadProps['onExceed'] = (files, prop) => {
	// let upload_list: any = inputuploadRefs.value;
	// upload_list[0]!.clearFiles();
	// const file = files[0] as UploadRawFile;
	// file.uid = genFileId();
	// upload_list[0]!.handleStart(file);
	flag = false;
	let upload_list: any = inputuploadRefs.value;
	upload_list[0]!.clearFiles();
	const file = files[0] as UploadRawFile;
	file.uid = genFileId();
	upload_list[0]!.handleStart(file);
	getFileData(files[0], prop);
	emit('inputHandleExceed', files, prop, state.formData);
	flag = true;
};
// 格式化进度，使用百分比进行展示
const format = (percentage: any) => `${percentage}%`;
// 上传百分比
const uploadPercentage = ref(0);
let times = null;
const getFileData = async (uploadFile: EmptyObjectType, prop: any) => {
	// 打开进度条弹窗
	showProgress.value = true;
	uploadPercentage.value = 0;
	times = setInterval(() => {
		uploadPercentage.value = (uploadPercentage.value % 100) + 10;
	}, 1000);

	const uploadTypeMap: EmptyObjectType = { drawPath: 0, draw3dPath: 1 };
	const res = await getUploadFileApi(uploadTypeMap[prop + ''], inputuploadForm.value.raw);
	if (res.status) {
		uploadPercentage.value = 100;
		ElMessage.success(`上傳成功`);
		props.dialogConfig.forEach((v) => {
			if (v.type === 'inputFile' && v.prop === prop) {
				state.formData[v.prop] = uploadFile.name;
			}
		});
		state.formData[prop + 'fileUrl'] = res.data;
		showProgress.value = false;
	} else {
		state.formData[prop + 'fileUrl'] = '';
		state.formData[prop + 'file'] = [];
		state.formData[prop + ''] = '';
		showProgress.value = false;
		ElMessageBox.confirm('上傳失敗! 請檢查此文件是否已經上傳過', '警告', {
			type: 'error',
			draggable: true,
			closeOnClickModal: false,
			showCancelButton: false,
		})
			.then(async () => {})
			.catch(() => {});
	}
};
watch(
	() => uploadPercentage.value,
	() => {
		if (uploadPercentage.value >= 90) clearInterval(times!);
	},
	{
		deep: true,
	}
);
// 優化的 可以在选中时自动替换上一个文件
const newInputHandleExceed: UploadProps['onExceed'] = (files) => {
	let upload_list: any = inputuploadRefs.value;
	upload_list[0]!.clearFiles();
	const file = files[0] as UploadRawFile;
	file.uid = genFileId();
	upload_list[0]!.handleStart(file);
};
// 上传文件
const inputsubmitUpload = async (prop: string, key?: string) => {
	let value = prop == 'drawPath' ? inputuploadForm.value.raw : input3duploadForm.value.raw;
	let funcType = 0;
	if (key === 'accepreporturl') {
		funcType = 2;
	} else {
		const typeMap: EmptyObjectType = {
			drawPath: 0,
			draw3dPath: 1,
		};
		funcType = typeMap[prop];
	}
	const res = await getUploadFileApi(funcType, value);
	state.formData[prop] = res.data;
	res.status && ElMessage.success(`上傳成功`);
};
// 查看上传的文件
const lookUpload = (prop: string) => {
	window.open(
		`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${
			state.formData[prop + 'fileUrl'] || state.formData[prop]
		}`,
		'_blank'
	);
};
// 清除文件
const clearUpload = (prop: string) => {
	ElMessageBox.confirm('確定清除文件嗎?', '提示', {
		confirmButtonText: '確 定',
		cancelButtonText: '取 消',
		type: 'warning',
		draggable: true,
	})
		.then(async () => {
			props.dialogConfig.forEach((v) => {
				if (v.type === 'inputFile' && v.prop === prop) {
					state.formData[prop + 'fileUrl'] = '';
					state.formData[prop + 'file'] = [];
					state.formData[prop + ''] = '';
				}
			});
			ElMessage.success(`清空文件成功`);
		})
		.catch(() => {});
};

const handleChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
	fileListName.value = uploadFile.name;
	uploadForm.value = uploadFile;
};

//可以在选中时自动替换上一个文件
const handleExceed: UploadProps['onExceed'] = (files) => {
	uploadRefs.value!.clearFiles();
	const file = files[0] as UploadRawFile;
	file.uid = genFileId();
	uploadRefs.value!.handleStart(file);
};

// 上传文件
const submitUpload = () => {
	uploadRefs.value!.submit();
	emit('importTableData', uploadForm.value);
	// closeDialog();
};
// 上传图片
const handleAvatarSuccess: UploadProps['onSuccess'] = async (response, uploadFile) => {
	// console.log(imagefileList.value[0]);
	// let arr = imagefileList.value;
	// imagefileList.value = [];
	// imagefileList.value.push(arr[arr.length - 1]);
};
// 图片改变时
const imageHandleChange: UploadProps['onChange'] = async (uploadFile, uploadFiles) => {
	imageUrl.value = URL.createObjectURL(uploadFile.raw!);
	imagefileList.value = uploadFiles;
};
//可以在选中时自动替换上一个文件
const imageHandleExceed: UploadProps['onExceed'] = async (files, uploadFiles) => {
	if (files[0].type !== 'image/jpeg' && files[0].type !== 'image/png') {
		ElMessage.error('圖片必須是JPG或者PNG格式!');
	} else {
		let upload_list: any = imageuploadRefs.value;
		upload_list[0]!.clearFiles();
		const file = files[0] as UploadRawFile;
		file.uid = genFileId();
		upload_list[0]!.handleStart(file);
		httpRequest();
	}
};

const httpRequest = async () => {
	// 打开进度条弹窗
	showProgress.value = true;
	uploadPercentage.value = 0;
	times = setInterval(() => {
		uploadPercentage.value = (uploadPercentage.value % 100) + 10;
	}, 1000);
	const res = await getUploadFileApi(5, imagefileList.value[0].raw);
	if (res.status) {
		props.dialogConfig.forEach((item) => {
			if (item.type === 'uploadImage') {
				state.formData[item.prop] = res.data;
			}
		});
	}
	showProgress.value = false;
};
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
	if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
		ElMessage.error('圖片必須是JPG或者PNG格式!!');
	}
	//  else if (rawFile.size / 1024 / 1024 > 2) {
	// 	ElMessage.error('图片大小不能超过2MB!');
	// 	return false;
	// }
	return true;
};
// 页面加载时
onMounted(() => {
	initFormField();
});

// 暴露变量
defineExpose({
	openDialog,
	closeDialog,
	openInnerDialog,
	closeInnerDialog,
});
</script>

<style scoped lang="scss">
.bottonDownload {
	margin-top: 5px;
}
.download-form {
	display: flex;
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
.input-file {
	display: flex;
}
.look-file {
	color: var(--el-color-primary) !important;
}
:deep(.el-upload-list--picture-card) {
	flex-wrap: nowrap !important;
}
.avatar-uploader .avatar {
	width: 148px;
	height: 148px;
	display: block;
}

.avatar-uploader {
	width: 148px;
	height: 148px;
	border: 1px dashed var(--el-border-color);
	border-radius: 6px;
	cursor: pointer;
	position: relative;
	overflow: hidden;
	transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
	border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
	font-size: 28px;
	color: #8c939d;
	width: 148px;
	height: 148px;
	text-align: center;
}
.uploadImagedisabled {
	pointer-events: auto !important;
	cursor: not-allowed !important;
}
</style>
