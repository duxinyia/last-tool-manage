<template>
	<div :class="{ main: !isDialog }" :style="!isDialog ? 'height: 420px' : ''">
		<div class="table-container" :class="{ 'link-width': !isDialog }">
			<nav v-if="!isDialog" class="pb10">請購驗收單詳情</nav>
			<el-form v-if="state.tableData.form" ref="tableSearchRef" :model="state.tableData.form" size="default" label-width="120px" class="table-form">
				<el-row :gutter="35">
					<el-col
						:xs="val.xs || 24"
						:sm="val.sm || 12"
						:md="val.md || 12"
						:lg="val.lg || 12"
						:xl="val.xl || 12"
						:class="!isDialog ? 'mb10' : 'mb20'"
						v-for="(val, key) in state.tableData.dialogConfig"
						:key="key"
					>
						<el-form-item :label="$t(val.label)" :prop="val.prop">
							<span v-if="val.type === 'text'" style="width: 100%; font-weight: 700; color: #1890ff">
								{{ state.tableData.form[val.prop] }}
							</span>
							<span v-if="val.type === 'button'">
								<el-button @click="clickLink" :disabled="val.disabled" type="primary" plain>{{ val.label }}</el-button>
							</span>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<el-empty v-else description="數據出錯" />
		</div>
	</div>
</template>

<script setup lang="ts" name="arrivalAcceptanceLink">
import { useRoute, useRouter } from 'vue-router';
import { defineAsyncComponent, reactive, ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getCheckRecordApi } from '/@/api/requistManage/arrivalAcceptance';

import { useI18n } from 'vue-i18n';
// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const route = useRoute();
const router = useRouter();
// 定义父组件传过来的值
const props = defineProps({
	isDialog: {
		type: Boolean,
		default: () => false,
	},
	checkNoRef: {
		type: Object,
		default: () => {},
	},
});
const state = reactive<TableDemoState>({
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
			height: 400,
		},
		// 给后端的数据
		form: {},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [],
		dialogConfig: [
			{ type: 'text', label: '驗收單號', placeholder: '', prop: 'applyCheckId', required: false },
			{ type: 'text', label: '申請單號', placeholder: '', prop: 'reqNo', required: false },
			{ type: 'text', label: '收貨單號', placeholder: '', prop: 'applyReceiveId', required: false },
			{ type: 'text', label: '料號', placeholder: '', prop: 'matNo', required: false },
			{ type: 'text', label: '圖紙編號', placeholder: '', prop: 'drawNo', required: false },
			{ type: 'text', label: '請購料號', placeholder: '', prop: 'reqMatNo', required: false },
			{ type: 'text', label: '品名-中文', placeholder: '', prop: 'nameCh', required: false },
			{ type: 'text', label: '品名-英文', placeholder: '', prop: 'nameEn', required: false },
			{ type: 'text', label: '機種', placeholder: '', prop: 'machineType', required: false },
			{ type: 'text', label: '驗收日期', placeholder: '', prop: 'checkDate', required: false },
			{ type: 'text', label: '驗收數量', placeholder: '', prop: 'checkQty', required: false },
			{ type: 'text', label: '通過數量', placeholder: '', prop: 'passQty', required: false },
			{ type: 'text', label: '不通過數量', placeholder: '', prop: 'failQty', required: false },
			{ type: 'text', label: '收貨人', placeholder: '', prop: 'receiver', required: false },
			{ type: 'text', label: '實際提交日期', placeholder: '', prop: 'createTime', required: false },
			{ type: 'text', label: '是否已發料', placeholder: '', prop: 'isDispatched', required: false },
			{ type: 'text', label: '備註', placeholder: '', prop: 'describe', required: false, xs: 24, sm: 24, md: 24, lg: 24, xl: 24 },
			{ type: 'text', label: '簽核狀態', placeholder: '', prop: 'signStatusStr', required: false },
			{ type: 'button', label: '查看驗收報告', placeholder: '', prop: 'accepReportUrl', required: false },
		],
		btnConfig: [],
		// 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
		page: {
			pageNum: 1,
			pageSize: 10,
		},
	},
});
watch(
	() => props.checkNoRef,
	() => {
		getTableData();
	},
	{
		deep: true,
	}
);
// 点击文件
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
// 初始化数据
// link/arrivalAcceptanceLink?comkey=AC-R2023332008-001
const getTableData = async () => {
	// state.tableData.config['height'] = props.isDialog ? 400 : 200;
	// let comkey = props.isDialog ? props.checkNoRef.applyCheckId : route.query.comkey;
	let comkey = route.query.comkey;
	if (comkey && !props.isDialog) {
		let data = { applyCheckId: comkey };
		const res = await getCheckRecordApi(data);
		state.tableData.form = res;
	} else {
		state.tableData.form = props.checkNoRef;
	}

	// state.tableData.data = res.data.receiveDetails;
	// if (!res.status) {
	// state.tableData.form = {};
	// }
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
	// width: 100%;
	background-color: white;
	display: flex;
	align-items: center;
	justify-content: center;
}

.table-container {
	width: 100%;
}
.link-width {
	width: 900px !important;
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
	margin-top: 10px;
	span {
		width: 100px;
	}
}
</style>
