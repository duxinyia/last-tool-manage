<template>
	<div class="system-menu-dialog-container">
		<el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" width="1200px">
			<el-row :gutter="10" v-if="state.dialog.num === 1">
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
			<el-button v-if="state.dialog.num === 1" size="default" class="buttonBorder mb12" @click="onAddRow" type="primary" plain
				><el-icon><ele-Plus /></el-icon>{{ $t('message.allButton.addBtn') }}</el-button
			>
			<div class="tableData">
				<el-table
					height="500px"
					id="elTable"
					:data="state.dialog.num === 1 ? vendors : marNoData"
					:border="true"
					v-bind="$attrs"
					row-key="id"
					style="width: 100%"
					:row-style="{ height: '10px' }"
					:header-row-style="{ background: '#dce9fd' }"
					:span-method="objectSpanMethod"
				>
					<el-table-column
						align="center"
						v-for="(item, index) in state.dialog.num === 1 ? otherHeaderData : headerData"
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
					<el-table-column v-if="state.dialog.num === 1" align="center" :label="$t('message.pages.operation')" :width="150">
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

			<template #footer v-if="state.dialog.num === 1">
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
const props = defineProps({
	otherHeaderData: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
	headerData: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
});
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
	{ type: 'text', lable: '送样单号', prop: 'simpleNo', value: '' },
	{ type: 'text', lable: '料号', prop: 'matNo', value: '' },
	{ type: 'text', lable: '品名-中文', prop: 'nameCh', value: '' },
	{ type: 'text', lable: '品名-英文', prop: 'nameEn', value: '' },
	{ type: 'input', lable: '工程验收人', prop: 'engineerName', placeholder: '', xs: 10, sm: 8, md: 8, lg: 8, xl: 8, value: '' },
]);
const vendors = ref([{ vendorCode: '', vendorName: '', sampleQty: '', sampleTime: '', needsQty: '' }]);
const marNoData = ref([
	{ matNo: 'a', nameCh: '2', nameEn: '3', sampleQty: '4', sampleTime: '5', vendorCode: '6', vendorName: '7' },
	{ matNo: 'a', nameCh: '5435', nameEn: '5345', sampleQty: '342', sampleTime: 'sfs', vendorCode: 'sdf', vendorName: 'fdsf' },
	{ matNo: 'a', nameCh: '5435', nameEn: '5345', sampleQty: '342', sampleTime: 'sfs', vendorCode: 'sdf', vendorName: 'fdsf' },
	{ matNo: 'erw', nameCh: 't', nameEn: 'e', sampleQty: 'et', sampleTime: 'et', vendorCode: 'et', vendorName: 'tet' },
	{ matNo: 'erw', nameCh: 't', nameEn: 'e', sampleQty: 'et', sampleTime: 'et', vendorCode: 'et', vendorName: 'tet' },
]);
const state = reactive({
	ruleForm: {},
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
		isdisable: false,
		num: null,
	},
});
// /**合并表格的第一列，处理表格数据 */
const flitterData = (arr, columnI) => {
	let spanOneArr = [];
	let concatOne = 0;

	arr.forEach((item, index) => {
		if (index === 0) {
			spanOneArr.push(1);
		} else {
			// 注意这里的data是表格绑定的字段，根据自己的需求来改
			if (columnI === 0 && item['matNo'] === arr[index - 1]['matNo']) {
				//第一列需合并相同内容的判断条件
				spanOneArr[concatOne] += 1;
				spanOneArr.push(0);
			} else {
				spanOneArr.push(1);
				concatOne = index;
			}
		}
	});
	return {
		one: spanOneArr,
	};
};
const objectSpanMethod = ({ row, column, rowIndex, columnIndex }: SpanMethodProps) => {
	if (columnIndex === 0) {
		const _row = flitterData(marNoData.value, columnIndex).one[rowIndex];
		const _col = _row > 0 ? 1 : 0;
		return {
			rowspan: _row,
			colspan: _col,
		};
	}
};

// 增加一行数据
const onAddRow = () => {
	vendors.value.push({
		vendorCode: '',
		vendorName: '',
		sampleQty: '',
		sampleTime: '',
		needsQty: '',
	});
};
// 删除行
const onDelRow = (i) => {
	vendors.value.splice(i, 1);
};
// 打开弹窗
const openDialog = (scope: Object, n: number) => {
	state.dialog.num = n;
	if (n === 1) {
		state.dialog.title = '送样';
		dialogForm.value.forEach((item) => {
			item.value = scope.row[item.prop];
		});
	} else {
		state.dialog.title = scope.matNo;
	}

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
:deep(.el-table__cell) {
	padding: 8px 0px !important;
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
