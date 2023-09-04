<template>
	<!-- <div class="table-container layout-padding"> -->
	<!-- <el-card :class="isDialog ? '' : 'box-card'"> -->
	<el-form v-if="state.search.length" ref="tableSearchRef" :model="state.form" size="default" label-width="auto" class="table-form">
		<el-row>
			<el-col
				:xs="val.xs || 24"
				:sm="val.sm || 12"
				:md="val.md || 10"
				:lg="val.lg || 8"
				:xl="val.xl || 6"
				class="mb10"
				v-for="(val, key) in state.search"
				:key="key"
			>
				<template v-if="val.type !== ''">
					<el-form-item
						:label="$t(val.label)"
						:prop="val.prop"
						:rules="[{ required: val.required, message: `${val.label}不能为空`, trigger: val.type === 'input' ? 'blur' : 'change' }]"
					>
						<span style="width: 100%; font-weight: 700; color: #1890ff">
							{{ state.form[val.prop] }}
						</span>
					</el-form-item>
				</template>
			</el-col>
		</el-row>
	</el-form>
	<el-empty v-else description="数据出错" />
	<!-- </el-card> -->
	<!-- </div> -->
</template>

<script setup lang="ts" name="/partno/noSearch">
import { useRoute, useRouter } from 'vue-router';
import { defineAsyncComponent, reactive, ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getMaterialApi } from '/@/api/link/noSearchLink';
import { useI18n } from 'vue-i18n';

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
		{ label: '料号：', prop: 'matNo', type: 'text', xs: 24, sm: 24, md: 24, lg: 24, xl: 24 },
		{ label: '中文：', prop: 'nameCh', type: 'text' },
		{ label: '英文：', prop: 'nameEn', type: 'text' },
		{ label: '图纸编号：', prop: 'drawNo', type: 'text' },
		{ label: '规格：', prop: 'specs', type: 'text' },
		{ label: '厂区：', prop: 'area', type: 'text' },
		{ label: 'BU：', prop: 'bu', type: 'text' },
		{ label: '专案代码：', prop: 'projectCode', type: 'text' },
		{ label: '阶段：', prop: 'stage', type: 'text' },
		{ label: '机种：', prop: 'machineType', type: 'text' },
		{
			label: '图纸文件：',
			prop: 'drawPath',
			type: 'text',
			xs: 24,
			sm: 24,
			md: 24,
			lg: 24,
			xl: 24,
		},
		{
			label: '3D圖紙：',
			prop: 'draw3dPath',
			type: 'text',
			xs: 24,
			sm: 24,
			md: 24,
			lg: 24,
			xl: 24,
		},
		{
			label: '备注：',
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
		getSelect();
	}
);
// 下拉框数据
const getSelect = async () => {
	// link/noSearchLink?comkey=CSG2023243-DP-56321-003
	let comkey = props.isDialog ? props.matNoRef : route.query.comkey;
	const res = await getMaterialApi(comkey);
	state.form = res.data;
	if (!res.status) {
		state.search = [];
	}
};
// 页面加载时
onMounted(() => {
	getSelect();
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
.box-card {
	width: 1000px;
}
</style>
