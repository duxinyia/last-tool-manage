<template>
	<div class="main" :style="!isDialog ? 'height: 330px' : ''">
		<div class="table-container" :class="{ 'link-width': !isDialog }">
			<nav v-if="!isDialog" class="pb10">驗收單详情</nav>
			<el-form v-if="state.tableData.form" ref="tableSearchRef" :model="state.tableData.form" size="default" label-width="auto" class="table-form">
				<el-row>
					<el-col
						:xs="val.xs || 24"
						:sm="val.sm || 12"
						:md="val.md || 10"
						:lg="val.lg || 8"
						:xl="val.xl || 6"
						class="mb10"
						v-for="(val, key) in state.tableData.search"
						:key="key"
					>
						<div v-if="val.type === 'text'">
							{{ val.label }}：<span style="width: 100%; font-weight: 700; color: #1890ff" class="ml10">{{ state.tableData.form[val.prop] }}</span>
						</div>
					</el-col>
				</el-row>
				<Table v-bind="state.tableData" class="table" />
				<el-button type="primary" class="mt10" @click="clickLink">查看驗收報告單</el-button>
				<div class="describe">
					<span>描述说明：</span>
					<span style="width: 100%; font-weight: 700; color: #1890ff">{{ state.tableData.form['describe'] }}</span>
				</div>
			</el-form>
			<el-empty v-else description="数据出错" />
		</div>
	</div>
</template>

<script setup lang="ts" name="/partno/noSearch">
import { useRoute, useRouter } from 'vue-router';
import { defineAsyncComponent, reactive, ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getCheckdetailApi } from '/@/api/requistManage/arrivalAcceptance';

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
		type: String,
		default: () => '',
	},
});
const state = reactive<TableDemoState>({
	tableData: {
		// 列表数据（必传）
		data: [],
		// 表头内容（必传，注意格式）
		header: [
			{ key: 'matno', colWidth: '250', title: 'message.pages.matNo', type: 'text', isCheck: true },
			{ key: 'namech', colWidth: '', title: '品名-中文', type: 'text', isCheck: true },
			{ key: 'checkqty', colWidth: '100', title: '验收数量', type: 'number', isCheck: true, isRequired: true },
			{ key: 'passqty', colWidth: '100', title: '合格数量', type: 'text', isCheck: true, isRequired: true },
			{ key: 'failqty', colWidth: '', title: '不合格数量', type: 'text', isCheck: true, isRequired: true },
			{ key: 'checkdate', colWidth: '150', title: '验收时间', type: 'text', isCheck: true, isRequired: true },
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
			height: 400,
		},
		// 给后端的数据
		form: {},
		// 搜索表单，动态生成（传空数组时，将不显示搜索，注意格式）
		search: [
			{ label: '验收单号', prop: 'checkno', required: false, type: 'text' },
			{ label: '收货单号', prop: 'receiptno', required: false, type: 'text' },
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
	() => props.checkNoRef,
	() => {
		getTableData();
	}
);
// 点击文件
const clickLink = () => {
	state.tableData.form['accepreporturl'] && window.open(`${import.meta.env.VITE_API_URL}${state.tableData.form['accepreporturl']}`, '_blank');
};
// 初始化数据
const getTableData = async () => {
	state.tableData.config['height'] = props.isDialog ? 400 : 200;
	// link/arrivalAcceptanceLink?comkey=3CSG-2023262001
	let comkey = props.isDialog ? props.checkNoRef : route.query.comkey;
	let data = { checkNo: comkey };
	const res = await getCheckdetailApi(data);
	state.tableData.form = res.data;
	state.tableData.data = res.data.receiveDetails;
	if (!res.status) {
		state.tableData.form = {};
	} else {
		state.tableData.config.loading = false;
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
