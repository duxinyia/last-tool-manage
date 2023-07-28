<template>
	<div class="system-menu-dialog-container">
		<el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" width="769px">
			<el-form ref="dialogFormRef" :model="state.ruleForm" size="default" label-width="80px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20" v-for="item in dialogConfig" :key="item.prop">
						<el-form-item
							:label="item.label"
							:prop="item.prop"
							:rules="[{ required: item.required, message: `${item.label}不能为空`, trigger: item.type === 'input' ? 'blur' : 'change' }]"
						>
							<el-input v-if="item.type === 'input'" v-model="state.ruleForm[item.prop]" :placeholder="item.placeholder" clearable></el-input>
							<el-select v-model="state.ruleForm[item.prop]" :placeholder="item.placeholder" v-if="item.type === 'select'">
								<el-option v-for="val in item.options" :key="val.value" :label="val.label" :value="val.value"> </el-option>
							</el-select>
							<el-switch
								v-if="item.type === 'switch'"
								v-model="state.ruleForm[item.prop]"
								inline-prompt
								active-text="启"
								inactive-text="禁"
							></el-switch>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<template #footer>
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

import { i18n } from '/@/i18n/index';

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// 引入组件
const IconSelector = defineAsyncComponent(() => import('/@/components/iconSelector/index.vue'));
// 定义父组件传过来的值
const props = defineProps({
	// 弹出框内容
	dialogConfig: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
});
// 定义变量内容
const dialogFormRef = ref<FormInstance>();
const state = reactive({
	ruleForm: {},
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
	},
});

// 打开弹窗
const openDialog = (type: string, row?: any) => {
	if (type === 'edit') {
		// 模拟数据，实际请走接口
		console.log(row);
		state.ruleForm = JSON.parse(JSON.stringify(row));
		state.dialog.title = '修改';
		state.dialog.submitTxt = '修 改';
	} else {
		state.dialog.title = '新增';
		state.dialog.submitTxt = '新 增';
		// 清空表单，此项需加表单验证才能使用
		nextTick(() => {
			dialogFormRef.value.resetFields();
		});
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
const onSubmit = (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	formEl.validate((valid: boolean) => {
		if (valid) {
			closeDialog(); // 关闭弹窗
			emit('refresh');
		} else {
		}
	});
};
// 初始化 form 字段，取自父组件 prop
const initFormField = () => {
	if (props.dialogConfig.length <= 0) return false;
	props.dialogConfig.forEach((v) => (state.ruleForm[v.prop] = ''));
};
// 页面加载时
onMounted(() => {
	initFormField();
});

// 暴露变量
defineExpose({
	openDialog,
});
</script>
