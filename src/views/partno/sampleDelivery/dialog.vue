<template>
	<div class="system-menu-dialog-container">
		<el-dialog title="送样" v-model="state.dialog.isShowDialog" width="1200px">
			<el-row :gutter="10">
				<el-col
					v-for="item in dialogForm"
					:key="item.prop"
					:xs="item.xs || 10"
					:sm="item.sm || 8"
					:md="item.md || 4"
					:lg="item.md || 4"
					:xl="item.xl || 4"
					class="sample-dialog-col"
				>
					<div v-if="item.type === 'text'">
						{{ item.lable }}：<span style="color: red" class="ml10">{{ item.value }}</span>
					</div>
					<div v-if="item.type === 'input'" class="objectCheck">
						<span style="width: 96px" class="mr10">{{ item.lable }}</span>
						<el-input style="height: 30px" v-model="item.value" :placeholder="item.placeholder" clearable></el-input>
					</div>
				</el-col>
			</el-row>
			<el-button size="default" class="buttonBorder" @click="onAddRow" type="primary" plain
				><el-icon><ele-Plus /></el-icon>{{ $t('message.allButton.addBtn') }}</el-button
			>
			<div class="tableData mt12">
				<el-table
					height="500px"
					id="elTable"
					:data="vendors"
					:border="false"
					v-bind="$attrs"
					row-key="id"
					stripe
					style="width: 100%"
					:row-style="{ height: '1px' }"
					:header-row-style="{ background: '#f2f5fa' }"
				>
					<el-table-column
						align="center"
						v-for="(item, index) in setHeader"
						:key="index"
						show-overflow-tooltip
						:prop="item.key"
						:width="item.colWidth"
						:label="$t(item.title)"
					>
						<template v-slot="scope">
							<template v-if="item.type === 'input'">
								<!-- {{ scope.row[item.key] }} -->
								<el-input style="height: 30px" v-model="vendors[scope.$index][item.key]" placeholder="请输入" clearable></el-input>
							</template>
							<template v-if="item.type === 'time'">
								<el-date-picker
									value-format="YYYY-MM-DD"
									v-model="vendors[scope.$index][item.key]"
									type="date"
									placeholder="请选择时间"
									style="height: 30px; max-width: 167px"
								/>
							</template>
						</template>
					</el-table-column>
					<el-table-column align="center" :label="$t('message.pages.operation')" :width="150">
						<template v-slot="scope">
							<el-button
								:disabled="vendors.length <= 1"
								size="default"
								class="button buttonBorder"
								color="#D33939"
								@click="onDelRow(scope.$index)"
								plain
								><el-icon><ele-Delete /></el-icon> 删除
							</el-button>
						</template>
					</el-table-column>
					<template #empty>
						<el-empty :description="$t('message.hint.nodata')" />
					</template>
				</el-table>
			</div>

			<template #footer>
				<span class="dialog-footer">
					<el-button @click="onCancel" size="default">取 消</el-button>
					<el-button :disabled="computedVendors" type="primary" @click="onSubmit()" size="default">确定</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="sampleDialog">
import { defineAsyncComponent, reactive, onMounted, ref, nextTick, computed } from 'vue';
import { i18n } from '/@/i18n/index';
import { ElMessage } from 'element-plus';
import { getTakeSampleApi } from '/@/api/partno/sampleDelivery.ts';
const emit = defineEmits([]);
// 定义父组件传过来的值
const props = defineProps({});
const computedVendors = computed(() => {
	let flag = false;
	const value = vendors.value[0];
	for (let key in value) {
		if (!value[key]) {
			return true;
		}
	}
	return flag;
});
// 定义变量内容

// 送样弹窗数据
const dialogForm = ref([
	{ type: 'text', lable: '送样单号', prop: 'no', value: '' },
	{ type: 'text', lable: '料号', prop: 'matNo', value: '' },
	{ type: 'text', lable: '品名-中文', prop: 'nameCh', value: '' },
	{ type: 'text', lable: '品名-英文', prop: 'nameEn', value: '' },
	{ type: 'input', lable: '工程验收人', prop: 'engineerName', placeholder: '', xs: 10, sm: 8, md: 8, lg: 8, xl: 8, value: '' },
]);
const vendors = ref([{ vendorCode: '', vendorName: '', sampleQty: '', sampleTime: '', needsQty: '' }]);
const setHeader = ref([
	{ key: 'vendorCode', colWidth: '', title: '厂商代码', type: 'input', isCheck: true },
	{ key: 'vendorName', colWidth: '', title: '厂商名称', type: 'input', isCheck: true },
	{ key: 'sampleQty', colWidth: '', title: '送样数量', type: 'input', isCheck: true },
	{ key: 'sampleTime', colWidth: '', title: '送样时间', type: 'time', isCheck: true },
	{ key: 'needsQty', colWidth: '', title: '需求送样数量', type: 'input', isCheck: true },
]);
const state = reactive({
	ruleForm: {},
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
		isdisable: false,
	},
});
// 增加一行数据
const onAddRow = () => {
	vendors.value.push({
		matNo: '',
		specs: '',
		nameCh: '',
		nameEn: '',
	});
};
// 删除行
const onDelRow = (i) => {
	vendors.value.splice(i, 1);
};
// 打开弹窗
const openDialog = (scope: Object) => {
	dialogForm.value.forEach((item) => {
		item.value = scope.row[item.prop];
	});
	// 打开弹窗时还原数据
	nextTick(() => {
		vendors.value = [{ vendorCode: '', vendorName: '', sampleQty: '', sampleTime: '', needsQty: '' }];
	});
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
const onSubmit = async () => {
	let sampleData = {};
	dialogForm.value.forEach((item) => {
		sampleData[item.prop] = item.value;
	});
	sampleData['vendors'] = vendors.value;
	const res = await getTakeSampleApi(sampleData);
	if (res.status) {
		closeDialog();
		ElMessage.success('送样成功');
	}
};

// 页面加载时
onMounted(() => {});

// 暴露变量
defineExpose({
	openDialog,
});
</script>

<style scoped lang="scss">
.objectCheck {
	display: flex !important;
	align-items: center;
	height: 19px;
}
:deep(.el-table th.el-table__cell) {
	background-color: unset;
	color: var(--el-color-primary);
}
.tableData {
	border: 1px solid var(--el-color-primary-light-7);
}
.buttonBorder {
	border: 0px !important;
}
.sample-dialog-col {
	margin-bottom: 20px;
}
</style>
