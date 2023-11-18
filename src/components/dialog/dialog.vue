<template>
	<div class="system-menu-dialog-container">
		<el-dialog draggable :close-on-click-modal="false" :title="state.dialog.title" v-model="state.dialog.isShowDialog" :width="dialogWidth">
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
						<el-form-item v-if="item.type != 'button'" :label="$t(item.label)" :prop="item.prop" :rules="allRules(item)">
							<el-input
								:maxlength="item.maxlength"
								v-if="item.type === 'input'"
								v-model="state.formData[item.prop]"
								:placeholder="$t(item.placeholder)"
								clearable
							></el-input>
							<el-date-picker
								v-if="item.type === 'date'"
								value-format="YYYY-MM-DD"
								v-model="state.formData[item.prop]"
								type="date"
								:placeholder="$t(item.placeholder)"
								style="width: 100%"
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
							<el-input disabled v-if="item.type === 'inputFile'" v-model="state.formData[item.prop]" :placeholder="$t(item.placeholder)" clearable>
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
							</el-input>
							<div v-if="item.type == 'tagsarea'">
								<el-tag v-for="tag in state.formData[item.prop]" :key="tag" closable class="mr10">
									{{ tag }}
								</el-tag>
							</div>
							<el-input disabled v-if="item.type === 'input3dFile'" v-model="state.formData[item.prop]" :placeholder="$t(item.placeholder)" clearable>
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
							</el-input>

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
							>
								<el-image class="avatar" v-if="imageUrl" :src="imageUrl" fit="contain" style="width: 148px; height: 148px" />
								<SvgIcon v-else class="avatar-uploader-icon" name="ele-Plus" />

								<!-- <template #file="{ file }">
									<div style="width: 148px; height: 148px">
										<el-image
											class="el-upload-list__item-thumbnail"
											v-if="imageUrl"
											:src="imageUrl"
											fit="contain"
											style="width: 148px; height: 148px"
										/>
										<span class="el-upload-list__item-actions" style="width: 100%; height: 100%">
											<span class="el-upload-list__item-preview" @click="handlePictureCardPreview(file)">
												<el-icon title="查看大图"><ele-ZoomIn /></el-icon>
											</span>
											<span class="el-upload-list__item-preview" @click="handlePictureChange(file)">
												<el-icon title="改变图片"><ele-PictureFilled /></el-icon>
											</span>
										</span>
									</div>
								</template> -->
							</el-upload>
							<el-select
								v-model="state.formData[item.prop]"
								:placeholder="$t(item.placeholder)"
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
									<slot name="optionFat" :row="val"></slot>
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
							></el-input>
							<span v-if="item.type === 'text'" style="width: 100%; font-weight: 700; color: #1890ff">
								{{ state.formData[item.prop] }}
							</span>
						</el-form-item>

						<span v-else>
							<el-button
								:disabled="item.disabled"
								type="primary"
								style="margin-left: 20px"
								plain
								v-if="item.type === 'button'"
								@click="dailogFormButton"
								>{{ item.label }}</el-button
							>
						</span>
					</el-col>
				</el-row>
			</el-form>

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
							<el-button type="success" plain size="default" @click="onExportQrcodeData"> 導出二維碼 </el-button>
							<el-button @click="innnerDialogCancel" size="default">清 空</el-button>
							<el-button type="primary" @click="innnerDialogSubmit(innnerDialogFormRef)" size="default">{{ state.dialog.submitTxt }}</el-button>
						</span>
					</template>
				</el-dialog>
			</template>
			<template #footer v-if="isFootBtn">
				<span class="dialog-footer">
					<el-button @click="onCancel" size="default">取 消</el-button>
					<el-button :loading="loadingBtn" type="primary" @click="onSubmit(dialogFormRef)" size="default">{{ state.dialog.submitTxt }}</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="systemMenuDialog">
import { defineAsyncComponent, reactive, onMounted, ref, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { debounce } from '/@/utils/debounceAndThrottle';
import { ElMessage, genFileId, UploadRawFile, FormRules, FormInstance } from 'element-plus';
import type { UploadInstance, UploadProps, UploadUserFile, UploadRequestOptions, UploadFile } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { getUploadFileApi } from '/@/api/global/index';
import { verifyPhone, verifyTelPhone, verifyEmail, verifiyNumberInteger } from '/@/utils/toolsValidate';
import { useI18n } from 'vue-i18n';
import table2excel from 'js-table2excel';
import { useRouter } from 'vue-router';
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
	'selectChange',
	'innnerDialogSubmit',
	'openInnerDialog',
	'editDialog',
	'remoteMethod',
	'handleNumberInputChange',
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
const ondownloadTemp = () => {
	emit('downloadTemp');
};
const dailogFormButton = () => {
	emit('dailogFormButton', state.formData);
};
// 改变number的值
const handleNumberInputChange = (value: number) => {
	emit('handleNumberInputChange', value, state.formData);
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

// 打开弹窗
const openDialog = (type: string, row?: any, title?: string) => {
	if (type === 'add') {
		state.dialog.isdisable = false;
		state.dialog.title = '新增';
		state.dialog.submitTxt = '新 增';
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
		state.dialog.title = '修改';
		state.dialog.submitTxt = '修 改';
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
		state.dialog.submitTxt = '確 定';
		nextTick(() => {
			state.formData = JSON.parse(JSON.stringify(row));
			dialogFormRef.value && dialogFormRef.value.resetFields();
			innnerDialogFormRef.value && innnerDialogFormRef.value.resetFields();
		});
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
	console.log(codes);

	table2excel(
		[{ key: 'code', title: '二維碼編碼', type: 'text' }],
		codes,
		`${meta.title}- ${state.dialog.title}二維碼 ${new Date().toLocaleString()}.xls`
	);
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
			emit('innnerDialogSubmit', state.formInnerData, state.formData);
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
const inputNum = (target: EmptyObjectType, prop: string) => {
	let timenow = target.timeStamp;
	arr.push(timenow);
	for (let i in arr) {
		if (Math.ceil(arr[arr.length - 1]) - Math.ceil(arr[arr.length - 2]) >= 30) {
			iscontu.value = false;
		} else {
			iscontu.value = true;
		}
		if (i && arr.length == parseInt(i) + 1) {
			if (iscontu.value == true) {
				return;
			}
		}
	}
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
const inputHandleChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
	props.dialogConfig.forEach((v) => {
		if (v.type === 'inputFile') {
			state.formData[v.prop] = uploadFile.name;
		}
	});
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
	window.open(`${import.meta.env.VITE_API_URL}${state.formData[prop]}`, '_blank');
};
// // 上传错误提示
// const handleError = () => {
// 	ElMessage.error('导入数据失败，请您重新上传！');
// };

// //上传成功提示
// const handleSuccess = () => {
// 	ElMessage.success('导入数据成功！');
// 	// ElNotification({
// 	// 	title: '温馨提示',
// 	// 	message: '导入数据成功！',
// 	// 	type: 'success',
// 	// });
// };
// 文件上传
// const uploadExcel = async (param: any) => {
// 	console.log(param);
// 	let fileFormData = new FormData();
// 	fileFormData.append('file', param.file, param.file.name);

// 	console.log(param);
// 	console.log(formdata.get(file));

// 	emit('importTableData');
// 	// const res = await importUrl(fileFormData);
// 	// if (res.code !== 0) return param.onError();
// 	// closeDialog(); // 关闭弹窗
// };
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
// 查看大图
const handlePictureCardPreview: UploadProps['onPreview'] = (uploadFile) => {
	dialogImageUrl.value = uploadFile.url!;
	dialogVisible.value = true;
};
const handlePictureChange = (file: UploadFile) => {};
const httpRequest = async () => {
	const res = await getUploadFileApi(5, imagefileList.value[0].raw);
	if (res.status) {
		props.dialogConfig.forEach((item) => {
			if (item.type === 'uploadImage') {
				state.formData[item.prop] = res.data;
			}
		});
	}
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
</style>
