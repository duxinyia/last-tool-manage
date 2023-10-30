<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<TableSearch
				:search="state.tableData.search"
				@search="onSearch"
				:searchConfig="state.tableData.searchConfig"
				@remoteMethod="remoteMethod"
				@selectChange="selectChangeStoreType"
			>
				<template #optionSearchFat="{ row, value }">
					<span v-if="value.prop === 'dispatcher'" style="float: left; margin-right: 35px">{{ row.value }}</span>
					<span v-if="value.prop === 'dispatcher'" style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ row.label }}</span>
				</template>
			</TableSearch>
			<Table
				ref="tableRef"
				v-bind="state.tableData"
				class="table"
				@pageChange="onTablePageChange"
				@sortHeader="onSortHeader"
				@cellclick="reqNoClick"
				@onOpenOtherDialog="openEntryDialog"
			/>
			<Dialog
				ref="entryJobDialogRef"
				:dialogConfig="state.tableData.dialogConfig"
				:innerDialogConfig="state.tableData.innerDialogConfig"
				dialogWidth="50%"
				dialogType="nestDialogConfig"
				@addData="entrySubmit"
				@dailogFormButton="scanCodeEntry"
				@commonInputHandleChange="change"
				:tagsData="tags"
				@innnerDialogCancel="innnerDialogCancel"
				@innnerDialogSubmit="innnerDialogSubmit"
				@openInnerDialog="openInnerDialog"
				@handleTagClose="handleTagClose"
				:loadingBtn="loadingBtn"
			>
				<template #optionFat="{ row }">
					<span style="float: left; margin-right: 10px">{{ row.text }}</span>
					<span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ row.label }}</span>
				</template>
			</Dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="/toolsReturn/entryJob">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
// 引入接口
import { GetTStockInputPageListApi, GetUserManagedStoreHouseApi, GetTStockAddApi } from '/@/api/requistManage/entryJob';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));
import { getEngieerGroupApi, getLegalStoreTypesApi, getQueryStoreHouseNoPageApi } from '/@/api/global/index';
// 定义变量内容
const { t } = useI18n();
const loadingBtn = ref(false);
const tableFormRef = ref();
const tableRef = ref<RefType>();
const entryJobDialogRef = ref();
// tags的数据
const tags = ref<EmptyArrayType<string>>([]);
// 单元格样式
const cellStyle = ref();
// 弹窗标题
const dilogTitle = ref();
const header = ref([
	{ key: 'matNo', colWidth: '250', title: 'message.pages.matNo', type: 'text', isCheck: true },
	{ key: 'machinetype', colWidth: '', title: '機種', type: 'text', isCheck: true },
	{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
	{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
	{ key: 'vendorcode', colWidth: '', title: '廠商代碼', type: 'text', isCheck: true },
	{ key: 'vendorname', colWidth: '', title: '廠商名稱', type: 'text', isCheck: true },
	{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'text', isCheck: true },
	{ key: 'reqQty', colWidth: '', title: '需求數量', type: 'text', isCheck: true },
	{ key: 'reqDate', colWidth: '', title: '需求時間', type: 'text', isCheck: true },
	{ key: 'receiptQty', colWidth: '', title: '收貨數量', type: 'input', isCheck: true, isRequired: true },
	{ key: 'receiptDate', colWidth: '150', title: '收貨時間', type: 'time', isCheck: true, isRequired: true },
]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'applyCheckId', colWidth: '', title: '驗收單號', type: 'text', isCheck: true },
			{ key: 'reqNo', colWidth: '', title: '申請單號', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'reqMatNo', colWidth: '', title: '請購料號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'dispatcher', colWidth: '', title: '發料人', type: 'text', isCheck: true },
			{ key: 'dispatchTime', colWidth: '', title: '發料時間', type: 'text', isCheck: true },
			{ key: 'qty', colWidth: '', title: '發料數量', type: 'text', isCheck: true },
			{ key: 'receiveStorageType', colWidth: '', title: '領用倉庫類型', type: 'text', isCheck: true },
			{ key: 'receiveSLocation', colWidth: '', title: '領用倉庫位置', type: 'text', isCheck: true },
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
			{ label: '料號', prop: 'matNo', required: false, type: 'input', lg: 6, xl: 6 },
			{ label: '請購料號', prop: 'reqMatNo', required: false, type: 'input' },
			{ label: '品名', prop: 'name', required: false, type: 'input' },
			{
				label: '發料人',
				prop: 'dispatcher',
				required: false,
				type: 'select',
				placeholder: '請輸入選擇發料人',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
			},
			{
				label: '領用倉庫類型',
				prop: 'receiveStorageType',
				required: false,
				type: 'select',
				options: [],
			},
			{
				label: '領用倉庫位置',
				prop: 'receiveSLocation',
				required: false,
				type: 'select',
				placeholder: '請輸入選擇領用倉庫位置',
				options: [],
				loading: true,
				filterable: true,
				remote: true,
				remoteShowSuffix: true,
				lg: 6,
				xl: 6,
			},
			{ label: '發料時間', prop: 'dispatchDate', required: false, type: 'dateRange' },

			// { label: '驗收日期', prop: 'checkDate', required: false, type: 'dateRange' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '入庫', color: '#D3C333', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			// reqNo: '',
			// prNo: '',
		},
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
		// 打印标题
		printName: '表格打印演示',
		//入库弹窗
		dialogConfig: [
			{ label: '申請單號:', prop: 'reqNo', placeholder: '', required: false, type: 'text' },
			{ label: '料號:', prop: 'matNo', placeholder: '', required: false, type: 'text' },
			{ label: '請購料號:', prop: 'reqMatNo', placeholder: '', required: false, type: 'text' },
			{ label: '品名-中文:', prop: 'nameCh', placeholder: '', required: false, type: 'text' },
			{ label: '品名-英文:', prop: 'nameEn', placeholder: '', required: false, type: 'text' },
			{ label: '發料人:', prop: 'dispatcher', placeholder: '', required: false, type: 'text' },
			{ label: '發料時間:', prop: 'dispatchTime', placeholder: '', required: false, type: 'text' },
			{ label: '發料數量:', prop: 'qty', placeholder: '', required: false, type: 'text' },
			{ label: '領用倉庫類型:', prop: 'receiveStorageType', placeholder: '', required: false, type: 'text' },
			{ label: '領用倉庫位置:', prop: 'receiveSLocation', placeholder: '', required: false, type: 'text' },
			// { label: '驗收合格數量:', prop: 'passQty', placeholder: '', required: false, type: 'text' },
			// validateForm: 'number',
			// message: '请输入正整数',
			{
				label: '有碼數量:',
				prop: 'stockqty',
				required: false,
				type: 'text',
				placeholder: '',
				xs: 24,
				sm: 12,
				md: 8,
				lg: 8,
				xl: 8,
			},
			{
				label: '掃碼錄入',
				prop: 'scan',
				placeholder: '',
				required: false,
				type: 'button',
				xs: 4,
				sm: 4,
				md: 4,
				lg: 4,
				xl: 4,
			},
			// {
			// 	label: '收貨倉庫:',
			// 	prop: 'storageId',
			// 	placeholder: '請選擇收貨倉庫',
			// 	required: true,
			// 	type: 'select',
			// 	options: [],
			// },
			{
				type: 'textarea',
				label: '描述說明:',
				placeholder: '請輸入描述說明',
				prop: 'entryDescribe',
				required: false,
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
		],
		innerDialogConfig: [
			{
				label: '掃碼入庫:',
				prop: 'sacnstockqty',
				placeholder: '請將光標放到此處掃碼',
				required: false,
				type: 'input',
				xs: 12,
				sm: 12,
				md: 12,
				lg: 12,
				xl: 12,
			},
			{
				label: '掃碼數量:',
				prop: 'stockqty',
				placeholder: '1',
				required: false,
				type: 'text',
				xs: 12,
				sm: 12,
				md: 12,
				lg: 12,
				xl: 12,
			},
			{
				label: '掃碼信息:',
				prop: 'codeList',
				placeholder: '請輸入掃碼信息',
				required: false,
				type: 'tagsarea',
				tag: true,
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
		],
	},
});
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
// cellStyle.value = changeToStyle([1]);
// 改变仓库类型下拉
const selectChangeStoreType = (vals: string, prop: string, form: EmptyObjectType) => {
	if (prop === 'receiveStorageType') {
		form.receiveSLocation = '';
	}
};
// 領用倉庫類型下拉选项数据
const getOptionsData = async () => {
	const res = await getLegalStoreTypesApi();
	const option = res.data.map((item: any) => {
		return { label: item, text: item, value: item };
	});
	state.tableData.search[5].options = option;
	state.tableData.dialogConfig![5].options = option;
};
let option: EmptyArrayType = [];
const remoteMethod = (query: string, form: EmptyObjectType, prop: string) => {
	if (query) {
		if (prop === 'receiveSLocation') {
			state.tableData.search[6].loading = true;
		} else {
			state.tableData.search[4].loading = true;
		}
		setTimeout(async () => {
			if (prop === 'receiveSLocation') {
				const res = await getQueryStoreHouseNoPageApi(form.storeType, query);
				option = res.data.map((item: EmptyObjectType) => {
					return { value: `${item.storeId}`, label: `${item.storeType}`, text: `${item.sLocation}` };
				});
				state.tableData.search?.forEach((item) => {
					if (item.prop === 'receiveSLocation') {
						item.loading = false;
						item.options = option.filter((item: EmptyObjectType) => {
							return item.text.toLowerCase().includes(query.toLowerCase()) || item.label.toLowerCase().includes(query.toLowerCase());
						});
					}
				});
			} else {
				const res = await getEngieerGroupApi(query);
				state.tableData.search[4].loading = false;
				let options = res.data.map((item: EmptyObjectType) => {
					return { value: `${item.userid}`, label: `${item.username}` };
				});
				state.tableData.search[4].options = options.filter((item: EmptyObjectType) => {
					return item.label.toLowerCase().includes(query.toLowerCase()) || item.value.toLowerCase().includes(query.toLowerCase());
				});
			}
		}, 500);
	} else {
		if (prop === 'receiveSLocation') {
			state.tableData.search[6].options = [];
		} else {
			state.tableData.search[4].options = [];
		}
	}
};
// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	option.forEach((item) => {
		if (item.value === form.receiveSLocation) {
			form.receiveSLocation = item.text;
		}
	});
	let data = {
		...form,
		dispatchDate: form.dispatchDate,
		startDispatchTime: form.dispatchDate && form.dispatchDate[0],
		endDispatchTime: form.dispatchDate && form.dispatchDate[1],
		page: state.tableData.page,
	};
	delete data.dispatchDate;
	const res = await GetTStockInputPageListApi(data);
	state.tableData.data = res.data.data;
	state.tableData.data.forEach((item) => {
		item.stockqty = 0;
	});
	state.tableData.config.total = res.data.total;
	if (res.status) {
		state.tableData.config.loading = false;
	}
};
// change
const change = (val: any, prop: string, state: any) => {
	let { formInnerData, formData } = state;
	if (prop == 'sacnstockqty') {
		if (formInnerData.codeList.length + 1 > formData.qty) {
			ElMessage.error(`掃碼數量超過發料數量，請勿繼續掃碼`);
			formInnerData['sacnstockqty'] = null;
		} else if (formInnerData.codeList.includes(val)) {
			ElMessage.warning(`該條碼已存在，請勿重複掃碼`);
			formInnerData['sacnstockqty'] = null;
		} else {
			formInnerData.codeList.push(val);
			formInnerData['sacnstockqty'] = null;
			formInnerData['stockqty'] = formInnerData.codeList.length;
			formData['stockqty'] = formInnerData.codeList.length;
		}
	}
};
const innnerDialogCancel = (formData: EmptyObjectType, formInnerData: EmptyObjectType) => {
	formInnerData.codeList = [];
	formInnerData['stockqty'] = 0;
	formData['stockqty'] = 0;
};
// 嵌套弹窗提交
const innnerDialogSubmit = (formInnerData: any, formData: any) => {
	// 防止用户用扫码枪扫数据之后又手动修改数量
	if (formInnerData.codeList.length != 0) {
		formInnerData.stockqty = formInnerData.codeList.length;
	}
	//如果存在需要存放扫码枪输入信息的字段
	state.tableData.innerDialogConfig &&
		state.tableData.innerDialogConfig.forEach((item: any) => {
			if (item.tag) {
				// formInnerData[item.prop] = [];
				formInnerData.codeList = formInnerData.codeList.map((item: any) => {
					return item;
				});
			}
		});
};
// 打开嵌套弹窗
const openInnerDialog = (state: any) => {
	let { formInnerData, formData } = state;
	formInnerData['stockqty'] = formInnerData.codeList.length;
	formData['stockqty'] = formInnerData.codeList.length;
};
// 关闭tag标签
const handleTagClose = (tag: any, state: EmptyObjectType) => {
	let { formInnerData, formData } = state;
	formInnerData.codeList.splice(formInnerData.codeList.indexOf(tag), 1);
	formInnerData['stockqty'] = formInnerData.codeList.length;
	formData['stockqty'] = formInnerData.codeList.length;
};
// 打开入库弹窗
const openEntryDialog = async (scope: any) => {
	entryJobDialogRef.value.openDialog('entry', scope.row, '入庫');
};
const scanCodeEntry = () => {
	entryJobDialogRef.value.openInnerDialog('掃碼錄入');
};
//点击确认入库
const entrySubmit = async (ruleForm: object, type: string, formInnerData: EmptyObjectType) => {
	loadingBtn.value = true;
	let obj: EmptyObjectType = { ...ruleForm };
	state.tableData.dialogConfig &&
		state.tableData.dialogConfig.forEach((item) => {
			if (item.prop == 'storageId' && item.options) {
				item.options.forEach((option) => {
					if (option.value == obj.storageId) {
						obj.sLocation = option.text;
						obj.storeType = option.label;
					}
				});
			}
		});

	obj.codeList = formInnerData.codeList;
	let submitData = {
		applyCheckId: obj.applyCheckId,
		storageId: obj.storageId,
		describe: obj.entryDescribe,
		codes: obj.codeList,
		// runId: obj.runid,
		// checkno: obj.checkno,
		// creator: obj.creator,
		// matno: obj.matno,
		// namech: obj.nameCh,
		// nameen: obj.nameEn,
		// checkqty: obj.checkQty,
		// stockqty: obj.stockqty,
		// stockcode: obj.stockcode,
		// sLocation: obj.sLocation,
		// storeType: obj.storeType,
	};
	if (obj.stockqty > obj.qty) {
		ElMessage.error(`有碼數量大於發料數量`);
	}
	// else if (obj.codes && obj.stockqty < obj.codes.length) {
	// 	ElMessage.error(`有码数量小于扫码数量`);
	// }
	// else if (obj.stockqty != obj.checkQty) {
	// ElMessageBox.confirm('入库数量与验收数量不一致，是否继续提交', '提示', {
	// 	confirmButtonText: '确认',
	// 	cancelButtonText: '取消',
	// 	type: 'warning',
	// 	buttonSize: 'default',
	// })
	// 	.then(async () => {
	// 		const res = await GetTStockAddApi(submitData);
	// 		if (res.status) {
	// 			ElMessage.success(`入库成功`);
	// 			entryJobDialogRef.value.closeDialog();
	// 			getTableData();
	// 		}
	// 	})
	// 	.catch(() => {
	// 		// ElMessage({
	// 		// 	type: 'info',
	// 		// 	message: 'Delete canceled',
	// 		// });
	// 	});
	// }
	else {
		const res = await GetTStockAddApi(submitData);
		if (res.status) {
			ElMessage.success(`入庫成功`);
			entryJobDialogRef.value.closeDialog();
			getTableData();
		}
	}
	loadingBtn.value = false;
};
// 点击收货单号
const reqNoClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	// if (column.property === 'checkno') {
	// 	dilogTitle.value = '单号:' + row.reqNo;
	// 	changeStatus(header1.value, 500, false);
	// 	let data = { reqNo: row.reqNo };
	// 	getDetailData(data);
	// }
};
// 根据弹出窗不一样展现的配置不一样
// const changeStatus = (header: EmptyArrayType, height: number, isShow: boolean) => {
// 	let tableData = dialogState.tableData;
// 	let config = tableData.config;
// 	tableData.header = header;
// 	config.height = height;
// 	config.isOperate = isShow;
// 	config.isInlineEditing = isShow;
// };
// 提交
// const onSubmit = async (formEl: FormInstance | undefined) => {
// 	if (!formEl) return;
// 	await formEl.validate(async (valid: boolean) => {
// 		if (!valid) return ElMessage.warning(t('表格項必填未填'));
// 		// if (!dialogState.tableData.form['sendTime']) return ElMessage.warning(t('请填写收货时间'));
// 		let allData: EmptyObjectType = {};
// 		allData = { ...dialogState.tableData.form };
// 		allData['details'] = dialogState.tableData.data;
// 		const res = await getAddReceiveApi(allData);
// 		if (res.status) {
// 			ElMessage.success(t('收货成功'));
// 			arriveJobDialogVisible.value = false;
// 		}
// 	});
// };
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
// if (dialogState.tableData.btnConfig)
// 	dialogState.tableData.btnConfig[0].disabled = computed(() => {
// 		return dialogState.tableData.data.length <= 1 ? true : false;
// 	});
// 页面加载时
onMounted(() => {
	getTableData();
	getOptionsData();
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
