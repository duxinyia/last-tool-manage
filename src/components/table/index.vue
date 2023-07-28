<template>
	<div class="table-container">
		<div class="table-footer">
			<div class="allBtn">
				<el-button size="default" class="ml10 buttonBorder" @click="onOpenAddRole('add')" type="primary" plain
					><el-icon><ele-Plus /></el-icon>{{ $t('message.allButton.addBtn') }}</el-button
				>

				<el-button size="default" class="ml10 buttonBorder" @click="onOpenAddRole('del')" color="#D33939" plain>
					<el-icon><ele-Delete /></el-icon>
					{{ $t('message.allButton.bulkDeletionBtn') }}
				</el-button>
			</div>
			<div class="table-footer-tool">
				<!-- <SvgIcon name="iconfont icon-dayinji" :size="19" title="打印" @click="onPrintTable" /> -->
				<SvgIcon name="iconfont icon-btn-daoru" :size="22" :title="$t('message.tooltip.import')" />
				<SvgIcon name="iconfont icon-btn-daochu" :size="22" :title="$t('message.tooltip.export')" @click="onImportTable" />
				<SvgIcon name="iconfont icon-refresh-line" :size="23" :title="$t('message.tooltip.refresh')" @click="onRefreshTable" />
				<el-popover
					placement="top-end"
					trigger="click"
					transition="el-zoom-in-top"
					popper-class="table-tool-popper"
					:width="300"
					:persistent="false"
					@show="onSetTable"
				>
					<template #reference>
						<SvgIcon name="iconfont icon-shezhi" :size="20" :title="$t('message.tooltip.setting')" />
					</template>
					<template #default>
						<div class="tool-box">
							<el-tooltip :content="$t('message.pages.dragsort')" placement="top-start">
								<SvgIcon name="fa fa-question-circle-o" :size="17" class="ml11" color="#909399" />
							</el-tooltip>
							<el-checkbox
								v-model="state.checkListAll"
								:indeterminate="state.checkListIndeterminate"
								class="ml10 mr1"
								:label="$t('message.pages.columndisplay')"
								@change="onCheckAllChange"
							/>
							<el-checkbox v-model="getConfig.isSerialNo" class="ml12 mr1" :label="$t('message.pages.no')" />
							<el-checkbox v-model="getConfig.isSelection" class="ml12 mr1" :label="$t('message.pages.moreoptions')" />
						</div>
						<el-scrollbar>
							<div ref="toolSetRef" class="tool-sortable">
								<div class="tool-sortable-item" v-for="v in header" :key="v.key" :data-key="v.key">
									<i class="fa fa-arrows-alt handle cursor-pointer"></i>
									<el-checkbox v-model="v.isCheck" size="default" class="ml12 mr8" :label="$t(v.title)" @change="onCheckChange" />
								</div>
							</div>
						</el-scrollbar>
					</template>
				</el-popover>
			</div>
		</div>
		<el-table
			id="elTable"
			class="mt12"
			:data="data"
			:border="setBorder"
			v-bind="$attrs"
			row-key="id"
			stripe
			style="width: 100%"
			:row-style="{ height: '10px' }"
			:header-row-style="{ background: '#f2f5fa' }"
			v-loading="config.loading"
			@selection-change="onSelectionChange"
		>
			<el-table-column type="selection" :reserve-selection="true" width="30" v-if="config.isSelection" />
			<el-table-column align="center" type="index" :label="$t('message.pages.no')" width="60" v-if="config.isSerialNo" />
			<el-table-column
				align="center"
				v-for="(item, index) in setHeader"
				:key="index"
				show-overflow-tooltip
				:prop="item.key"
				:width="item.colWidth"
				:label="$t(item.title)"
			>
				<template v-slot="scope">
					<template v-if="item.type === 'image'">
						<el-image
							:style="{ width: `${item.width}px`, height: `${item.height}px` }"
							:src="scope.row[item.key]"
							:zoom-rate="1.2"
							:preview-src-list="[scope.row[item.key]]"
							preview-teleported
							fit="cover"
						/>
					</template>

					<template v-if="item.type === 'status'">
						<!-- <el-tag type="success" v-if="scope.row.status === true">启用</el-tag>
						<el-tag type="info" v-else>禁用</el-tag> -->
						<el-switch
							v-model="scope.row[item.key]"
							inline-prompt
							:active-text="$t('message.allButton.startup')"
							:inactive-text="$t('message.allButton.disable')"
						></el-switch>
					</template>

					<template v-else>
						{{ scope.row[item.key] }}
					</template>
				</template>
			</el-table-column>

			<el-table-column align="center" :label="$t('message.pages.operation')" :width="config.isEditBtn ? 240 : 150" v-if="config.isOperate">
				<template v-slot="scope">
					<el-button v-if="config.isEditBtn" @click="onOpenEditRole('edit', scope.row)" color="#39D339" plain class="button buttonBorder"
						><el-icon><ele-Edit /></el-icon>{{ $t('message.allButton.editBtn') }}</el-button
					>
					<el-popconfirm :title="$t('message.hint.suredel')" @confirm="onDelRow(scope.row)">
						<template #reference>
							<el-button class="button buttonBorder" color="#D33939" plain
								><el-icon><ele-Delete /></el-icon>{{ $t('message.allButton.deleteBtn') }}</el-button
							>
						</template>
					</el-popconfirm>
				</template>
			</el-table-column>
			<template #empty>
				<el-empty :description="$t('message.hint.nodata')" />
			</template>
		</el-table>
		<div class="footer">
			<el-pagination
				class="mt15 pages"
				v-model:current-page="state.page.pageNum"
				v-model:page-size="state.page.pageSize"
				:pager-count="5"
				:page-sizes="[10, 20, 30]"
				:total="config.total"
				layout="total, sizes, prev, pager, next, jumper"
				background
				@size-change="onHandleSizeChange"
				@current-change="onHandleCurrentChange"
			>
			</el-pagination>
		</div>
		<Dialog ref="roleDialogRef" :dialogConfig="dialogConfig" />
	</div>
</template>

<script setup lang="ts" name="netxTable">
import { reactive, computed, nextTick, ref, defineAsyncComponent } from 'vue';
import { ElMessage } from 'element-plus';
import printJs from 'print-js';
import Sortable from 'sortablejs';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import '/@/theme/tableTool.scss';
import { useI18n } from 'vue-i18n';
// 引入组件
const Dialog = defineAsyncComponent(() => import('/@/components/dialog/dialog.vue'));

// 定义父组件传过来的值
const props = defineProps({
	// 列表内容
	data: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
	// 表头内容
	header: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
	// 配置项
	config: {
		type: Object,
		default: () => {},
	},
	// 打印标题
	printName: {
		type: String,
		default: () => '',
	},
	// 弹出框内容
	dialogConfig: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
});

// 定义子组件向父组件传值/事件
const emit = defineEmits(['delRow', 'pageChange', 'sortHeader', 'importTable']);
// 打开新增角色弹窗
const onOpenAddRole = (type: string) => {
	roleDialogRef.value.openDialog(type);
};
// 打开修改角色弹窗
const onOpenEditRole = (type: string, row: Object) => {
	roleDialogRef.value.openDialog(type, row);
};
// 定义变量内容
const { t } = useI18n();
const toolSetRef = ref();
const roleDialogRef = ref();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
const state = reactive({
	page: {
		pageNum: 1,
		pageSize: 10,
	},
	selectlist: [] as EmptyObjectType[],
	checkListAll: true,
	checkListIndeterminate: false,
});

// 设置边框显示/隐藏
const setBorder = computed(() => {
	return props.config.isBorder ? true : false;
});
// 获取父组件 配置项（必传）
const getConfig = computed(() => {
	return props.config;
});
// 设置 tool header 数据
const setHeader = computed(() => {
	return props.header.filter((v) => v.isCheck);
});
// tool 列显示全选改变时
const onCheckAllChange = <T>(val: T) => {
	if (val) props.header.forEach((v) => (v.isCheck = true));
	else props.header.forEach((v) => (v.isCheck = false));
	state.checkListIndeterminate = false;
};
// tool 列显示当前项改变时
const onCheckChange = () => {
	const headers = props.header.filter((v) => v.isCheck).length;
	state.checkListAll = headers === props.header.length;
	state.checkListIndeterminate = headers > 0 && headers < props.header.length;
};
// 表格多选改变时，用于导出
const onSelectionChange = (val: EmptyObjectType[]) => {
	state.selectlist = val;
};
// 删除当前项
const onDelRow = (row: EmptyObjectType) => {
	emit('delRow', row);
};
// 分页改变
const onHandleSizeChange = (val: number) => {
	state.page.pageSize = val;
	emit('pageChange', state.page);
};
// 分页改变
const onHandleCurrentChange = (val: number) => {
	state.page.pageNum = val;
	emit('pageChange', state.page);
};
// 搜索时，分页还原成默认
const pageReset = () => {
	state.page.pageNum = 1;
	state.page.pageSize = 10;
	emit('pageChange', state.page);
};
// 打印
const onPrintTable = () => {
	// https://printjs.crabbly.com/#documentation
	// 自定义打印
	let tableTh = '';
	let tableTrTd = '';
	let tableTd: any = {};
	// 表头
	props.header.forEach((v) => {
		tableTh += `<th class="table-th">${v.title}</th>`;
	});
	// 表格内容
	props.data.forEach((val, key) => {
		if (!tableTd[key]) tableTd[key] = [];
		props.header.forEach((v) => {
			if (v.type === 'text') {
				tableTd[key].push(`<td class="table-th table-center">${val[v.key]}</td>`);
			} else if (v.type === 'image') {
				tableTd[key].push(`<td class="table-th table-center"><img src="${val[v.key]}" style="width:${v.width}px;height:${v.height}px;"/></td>`);
			}
		});
		tableTrTd += `<tr>${tableTd[key].join('')}</tr>`;
	});
	// 打印
	printJs({
		printable: `<div style=display:flex;flex-direction:column;text-align:center><h3>${props.printName}</h3></div><table border=1 cellspacing=0><tr>${tableTh}${tableTrTd}</table>`,
		type: 'raw-html',
		css: ['//at.alicdn.com/t/c/font_2298093_rnp72ifj3ba.css', '//unpkg.com/element-plus/dist/index.css'],
		style: `@media print{.mb15{margin-bottom:15px;}.el-button--small i.iconfont{font-size: 12px !important;margin-right: 5px;}}; .table-th{word-break: break-all;white-space: pre-wrap;}.table-center{text-align: center;}`,
	});
};
// 导出
const onImportTable = () => {
	if (state.selectlist.length <= 0) return ElMessage.warning('请先选择要导出的数据');
	props.header.forEach((item) => {
		item.title = t(item.title);
	});
	emit('importTable');
};
// 刷新
const onRefreshTable = () => {
	emit('pageChange', state.page);
};
// 设置
const onSetTable = () => {
	nextTick(() => {
		const sortable = Sortable.create(toolSetRef.value, {
			handle: '.handle',
			dataIdAttr: 'data-key',
			animation: 150,
			onEnd: () => {
				const headerList: EmptyObjectType[] = [];
				sortable.toArray().forEach((val: string) => {
					props.header.forEach((v) => {
						if (v.key === val) headerList.push({ ...v });
					});
				});
				emit('sortHeader', headerList);
			},
		});
	});
};

// 暴露变量
defineExpose({
	pageReset,
});
</script>

<style scoped lang="scss">
.table-container {
	display: flex;
	flex-direction: column;
	.el-table {
		flex: 1;
	}
	.table-footer {
		display: flex;
		.table-footer-tool {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: flex-end;
			i {
				margin-right: 10px;
				cursor: pointer;
				color: var(--el-text-color-regular);
				&:last-of-type {
					margin-right: 0;
				}
			}
		}
	}
	.button {
		width: 80px;
		height: 32px;
	}
	.buttonBorder {
		border: 0px !important;
	}
	:deep(.el-table__cell) {
		padding: 8px 0px !important;
	}
	.footer {
		display: flex;
	}
	.pages {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}
	:deep(.el-table th.el-table__cell) {
		background-color: unset;
	}
}
</style>
