<template>
	<nav v-if="!isDialog" class="pb10" style="background-color: #fff">
		{{ state.form.statusStr
		}}<el-tag v-if="state.form.runStatus === 77" style="font-weight: 700; font-size: 12px" class="ml10" type="warning">未經試產簽核 </el-tag>
	</nav>
	<div class="main" :style="!isDialog ? 'height: 411px' : ''">
		<div style="display: flex">
			<div class="table-container">
				<el-form
					v-if="state.form"
					ref="tableSearchRef"
					:model="state.form"
					size="default"
					label-width="auto"
					class="table-form"
					style="display: flex"
				>
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
							v-for="(val, key) in showForm"
							:key="key"
						>
							<template v-if="val.type !== ''">
								<el-form-item :label="val.prop !== 'drawPath' ? $t(val.label) : ''" :prop="val.prop">
									<span v-if="val.type === 'text'" style="width: 100%; font-weight: 700; color: #1890ff">
										{{ state.form[val.prop] }}
									</span>

									<el-button type="primary" style="margin-left: 60px" v-if="val.type === 'btn'" @click="clickLink(val.prop, state.form)"
										>查看圖紙</el-button
									>
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
				<div
					v-if="!isDialog || props.matNoRef.signStatus === 5 || props.matNoRef.signStatus === 6"
					style="display: flex; align-items: center; margin: 0 5px; width: 130px; margin-top: -93px; height: 100%"
				>
					<span class="center-text">修改前</span>
					<!-- <el-icon size="24" style="border: 1px solid #ccc; border-radius: 50%; background-color: #1890ff; color: #fff; margin: 0 5px"
						><ele-Right
					/></el-icon> -->
					<el-divider direction="vertical" style="height: 100%" />
					<span class="center-text">修改后</span>
				</div>
				<div class="" v-if="!isDialog || props.matNoRef.signStatus === 5 || props.matNoRef.signStatus === 6">
					<el-form
						v-if="state.form2"
						ref="tableSearchRef"
						:model="state.form2"
						size="default"
						label-width="auto"
						class="table-form"
						style="display: flex"
					>
						<div :xs="24" :sm="12" :md="2" :lg="2" :xl="2">
							<el-image
								title="點擊查看大圖"
								:style="{ width: `241px`, height: `277px` }"
								:src="`${state.form2.picture}`"
								:preview-src-list="[state.form2.picture]"
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
										<span v-if="val.type === 'text'" style="width: 100%; font-weight: 700" :style="{ color: val.color }">
											{{ state.form2[val.prop] }}
										</span>

										<el-button
											:type="lookFileColor ? 'danger' : 'primary'"
											style="margin-left: 60px"
											v-if="val.type === 'btn'"
											@click="clickLink(val.prop, state.form2)"
											>查看圖紙</el-button
										>
										<div v-if="val.type == 'tagsarea'">
											<el-tag :type="val.colorType" v-for="tag in state.form2[val.prop]" :key="tag" class="mr10">
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
				<!-- <el-empty v-else description="數據出錯" /> -->
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="matModifySignInfoLink">
import { useRoute, useRouter } from 'vue-router';
import { defineAsyncComponent, reactive, ref, onMounted, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getMaterialApi, getMatModifySignInfoApi, getMatSignInfoApi } from '/@/api/link/noSearchLink';
import { useI18n } from 'vue-i18n';
import { getMachineTypesOfMatApi } from '/@/api/partno/noSearch';
import { judementSameArr } from '/@/utils/arrayOperation';
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
const emit = defineEmits(['editDialogTitle']);
const lookFileColor = ref(false);
const state = reactive<LinkState>({
	search: [
		{ label: '料號：', prop: 'matNo', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: '請購料號：', prop: 'reqMatNo', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: '品名-中文：', prop: 'nameCh', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: '品名-英文：', prop: 'nameEn', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: '圖紙編號：', prop: 'drawNo', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: '圖紙版次：', prop: 'revision', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: 'BU：', prop: 'bu', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: '规格：', prop: 'specs', type: 'text', isCheck: true, color: '#1890ff' },
		// { label: '厂区：', prop: 'area', type: 'text' },
		// { label: 'BU：', prop: 'bu', type: 'text' },
		// { label: '专案代码：', prop: 'projectCode', type: 'text' },
		{ label: '階段：', prop: 'stage', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: '段位：', prop: 'depart', type: 'text', isCheck: true, color: '#1890ff' },
		{ label: '二維碼管理模式：', prop: 'codeManageModeText', type: 'text', isCheck: true, color: '#1890ff' },
		{
			label: '備註：',
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
			label: '機種：',
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
			label: '圖紙文件：',
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
		0: '有碼管理',
		1: '無碼管理',
	};
	if (!props.isDialog || props.matNoRef.signStatus === 5 || props.matNoRef.signStatus === 6) {
		let comkey = props.isDialog ? `${props.matNoRef.matNo}_${props.matNoRef.modificationCount}` : route.query.comkey;
		const res = await getMatModifySignInfoApi(comkey);
		state.form = res.data.original;
		state.form2 = res.data.modified;
		state.form.bu = res.data.original.buCode;
		state.form2.bu = res.data.modified.buCode;
		state.form.codeManageModeText = codeManageModeMap[state.form.codeManageMode];
		state.form2.codeManageModeText = codeManageModeMap[state.form2.codeManageMode];
		state.form.machineType = res.data.original.machineTypes;
		state.form2.machineType = res.data.modified.machineTypes;
		state.form.picture =
			(import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl) + res.data.original.picture;
		state.form2.picture =
			(import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl) + res.data.modified.picture;
		const original = res.data.original;
		const modified = res.data.modified;
		lookFileColor.value = original.drawPath !== modified.drawPath ? true : false;
		state.search.forEach((item) => {
			if (item.prop === 'machineType') {
				// console.log('original', original.machineType);
				// console.log('modified', modified.machineType);
				const temp = judementSameArr(modified.machineType, original.machineType);
				// console.log(temp);
				item.colorType = temp ? 'primary' : 'danger';
			} else if (original[item.prop] !== modified[item.prop]) {
				item.color = 'red';
				item.colorType = 'danger';
			}
		});
	}
	emit('editDialogTitle', state.form.statusStr);
	// else {
	// 	let comkey = props.isDialog ? props.matNoRef.matNo : route.query.comkey;
	// 	const res = props.isDialog ? await getMaterialApi(comkey) : await getMatSignInfoApi(comkey);
	// 	state.form = res.data;
	// 	state.form.machineType = res.data.machineTypes;
	// 	if (!props.isDialog) state.form.bu = res.data.buCode;
	// 	state.form.codeManageModeText = codeManageModeMap[state.form.codeManageMode];
	// 	state.form.picture = (import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl) + res.data.picture;
	// 	if (props.isDialog) {
	// 		const res1 = await getMachineTypesOfMatApi(comkey);
	// 		state.form.machineType = res1.data;
	// 		if (!res.status && !res1.status) {
	// 			state.form = {};
	// 		}
	// 	}
	// }
};
// 点击文件
const clickLink = (prop: string, form: EmptyObjectType) => {
	if (prop === 'drawPath' && form.drawPath.includes('/')) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${form[prop]}`, '_blank');
	} else {
		ElMessage.warning('暫無圖紙文件或者文件圖紙路徑錯誤');
	}
};
// 页面加载时
onMounted(() => {
	getDetailData();
});
</script>

<style scoped lang="scss">
:deep(.table-form) {
	width: 860px !important;
}
.main {
	margin-left: 10px;
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
