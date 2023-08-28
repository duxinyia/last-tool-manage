<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch :search="state.tableData.search" @search="onSearch" :searchConfig="state.tableData.searchConfig" />
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@cellclick="matnoClick"
				:cellStyle="cellStyle"
				@onOpenOtherDialog="openReturnDialog"
			/>
			<el-dialog ref="repairReturnDialogRef" v-model="arriveJobDialogVisible" :title="dilogTitle" width="60%">
				<el-form ref="tableFormRef" :model="dialogState.tableData.form" size="default">
					<el-row v-if="dilogTitle == '退库'">
						<el-col
							:xs="val.xs || 24"
							:sm="val.sm || 12"
							:md="val.md || 8"
							:lg="val.lg || 8"
							:xl="val.xl || 8"
							class="mb10"
							v-for="(val, key) in dialogState.tableData.search"
							:key="key"
						>
							<el-form-item
								:label="`${$t(val.label)}：`"
								:prop="val.prop"
								:rules="[
									{
										required: val.required,
										message: `${$t(val.label)}不能为空`,
										trigger: 'blur',
									},
								]"
							>
								<div v-if="val.type === 'text'">
									<span>{{ dialogState.tableData.form[val.prop] }}</span>
								</div>
								<div v-if="val.type === 'input'" class="dialog-input">
									<!-- <span v-if="val.isRequired" class="color-danger mr5">*</span> -->
									<el-input v-model="dialogState.tableData.form[val.prop]" placeholder="请输入" clearable style="height: 30px"></el-input>
								</div>
								<div v-if="val.type === 'select'" class="dialog-input">
									<el-select v-model="dialogState.tableData.form[val.prop]" placeholder="请输入" clearable @change="selectChange(val.prop)">
										<el-option v-for="item in val.options" :key="item.value" :label="item.label" :value="item.value"> </el-option>
									</el-select>
								</div>
							</el-form-item>
						</el-col>
					</el-row>

					<Table v-bind="dialogState.tableData" class="table" @delRow="onDelRow" v-if="dilogTitle != '退库'" />

					<div class="describe" v-if="dilogTitle == '退库'">
						<span>描述说明：</span>
						<el-input
							class="input-textarea"
							show-word-limit
							v-model="dialogState.tableData.form['describe']"
							type="textarea"
							placeholder="请输入"
							maxlength="150"
						></el-input>
					</div>
				</el-form>
				<template #footer v-if="dilogTitle == '退库'">
					<span class="dialog-footer">
						<el-button size="default" auto-insert-space @click="arriveJobDialogVisible = false">取消</el-button>
						<el-button size="default" type="primary" auto-insert-space @click="onSubmit(tableFormRef)"> 确定 </el-button>
					</span>
				</template>
			</el-dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="/requistManage/arriveJob">
import { defineAsyncComponent, reactive, ref, onMounted, computed, nextTick } from 'vue';
import type { FormInstance } from 'element-plus';

import { ElMessage } from 'element-plus';
// 引入接口
import { getQueryNoPageApi } from '/@/api/requistManage/presentation';
import { getStockListApi, ExitStoreApi, getExitReasonApi } from '/@/api/toolsReturn/maintentanceTools';
import { getMaterialListApi, getGetSampleApi } from '/@/api/partno/sampleDelivery';

import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const repairReturnDialogRef = ref();
const arriveJobDialogVisible = ref(false);

// 单元格样式
const cellStyle = ref();

// 弹窗标题
const dilogTitle = ref();
const header = ref([]);
const header1 = ref([
	{ key: 'matNo', colWidth: '', title: 'message.pages.matNo', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
	{ key: 'drawNo', colWidth: '', title: 'message.pages.drawNo', type: 'text', isCheck: true },
	{ key: 'specs', colWidth: '', title: 'message.pages.specs', type: 'text', isCheck: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matno', colWidth: '', title: '料号', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
			{ key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
			{ key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
			{ key: 'stockqty', colWidth: '', title: '库存总量', type: 'text', isCheck: true },
			{ key: 'qrstockqty', colWidth: '', title: '有码库存量', type: 'text', isCheck: true },
			{ key: 'noqrstockqty', colWidth: '', title: '无码库存量', type: 'text', isCheck: true },
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
			{ label: '料号', prop: 'matNo', required: false, type: 'input' },
			{ label: '品名', prop: 'matName', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '退库', color: '#D3C333', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			matNo: '',
			matName: '',
		},
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '表格打印演示',
	},
});
const dialogState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: false, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			isDialogTab: true, //是否是弹窗里面的表格
			height: 500,
		},
		// 给后端的数据
		form: {},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '料号', prop: 'matno', required: false, type: 'text' },
			{ label: '品名-中文', prop: 'nameCh', required: false, type: 'text' },
			{ label: '品名-英文', prop: 'nameEn', required: false, type: 'text' },
			{ label: '厂商代码', prop: 'vendorcode', required: false, type: 'text' },
			{ label: '厂商名称', prop: 'vendorname', required: false, type: 'text', xs: 24, sm: 12, md: 12, lg: 12, xl: 12 },
			{
				label: '退库类型',
				prop: 'exitType',
				required: true,
				type: 'select',
				options: [
					{ value: 1, label: '维修' },
					{ value: 2, label: '闲置' },
					{ value: 3, label: '报废' },
				],
			},
			{ label: '退库原因', prop: 'reasonId', required: true, type: 'select', options: [] },
			{ label: '退库数量', prop: 'exitQty', required: true, type: 'input' },
		],
		btnConfig: [{ type: 'edit', name: '退库', color: '#D33939', isSure: true, disabled: true }],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// 单元格字体颜色
const changeToStyle = (indList: number[]) => {
	// return ({ columnIndex }: any) => {
	// 	for (let j = 0; j < indList.length; j++) {
	// 		let ind = indList[j];
	// 		if (columnIndex === ind) {
	// 			return { color: 'var(--el-color-primary)', cursor: 'pointer' };
	// 		}
	// 	}
	// };
};
cellStyle.value = changeToStyle([1]);
// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	let data = {
		matNo: form.matNo,
		matName: form.matName,
		page: state.tableData.page,
	};
	const res = await getStockListApi(data);
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
//删除
const onDelRow = (row: EmptyObjectType, i: number) => {
	dialogState.tableData.data.splice(i, 1);
};
const exitTypeMap: EmptyObjectType = {
	1: 'RepairReason',
	2: 'IdleReason',
	3: 'UselessReason',
};
//退库弹窗里的退库类型和退库原因选择时的操作
const selectChange = async (name: string) => {
	if (name == 'exitType') {
		dialogState.tableData.form.reasonId = '';
		let res: any = [];
		res = await getExitReasonApi(exitTypeMap[dialogState.tableData.form.exitType]);
		dialogState.tableData.search[6].options = res.data.map((item: any) => {
			return { value: item.runid, label: item.dataname };
		});
	}
	//根据原因id获取原因名称
	if (name == 'reasonId') {
		dialogState.tableData.search[6].options?.forEach((item) => {
			if (item.value == dialogState.tableData.form.reasonId) {
				dialogState.tableData.form['exitReason'] = item.label;
			}
		});
	}
};

// 点击退库弹窗
const openReturnDialog = (scope: EmptyObjectType) => {
	//先清空数据
	arriveJobDialogVisible.value = true;
	dialogState.tableData.form['describe'] = '';
	nextTick(() => {
		tableFormRef.value.resetFields();
	});
	dilogTitle.value = '退库';
	dialogState.tableData.form = { ...scope.row };
	changeStatus(header.value, 300, true);
};
// 点击料号,暂时不做
const matnoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	// if (column.property === 'matno') {
	// 	dilogTitle.value = '料号:' + row.matNo;
	// 	changeStatus(header1.value, 500, false);
	// 	getDetailData(row.matNo);
	// }
};
// 获取料号详情接口
const getDetailData = async (data: string) => {
	const res = await getQueryNoPageApi(data);
	dialogState.tableData.data = res.data;
	arriveJobDialogVisible.value = true;
	if (res.status) {
		dialogState.tableData.config.loading = false;
	}
};
// 根据弹出窗不一样展现的配置不一样
const changeStatus = (header: EmptyArrayType, height: number, isShow: boolean) => {
	let tableData = dialogState.tableData;
	let config = tableData.config;
	tableData.header = header;
	config.height = height;
	config.isOperate = isShow;
	config.isInlineEditing = isShow;
};
// 提交
const onSubmit = async (formEl: EmptyObjectType | undefined) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格项必填未填'));
		// if (!dialogState.tableData.form['sendTime']) return ElMessage.warning(t('请填写收货时间'));
		let allData = { ...dialogState.tableData.form };
		let submitData = {
			stockId: allData.runid,
			exitType: allData.exitType,
			reasonId: allData.reasonId,
			exitReason: allData.exitReason,
			exitQty: allData.exitQty,
			describe: allData.describe,
			codeList: [],
		};
		const res = await ExitStoreApi(submitData);
		if (res.status) {
			ElMessage.success(t('退库成功'));
			arriveJobDialogVisible.value = false;
		}
	});
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value.pageReset();
};

// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType) => {
	state.tableData.page.pageNum = page.pageNum;
	state.tableData.page.pageSize = page.pageSize;
	getTableData();
};
// 拖动显示列排序回调
const onSortHeader = (data: TableHeaderType[]) => {
	state.tableData.header = data;
};
if (dialogState.tableData.btnConfig)
	dialogState.tableData.btnConfig[0].disabled = computed(() => {
		return dialogState.tableData.data.length <= 1 ? true : false;
	});
// 页面加载时
onMounted(() => {
	getTableData();
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
.describe {
	display: flex;
	margin-top: 10px;
	span {
		width: 90px;
	}
}
.dialog-input {
	display: flex;
	align-items: center;
	.el-input {
		width: 90%;
	}
	.el-select {
		width: 90%;
	}
}
</style>
