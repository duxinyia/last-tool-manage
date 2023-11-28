<template>
	<div class="system-menu-dialog-container">
		<el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" :width="dialogWidth">
			<el-row :gutter="10" v-if="state.dialog.num === 1">
				<el-col
					v-for="item in dialogForm"
					:key="item.prop"
					:xs="item.xs || 10"
					:sm="item.sm || 8"
					:md="item.md || 7"
					:lg="item.md || 7"
					:xl="item.xl || 7"
					class="sample-dialog-col"
				>
					<div v-if="item.type === 'text'">
						{{ item.label }}：<span style="color: red; line-height: 30px" class="ml10">{{ state.formData[item.prop] }}</span>
					</div>
					<div v-if="item.type === 'select'">
						<span v-if="item.isRequired" class="color-danger mr5">*</span>
						<span style="width: 96px" class="mr10">{{ item.label }}</span>
						<el-select
							size="default"
							v-model="state.formData[item.prop]"
							filterable
							remote
							:reserve-keyword="false"
							placeholder="請選擇工程驗收人"
							remote-show-suffix
							:remote-method="selectChange"
							:loading="loading"
						>
							<el-option v-for="val in item.options" :key="val.label" :label="val.value" :value="val.value">
								<span style="float: left">{{ val.label }}</span>
								<span style="float: right; color: var(--el-text-color-secondary)">{{ val.value }}</span>
							</el-option>
						</el-select>
					</div>
					<div v-if="item.type === 'input'" class="objectCheck">
						<span style="width: 96px" class="mr10">{{ item.label }}</span>
						<el-input style="height: 30px" v-model="state.formData[item.prop]" :placeholder="item.placeholder" clearable></el-input>
					</div>
				</el-col>
			</el-row>
			<el-button
				v-if="state.dialog.num === 1 && state.dialog.title == '送樣'"
				size="default"
				class="buttonBorder mb12"
				@click="onAddRow"
				type="primary"
				plain
				><el-icon><ele-Plus /></el-icon>{{ $t('message.allButton.addBtn') }}</el-button
			>
			<el-form ref="tableSampleRef" :model="state" size="default">
				<el-table
					ref="tableRef"
					class="tableData"
					height="300px"
					id="elTable"
					:data="state.dialog.num === 1 ? state.vendors : marNoData"
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
						v-for="item in state.dialog.num === 1 ? otherHeaderData : headerData"
						:key="item.key"
						show-overflow-tooltip
						:prop="item.key"
						:width="item.colWidth"
						:label="$t(item.title)"
					>
						<template v-slot:header>
							<span v-if="item.isRequired" class="color-danger">*</span>
							<span class="pl5">{{ item.title }}</span>
						</template>
						<template v-slot="scope">
							<el-form-item
								:prop="`vendors.${scope.$index}.${item.key}`"
								:rules="[
									{ required: item.isRequired, message: '不能為空', trigger: item.type === 'input' || item.type === 'time' ? 'blur' : 'change' },
								]"
							>
								<el-input
									v-if="item.type === 'input'"
									style="height: 30px"
									v-model="state.vendors[scope.$index][item.key]"
									placeholder="請輸入"
									clearable
								></el-input>
								<el-date-picker
									v-if="item.type === 'time'"
									value-format="YYYY-MM-DD"
									v-model="state.vendors[scope.$index][item.key]"
									type="date"
									placeholder="請選擇時間"
									style="height: 30px"
								/>

								<div v-if="item.type != 'input' && item.type != 'time'" style="text-align: center; width: 100%">
									<span>{{ scope.row[item.key] }}</span>
								</div>
							</el-form-item>
						</template>
					</el-table-column>
					<el-table-column v-if="state.dialog.num === 1" align="center" :label="$t('message.pages.operation')" :width="150">
						<template v-slot="scope">
							<el-button
								:disabled="state.vendors.length <= 1"
								size="default"
								class="button buttonBorder"
								color="#D33939"
								@click="onDelRow(scope.$index)"
								plain
								><el-icon><ele-Delete /></el-icon> 刪除
							</el-button>
						</template>
					</el-table-column>
					<template #empty>
						<el-empty :description="$t('message.hint.nodata')" />
					</template>
				</el-table>
			</el-form>

			<template #footer v-if="state.dialog.num === 1">
				<span class="dialog-footer">
					<el-button @click="onCancel" size="default">取 消</el-button>
					<el-button type="primary" @click="onSubmit(tableSampleRef)" size="default" :loading="loadingBtn">確定</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="sampleDialog">
import { defineAsyncComponent, reactive, onMounted, ref, nextTick, computed, onUpdated } from 'vue';
import { i18n } from '/@/i18n/index';
import { ElMessage } from 'element-plus';
import { getTakeSampleApi } from '/@/api/partno/sampleDelivery';
import { SampleRecieveApi } from '/@/api/partno/sendReceive';
const emit = defineEmits(['sampleSuccess', 'selectChange']);
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
	dialogForm: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
	dialogWidth: {
		type: String,
		default: () => '85%',
	},
	operation: {
		type: String,
		default: '',
	},
});
// 定义变量内容
const tableSampleRef = ref();
const tableRef = ref();
const loading = ref(false);
const loadingBtn = ref(false);
let marNoData = ref<EmptyObjectType>([]);
const state = reactive<dialogFormState>({
	formData: {},
	formInnerData: {},
	vendors: [],
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
		isdisable: false,
		num: 0,
	},
	innerdialog: {
		isShowInnerDialog: false,
		type: '',
		title: '',
		submitTxt: '',
		isdisable: false,
		num: 0,
	},
});
// /**合并表格的第一列，处理表格数据 */
const flitterData = (arr: EmptyObjectType, columnI: number, property: string) => {
	let spanOneArr: EmptyArrayType = [];
	let concatOne = 0;
	arr.forEach((item: EmptyObjectType, index: number) => {
		if (index === 0) {
			spanOneArr.push(1);
		} else {
			// 注意这里的data是表格绑定的字段，根据自己的需求来改
			if (item[property] === arr[index - 1][property] && item['sampleNo'] === arr[index - 1]['sampleNo']) {
				//列需合并相同内容的判断条件
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
const objectSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
	let arr = ['nameCh', 'nameEn', 'sampleNo'];
	if (~arr.indexOf(column.property)) {
		const _row = flitterData(marNoData.value, columnIndex, column.property).one[rowIndex];
		const _col = _row > 0 ? 1 : 0;
		return {
			rowspan: _row,
			colspan: _col,
		};
	}
};

// 增加一行数据
const onAddRow = () => {
	state.vendors.push({
		vendorCode: '',
		vendorName: '',
		needsQty: '',
	});
	// 对 Table 进行重新布局。 当表格可见性变化时，您可能需要调用此方法以获得正确的布局
	tableRef.value.doLayout();
};
// 删除行
const onDelRow = (i: number) => {
	state.vendors.splice(i, 1);
};
// 打开弹窗
const openDialog = (scope: EmptyObjectType, n: number, tit: string, data: EmptyArrayType) => {
	loadingBtn.value = false;
	state.dialog.num = n;
	state.dialog.title = tit;
	if (n === 1) {
		props.dialogForm.forEach((item) => {
			state.formData[item.prop] = scope.row[item.prop];
		});
		// 打开弹窗时还原数据
		nextTick(() => {
			//如果打开的是送样弹窗
			if (props.operation == '送樣') {
				state.vendors = [{ vendorCode: '', vendorName: '', needsQty: '' }];
			}
			//如果打开的是收货弹窗
			else {
				state.vendors = data;
			}
		});
	} else {
		state.dialog.title = scope.matNo;
		marNoData.value = data;
	}
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
const onSubmit = async (formEl: EmptyObjectType | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning('表格項必填未填');
		let sampleData: EmptyObjectType = {};
		props.dialogForm.forEach((item) => {
			sampleData[item.prop] = state.formData[item.prop];
		});
		sampleData['vendors'] = state.vendors;
		sampleData.vendors.forEach((item: EmptyObjectType) => {
			delete item.sampleQty;
		});
		if (props.operation == '送樣') {
			const res = await getTakeSampleApi(sampleData);
			if (res.status) {
				closeDialog();
				ElMessage.success('送樣成功');
				emit('sampleSuccess');
			}
		} else if (props.operation == '收貨') {
			let receiveData: EmptyObjectType = {};
			props.dialogForm.forEach((item) => {
				if (item.prop == 'engineerNo') {
					receiveData['engineer'] = state.formData[item.prop];
				}
				if (item.prop == 'sampleNo') {
					receiveData[item.prop] = state.formData[item.prop];
				}
			});
			if (!receiveData['engineer']) return ElMessage.warning('請選擇工程驗收人');
			loadingBtn.value = true;
			receiveData['recieveDetails'] = state.vendors.map((item) => {
				let obj = {
					runId: item.runId,
					sampleTime: item.receiveTime,
					sampleQty: item.receiveQty,
					vendorCode: item.vendorCode,
				};
				return obj;
			});
			const res: any = await SampleRecieveApi(receiveData);
			if (res.status) {
				closeDialog();
				ElMessage.success('收貨成功');
				emit('sampleSuccess');
			}
		}
		loadingBtn.value = false;
	});
};

// 工程验收人搜索下拉选择
const selectChange = (query: string) => {
	emit('selectChange', query, state.formData);
};
const loadingOpen = () => {
	loading.value = true;
};
const loadingClose = () => {
	loading.value = false;
};
// 页面加载时
onMounted(() => {});

// 暴露变量
defineExpose({
	openDialog,
	loadingOpen,
	loadingClose,
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
	margin-bottom: 10px;
}
</style>
