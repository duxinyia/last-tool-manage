<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch
				labelWidth=" "
				v-if="state.tableData.search[2].options && state.tableData.search[2].options.length > 0"
				:search="state.tableData.search"
				@search="onSearch"
				:searchConfig="state.tableData.searchConfig"
				@remoteMethod="remoteMethod"
			/>
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@cellclick="idleNoClick"
				:cellStyle="cellStyle"
				@onOpenOtherDialog="openDetailDialog"
				@importTable="onExportTableData"
			/>
			<el-dialog ref="reportInquiryDialogRef" v-model="reportInquiryDialogVisible" :title="dilogTitle" width="40%">
				<el-form ref="dialogFormRef" :model="dialogState.tableData" size="default" label-width="100px">
					<el-row>
						<el-col :xs="24" :sm="12" :md="11" :lg="11" :xl="11" class="mb5" v-for="(val, key) in dialogState.tableData.search" :key="key">
							<el-form-item :label="$t(val.label)" :prop="val.prop">
								<span v-if="val.type === 'text'" style="width: 100%; font-weight: 500; color: red">
									{{ dialogState.tableData.form[val.prop] }}
								</span>
							</el-form-item>
						</el-col>
					</el-row>
				</el-form>
				<Table v-bind="dialogState.tableData" class="table" />

				<div class="describe">
					<div style="line-height: 30px">
						描述說明：<span style="color: red" class="ml10">{{ dialogState.tableData.form['describe'] }}</span>
					</div>
				</div>
			</el-dialog>
			<!-- 閒置詳情彈窗 -->
			<el-dialog v-model="detaildialogVisible" :title="dilogTitle" width="50%">
				<IdleNoDetailDialog :isDialog="true" :IdleNoRef="IdleNoRef" />
				<template #footer v-if="dilogTitle == '詳情'">
					<span class="dialog-footer">
						<el-button size="default" auto-insert-space @click="detaildialogVisible = false">取消</el-button>
						<el-button size="default" type="primary" auto-insert-space @click="onSend" :loading="loadingBtn" :disabled="sendDisabled">
							送 簽
						</el-button>
					</span>
				</template>
			</el-dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="/requistManage/reportingInquiry">
import { defineAsyncComponent, reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { IdleQueryPageListApi, GetIdleDetailApi, getIdleSubmitSignApi, getIdleDownloadApi } from '/@/api/unusedManage/unusedInquiry';
import { getQueryStoreHouseNoPageApi } from '/@/api/global';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const IdleNoDetailDialog = defineAsyncComponent(() => import('/@/views/link/idleInquiryLink/index.vue'));

// 定义变量内容
const reportInquiryDialogVisible = ref(false);
const sendDisabled = ref(false);
const { t } = useI18n();
const tableRef = ref<RefType>();
const reportInquiryDialogRef = ref();
// 单元格样式
const cellStyle = ref();
// 弹窗标题
const dilogTitle = ref();
const detaildialogVisible = ref(false);
const loadingBtn = ref(false);
const IdleNoRef = ref();
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'idleno', colWidth: '', title: '閒置單號', type: 'text', isCheck: true },
			{ key: 'idledate', colWidth: '', title: '閒置日期', type: 'text', isCheck: true },
			{ key: 'classes', colWidth: '', title: '班別', type: 'text', isCheck: true },
			{ key: 'idleSLocation', colWidth: '', title: '閒置倉庫位置', type: 'text', isCheck: true },
			{ key: 'signStatus', colWidth: '', title: '簽核狀態', type: 'text', isCheck: true },
			{ key: 'creator', colWidth: '', title: '操作人', type: 'text', isCheck: true },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: true, // 是否显示表格多选
			isOperate: true, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: true, //是否有分页
			exportIcon: true, //是否有导出icon(导出功能)
		},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '閒置單號', prop: 'idleNo', required: false, type: 'input' },
			{ label: '閒置日期', prop: 'idleDate', required: false, type: 'dateRange' },
			{
				label: '簽核狀態',
				prop: 'signStatus',
				required: false,
				type: 'select',
				clearable: true,
				options: [
					{ value: 0, label: '未送簽', text: '未送簽', selected: true },
					{ value: 1, label: '簽核中', text: '簽核中', selected: false },
					{ value: 2, label: '簽核完成', text: '簽核完成', selected: false },
				],
			},
			{ label: '班別', prop: 'classes', type: 'input', required: false },
			{
				label: '閒置倉庫位置',
				prop: 'idleSLocation',
				type: 'select',
				required: false,
				placeholder: '請輸入選擇閒置倉庫位置',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
			},
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'detail', name: '詳情', color: '#1890ff', isSure: false, icon: 'ele-View' }],
		// 给后端的数据
		form: {
			// idleNo: '',
			// idleDate: '',
			signStatus: 0,
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
		header: [
			{
				key: 'matno',
				colWidth: '250',
				title: 'message.pages.matNo',
				type: 'text',
				isCheck: true,
			},
			// { key: 'vendorcode', colWidth: '', title: '厂商代码', type: 'text', isCheck: true },
			// { key: 'vendorname', colWidth: '', title: '厂商名称', type: 'text', isCheck: true },
			{ key: 'qty', colWidth: '', title: '閒置數量', type: 'text', isCheck: true },
			{ key: 'idlereason', colWidth: '150', title: '閒置原因', type: 'text', isCheck: true },
			// { key: 'prItemNo', colWidth: '', title: 'PR项次', type: 'text', isCheck: true },
		],
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
			height: 300,
		},
		// 给后端的数据
		form: {},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '閒置單號:', prop: 'idlepno', type: 'text', required: false },
			{ label: '閒置日期:', prop: 'idleDate', type: 'text', required: false },
			{ label: '班別:', prop: 'classes', type: 'text', required: false },
			{ label: '閒置倉庫位置:', prop: 'idleSLocation', type: 'text', required: false },
		],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// 点击详情按钮
const openDetailDialog = (scope: EmptyObjectType) => {
	loadingBtn.value = false;
	IdleNoRef.value = scope.row.idleno;
	// getDetailData(scope.row.idleno);
	detaildialogVisible.value = true;
	dilogTitle.value = '詳情';
	sendDisabled.value = scope.row.signStatus1 ? true : false;
};
// 单元格字体颜色
const changeToStyle = (indList: number[]) => {
	return ({ columnIndex }: any) => {
		for (let j = 0; j < indList.length; j++) {
			let ind = indList[j];
			if (columnIndex === ind) {
				return { color: 'var(--el-color-primary)', cursor: 'pointer' };
			}
		}
	};
};
cellStyle.value = changeToStyle([2]);
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	option.forEach((item) => {
		if (item.value === form.idleSLocation) {
			form.idleSLocation = item.text;
		}
	});
	let data: EmptyObjectType = {};
	data = {
		...form,
		idleDateStart: form.idleDate && form.idleDate[0],
		idleDateEnd: form.idleDate && form.idleDate[1],
		page: state.tableData.page,
	};

	delete data.idleDate;
	const signStatusMap: EmptyObjectType = {
		0: '未送簽',
		1: '簽核中',
		2: '簽核完成',
	};
	const res = await IdleQueryPageListApi(data);
	res.data.data.forEach((item: any) => {
		item.signStatus1 = item.signStatus;
		item.signStatus = signStatusMap[item.signStatus];
	});
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
// 点击闲置单号
const idleNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'idleno') {
		dilogTitle.value = '閒置單號:' + row.idleno;
		getDetailData(row.idleno);
	}
};
// 详情接口
const getDetailData = async (idleno: string) => {
	const res = await GetIdleDetailApi(idleno);
	dialogState.tableData.data = res.data.idledetaillist;
	dialogState.tableData.form = res.data;
	reportInquiryDialogVisible.value = true;
	if (res.status) {
		dialogState.tableData.config.loading = false;
	}
};
// 送簽
const onSend = async () => {
	loadingBtn.value = true;
	const res = await getIdleSubmitSignApi(IdleNoRef.value);
	if (res.status) {
		ElMessage.success(t('送簽成功'));
		detaildialogVisible.value = false;
		getTableData();
	}
	loadingBtn.value = false;
};
let option: EmptyArrayType = [];
const remoteMethod = (query: string, form: EmptyObjectType, prop?: string) => {
	let search = state.tableData.search;
	if (query && prop === 'idleSLocation') {
		search?.forEach((item) => {
			if (item.prop === 'idleSLocation') item.loading = true;
		});
		setTimeout(async () => {
			const res = await getQueryStoreHouseNoPageApi('閒置倉', query);
			option = res.data.map((item: EmptyObjectType) => {
				return { value: `${item.storeId}`, label: `${item.storeType}`, text: `${item.sLocation}` };
			});
			search?.forEach((item) => {
				if (item.prop === 'idleSLocation') {
					item.loading = false;
					item.options = option.filter((item: EmptyObjectType) => {
						return item.value;
					});
				}
			});
		}, 500);
	} else {
		search?.forEach((item) => {
			if (item.prop === 'idleSLocation') item.options = [];
		});
	}
};
// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.search[2].options?.forEach((item) => {
		if (data.signStatus === item.text) {
			data.signStatus = item.value;
		}
	});
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value && tableRef.value?.pageReset();
};
// 导出
const onExportTableData = async (row: EmptyObjectType) => {
	let rows: EmptyArrayType = [];
	Object.keys(row).forEach((key) => {
		rows.push(row[key].idleno);
	});
	const res = await getIdleDownloadApi(rows);
	const result: any = res;
	let blob = new Blob([result], {
		// 这里一定要和后端对应，不然可能出现乱码或者打不开文件
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	});
	const link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = `${t('閒置單')} ${new Date().toLocaleString()}.xlsx`; // 在前端也可以设置文件名字
	link.click();
	//释放内存
	window.URL.revokeObjectURL(link.href);
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
</style>
