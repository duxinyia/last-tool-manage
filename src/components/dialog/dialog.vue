<template>
	<div class="system-menu-dialog-container">
		<el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" width="769px">
			<el-form v-if="state.dialog.type !== 'imp'" ref="dialogFormRef" :model="state.formData" size="default" label-width="80px">
				<el-row :gutter="35">
					<el-col
						:xs="item.xs || 24"
						:sm="item.sm || 12"
						:md="item.md || 12"
						:lg="item.md || 12"
						:xl="item.xl || 12"
						class="mb20"
						v-for="item in dialogConfig"
						:key="item.prop"
					>
						<el-form-item
							:label="$t(item.label)"
							:prop="item.prop"
							:rules="[
								{
									required: item.required,
									message: `${$t(item.label)}不能为空`,
									trigger: item.type === 'input' || item.type === 'inputFile' || item.type === 'textarea' ? 'blur' : 'change',
								},
							]"
						>
							<el-input v-if="item.type === 'input'" v-model="state.formData[item.prop]" :placeholder="$t(item.placeholder)" clearable></el-input>

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
									><el-button @click="inputsubmitUpload" type="primary" class="ml1">上传文件</el-button>
									<el-button v-if="state.formData['drawPath'].includes('/')" class="look-file" @click="lookUpload">查看文件</el-button>
								</template>
							</el-input>

							<el-select
								v-model="state.formData[item.prop]"
								:placeholder="$t(item.placeholder)"
								v-if="item.type === 'select'"
								:disabled="state.dialog.isdisable"
							>
								<el-option v-for="val in item.options" :key="val.value" :label="val.label" :value="val.value"> </el-option>
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
								maxlength="150"
							></el-input>
						</el-form-item>
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
			<template #footer v-if="state.dialog.type !== 'imp'">
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

import { ElMessage, genFileId, UploadRawFile } from 'element-plus';
import type { UploadInstance, UploadProps, UploadUserFile } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { getUploadFileApi } from '/@/api/global/index';
// 引入组件
const IconSelector = defineAsyncComponent(() => import('/@/components/iconSelector/index.vue'));
const emit = defineEmits(['downloadTemp', 'importTableData', 'addData']);
// 定义父组件传过来的值
const props = defineProps({
	// 弹出框内容
	dialogConfig: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
	dialogType: {
		type: String,
		default: () => '',
	},
});

const uploadRefs = ref<UploadInstance>();
const inputuploadRefs = ref<UploadInstance>();
const fileList = ref<UploadUserFile[]>([]);
const inputfileList = ref<UploadUserFile[]>([]);
const fileListName = ref();
// 定义变量内容
const dialogFormRef = ref();
const uploadForm = ref();
const inputuploadForm = ref();
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
});
const ondownloadTemp = () => {
	emit('downloadTemp');
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
	}
	state.dialog.type = type;
	state.dialog.isShowDialog = true;
};
// 关闭弹窗
const closeDialog = () => {
	state.dialog.isShowDialog = false;
};

// 取消
const onCancel = () => {
	closeDialog();
};
// 提交
const onSubmit = (formEl: EmptyObjectType | undefined) => {
	if (!formEl) return;
	formEl.validate((valid: boolean) => {
		if (valid) {
			emit('addData', state.formData, state.dialog.type);
		} else {
		}
	});
};
// 初始化 form 字段，取自父组件 prop
const initFormField = () => {
	if (props.dialogConfig.length <= 0) return false;
	props.dialogConfig.forEach((v) => (state.formData[v.prop] = ''));
};
// input框里面的数据
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
	inputuploadRefs.value[0]!.clearFiles();
	const file = files[0] as UploadRawFile;
	file.uid = genFileId();
	inputuploadRefs.value[0]!.handleStart(file);
};

// 上传文件
const inputsubmitUpload = async () => {
	const res = await getUploadFileApi(0, inputuploadForm.value.raw);
	state.formData['drawPath'] = res.data;
	res.status && ElMessage.success(`上传成功`);
};
// 查看上传的文件
const lookUpload = () => {
	window.open(`${import.meta.env.VITE_API_URL}${state.formData['drawPath']}`, '_blank');
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
