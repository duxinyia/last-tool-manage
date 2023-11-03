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
					<span style="float: left; margin-right: 35px">{{ row.text }}</span>
					<span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ row.label }}</span>
				</template>
			</Dialog>
		</div>
	</div>
</template>

<script setup lang="ts" name="/toolsReturn/maintainEntry">
import { defineAsyncComponent, reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
// 引入接口
import { GetQueryStorableRepairCheckDetailsApi, GetPutStorageApi } from '/@/api/toolsReturn/maintainEntry';
import { GetUserManagedStoreHouseApi } from '/@/api/requistManage/entryJob';
import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableSearch = defineAsyncComponent(() => import('/@/components/search/search.vue'));
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));

// 定义变量内容
const { t } = useI18n();
const tableFormRef = ref();
const tableRef = ref<RefType>();
const entryJobDialogRef = ref();
const loadingBtn = ref(false);
// tags的数据
const tags = ref<EmptyArrayType<string>>([]);
// 单元格样式
const cellStyle = ref();
// 弹窗标题
const dilogTitle = ref();

const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'repairCheckNo', colWidth: '', title: '維修驗收單號', type: 'text', isCheck: true },
			{ key: 'repairReceiveNo', colWidth: '', title: '維修收貨單號', type: 'text', isCheck: true },
			// { key: 'reqno', colWidth: '', title: '申请单号', type: 'text', isCheck: true },
			{ key: 'matNo', colWidth: '', title: '料號', type: 'text', isCheck: true },
			{ key: 'repairNo', colWidth: '', title: '維修單號', type: 'text', isCheck: true },
			// { key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			// { key: 'nameen', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'checkQty', colWidth: '', title: '驗收數量', type: 'text', isCheck: true },
			{ key: 'passQty', colWidth: '', title: '合格數量', type: 'text', isCheck: true },
			{ key: 'failQty', colWidth: '', title: '不合格數量', type: 'text', isCheck: true },
			// { key: 'runstatus', colWidth: '', title: '状态', type: 'status', isCheck: true },
			// { key: 'isstorage', colWidth: '', title: '是否入库', type: 'text', isCheck: true },
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
			{ label: '維修單號', prop: 'repairNo', required: false, type: 'input' },
			{ label: '料號', prop: 'matNo', required: false, type: 'input', lg: 5, xl: 5 },
			{ label: '維修驗收單號', prop: 'repairCheckNo', required: false, type: 'input' },
			{ label: '維修收貨單號', prop: 'repairReceiveNo', required: false, type: 'input' },
		],
		searchConfig: {
			isSearchBtn: true,
		},
		btnConfig: [{ type: 'sendReceive', name: '入庫', color: '#D3C333', isSure: false, icon: 'ele-EditPen' }],
		// 给后端的数据
		form: {
			repairCheckNo: '',
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
			// { label: '入库单号:', prop: 'putno', placeholder: '请输入入库单号', required: false, type: 'text', xs: 24, sm: 8, md: 8, lg: 8, xl: 8 },
			{
				label: '驗收單號:',
				prop: 'repairCheckNo',
				placeholder: '請輸入驗收單號',
				required: false,
				type: 'text',
			},
			//这个字段待定
			{ label: '驗收人:', prop: 'checker', placeholder: '請輸入驗收人', required: false, type: 'text' },
			{ label: '料號:', prop: 'matNo', placeholder: '請輸入料號', required: false, type: 'text' },
			{ label: '品名-中文:', prop: 'nameCh', placeholder: '請輸入品名-中文', required: false, type: 'text' },
			{ label: '品名-英文:', prop: 'nameEn', placeholder: '請輸入品名-英文', required: false, type: 'text' },
			// { label: '厂商代码:', prop: 'vendorCode', placeholder: '请输入厂商代码', required: false, type: 'text', xs: 24, sm: 8, md: 8, lg: 8, xl: 8 },
			// {
			// 	label: '厂商名称:',
			// 	prop: 'vendorName',
			// 	placeholder: '请输入厂商名称',
			// 	required: false,
			// 	type: 'text',
			// 	xs: 24,
			// 	sm: 8,
			// 	md: 8,
			// 	lg: 16,
			// 	xl: 16,
			// },
			{ label: '驗收合格數量:', prop: 'passQty', placeholder: '', required: false, type: 'text' },
			// 这个字段待定
			{
				label: '驗收時間:',
				prop: 'checkTime',
				placeholder: '請輸入驗收時間',
				required: false,
				type: 'text',
				xs: 24,
				sm: 24,
				md: 24,
				lg: 24,
				xl: 24,
			},
			// validateForm: 'number',
			// 	message: '请输入正整数',
			{
				label: '有碼數量:',
				prop: 'stockqty',
				placeholder: '',
				required: false,
				type: 'text',
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
			{
				label: '收貨倉庫:',
				prop: 'storageId',
				placeholder: '請選擇收貨倉庫',
				required: true,
				type: 'select',
				options: [],
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
				placeholder: '',
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
// 下拉选项数据
const getOptionsData = async () => {
	let res = await GetUserManagedStoreHouseApi();
	if (state.tableData.dialogConfig) {
		state.tableData.dialogConfig.forEach((option) => {
			if (option.prop == 'storageId') {
				option.options = res.data.map((item: any) => {
					return { label: item.storeType, text: item.sLocation, value: item.storeId };
				});
			}
		});
	}
};
// 初始化列表数据
const getTableData = async () => {
	const form = state.tableData.form;
	let data = {
		...form,
		page: state.tableData.page,
	};
	const res = await GetQueryStorableRepairCheckDetailsApi(data);
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
		if (formInnerData.codeList.length + 1 > formData.passQty) {
			ElMessage.error(`掃碼數量超過驗收合格數量，請勿繼續掃碼`);
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
	entryJobDialogRef.value.openDialog('entry', scope.row);
};
const scanCodeEntry = () => {
	entryJobDialogRef.value.openInnerDialog('掃碼錄入');
};
//点击确认入库
const entrySubmit = async (ruleForm: object, type: string, formInnerData: EmptyObjectType) => {
	loadingBtn.value = true;
	let obj: EmptyObjectType = { ...ruleForm };
	state.tableData.dialogConfig &&
		state.tableData.dialogConfig.forEach((option) => {
			if (option.prop == 'storageId' && option.options) {
				option.options.forEach((item) => {
					if (item.value == obj.storageId) {
						obj.sLocation = item.text;
						obj.storeType = item.label;
					}
				});
			}
		});
	obj.codeList = formInnerData.codeList;

	let submitData = {
		repairCheckDetailId: obj.repairCheckDetailId,
		// runId: obj.runid,
		storageId: obj.storageId,
		codes: obj.codeList,
		// checkno: obj.checkno,
		// creator: obj.creator,
		// matno: obj.matno,
		// namech: obj.namech,
		// nameen: obj.nameen,
		// vendorcode: obj.vendorcode,
		// vendorname: obj.vendorname,
		// checkqty: obj.checkQty,
		// putQty: obj.stockqty,
		// stockcode: obj.stockcode,
		// storeType: obj.storeType,
		// sLocation: obj.sLocation,
	};
	if (obj.stockqty > obj.passQty) {
		ElMessage.error(`有碼數量大於驗收合格數量`);
	}
	// else if (submitData.Codes && submitData.putQty < submitData.Codes.length) {
	// 	ElMessage.error(`有码数量小于扫码数量`);
	// } else if (submitData.putQty != submitData.checkqty) {
	// 	ElMessageBox.confirm('入库数量与验收数量不一致，是否继续提交', '提示', {
	// 		confirmButtonText: '确认',
	// 		cancelButtonText: '取消',
	// 		type: 'warning',
	// 		buttonSize: 'default',
	// 	})
	// 		.then(async () => {
	// 			const res = await GetPutStorageApi(submitData);
	// 			if (res.status) {
	// 				ElMessage.success(`入库成功`);
	// 				entryJobDialogRef.value.closeDialog();
	// 				getTableData();
	// 			}
	// 		})
	// 		.catch(() => {
	// 			// ElMessage({
	// 			// 	type: 'info',
	// 			// 	message: 'Delete canceled',
	// 			// });
	// 		});
	// }
	else {
		const res = await GetPutStorageApi(submitData);
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
	tableRef.value?.pageReset();
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
