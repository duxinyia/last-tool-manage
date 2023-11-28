<template>
	<el-tabs v-model="activeName" class="table-container layout-padding" @tab-click="handleClick">
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="需求請購單" name="first">
			<div class="title">需求請購單</div>
			<el-form ref="tableSearchRef" size="default" label-width="auto" class="table-form">
				<el-row>
					<el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4" class="mb20 mr20" v-for="(val, key) in state.tableData.search" :key="key">
						<el-form-item :label="$t(val.label)" :prop="val.prop">
							<el-input
								:maxlength="val.maxlength"
								v-model="state.tableData.form[val.prop]"
								:placeholder="`請輸入${$t(val.label)}`"
								clearable
								v-if="val.type === 'input'"
								style="width: 150px"
							/>
							<span v-else style="color: red; width: 100%">
								{{ state.tableData.form[val.prop] }}
							</span>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<!-- 表格 -->
			<el-form ref="tableFormRef" :model="state.tableData" size="default">
				<Table
					ref="tableRef"
					v-bind="state.tableData"
					class="table"
					@delRow="(row: EmptyObjectType, i: number)=>onDelRow(row,i,state.tableData)"
					@addrow="onAddRow(state.tableData)"
					@remoteMethod="(index: number, query: string)=>remoteMethod(index, query,state.tableData)"
					@changeselect="changeSelect"
				/>
			</el-form>
			<div class="describe">
				<span>描述說明：</span>
				<el-input
					class="input-textarea"
					show-word-limit
					v-model="state.tableData.form['describe']"
					type="textarea"
					placeholder="請輸入"
					maxlength="150"
				></el-input>
			</div>
			<!-- 提交按钮 -->
			<span class="table-bottom">
				<el-button :loading="saveLoading" type="info" @click="onClearData" size="default">重置</el-button>
				<el-button :loading="saveLoading" type="success" @click="onSubmit(tableFormRef, 1, state.tableData)" size="default">保存</el-button>
				<el-button :loading="subLoading" type="primary" @click="onSubmit(tableFormRef, 2, state.tableData)" size="default">提交</el-button>
			</span>
		</el-tab-pane>
		<el-tab-pane class="table-padding layout-padding-view layout-padding-auto" label="請購單記錄" name="second">
			<TableSearch :search="secondState.tableData.search" @search="onSearch" :searchConfig="secondState.tableData.searchConfig" labelWidth="70px" />
			<Table
				ref="tableRef2"
				v-bind="secondState.tableData"
				class="table"
				@sortHeader="onSortHeader"
				@pageChange="onTablePageChange"
				@onOpenOtherDialog="openDetailDialog"
			/>
		</el-tab-pane>
		<!-- 彈窗 -->
		<el-dialog draggable :close-on-click-modal="false" v-model="detailDialogVisible" title="詳情" width="80%">
			<el-form ref="dialogFormRef" :model="dialogState.tableData.form" size="default" label-width="100px">
				<el-row>
					<el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6" class="mb10" v-for="(val, key) in dialogState.tableData.dialogConfig" :key="key">
						<el-form-item :label="val.type === 'status' ? (isDraft ? $t(val.label) : '') : $t(val.label)" :prop="val.prop">
							<el-input
								v-if="val.type === 'input'"
								:maxlength="val.maxlength"
								v-model="dialogState.tableData.form[val.prop]"
								:placeholder="`請輸入${$t(val.label)}`"
								clearable
								style="width: 150px"
							/>
							<!-- <el-date-picker
								v-if="val.type === 'dateRange'"
								value-format="YYYY-MM-DD"
								v-model="dialogState.tableData.form[val.prop]"
								type="daterange"
								range-separator="-"
								start-placeholder="開始日期"
								end-placeholder="結束日期"
								style="width: 100%"
							/> -->
							<span v-if="val.type === 'text'" style="color: #1890ff; font-weight: 700; line-height: 30px" class="ml10">{{
								dialogState.tableData.form[val.prop]
							}}</span>
							<template v-if="val.type === 'status' && dialogState.tableData.form[val.prop]">
								<el-tag size="large" type="warning">草稿</el-tag>
							</template>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<el-form ref="dialogtableFormRef" :model="dialogState.tableData" size="default">
				<Table
					ref="tableRef"
					v-bind="dialogState.tableData"
					class="table"
					@delRow="(row: EmptyObjectType, i: number)=>onDelRow(row,i,dialogState.tableData)"
					@addrow="onAddRow(dialogState.tableData)"
					@remoteMethod="(index: number, query: string)=>remoteMethod(index, query,dialogState.tableData)"
					@changeselect="changeSelect"
				/>
			</el-form>
			<div class="describe">
				<span>描述說明：</span>
				<el-input
					v-if="isDraft"
					class="input-textarea"
					show-word-limit
					v-model="dialogState.tableData.form['describe']"
					type="textarea"
					placeholder="請輸入"
					maxlength="150"
				></el-input>
				<span v-else style="color: #1890ff; font-weight: 700">{{ dialogState.tableData.form['describe'] }}</span>
			</div>
			<template #footer v-if="isDraft">
				<span class="dialog-footer">
					<el-button size="default" auto-insert-space @click="detailDialogVisible = false">取 消</el-button>
					<el-button size="default" type="danger" auto-insert-space :loading="delLoading" @click="onDelData"> 刪除草稿 </el-button>
					<el-button
						size="default"
						type="success"
						auto-insert-space
						@click="onSubmit(dialogtableFormRef, 1, dialogState.tableData)"
						:loading="saveLoading"
					>
						保 存
					</el-button>
					<el-button
						size="default"
						type="primary"
						auto-insert-space
						@click="onSubmit(dialogtableFormRef, 2, dialogState.tableData)"
						:loading="subLoading"
					>
						提 交
					</el-button>
				</span>
			</template>
		</el-dialog>
	</el-tabs>
</template>

<script setup lang="ts" name="requistManagepresentation">
import { defineAsyncComponent, reactive, ref, onMounted, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox, TabsPaneContext } from 'element-plus';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
// 接口
import {
	getApplyRecordDetailApi,
	getCreateOrUpdateDraftApi,
	getDeleteDraftApi,
	getQueryApplyRecordApi,
	getQueryNoPageApi,
	getSubmitDraftApi,
} from '/@/api/requistManage/presentation';
import { getMachineTypesOfMatApi } from '/@/api/partno/noSearch';
// 定义变量内容
const { t } = useI18n();
const tableRef = ref();
const dialogTableRef = ref();
const tableRef2 = ref();
const tableFormRef = ref();
const dialogtableFormRef = ref();
const resDataRef = ref([]);
const subLoading = ref(false);
const saveLoading = ref(false);
const delLoading = ref(false);
const detailDialogVisible = ref(false);
const activeName = ref<string | number>('first');
const handleClick = (tab: TabsPaneContext, event: Event) => {
	activeName.value = tab.paneName as string | number;
	// activeName.value === 'first' ? 0 : getTableData();
};
// 彈窗form數據
const state = reactive<EmptyObjectType>({
	tableData: {
		// 列表数据（必传）
		data: [
			{
				matNo: '',
				nameCh: '',
				nameEn: '',
				drawNo: '',
				reqQty: null,
				reqDate: '',
				prItemNo: '',
			},
		],
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: true, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			height: 500,
			isAddRowBtn: true, //是否有添加行按钮
		},
		// 表头内容（必传，注意格式）
		header: [
			{
				key: 'matNo',
				colWidth: '250',
				title: 'message.pages.matNo',
				type: 'select',
				isCheck: true,
				isRequired: true,
				loading: false,
				option: [],
				isfilterable: true,
			},
			{ key: 'drawNo', colWidth: '100', title: '圖紙編號', type: 'text', isCheck: true, isRequired: false },
			{ key: 'reqMatNo', colWidth: '150', title: '請購料號', type: 'text', isCheck: true, isRequired: false },
			{ key: 'nameCh', colWidth: '110', title: '品名-中文', type: 'text', isCheck: true, isRequired: false },
			{ key: 'nameEn', colWidth: '110', title: '品名-英文', type: 'text', isCheck: true, isRequired: false },
			{
				key: 'machineType',
				colWidth: '150',
				title: '機種',
				type: 'select',
				isCheck: true,
				isRequired: true,
				collapseTags: true,
				collapseTagsTooltip: true,
				clearable: true,
				rowOption: true,
			},
			{ key: 'line', colWidth: '', title: '線體', type: 'input', isCheck: true, isRequired: true },
			{ key: 'reqQty', colWidth: '150', title: 'PR數量', type: 'number', isCheck: true, isRequired: true, min: 0 },
			{ key: 'reqDate', colWidth: '150', title: '需求時間', type: 'time', isCheck: true, isRequired: true },
			{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'input', isCheck: true, isRequired: false, maxlength: 20 },
		],
		// 弹窗表单
		dialogConfig: [],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		searchConfig: {
			isSearchBtn: false, //搜索框
		},
		search: [
			{ label: '申請單號：', prop: 'reqNo', placeholder: '', type: 'text' },
			{ label: 'PR單號', prop: 'prNo', placeholder: '请输入PR單號', type: 'input', maxlength: 20 },
		],
		// 给后端的数据
		form: {
			reqNo: '',
		},
	},
});
const secondState = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'reqNo', colWidth: '', title: '申請單號', type: 'text', isCheck: true },
			{ key: 'prNo', colWidth: '', title: 'PR單號', type: 'text', isCheck: true },
			{ key: 'statusStr', colWidth: '', title: '狀態', type: 'text', isCheck: true },
			{ key: 'submitTime', colWidth: '', title: '提交時間', type: 'text', isCheck: true },
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
			{ label: '申請單號', prop: 'reqNo', required: false, type: 'input' },
			{ label: 'PR單號', prop: 'prNo', required: false, type: 'input' },
			{ label: '提交時間', prop: 'submitTime', required: false, type: 'dateRange' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'detail', name: '查看詳情', color: '#1890ff', isSure: false, icon: 'ele-View' }],
		// 给后端的数据
		form: {},
		dialogConfig: [],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
const dialogState = reactive<EmptyObjectType>({
	tableData: {
		// 列表数据（必传）
		data: [
			{
				matNo: '',
				nameCh: '',
				nameEn: '',
				drawNo: '',
				reqQty: null,
				reqDate: '',
				prItemNo: '',
			},
		],
		config: {
			total: 0, // 列表总数
			loading: false, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: true, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			height: 500,
			isAddRowBtn: true, //是否有添加行按钮
		},
		// 表头内容（必传，注意格式）
		header: [
			{
				key: 'matNo',
				colWidth: '250',
				title: 'message.pages.matNo',
				type: 'select',
				othersType: 'select',
				isCheck: true,
				isRequired: true,
				loading: false,
				option: [],
				isfilterable: true,
			},
			{ key: 'drawNo', colWidth: '100', title: '圖紙編號', type: 'text', isCheck: true, isRequired: false },
			{ key: 'reqMatNo', colWidth: '150', title: '請購料號', type: 'text', isCheck: true, isRequired: false },
			{ key: 'nameCh', colWidth: '110', title: '品名-中文', type: 'text', isCheck: true, isRequired: false },
			{ key: 'nameEn', colWidth: '110', title: '品名-英文', type: 'text', isCheck: true, isRequired: false },
			{
				key: 'machineType',
				colWidth: '150',
				title: '機種',
				type: 'select',
				othersType: 'select',
				isCheck: true,
				isRequired: true,
				collapseTags: true,
				collapseTagsTooltip: true,
				clearable: true,
				rowOption: true,
			},
			{ key: 'line', colWidth: '', title: '線體', type: 'input', othersType: 'input', isCheck: true, isRequired: true },
			{ key: 'reqQty', colWidth: '150', title: 'PR數量', type: 'number', othersType: 'number', isCheck: true, isRequired: true, min: 0 },
			{ key: 'reqDate', colWidth: '150', title: '需求時間', type: 'time', othersType: 'time', isCheck: true, isRequired: true },
			{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'input', othersType: 'input', isCheck: true, isRequired: false, maxlength: 20 },
			{ key: 'describe', colWidth: '150', title: '描述說明', type: 'textarea', othersType: 'textarea', isCheck: true, isRequired: false },
			{ key: 'receivedQty', colWidth: '110', title: '已收貨數量', type: 'text', isCheck: true, isRequired: false },
			{ key: 'checkPassQty', colWidth: '120', title: '驗收合格數量', type: 'text', isCheck: true, isRequired: false },
			{ key: 'checkFailQty', colWidth: '130', title: '驗收不合格數量', type: 'text', isCheck: true, isRequired: false },
			{ key: 'dispatchedQty', colWidth: '110', title: '已發料數量', type: 'text', isCheck: true, isRequired: false },
			{ key: 'storedQty', colWidth: '110', title: '已入庫數量', type: 'text', isCheck: true, isRequired: false },
		],
		// 弹窗表单
		dialogConfig: [
			{ label: '申請單號:', prop: 'reqNo', placeholder: '', required: false, type: 'text' },
			{ label: 'PR單號:', prop: 'prNo', placeholder: '', required: false, type: 'text', othersType: 'input' },
			// { label: '提交時間:', prop: 'submitTime', placeholder: '', required: false, type: 'text', othersType: 'dateRange' },
			{ label: '狀態:', prop: 'isDraft', placeholder: '', required: false, type: 'status' },
		],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true }],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		searchConfig: {
			isSearchBtn: false, //搜索框
		},
		search: [],
		// 给后端的数据
		form: {},
	},
});
// 初始化列表数据
const getTableData = async () => {
	{
		secondState.tableData.config.loading = true;
		const form = secondState.tableData.form;
		form.startSubmitTime = (form.submitTime && form.submitTime[0]) || null;
		form.endSubmitTime = (form.submitTime && form.submitTime[1]) || null;
		delete form.submitTime;
		const data = { ...form, page: secondState.tableData.page };
		const res = await getQueryApplyRecordApi(data);
		secondState.tableData.data = res.data.data;
		secondState.tableData.config.total = res.data.total;
		if (res.status) {
			secondState.tableData.config.loading = false;
		}
	}
};
// 分页改变时回调
const onTablePageChange = (page: TableDemoPageType) => {
	secondState.tableData.page.pageNum = page.pageNum;
	secondState.tableData.page.pageSize = page.pageSize;
	getTableData();
};
// 拖动显示列排序回调
const onSortHeader = (data: TableHeaderType[]) => {
	secondState.tableData.header = data;
};
const onSearch = (data: EmptyObjectType) => {
	secondState.tableData.form = Object.assign({}, secondState.tableData.form, { ...data });
	tableRef2.value && tableRef2.value?.pageReset();
};
const isDraft = ref();
// 打開詳情彈窗
const openDetailDialog = async (scope: EmptyObjectType) => {
	dialogState.tableData.config.loading = true;
	const res = await getApplyRecordDetailApi(scope.row.reqNo);
	dialogState.tableData.form = res.data;
	dialogState.tableData.data = res.data.details;
	isDraft.value = res.data.isDraft;
	dialogState.tableData.dialogConfig.forEach((item: any) => {
		if (item.prop === 'prNo') {
			item.type = res.data.isDraft ? item.othersType || item.type : 'text';
		}
	});
	dialogState.tableData.header.forEach((item: any) => {
		item.type = res.data.isDraft ? item.othersType || item.type : 'text';
		const hideArr = ['receivedQty', 'checkPassQty', 'checkFailQty', 'dispatchedQty', 'storedQty'];
		if (hideArr.includes(item.key)) {
			item.isCheck = res.data.isDraft ? false : true;
		}
	});
	dialogState.tableData.config.isAddRowBtn = res.data.isDraft ? true : false;
	dialogState.tableData.config.isOperate = res.data.isDraft ? true : false;
	detailDialogVisible.value = true;
	if (res.status) {
		dialogState.tableData.config.loading = false;
	}
};
const remoteMethod = (index: number, query: string, datas: EmptyObjectType) => {
	let loading = datas.header[0].loading;
	if (query) {
		loading = true;
		setTimeout(async () => {
			const res = await getQueryNoPageApi(query);
			loading = false;
			resDataRef.value = res.data;
			datas.header[0].option = res.data.map((item: EmptyObjectType) => {
				return { ...item, value: `${item.matNo}`, label: `${item.matNo}` };
			});
			if (res.data.length === 1) {
				datas.data[0].matNo = query;
				changeSelect(0, query);
			}

			// datas.header[0].option = option.filter((item: EmptyObjectType, index) => {
			// 	return item.label.toLowerCase().includes(query.toLowerCase());
			// });
		}, 500);
	} else {
		datas.header[0].option = [];
	}
};
// let links = ref([]);
// // 获取输入建议的方法， 仅当你的输入建议数据 resolve 时，通过调用 callback(data:[])  来返回它
// const querySearchAsync = async (queryString: string, cb: (arg: any) => void) => {
// 	if (queryString) {
// 		let res = await getQueryNoPageApi(queryString);
// 		res.data.forEach((item: any) => {
// 			item['value'] = item.matNo;
// 		});
// 		links.value = res.data;
// 		const results = links.value;
// 		cb(results);
// 	} else {
// 		links.value = [];
// 		cb(links.value);
// 	}
// };
// // 	点击选中建议项时触发 清空数据
// const handleChange = (i: number) => {
// 	let data = state.tableData.data[i];
// 	data.nameCh = '';
// 	data.nameEn = '';
// };
// // 	在 Input 值改变时触发
const changeSelect = async (i: number, query: any) => {
	resDataRef.value.forEach(async (item: any) => {
		if (item.matNo === query) {
			let data = activeName.value === 'first' ? state.tableData.data[i] : dialogState.tableData.data[i];
			data.nameCh = item.nameCh;
			data.nameEn = item.nameEn;
			data.drawNo = item.drawNo;
			data.reqMatNo = item.reqMatNo;
			data.machineType = item.machineType;
			const res = await getMachineTypesOfMatApi(item.matNo);
			data.machineTypeoption = res.data.map((item: EmptyObjectType) => {
				return { value: `${item}`, label: `${item}` };
			});
		}
	});
};
// 刪除草稿
const onDelData = async () => {
	ElMessageBox.confirm('確定刪除草稿嗎?', '提示', {
		confirmButtonText: '確 定',
		cancelButtonText: '取 消',
		type: 'warning',
		draggable: true,
	})
		.then(async () => {
			delLoading.value = true;
			const res = await getDeleteDraftApi(dialogState.tableData.form.reqNo);
			if (res.status) {
				ElMessage.success(t('刪除草稿成功'));
				detailDialogVisible.value = false;
				getTableData();
			}
			delLoading.value = false;
		})
		.catch(() => {});
};
// 增加一行数据
const onAddRow = (datas: EmptyObjectType) => {
	datas.data.push({});
	// 新增的时候超过表格了跟着移动
	nextTick(() => {
		tableRef.value.setScrollTop();
	});
	// 对 Table 进行重新布局。 当表格可见性变化时，您可能需要调用此方法以获得正确的布局
	// tableRef.value.doLayout();
};
// 新增的时候超过表格了跟着移动
// watch(
// 	() => state.tableData.data,
// 	() => {
// 		nextTick(() => {
// 			tableRef.value.setScrollTop();
// 		});
// 	},
// 	{ deep: true }
// );
//删除
const onDelRow = (row: EmptyObjectType, i: number, datas: EmptyObjectType) => {
	datas.data.splice(i, 1);
};
// 清空數據 重置
const onClearData = () => {
	const tableData = state.tableData;
	if (Object.keys(tableData.form).length <= 0 && tableData.data.length <= 0) return ElMessage.warning(t('數據已經重置了，請勿繼續點擊重置按鈕'));
	ElMessageBox.confirm('確定重置嗎?', '提示', {
		confirmButtonText: '確 定',
		cancelButtonText: '取 消',
		type: 'warning',
		draggable: true,
	})
		.then(async () => {
			// 清空
			tableData.form = {};
			tableData.data = [];
		})
		.catch(() => {});
};
// 1.保存，2.提交
const onSubmit = async (formEl: EmptyObjectType | undefined, type: number, datas: EmptyObjectType) => {
	if (!formEl) return;
	await formEl.validate(async (valid: boolean) => {
		if (!valid) return ElMessage.warning(t('表格項必填未填'));
		const typeMap: EmptyObjectType = {
			1: '保存',
			2: '提交',
		};
		let allData: EmptyObjectType = {};
		allData = { ...datas.form };
		const data = datas.data.map((item: any) => {
			return {
				matNo: item.matNo,
				machineType: item.machineType,
				line: item.line,
				reqQty: item.reqQty,
				reqDate: item.reqDate,
				prItemNo: item.prItemNo,
				describe: item.describe,
			};
		});
		allData['details'] = data;
		if (datas.data.length <= 0) {
			ElMessage.warning(t(`${typeMap[type]}數據為空，請新增數據`));
		} else {
			if (type === 1) {
				saveLoading.value = true;
				const res = await getCreateOrUpdateDraftApi(allData);
				if (res.status) {
					datas.form.reqNo = res.data;
					ElMessage.success(t('保存草稿成功'));
				}
				saveLoading.value = false;
			} else {
				if (!datas.form.reqNo) return ElMessage.warning(t(`請先保存數據，得到申請料號再提交`));
				ElMessageBox.confirm('確定提交嗎?', '提示', {
					confirmButtonText: '確 定',
					cancelButtonText: '取 消',
					type: 'warning',
					draggable: true,
				})
					.then(async () => {
						subLoading.value = true;
						const res = await getSubmitDraftApi({ reqNo: datas.form.reqNo });
						if (res.status) {
							ElMessage.success(t('提交成功'));
						}
						subLoading.value = false;
						if (activeName.value !== 'first') {
							detailDialogVisible.value = false;
						}
						// 清空
						const tableData = state.tableData;
						tableData.form = {};
						tableData.data = [];
					})
					.catch(() => {});
			}
			getTableData();
		}
	});
};
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
.title {
	font-size: 20px;
	display: flex;
	justify-content: center;
	margin-bottom: 10px;
}
.describe {
	display: flex;
	margin-top: 10px;
	span {
		width: 90px;
	}
}
.table-bottom {
	display: flex;
	justify-content: flex-end;
	margin-top: 10px;
}
:deep(.el-tabs__content) {
	height: 100% !important;
}
:deep(.el-tabs__item) {
	font-weight: 700;
	font-size: 14px;
}
</style>
