<template>
	<div class="main" :style="!isDialog ? 'height: 330px' : ''">
		<nav v-if="!isDialog" class="pb10">料號詳情</nav>
		<div class="table-container">
			<!-- <el-card :class="isDialog ? '' : 'box-card'"> -->
			<el-form v-if="state.form" ref="tableSearchRef" :model="state.form" size="default" label-width="auto" class="table-form" style="display: flex">
				<div :xs="24" :sm="12" :md="2" :lg="2" :xl="2">
					<el-image
						title="點擊查看大圖"
						:style="{ width: `241px`, height: `277px` }"
						:src="`${state.form.picture}`"
						:preview-src-list="[state.form.picture]"
						:zoom-rate="1.2"
						preview-teleported
						hide-on-click-modal
						fit="cover"
					/>
				</div>
				<el-row>
					<el-col
						:xs="val.xs || 24"
						:sm="val.sm || 12"
						:md="val.md || 12"
						:lg="val.lg || 12"
						:xl="val.xl || 12"
						class="mb10"
						v-for="(val, key) in state.search"
						:key="key"
					>
						<template v-if="val.type !== ''">
							<el-form-item :label="val.prop !== 'drawPath' ? $t(val.label) : ''" :prop="val.prop">
								<span v-if="val.type === 'text'" style="width: 100%; font-weight: 700; color: #1890ff">
									{{ state.form[val.prop] }}
								</span>
								<el-button type="primary" class="ml20" v-if="val.type === 'btn'" @click="clickLink(val.prop)">查看圖紙</el-button>
								<div v-if="val.type == 'tagsarea'">
									<el-tag v-for="tag in state.form[val.prop]" :key="tag" class="mr10">
										{{ tag }}
									</el-tag>
								</div>
							</el-form-item>
						</template>
					</el-col>
				</el-row>
			</el-form>
			<el-empty v-else description="數據出錯" />

			<!-- </el-card> -->
		</div>
	</div>
</template>

<script setup lang="ts" name="/partno/noSearch">
import { useRoute, useRouter } from 'vue-router';
import { defineAsyncComponent, reactive, ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getMaterialApi } from '/@/api/link/noSearchLink';
import { useI18n } from 'vue-i18n';
import { getMachineTypesOfMatApi } from '/@/api/partno/noSearch';
const route = useRoute();
const router = useRouter();
// 定义父组件传过来的值
const props = defineProps({
	isDialog: {
		type: Boolean,
		default: () => false,
	},
	matNoRef: {
		type: String,
		default: () => '',
	},
});
const state = reactive<LinkState>({
	search: [
		{ label: '料號：', prop: 'matNo', type: 'text' },
		{ label: '請購料號：', prop: 'reqMatNo', type: 'text' },
		{ label: 'BU：', prop: 'bu', type: 'text' },
		{ label: '中文：', prop: 'nameCh', type: 'text' },
		{ label: '英文：', prop: 'nameEn', type: 'text' },
		{ label: '圖紙編號：', prop: 'drawNo', type: 'text' },
		// { label: '规格：', prop: 'specs', type: 'text' },
		// { label: '厂区：', prop: 'area', type: 'text' },
		// { label: 'BU：', prop: 'bu', type: 'text' },
		// { label: '专案代码：', prop: 'projectCode', type: 'text' },
		{ label: '階段：', prop: 'stage', type: 'text' },
		{ label: '段位：', prop: 'depart', type: 'text' },
		{ label: '機種：', prop: 'machineType', type: 'tagsarea', xs: 24, sm: 24, md: 24, lg: 24, xl: 24 },
		{
			label: '圖紙文件：',
			prop: 'drawPath',
			type: 'btn',
			xs: 24,
			sm: 24,
			md: 24,
			lg: 24,
			xl: 24,
		},
		// {
		// 	label: '3D圖紙：',
		// 	prop: 'draw3dPath',
		// 	type: 'text',
		// 	xs: 24,
		// 	sm: 24,
		// 	md: 24,
		// 	lg: 24,
		// 	xl: 24,
		// },
		{
			label: '備註：',
			prop: 'describe',
			placeholder: 'message.pages.placeDescribe',
			required: false,
			type: 'textarea',
			xs: 24,
			sm: 24,
			md: 24,
			lg: 24,
			xl: 24,
		},
	],
	searchConfig: false,
	form: {},
});
watch(
	() => props.matNoRef,
	() => {
		getDetailData();
	}
);
// 详情数据
const getDetailData = async () => {
	// link/noSearchLink?comkey=CMA23305-52-PM9423-3-001
	let comkey = props.isDialog ? props.matNoRef : route.query.comkey;
	const res = await getMaterialApi(comkey);
	state.form = res.data;
	state.form.picture = import.meta.env.VITE_API_URL + res.data.picture;
	const res1 = await getMachineTypesOfMatApi(comkey);
	state.form.machineType = res1.data;
	if (!res.status && !res1.status) {
		state.form = {};
	}
};
// 点击文件
const clickLink = (prop: string) => {
	if (prop === 'drawPath') {
		window.open(`${import.meta.env.VITE_API_URL}${state.form[prop]}`, '_blank');
	} else {
		ElMessage.warning('暫無圖紙文件');
	}
};
// 页面加载时
onMounted(() => {
	getDetailData();
});
</script>

<style scoped lang="scss">
:deep(.table-form) {
	width: 900px !important;
}
.main {
	overflow: auto;
	width: 100%;
	background-color: white;
}

.table-container {
	display: flex;
	align-items: center;
	justify-content: center;
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
</style>
