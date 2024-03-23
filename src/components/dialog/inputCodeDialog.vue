<template>
	<el-dialog
		:destroy-on-close="true"
		draggable
		:close-on-click-modal="false"
		:title="dialogTitle"
		v-model="state.dialog.isShowDialog"
		:width="dialogWidth"
		:show-close="false"
	>
		<el-form ref="inputQrcodeDialogFormRef" :model="state.formData" size="default">
			<el-row :gutter="35">
				<el-col
					:xs="item.xs || 24"
					:sm="item.sm || 12"
					:md="item.md || 12"
					:lg="item.md || 12"
					:xl="item.xl || 12"
					class="mb20"
					v-for="item in inputQrcodeDialogConfig"
					:key="item.prop"
				>
					<el-form-item
						v-if="item.type != 'button'"
						:label="$t(item.label)"
						:prop="item.prop"
						:rules="[
							{
								required: item.required,
								message: `${t(item.label)}不能為空`,
								trigger: item.type === 'input' || item.type === 'inputFile' || item.type === 'textarea' || item.type === 'select' ? 'blur' : 'change',
							},
						]"
					>
						<el-input
							v-if="item.type === 'sacnstockqtyInput'"
							v-model="state.formData[item.prop]"
							:placeholder="$t(item.placeholder)"
							clearable
							:maxlength="item.maxlength"
							@input=" (val:any) => commonInputHandleChange(val,item.prop)"
						></el-input>

						<div v-else-if="item.type == 'tagsarea'">
							<el-tag v-for="tag in state.formData[item.prop]" :key="tag" closable @close="handleTagClose(tag)" class="mr10">
								{{ tag }}
							</el-tag>
						</div>
						<!-- 入库数量 -->
						<span v-else style="width: 100%; font-weight: 700; color: #1890ff">
							{{ state.formData[item.prop] }}
						</span>
					</el-form-item>
					<span v-else-if="item.type === 'button'">
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
				<el-button type="success" plain size="default" @click="onExportQrcodeData"> 導出二維碼 </el-button>
				<el-button @click="innnerDialogCancel" size="default">清 空</el-button>
				<el-button type="primary" @click="innnerDialogSubmit(inputQrcodeDialogFormRef)" size="default">確 定</el-button>
			</span>
		</template>
	</el-dialog>
</template>

<script setup lang="ts" name="qrCodeDialog">
import { defineAsyncComponent, reactive, onMounted, ref, nextTick, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { debounce } from '/@/utils/debounceAndThrottle';
import { ElMessage, ElMessageBox } from 'element-plus';
import table2excel from 'js-table2excel';
import * as XLSX from 'xlsx';
const { t } = useI18n();
const inputQrcodeDialogFormRef = ref();
const inputImportQrcodeFile = ref();
const loading = ref(false);
const router = useRouter();
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
// 定义父组件传过来的值
const props = defineProps({
	inputQrcodeDialogConfig: {
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
		default: () => '50%',
	},
	loadingBtn: {
		type: Boolean,
		default: () => false,
	},
	labelWidth: {
		type: String,
		default: () => '100px',
	},
	dialogTitle: {
		type: String,
		default: () => '二維碼編號',
	},
	color: {
		type: String,
		default: () => '',
	},
});
const emit = defineEmits([
	'commonInputHandleChange',
	'handleTagClose',
	'dailogFormButton',
	'onImportQrcodeData',
	'innnerDialogCancel',
	'innnerDialogSubmit',
]);
// 初始化 form 字段，取自父组件 prop
const initFormField = () => {
	if (props.inputQrcodeDialogConfig.length <= 0) return false;
	props.inputQrcodeDialogConfig.forEach((v) => {
		state.formData[v.prop] = '';
		state.formData['codeList'] = [];
	});
};
// 输入框一输入变化（不需要光标移开）
const commonInputHandleChange = debounce((val: any, prop: string) => {
	let { formData } = state;
	if (prop == 'sacnstockqty') {
		if (formData.codeList.includes(val)) {
			ElMessage.warning(`該條碼已存在，請勿重複掃碼`);
		} else if (
			formData.codeList.length + 1 > outTableRow.checkQty - outTableRow.passQty - outTableRow.reRepairQty ||
			formData.codeList.length + 1 > outTableRow.checkQty
		) {
			ElMessage.error(`掃碼數量超過可錄入數量，請勿繼續掃碼`);
		} else {
			formData.codeList.push(val);
			formData['stockqty'] = formData.codeList.length;
		}
		formData['sacnstockqty'] = null;
	}
	emit('commonInputHandleChange', val, prop, state);
}, 500);
// 手動輸入
const dailogFormButton = (btnConfig: EmptyObjectType) => {
	if (!state.formData['inputQty']) return;
	if (state.formData.codeList.includes(state.formData['inputQty'])) {
		ElMessage.warning(`該條碼已存在，請勿重複掃碼`);
	} else if (
		state.formData.codeList.length + 1 > outTableRow.checkQty - outTableRow.passQty - outTableRow.reRepairQty ||
		state.formData.codeList.length + 1 > outTableRow.checkQty
	) {
		ElMessage.error(`掃碼數量超過可錄入數量，請勿繼續掃碼`);
	} else {
		state.formData.codeList.push(state.formData['inputQty']);
		state.formData['stockqty'] = state.formData.codeList.length;
	}
	state.formData['inputQty'] = null;
	emit('dailogFormButton', state.formData, btnConfig);
};
// 关闭tag标签
const handleTagClose = (tag: any) => {
	state.formData.codeList.splice(state.formData.codeList.indexOf(tag), 1);
	state.formData['stockqty'] = state.formData.codeList.length;
	ElMessage.success('刪除成功');
	emit('handleTagClose', tag, state);
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
// 導出二維碼編碼
const onExportQrcodeData = () => {
	const { meta } = router.currentRoute.value;
	let { formData } = state;
	if (formData.codeList.length <= 0) return ElMessage.warning('請先錄入二維碼');
	let codes = formData.codeList.map((item: any) => {
		return { code: item };
	});
	table2excel(
		[{ key: 'code', title: '二維碼編碼', type: 'text' }],
		codes,
		`${meta.title}- ${state.dialog.title}二維碼 ${new Date().toLocaleString()}.xls`
	);
};
const innnerDialogCancel = () => {
	if (state.formData.codeList.length <= 0) return ElMessage.warning('數據已清空');
	ElMessageBox.confirm('確定清空嗎?', '提示', {
		confirmButtonText: '確 定',
		cancelButtonText: '取 消',
		type: 'warning',
		draggable: true,
	})
		.then(async () => {
			state.formData.codeList = [];
			state.formData['stockqty'] = 0;
		})
		.catch(() => {});
	emit('innnerDialogCancel', state.formData);
	// closeInnerDialog();
};
//内嵌弹窗提交
const innnerDialogSubmit = (formEl: EmptyObjectType | undefined) => {
	if (!formEl) return;
	formEl.validate((valid: boolean) => {
		if (valid) {
			emit('innnerDialogSubmit', state.formData, state.dialog.isShowDialog);
			closeDialog();
		} else {
		}
	});
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
		if (state.formData.codeList.includes(flatArray[i])) {
			repetitionCode.push(flatArray[i]);
		} else {
			importNoRepetitionCode.push(flatArray[i]);
		}
	}
	// 最后去重了条码加上现有的条码集合的长度
	const flatArrayLength = [...new Set(state.formData.codeList.concat(flatArray))].length;
	if (flatArrayLength > outTableRow.checkQty - outTableRow.passQty - outTableRow.reRepairQty || flatArrayLength > outTableRow.checkQty) {
		ElMessage.error(`此文件中的條碼數量加上现有的掃碼數量超過可錄入數量，請勿導入`);
		return;
	}
	if (importNoRepetitionCode.length <= 0) {
		ElMessage.error(`此文件所有條碼與現有條碼全部重複，請勿重複導入`);
		return;
	}
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
	state.formData.codeList = [...new Set(state.formData.codeList.concat(flatArray))];
	// 增加条码后更改数量
	state.formData.stockqty = state.formData.codeList.length;
	ElMessage.success(`導入成功，共导入${importNoRepetitionCode.length}条`);
};
onMounted(() => {
	initFormField();
});
let outTableRow: EmptyObjectType = {};
// 打开弹窗
const openDialog = (type: string, row?: any, title?: string) => {
	outTableRow = row;
	state.formData.codeList = row?.uselessCodes || [];
	if (row.uselessCodes && row.uselessCodes.length > 0) {
		state.formData['stockqty'] = row.uselessCodes.length;
	} else {
		state.formData['stockqty'] = null;
	}

	state.dialog.isShowDialog = true;
};

// 关闭弹窗
const closeDialog = () => {
	state.dialog.isShowDialog = false;
};

// 暴露变量
defineExpose({
	openDialog,
	closeDialog,
});
</script>

<style scoped lang="scss">
.infinite-list-wrapper {
	height: 500px;
	text-align: center;
}
.infinite-list-wrapper .list {
	padding: 0;
	margin: 0;
	list-style: none;
}

.infinite-list-wrapper .list-item {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 30px;
	margin-top: 10px;
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
}
.list-item-primary {
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
}
.list-item-danger {
	background: var(--el-color-danger-light-9);
	color: var(--el-color-danger);
}
</style>
