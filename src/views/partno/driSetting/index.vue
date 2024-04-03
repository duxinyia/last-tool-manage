<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch
				:search="state.tableData.search"
				@search="onSearch"
				:searchConfig="state.tableData.searchConfig"
				@remoteMethod="(query) => remoteMethod(query, 1)"
				labelWidth="70px"
			/>
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@delRow="onTableDelRow"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@importTable="onExportTableData"
				@onOpentopBtnOther="openDialog"
				:cellStyle="cellStyle"
				@cellclick="matNoClick"
			>
			</Table>
			<Dialog
				ref="noSearchDialogRef"
				:dialogConfig="state.tableData.dialogConfig"
				@addData="addData"
				:loadingBtn="loadingBtn"
				@inputBlur="onInputBlur"
				labelWidth="110px"
				@close="isDialogStatus = false"
			/>
			<el-dialog
				v-if="matNoRef && (matNoRef.signStatus === 5 || matNoRef.signStatus === 6)"
				draggable
				:close-on-click-modal="false"
				v-model="matNoDetaildialogVisible"
				:title="titleDialog + '中'"
				width="99%"
			>
				<matModifySignInfoLink @editDialogTitle="editDialogTitle" :isDialog="true" :matNoRef="matNoRef"
			/></el-dialog>
			<el-dialog
				v-else
				draggable
				:close-on-click-modal="false"
				v-model="matNoDetaildialogVisible"
				:title="$t('message.pages.partNumberDetails')"
				width="50%"
			>
				<matNoDetailDialog :isDialog="true" :matNoRef="matNoRef"
			/></el-dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="/partno/driSetting">
import { defineAsyncComponent, reactive, ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getInvalidMaterialApi, getMachineTypesApi } from '/@/api/partno/noSearch';
import { postMatDRIManageChangeMatsDRIApi, postMatDRIManageQueryMatsOfUserBuApi } from '/@/api/partno/driSetting';
import { useI18n } from 'vue-i18n';
import { getUserNameApi } from '/@/api/global';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
const matNoDetailDialog = defineAsyncComponent(() => import('/@/views/link/noSearchLink/index.vue'));
const matModifySignInfoLink = defineAsyncComponent(() => import('/@/views/link/matModifySignInfoLink/index.vue'));
// 定义变量内容
const { t } = useI18n();
const loadingBtn = ref(false);
const tableRef = ref<RefType>();
const noSearchDialogRef = ref();
const matNoRef = ref();
const matNoDetaildialogVisible = ref(false);
let isDialogStatus = ref(false);
const titleDialog = ref('');
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matNo', colWidth: '', title: 'message.pages.matNo', type: 'text', isCheck: true },
			{ key: 'reqMatNo', colWidth: '', title: 'message.pages.materialPurchaseNumber', type: 'text', isCheck: true },
			{ key: 'depart', colWidth: '', title: 'message.pages.segmentPosition', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: 'message.pages.nameCh', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: 'message.pages.nameEn', type: 'text', isCheck: true },
			{ key: 'drawNo', colWidth: '', title: 'message.pages.drawNo', type: 'text', isCheck: true },
			{ key: 'specs', colWidth: '', title: 'message.pages.specs', type: 'text', isCheck: true },
			{ key: 'signStatusStr', colWidth: '', title: 'message.pages.signatureStatus', type: 'text', isCheck: true },
			{
				key: 'codeManageMode',
				colWidth: '',
				title: 'message.pages.qrCodeManagementMode',
				type: 'text',
				isCheck: true,
				transfer: {
					0: 'message.pages.codedManagement',
					1: 'message.pages.noCodeManagement',
				},
			},
			{ key: 'picture', colWidth: '', title: 'message.pages.picture', width: '70', height: '40', type: 'uploadImage', isCheck: true },
			{ key: 'dri', colWidth: '', title: 'DRI', type: 'text', isCheck: true },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: true, // 是否显示表格序号
			isSelection: true, // 是否显示表格多选
			isOperate: false, // 是否显示表格操作栏
			isButton: true, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: true, //是否有表格右上角工具
			isPage: true, //是否有分页
			operateWidth: 220, //操作栏宽度，如果操作栏有几个按钮就自己定宽度
			// exportIcon: true, //是否有导出icon(导出功能)
		},
		topBtnConfig: [
			{ type: 'changeDri', name: '變更DRI', defaultColor: 'primary', isSure: true, disabled: true, icon: 'ele-Edit', isNoSelcetDisabled: true },
		],
		btnConfig: [],
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: 'message.pages.matNo', prop: 'matNo', placeholder: '', required: false, type: 'input' },

			{
				label: 'message.pages.segmentPosition',
				prop: 'depart',
				placeholder: '',
				required: false,
				type: 'select',
				options: [
					{ value: 'FOL', label: 'FOL', text: 'FOL' },
					{ value: 'EOL', label: 'EOL', text: 'EOL' },
					{ value: 'SMT', label: 'SMT', text: 'SMT' },
				],
			},
			{ label: 'message.pages.nameProduct', prop: 'name', placeholder: '', required: false, type: 'input' },
			{ label: 'message.pages.drawNo', prop: 'drawNo', placeholder: '', required: false, type: 'input' },
			{
				label: 'message.pages.machineType',
				prop: 'machineType',
				required: false,
				type: 'select',
				placeholder: 'message.pages.pleaseEnterTheSelectionModel',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
			},
			{
				label: '簽核狀態',
				prop: 'signStatus',
				placeholder: '',
				required: false,
				type: 'select',
				options: [
					{ value: 0, label: '未送簽', text: '未送簽' },
					{ value: 1, label: '試產簽核中', text: '試產簽核中' },
					{ value: 2, label: '試產簽核完成', text: '試產簽核完成' },
					{ value: 3, label: '量產簽核中', text: '量產簽核中' },
					{ value: 4, label: '量產簽核完成', text: '量產簽核完成' },
					{ value: 5, label: '試產料號修改簽核中', text: '試產料號修改簽核中' },
					{ value: 6, label: '量產料號修改簽核中', text: '量產料號修改簽核中' },
				],
			},
		],
		searchConfig: {
			isSearchBtn: true,
		},
		// 给后端的数据
		form: {},
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '',
		// 弹窗表单
		dialogConfig: [
			{ label: 'DRI', prop: 'changedDRI', placeholder: '', required: true, type: 'input' },
			{ label: '姓名', prop: 'changedDRIName', placeholder: '', required: false, type: 'text' },
		],
	},
});
watch(
	() => isDialogStatus.value,
	(val) => {
		if (val == false) {
			tableRef.value.clearSelection();
		}
	}
);
// 单元格字体颜色
const cellStyle = ({ column }: EmptyObjectType) => {
	const property = column.property;
	if (property === 'matNo') {
		return { color: 'var(--el-color-primary)', cursor: 'pointer' };
	}
};
// 修改弹窗标题
const editDialogTitle = (title: string) => {
	titleDialog.value = title;
};
// 点击料号弹出详情
const matNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'matNo') {
		matNoRef.value = row;
		setTimeout(() => {
			matNoDetaildialogVisible.value = true;
		}, 100);
	}
};
// 选择下拉
let options: EmptyArrayType = [];
const remoteMethod = (query: string, num: number) => {
	let dialogConfig = num === 2 ? state.tableData.dialogConfig : state.tableData.search;
	dialogConfig?.forEach((item) => {
		if (item.prop === 'machineTypes' || item.prop === 'machineType') item.loading = true;
	});
	if (query) {
		setTimeout(async () => {
			const res = await getMachineTypesApi(query);
			options = res.data.map((item: EmptyObjectType) => {
				return { value: `${item}`, label: `${item}`, text: `${item}` };
			});
			dialogConfig?.forEach((item) => {
				if (item.prop === 'machineTypes' || item.prop === 'machineType') {
					item.loading = false;
					item.options = options.filter((item: EmptyObjectType) => {
						return item.value.toLowerCase().includes(query.toLowerCase());
					});
				}
			});
		}, 500);
	} else {
		dialogConfig?.forEach((item) => {
			if (item.prop === 'machineTypes' || item.prop === 'machineType') item.options = [];
		});
	}
};
// 初始化列表数据
const getTableData = async () => {
	state.tableData.config.loading = true;
	const form = state.tableData.form;
	if (form.signStatus === '') form.signStatus = null;
	let data = {
		...form,
		page: state.tableData.page,
	};

	const res = await postMatDRIManageQueryMatsOfUserBuApi(data);
	res.data.data.forEach((item: any) => {
		item.dri = item.dri + ' / ' + item.driName;
		item.picture = `${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${item.picture}`;
	});
	state.tableData.data = res.data.data;
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};

// 搜索点击时表单回调
const onSearch = (data: EmptyObjectType) => {
	state.tableData.form = Object.assign({}, state.tableData.form, { ...data });
	tableRef.value?.pageReset();
};
// 輸入工號得到姓名
const onInputBlur = async (row: EmptyObjectType) => {
	if (row.changedDRI) {
		const res = await getUserNameApi(row.changedDRI);
		if (res.status) {
			row.changedDRIName = res.message;
		} else {
			row.changedDRI = '';
			row.changedDRIName = '';
			ElMessage.warning(t('請重新輸入DRI'));
		}
	} else {
		row.changedDRIName = '';
	}
};
let selectlist: EmptyObjectType = {};

// 打开弹窗
const openDialog = async (row: EmptyObjectType, type: string) => {
	selectlist = row;
	loadingBtn.value = false;
	isDialogStatus.value = true;
	noSearchDialogRef.value.openDialog(type, {}, '變更DRI');
};
// 新增数据  修改数据
const addData = async (ruleForm: EmptyObjectType, type: string) => {
	let matNos: EmptyArrayType = [];
	selectlist.forEach((item: any) => {
		matNos.push(item.matNo);
	});
	const data = {
		matNos,
		changedDRI: ruleForm.changedDRI,
	};
	loadingBtn.value = true;
	const res = await postMatDRIManageChangeMatsDRIApi(data);
	loadingBtn.value = false;
	if (res.status) {
		ElMessage.success(`變更成功`);
		noSearchDialogRef.value.closeDialog();
		isDialogStatus.value = false;
		getTableData();
	}
};

// 删除当前项回调
const onTableDelRow = async (row: EmptyObjectType, type: string) => {
	// let rows = [];
	// if (type === 'bulkDel') {
	// 	Object.keys(row).forEach((key) => {
	// 		rows.push(row[key].matNo);
	// 	});
	// } else {
	// 	rows.push(row.matNo);
	// }
	// const res = await getInvalidMaterialApi(rows);
	// if (res.status) {
	// 	type === 'bulkDel'
	// 		? ElMessage.success(`批量刪除成功`)
	// 		: ElMessage.success(`${t('message.allButton.deleteBtn')}${row.matNo}${t('message.hint.success')}`);
	// 	getTableData();
	// }
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
// 导出
const onExportTableData = async (row: EmptyObjectType, hearder: EmptyObjectType) => {
	//#region
	// let rows: EmptyArrayType = [];
	// Object.keys(row).forEach((key) => {
	// 	rows.push(row[key].matNo);
	// });
	// const propertyNames: EmptyArrayType = [];
	// const strArr: EmptyObjectType = {
	// 	Bu: 'BuCode',
	// 	Picture: 'PictureUrl',
	// 	MatNo: 'Matno',
	// 	ReqMatNo: 'ReqMatno',
	// 	CodeManageMode: 'CodeManageModeStr',
	// };
	// const imparity = ['Bu', 'Picture', 'MatNo', 'ReqMatNo', 'CodeManageMode'];
	// hearder.forEach((item: any) => {
	// 	propertyNames.push(item.key.charAt(0).toUpperCase() + item.key.slice(1));
	// });
	// propertyNames.forEach((item) => {
	// 	if (imparity.includes(item)) {
	// 		propertyNames[propertyNames.indexOf(item)] = strArr[item];
	// 	}
	// });
	// if (propertyNames.length <= 0) return ElMessage.warning('請選擇要導出的列');
	// const data = { ids: rows, propertyNames: propertyNames };
	// const res = await getMatnoExportApi(data);
	// const result: any = res.data;
	// let blob = new Blob([result], {
	// 	// 这里一定要和后端对应，不然可能出现乱码或者打不开文件
	// 	type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	// });
	// const link = document.createElement('a');
	// link.href = window.URL.createObjectURL(blob);
	// const temp = res.headers['content-disposition'].split(';')[1].split('filename=')[1].replace(new RegExp('"', 'g'), '');
	// link.download = decodeURIComponent(temp);
	// // link.download = `${t('料號')} ${new Date().toLocaleString()}.xlsx`; // 在前端也可以设置文件名字
	// link.click();
	// //释放内存
	// window.URL.revokeObjectURL(link.href);
	//#endregion
};

// 页面加载时
onMounted(() => {
	getTableData();
	// getSelect();
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
.buttonBorder {
	border: 0px !important;
}
</style>
