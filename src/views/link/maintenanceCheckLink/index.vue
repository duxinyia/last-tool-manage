<template>
	<div class="main" :style="!isDialog ? 'height: 400px' : ''">
		<div class="table-container" :class="{ 'link-width': !isDialog }">
			<nav v-if="!isDialog" class="pt10 pb10">維修單驗收詳情</nav>
			<el-form v-if="state.tableData.form" ref="tableSearchRef" :model="state.tableData.form" size="default" label-width="100px" class="table-form">
				<el-row :gutter="35">
					<el-col
						:xs="val.xs || 24"
						:sm="val.sm || 12"
						:md="val.md || 12"
						:lg="val.lg || 12"
						:xl="val.xl || 12"
						v-for="(val, key) in state.tableData.search"
						:key="key"
					>
						<el-form-item :label="val.label" :prop="val.prop">
							<span v-if="val.type === 'text'" style="width: 100%; font-weight: 700; color: #1890ff">
								{{ state.tableData.form[val.prop] }}
							</span></el-form-item
						>
					</el-col>
				</el-row>
				<Table v-bind="state.tableData" class="table" :cellStyle="cellStyle" @cellclick="uselessCodeClick" />
				<el-button class="mt5" size="default" plain type="primary" @click="clickLink">查看驗收報告</el-button>
				<div class="describe">
					<span>備註：</span>
					<span style="width: 100%; font-weight: 700; color: #1890ff">{{ state.tableData.form['describe'] }}</span>
				</div>
			</el-form>
			<el-empty v-else description="數據出錯" />
		</div>
		<!-- 二維碼彈窗 -->
		<qrCodeDialog color="danger" ref="inventoryDialogRef" :tags="tags" dialogTitle="報廢數量" />
	</div>
</template>

<script setup lang="ts" name="maintenanceCheckLink">
import { useRoute, useRouter } from 'vue-router';
import { defineAsyncComponent, reactive, ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { GetIdleDetailApi } from '/@/api/unusedManage/unusedInquiry';

import { useI18n } from 'vue-i18n';
import { getRepairCheckRecordDetailApi } from '/@/api/maintenanceManage/maintenanceCheck';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const qrCodeDialog = defineAsyncComponent(() => import('/@/components/dialog/qrCodeDialog.vue'));
const route = useRoute();
const router = useRouter();
// 定义父组件传过来的值
const props = defineProps({
	isDialog: {
		type: Boolean,
		default: () => false,
	},
	IdleNoRef: {
		type: String,
		default: () => '',
	},
});
const inventoryDialogRef = ref();
// tags的数据
let tags = ref<EmptyArrayType>([]);
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'prItemNo', colWidth: '', title: 'PR項次', type: 'text', isCheck: true },
			{
				key: 'matNo',
				colWidth: '240',
				title: '料號',
				type: 'text',
				isCheck: true,
			},
			{ key: 'drawNo', colWidth: '', title: '圖紙編號', type: 'text', isCheck: true },
			{ key: 'nameCh', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'nameEn', colWidth: '', title: '品名-英文', type: 'text', isCheck: true },
			{ key: 'checkDate', colWidth: '', title: '驗收日期', type: 'text', isCheck: true },
			{ key: 'checkQty', colWidth: '', title: '驗收數量', type: 'text', isCheck: true },
			{ key: 'passQty', colWidth: '', title: '通過數量', type: 'text', isCheck: true },
			{ key: 'reRepairQty', colWidth: '', title: '返修數量', type: 'text', isCheck: true },
			{ key: 'uselessQty', colWidth: '', title: '報廢數量', type: 'text', isCheck: true },
			{ key: 'failReasons', colWidth: '240', title: '驗收不通過原因', type: 'text', isCheck: true },
		],
		// 配置项（必传）
		config: {
			total: 0, // 列表总数
			loading: true, // loading 加载
			isBorder: false, // 是否显示表格边框
			isSerialNo: false, // 是否显示表格序号
			isSelection: false, // 是否显示表格多选
			isOperate: false, // 是否显示表格操作栏
			isButton: false, //是否显示表格上面的新增删除按钮
			isInlineEditing: false, //是否是行内编辑
			isTopTool: false, //是否有表格右上角工具
			isPage: false, //是否有分页
			isDialogTab: true, //是否是弹窗里面的表格
			height: 200,
		},
		// 给后端的数据
		form: {},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '維修單號:', prop: 'repairNo', type: 'text', required: false },
			{ label: '驗收單號:', prop: 'repairCheckNo', type: 'text', required: false },
			// { label: '收貨單號:', prop: 'repairReceiveNo', type: 'text', required: false },
			// { label: 'PR單號:', prop: 'prNo', type: 'text', required: false },
			{ label: '收貨人:', prop: 'receiver', type: 'text', required: false },
			{ label: '提交時間:', prop: 'createTime', type: 'text', required: false },
		],
		btnConfig: [{ type: 'del', name: 'message.allButton.deleteBtn', color: '#D33939', isSure: true, disabled: true }],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
watch(
	() => props.IdleNoRef,
	() => {
		getTableData();
	},
	{
		deep: true,
	}
);
// 单元格字体颜色
const cellStyle = ({ row, column }: EmptyObjectType) => {
	const property = column.property;
	if (property === 'uselessQty' && row.uselessCodes && row.uselessCodes.length > 0) {
		return { color: 'red', cursor: 'pointer' };
	}
};
// 點擊報廢數量
const uselessCodeClick = (row: EmptyObjectType, column: EmptyObjectType) => {
	if (column.property === 'uselessQty' && row.uselessCodes && row.uselessCodes.length > 0) {
		tags.value = row.uselessCodes;
		inventoryDialogRef.value?.openDialog();
	}
};
// 初始化数据
const getTableData = async () => {
	// state.tableData.config['height'] = props.isDialog ? 400 : 200;
	//link/maintenanceCheckLink?comkey=CSG-2023319001
	const comkey = props.isDialog ? props.IdleNoRef : route.query.comkey;
	state.tableData.config.loading = true;
	const res = await getRepairCheckRecordDetailApi(comkey as string);
	res.data.receiver = `${res.data.receiver} / ${res.data.receiverName}`;
	state.tableData.form = res.data;
	res.data.details.forEach((item: any) => {
		item.failReasons = item.failReasons.join(' | ');
	});
	state.tableData.data = res.data.details;
	if (!res.status) {
		state.tableData.form = {};
	} else {
		state.tableData.config.loading = false;
	}
};
// 查看驗收報告
const clickLink = () => {
	if (state.tableData.form['accepReportUrl']) {
		window.open(
			`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${
				state.tableData.form['accepReportUrl']
			}`,
			'_blank'
		);
	} else {
		ElMessage.warning('沒有驗收報告單');
	}
};
// 页面加载时
onMounted(() => {
	getTableData();
});
</script>

<style scoped lang="scss">
:deep(.table-form) {
	width: 100% !important;
}
.main {
	overflow: auto;
	padding: 0 15%;
	// width: 100%;
	background-color: white;
	display: flex;
	align-items: center;
	justify-content: center;
}

.table-container {
	width: 100%;
	height: 100%;
}
.link-width {
	width: 100% !important;
}
nav {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;
}
// .box-card {
// 	width: 1000px;
// }
.describe {
	display: flex;
	justify-content: center;
	padding-top: 5px;
	line-height: 30px;
	span {
		width: 50px;
	}
}
</style>
