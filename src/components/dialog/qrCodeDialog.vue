<template>
	<el-dialog :destroy-on-close="true" draggable :close-on-click-modal="false" :title="dialogTitle" v-model="isShowDialog" :width="dialogWidth">
		<div style="height: 400px">
			<el-tag :type="i.runStatus || i.runstatus || i ? '' : 'danger'" class="mr10 mb10" v-for="i in dialogConfig" :key="i" style="width: 250px">{{
				i.code || i
			}}</el-tag>
		</div>

		<!-- <div style="margin-bottom: 5px; font-weight: 700; color: red; display: flex; justify-content: center">共有{{ tags.length }}條二維碼編碼</div> -->
		<!-- <div class="infinite-list-wrapper" style="overflow: auto">
			<ul v-infinite-scroll="load" class="list" :infinite-scroll-disabled="disabled">
				:class="i.runStatus===1 ? 'list-item-primary' : 'list-item-danger'"
				<li v-for="i in dialogConfig" :key="i" class="list-item">
					{{ i.code || i }}
				</li>
			</ul>
			<p v-if="loading">數據過多，加載中...</p>
			<p v-if="noMore && tags.length >= 20">數據加載完畢</p>
		</div> -->
		<template #footer>
			<el-pagination
				small
				ref="pagination"
				class="mt15 pages"
				v-model:current-page="state.page.pageNum"
				v-model:page-size="state.page.pageSize"
				:pager-count="3"
				:page-sizes="[20, 40, 60]"
				:total="dialogConfig.length"
				layout="total, sizes, prev, pager, next, jumper"
				background
				@size-change="onHandleSizeChange"
				@current-change="onHandleCurrentChange"
			>
			</el-pagination>
		</template>
	</el-dialog>
</template>

<script setup lang="ts" name="qrCodeDialog">
import { defineAsyncComponent, reactive, onMounted, ref, nextTick, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const dialogConfig = ref<any>([]);
const isShowDialog = ref(false);
const loading = ref(false);
const state = reactive({
	page: {
		pageNum: 1,
		pageSize: 20,
	},
});
const emit = defineEmits([]);
// 定义父组件传过来的值
const props = defineProps({
	// 弹出框内容
	// dialogConfig: {
	// 	type: Array<EmptyObjectType>,
	// 	default: () => [],
	// },
	tags: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
	dialogType: {
		type: String,
		default: () => '',
	},
	isFootBtn: {
		type: Boolean,
		default: () => true,
	},
	dialogWidth: {
		type: String,
		default: () => '30%',
	},
	tagsData: {
		type: Array,
		default: () => [],
	},
	loadingBtn: {
		type: Boolean,
		default: () => false,
	},
	labelWidth: {
		type: String,
		default: () => '100px',
	},
	dialogTitle: {
		type: String,
		default: () => '二維碼編號',
	},
});
watch(
	() => props.tags,
	() => {
		dialogConfig.value = [];
		// if (props.tags.length >= 20) {
		// 	for (let i = 0; i < 20; i++) {
		// 		dialogConfig.value.push(props.tags[i]);
		// 	}
		// } else {
		dialogConfig.value = props.tags;
		// }
	},
	{
		deep: true,
		immediate: true,
	}
);
// tags的数据
// let tags = ref<EmptyArrayType>([]);
const load = () => {
	let num = 0;
	loading.value = true;
	setTimeout(() => {
		for (let i = dialogConfig.value.length; i < dialogConfig.value.length + 20; i++) {
			if (props.tags[i].code || props.tags[i]) {
				dialogConfig.value.push(props.tags[i]);
				num++;
			}
			if (num > 20) break;
			loading.value = false;
		}
	}, 2000);
};
onMounted(() => {});
// 打开弹窗
const openDialog = () => {
	isShowDialog.value = true;
};
const noMore = computed(() => dialogConfig.value.length >= props.tags.length);
const disabled = computed(() => loading.value || noMore.value);
// 关闭弹窗
const closeDialog = () => {
	isShowDialog.value = false;
};
// 分页改变
const onHandleSizeChange = (val: number) => {};
// 分页改变
const onHandleCurrentChange = (val: number) => {};
// 暴露变量
defineExpose({
	openDialog,
	closeDialog,
});
</script>

<style scoped lang="scss">
.infinite-list-wrapper {
	height: 500px;
	text-align: center;
}
.infinite-list-wrapper .list {
	padding: 0;
	margin: 0;
	list-style: none;
}

.infinite-list-wrapper .list-item {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 30px;
	margin-top: 10px;
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
}
.list-item-primary {
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
}
.list-item-danger {
	background: var(--el-color-danger-light-9);
	color: var(--el-color-danger);
}
// .infinite-list-wrapper .list-item + .list-item {
// 	margin-top: 10px;
// }

.pages {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: flex-end;
}
</style>
