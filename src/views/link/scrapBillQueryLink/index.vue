<template>
	<div class="main" :style="!isDialog ? 'height: 400px' : ''">
		<div class="table-container" :class="{ 'link-width': !isDialog }">
			<nav v-if="!isDialog" class="pb10">報廢單詳情</nav>
			<el-form v-if="state.tableData.form" ref="tableSearchRef" :model="state.tableData.form" size="default" label-width="100px" class="table-form">
				<el-row>
					<el-col
						:xs="val.xs || 24"
						:sm="val.sm || 12"
						:md="val.md || 10"
						:lg="val.lg || 10"
						:xl="val.xl || 10"
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
				<Table v-bind="state.tableData" class="table" />
				<div class="describe">
					<span>備註：</span>
					<span style="width: 100%; font-weight: 700; color: #1890ff">{{ state.tableData.form['describe'] }}</span>
				</div>
				<el-button class="mt10" type="primary" plain @click="lookAttachment">查看附件</el-button>
			</el-form>
			<el-empty v-else description="數據出錯" />
		</div>
	</div>
</template>

<script setup lang="ts" name="/partno/noSearch">
import { useRoute, useRouter } from 'vue-router';
import { defineAsyncComponent, reactive, ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getUselessDetailApi } from '/@/api/scrapManage/scrapBillQuery';

import { useI18n } from 'vue-i18n';
import { getOperAttachmentApi } from '/@/api/global';
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
	UselessNoRef: {
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
			{
				key: 'matno',
				colWidth: '250',
				title: 'message.pages.matNo',
				type: 'text',
				isCheck: true,
			},
			{ key: 'qty', colWidth: '', title: '報廢數量', type: 'text', isCheck: true },
			{ key: 'reason', colWidth: '', title: '報廢原因', type: 'text', isCheck: true },
			// { key: 'state', colWidth: '', title: '站位', type: 'text', isCheck: true },
			// { key: 'stage', colWidth: '', title: '階段', type: 'text', isCheck: true },
			// { key: 'classes', colWidth: '', title: '班次', type: 'text', isCheck: true },
			// { key: 'me', colWidth: '100', title: 'ME負責人', type: 'text', isCheck: true },
			// { key: 'pm', colWidth: '100', title: 'PM確認人', type: 'text', isCheck: true },
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
			{ label: '報廢單號:', prop: 'uselessno', type: 'text', required: false },
			{ label: '報廢時間:', prop: 'uselessDate', type: 'text', required: false },
			// { label: '班別:', prop: 'classes', type: 'text', required: false },
			// { label: '站位:', prop: 'state', type: 'text', required: false },
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
	() => props.UselessNoRef,
	() => {
		getTableData();
	},
	{
		deep: true,
	}
);
const comkey = props.isDialog ? props.UselessNoRef : route.query.comkey;
// 初始化数据
const getTableData = async () => {
	state.tableData.config['height'] = props.isDialog ? 400 : 200;
	//link/scrapBillQueryLink?comkey=UL-CSG-2023262-003

	const res = await getUselessDetailApi(comkey);
	state.tableData.form = res.data;
	state.tableData.data = res.data.uselessdetaillist;
	if (!res.status) {
		state.tableData.form = {};
	} else {
		state.tableData.config.loading = false;
	}
};
// 查看附件
const lookAttachment = async () => {
	const res = await getOperAttachmentApi(21, comkey as string);
	if (res.status) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${res.data}`, '_blank');
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
		width: 50px;
	}
}
</style>
