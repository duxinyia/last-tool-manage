<template>
	<nav v-if="!isDialog" class="pb10" style="background-color: #fff">
		料號詳情<el-tag v-if="state.form.runStatus === 77" style="font-weight: 700; font-size: 12px" class="ml10" type="warning">未經試產簽核 </el-tag>
	</nav>
	<div class="main" :style="!isDialog ? 'height: 411px' : ''">
		<div class="table-container">
			<el-form v-if="state.form" ref="tableSearchRef" :model="state.form" size="default" label-width="auto" class="table-form" style="display: flex">
				<div :xs="24" :sm="12" :md="2" :lg="2" :xl="2">
					<el-image
						:title="$t('message.pages.clickForLargerImage')"
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
						v-for="(val, key) in showForm"
						:key="key"
					>
						<template v-if="val.type !== ''">
							<el-form-item :label="val.prop !== 'drawPath' ? $t(val.label) : ''" :prop="val.prop">
								<span v-if="val.type === 'text'" style="width: 100%; font-weight: 700; color: #1890ff">
									{{ state.form[val.prop] }}
								</span>

								<el-button type="primary" style="margin-left: 60px" v-if="val.type === 'btn'" @click="clickLink(val.prop)">{{
									$t('message.pages.viewTheDrawing')
								}}</el-button>
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
			<!-- <el-empty v-else description="數據出錯" /> -->
		</div>
	</div>
</template>

<script setup lang="ts" name="/partno/noSearch">
import { useRoute, useRouter } from 'vue-router';
import { defineAsyncComponent, reactive, ref, onMounted, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getMaterialApi, getMatModifySignInfoApi, getMatSignInfoApi } from '/@/api/link/noSearchLink';
import { useI18n } from 'vue-i18n';
import { getMachineTypesOfMatApi } from '/@/api/partno/noSearch';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
// 定义父组件传过来的值
const props = defineProps({
	isDialog: {
		type: Boolean,
		default: () => false,
	},
	matNoRef: {
		type: Object,
		default: () => {},
	},
});
const state = reactive<LinkState>({
	search: [
		{ label: 'message.pages.matNo', prop: 'matNo', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: 'message.pages.materialPurchaseNumber', prop: 'reqMatNo', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: 'message.pages.nameCh', prop: 'nameCh', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: 'message.pages.nameEn', prop: 'nameEn', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: 'message.pages.drawNo', prop: 'drawNo', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: 'message.pages.layoutDrawing', prop: 'revision', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: 'BU', prop: 'bu', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: 'message.pages.specs', prop: 'specs', type: 'text', isCheck: true, color: '#1890ff' },
		// { label: '厂区：', prop: 'area', type: 'text' },
		// { label: 'BU：', prop: 'bu', type: 'text' },
		// { label: '专案代码：', prop: 'projectCode', type: 'text' },
		{ label: 'message.pages.phase', prop: 'stage', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: 'message.pages.segmentPosition', prop: 'depart', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: 'message.pages.qrCodeManagementMode', prop: 'codeManageModeText', type: 'text', isCheck: true, color: '#1890ff' },
		{
			label: 'message.pages.describe',
			prop: 'describe',
			placeholder: 'message.pages.placeDescribe',
			type: 'text',
			xs: 24,
			sm: 24,
			md: 24,
			lg: 24,
			xl: 24,
			isCheck: true,
			color: '#1890ff',
		},
		{
			label: 'message.pages.machineType',
			prop: 'machineType',
			type: 'tagsarea',
			xs: 24,
			sm: 24,
			md: 24,
			lg: 24,
			xl: 24,
			isCheck: true,
			color: '#1890ff',
			colorType: 'primary',
		},
		{
			label: 'message.pages.drawPath',
			prop: 'drawPath',
			type: 'btn',
			xs: 24,
			sm: 24,
			md: 24,
			lg: 24,
			xl: 24,
			isCheck: true,
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
	],
	searchConfig: false,
	form: {},
	form2: {},
});
// 设置 顯示数据
const showForm = computed(() => {
	return state.search.filter((v) => v.isCheck);
});
watch(
	() => props.matNoRef,
	() => {
		getDetailData();
	},
	{
		deep: true,
	}
);
// 详情数据
const getDetailData = async () => {
	// if (route.query.comkey) {
	// 	state.search.forEach((item) => {
	// item.isCheck =item.prop === 'describe'?false:true
	// 	});
	// }
	// link/noSearchLink?comkey=CMA23305-52-PM9423-3-001
	// CSG24027-001_3
	const codeManageModeMap: EmptyObjectType = {
		0: 'message.pages.codedManagement',
		1: 'message.pages.noCodeManagement',
	};
	let comkey = props.isDialog ? props.matNoRef.matNo : route.query.comkey;
	const res = props.isDialog ? await getMaterialApi(comkey) : await getMatSignInfoApi(comkey);
	state.form = res.data;
	state.form.machineType = res.data.machineTypes;
	if (!props.isDialog) state.form.bu = res.data.buCode;
	state.form.codeManageModeText = t(codeManageModeMap[state.form.codeManageMode]);
	state.form.picture = (import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl) + res.data.picture;
	if (props.isDialog) {
		const res1 = await getMachineTypesOfMatApi(comkey);
		state.form.machineType = res1.data;
		if (!res.status && !res1.status) {
			state.form = {};
		}
	}
};
// 点击文件
const clickLink = (prop: string) => {
	if (prop === 'drawPath' && state.form.drawPath.includes('/')) {
		window.open(
			`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${state.form[prop]}`,
			'_blank'
		);
	} else {
		ElMessage.warning(t('message.hint.info2'));
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
.center-text {
	color: #27ba9b;
	font-size: 16px;
	font-weight: 700;
}
// .box-card {
// 	width: 1000px;
// }
</style>
