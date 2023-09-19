<template>
	<div class="system-menu-dialog-container">
		<el-dialog draggable :title="state.dialog.title" v-model="state.dialog.isShowDialog" :width="dialogWidth">
			<el-form v-if="state.dialog.type !== 'imp'" ref="dialogFormRef" :model="state.formData" size="default" label-width="100px">
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
							<el-input v-if="item.type === 'input'" v-model="state.formData[item.prop]" :placeholder="$t(item.placeholder)" clearable></el-input>
							<el-date-picker
								v-if="item.type === 'date'"
								value-format="YYYY-MM-DD"
								v-model="state.formData[item.prop]"
								type="date"
								:placeholder="$t(item.placeholder)"
								style="width: 100%"
							/>
							<!-- 数字输入框 -->
							<el-input-number v-if="item.type === 'number'" v-model="state.formData[item.prop]" :min="item.min || 0" :max="item.max" size="small" />
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
										<el-button type="primary" class="ml1">浏览文件</el-button>
									</el-upload></template
								>
								<template #append v-if="state.formData[item.prop]"
									><el-button @click="inputsubmitUpload(item.prop)" type="primary" class="ml1">上传文件</el-button>
									<el-button v-if="state.formData['drawPath'].includes('/')" class="look-file" @click="lookUpload(item.prop)">查看文件</el-button>
								</template>
							</el-input>
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
										<el-button type="primary" class="ml1">浏览文件</el-button>
									</el-upload></template
								>
								<template #append v-if="state.formData[item.prop]"
									><el-button @click="inputsubmitUpload(item.prop)" type="primary" class="ml1">上传文件</el-button>
									<el-button v-if="state.formData['draw3dPath'].includes('/')" class="look-file" @click="lookUpload(item.prop)">查看文件</el-button>
								</template>
							</el-input>

							<el-select
								v-model="state.formData[item.prop]"
								:placeholder="$t(item.placeholder)"
								v-if="item.type === 'select'"
								style="width: 100%"
								:disabled="state.dialog.isdisable"
								@change="(val:any) => selectHandelChange(val,item.prop)"
								:filterable="item.filterable"
								:remote="item.remote"
								:remote-show-suffix="item.remoteShowSuffix"
								:remote-method="remoteMethod"
								:loading="item.loading"
							>
								<el-option v-for="val in item.options" :key="val.label" :label="val.text" :value="val.value">
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
								:maxlength="item.maxlength || 300"
							></el-input>
							<span v-if="item.type === 'text'" style="width: 100%; font-weight: 700; color: #1890ff">
								{{ state.formData[item.prop] }}
							</span>
						</el-form-item>

						<span v-else>
							<el-button type="primary" plain v-if="item.type === 'button'" @click="dailogFormButton">{{ item.label }}</el-button>
						</span>
					</el-col>
				</el-row>
			</el-form>

			<el-form v-if="state.dialog.type === 'imp'" class="drawer-multiColumn-form" label-width="100px">
				<el-button size="default" class="buttonBorder mb10" @click="ondownloadTemp" type="primary" plain>{{ $t('下载模版') }}</el-button>
				<div class="download-form">
					<el-input v-model="fileListName" placeholder="请点击浏览文件按钮" />
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
						<el-button type="primary" size="default" class="ml10 buttonBorder bottonDownload" plain>浏览文件</el-button>
					</el-upload>
					<el-button
						:disabled="fileListName ? false : true"
						size="default"
						class="ml10 buttonBorder bottonDownload"
						type="primary"
						plain
						@click="submitUpload"
						>{{ $t('开始上传') }}</el-button
					>
				</div>
			</el-form>
			<!-- 嵌套弹窗 -->
			<template v-if="dialogType == 'nestDialogConfig'">
				<el-dialog :title="state.innerdialog.title" v-model="state.innerdialog.isShowInnerDialog" width="40%" append-to-body>
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
										v-if="item.type === 'input'"
										v-model="state.formInnerData[item.prop]"
										:placeholder="$t(item.placeholder)"
										clearable
										@input=" (val:any) => commonInputHandleChange(val,item.prop)"
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
							</el-col>
						</el-row>
					</el-form>
					<template #footer v-if="isFootBtn">
						<span class="dialog-footer">
							<el-button @click="innnerDialogCancel" size="default">清 空</el-button>
							<el-button type="primary" @click="innnerDialogSubmit(innnerDialogFormRef)" size="default">{{ state.dialog.submitTxt }}</el-button>
						</span>
					</template>
				</el-dialog>
			</template>
			<template #footer v-if="isFootBtn">
				<span class="dialog-footer">
					<el-button @click="onCancel" size="default">取 消</el-button>
					<el-button type="primary" @click="onSubmit(dialogFormRef)" size="default">{{ state.dialog.submitTxt }}</el-button>
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
import type { UploadInstance, UploadProps, UploadUserFile } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { getUploadFileApi } from '/@/api/global/index';
import { verifyPhone, verifyEmail, verifiyNumberInteger } from '/@/utils/toolsValidate';
import { useI18n } from 'vue-i18n';
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
});
const { t } = useI18n();
const uploadRefs = ref<UploadInstance>();
const inputuploadRefs = ref<UploadInstance>();
const input3duploadRefs = ref<UploadInstance>();
const fileList = ref<UploadUserFile[]>([]);
const inputfileList = ref<UploadUserFile[]>([]);
const input3dfileList = ref<UploadUserFile[]>([]);
const fileListName = ref();
// 定义变量内容
const dialogFormRef = ref();
const innnerDialogFormRef = ref();
const uploadForm = ref();
const inputuploadForm = ref();
const input3duploadForm = ref();

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
	emit('dailogFormButton');
};
// 校验表单
const validatePass = (rule: any, value: any, callback: any, item: EmptyObjectType) => {
	const validateForm = item.validateForm;
	if (value === '') {
		callback(new Error(`${t(item.label)}不能为空`));
	} else if (
		(validateForm && validateForm === 'phone' && !verifyPhone(value)) ||
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
				message: `${t(item.label)}不能为空`,
				trigger: item.type === 'select' || item.type === 'input' || item.type === 'inputFile' || item.type === 'textarea' ? 'blur' : 'change',
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
			inputuploadForm.value = '';
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
			emit('editDialog', state.formData);
		});
		props.dialogConfig.forEach((v) => {
			if (v.editDisable) {
				state.dialog.isdisable = true;
			}
		});
	} else if (type === 'imp') {
		fileListName.value = '';
		state.dialog.title = '上传文件';
		state.dialog.submitTxt = '开始上传';
	} else {
		state.dialog.title = title;
		state.dialog.submitTxt = '确 定';
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
		} else {
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
	emit('commonInputHandleChange', val, prop, state);
}, 500);
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
	emit('remoteMethod', query);
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
const inputsubmitUpload = async (prop: string) => {
	let value = prop == 'drawPath' ? inputuploadForm.value.raw : input3duploadForm.value.raw;
	const res = await getUploadFileApi(0, value);
	state.formData[prop] = res.data;
	res.status && ElMessage.success(`上传成功`);
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
</style>
