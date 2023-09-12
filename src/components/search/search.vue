<template>
	<div class="table-search-container" v-if="props.search.length > 0">
		<el-form ref="tableSearchRef" :model="state.form" size="default" label-width="auto" class="table-form">
			<el-row>
				<el-col
					:xs="val.xs || 24"
					:sm="val.sm || 12"
					:md="val.md || 8"
					:lg="val.lg || 4"
					:xl="val.xl || 4"
					class="mr20 isMargin"
					v-for="(val, key) in search"
					:key="key"
					v-show="key === 0 || state.isToggle"
				>
					<el-form-item
						v-if="val.type !== ''"
						:label="$t(val.label)"
						:prop="val.prop"
						:rules="[{ required: val.required, message: `${val.label}不能为空`, trigger: val.type === 'input' ? 'blur' : 'change' }]"
					>
						<el-input
							v-model="state.form[val.prop]"
							:placeholder="`请输入${$t(val.label)}`"
							clearable
							v-if="val.type === 'input'"
							style="width: 100%"
						/>
						<el-date-picker
							v-model="state.form[val.prop]"
							type="date"
							:placeholder="val.placeholder"
							v-else-if="val.type === 'date'"
							style="width: 100%"
						/>
						<el-date-picker
							v-else-if="val.type === 'dateRange'"
							value-format="YYYY-MM-DD"
							v-model="state.form[val.prop]"
							type="daterange"
							range-separator="-"
							start-placeholder="開始時間"
							end-placeholder="結束時間"
							style="width: 100%"
						/>
						<el-select v-model="state.form[val.prop]" :placeholder="`请选择${val.label}`" v-else-if="val.type === 'select'" style="width: 100%">
							<el-option v-for="item in val.options" :key="item.label" :label="item.text" :value="item.value"> </el-option>
						</el-select>
						<span v-else style="width: 100%; font-weight: 700; color: #1890ff">
							{{ state.form[val.prop] }}
						</span>
					</el-form-item>
				</el-col>
				<el-col :xs="24" :sm="12" :md="8" :lg="2" :xl="2">
					<el-form-item class="table-form-btn" :label-width="search.length <= 6 ? '20px' : '100px'">
						<template #label v-if="search.length > 6">
							<div class="table-form-btn-toggle ml10" @click="state.isToggle = !state.isToggle">
								<span>{{ state.isToggle ? '收筛选' : '展筛选' }}</span>
								<SvgIcon :name="state.isToggle ? 'ele-ArrowUp' : 'ele-ArrowDown'" />
							</div>
						</template>
						<div>
							<el-button v-if="searchConfig.isSearchBtn" size="default" type="primary" @click="onSearch(tableSearchRef)"
								><el-icon> <ele-Search /> </el-icon>{{ $t('message.allButton.searchBtn') }}
							</el-button>
							<!-- <el-button size="default" type="info" class="ml10" @click="onReset(tableSearchRef)"
								><el-icon><ele-RefreshLeft /></el-icon> {{ $t('message.allButton.resetBtn') }}
							</el-button> -->
						</div>
					</el-form-item>
				</el-col>
			</el-row>
		</el-form>
	</div>
</template>

<script setup lang="ts" name="makeTableDemoSearch">
import { reactive, ref, onMounted } from 'vue';
import type { FormInstance } from 'element-plus';
import { useI18n } from 'vue-i18n';

// 定义父组件传过来的值
const props = defineProps({
	// 搜索表单
	search: {
		type: Array<TableSearchType>,
		default: () => [],
	},
	// 表单配置
	searchConfig: {
		type: Object,
		default: () => {},
	},
});

// 定义子组件向父组件传值/事件
const emit = defineEmits(['search']);

// 定义变量内容
const { t } = useI18n();
const tableSearchRef = ref<FormInstance>();
const state = reactive<searchState>({
	form: {},
	isToggle: true,
});

// 查询
const onSearch = (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	formEl.validate((valid: boolean) => {
		if (valid) {
			emit('search', state.form);
		} else {
			return false;
		}
	});
};
// 重置
const onReset = (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	formEl.resetFields();
	emit('search', state.form);
};
// 初始化 form 字段，取自父组件 search.prop
const initFormField = () => {
	if (props.search.length <= 0) return false;
	props.search.forEach((v) => {
		if (v.type === 'select' && v.options && v.options?.length > 0) {
			v.options?.forEach((item) => {
				if (item.selected) {
					state.form[v.prop] = item.text;
				}
			});
			emit('search', state.form);
		}
	});
};
// 页面加载时
onMounted(() => {
	initFormField();
});
</script>

<style scoped lang="scss">
.table-search-container {
	display: flex;
	.table-form {
		flex: 1;
		.table-form-btn-toggle {
			white-space: nowrap;
			user-select: none;
			display: flex;
			align-items: center;
			color: var(--el-color-primary);
		}
	}
}

/* 页面宽度小于1200px
------------------------------- */
@media screen and (max-width: 1200px) {
	.isMargin {
		margin-bottom: 10px;
	}
}
</style>
