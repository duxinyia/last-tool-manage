<template>
	<div class="home-container layout-pd">
		<!-- <el-row :gutter="15" class="home-card-one mb15">
			<el-col
				:xs="24"
				:sm="12"
				:md="12"
				:lg="6"
				:xl="6"
				v-for="(v, k) in state.homeOne"
				:key="k"
				:class="{ 'home-media home-media-lg': k > 1, 'home-media-sm': k === 1 }"
			>
				<div class="home-card-item flex">
					<div class="flex-margin flex w100" :class="` home-one-animation${k}`">
						<div class="flex-auto" ref="topCardItemRefs">
							<span class="font30 countup-card-item-tip-num" :style="{ color: v.color1 }">{{ v.num1 }}</span>
							<span class="ml5 font16">{{ v.num2 }}</span>
							<div class="mt10">{{ v.num3 }}</div>
						</div>
						<div class="home-card-item-icon flex" :style="{ background: `var(${v.color2})` }">
							<i class="flex-margin font32" :class="v.num4" :style="{ color: `var(${v.color3})` }"></i>
						</div>
					</div>
				</div>
			</el-col>
		</el-row> -->

		<el-row :gutter="15" class="home-card-three mb15">
			<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="home-media">
				<div class="big-data-up mb10">
					<div class="up-left">
						<i class="el-icon-time mr5"></i>
						<!-- <span>{{ state.time.txt }}</span> -->
					</div>
					<div class="up-center">
						<span>{{ $t('message.router.mainHead') }}</span>
					</div>
				</div>
			</el-col>
			<el-col :xs="24" :sm="10" :md="10" :lg="10" :xl="10" class="home-media">
				<div class="home-card-item">
					<div class="home-title">
						<el-icon
							:style="{
								color: '#F72B3F',
							}"
							:size="20"
							><ele-Memo
						/></el-icon>
						<span class="home-card-item-title ml10">{{ $t('message.pages.toDoList') }}</span>
					</div>
					<div style="height: 100%; display: flex; justify-content: center">
						<el-empty v-if="activities.length <= 0" :description="$t('message.pages.noTodoListYet')" />
						<div class="time-line pl10" v-else>
							<el-timeline class="mt20">
								<el-timeline-item
									v-for="(activity, index) in activities"
									:key="index"
									:icon="MoreFilled"
									type="primary"
									size="large"
									:timestamp="activity.generateTime"
								>
									<span>{{ $t(activity.no) }}：</span>
									<span
										class="cursor-pointer"
										style="color: #1890ff; font-weight: 700"
										:title="$t('message.pages.clickToPage')"
										@click="routePage(activity.type)"
										>{{ activity.keyNo }}</span
									>
									<span>{{ $t(activity.content) }}</span>
									<el-icon color="#1890ff" :title="$t('message.pages.clickToCopyNo')" class="ml10" @click="copyText(activity.keyNo)"
										><ele-CopyDocument
									/></el-icon>
								</el-timeline-item>
							</el-timeline>
						</div>
					</div>
				</div>
			</el-col>
			<!-- 中間 -->
			<el-col :xs="24" :sm="9" :md="9" :lg="9" :xl="9" class="home-media">
				<div class="home-card-item">
					<div class="home-title">
						<el-icon
							:style="{
								color: '#F72B3F',
							}"
							:size="20"
							><ele-Tickets
						/></el-icon>
						<span class="home-card-item-title ml10">{{ $t('退回') }}</span>
					</div>
					<div style="height: 100%; display: flex; justify-content: center">
						<el-empty v-if="centeractivities.length <= 0" :description="$t('message.pages.noTodoListYet')" />
						<div class="time-line pl10" v-else>
							<el-timeline class="mt20">
								<el-timeline-item
									v-for="(activity, index) in centeractivities"
									:key="index"
									:icon="MoreFilled"
									type="primary"
									size="large"
									:timestamp="activity.generateTime"
								>
									<span>{{ $t(activity.no) }}：</span>
									<span
										class="cursor-pointer"
										style="color: #1890ff; font-weight: 700"
										:title="$t('message.pages.clickToPage')"
										@click="routePage(activity.type)"
										>{{ activity.keyNo }}</span
									>
									<span>{{ $t(activity.content) }}</span>
									<el-icon color="#1890ff" :title="$t('message.pages.clickToCopyNo')" class="ml10" @click="copyText(activity.keyNo)"
										><ele-CopyDocument
									/></el-icon>
								</el-timeline-item>
							</el-timeline>
						</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="24" :sm="5" :md="5" :lg="5" :xl="5">
				<div class="home-card-item">
					<span class="home-card-item-title">{{ $t('message.pages.templateDownload') }}</span>
					<div class="home-monitor">
						<div class="flex-warp">
							<div class="flex-warp-item" v-for="(v, k) in state.homeThree" :key="k">
								<div class="flex-warp-item-box" :class="`home-animation${k}`" @click="downloadTemp(v.link)">
									<div class="flex-margin">
										<!-- <i :class="v.icon" :style="{ color: v.iconColor }"></i> -->
										<el-icon :style="{ color: v.iconColor }"><ele-Download /></el-icon>
										<span class="pl5">{{ $t(v.label) }}</span>
										<div class="mt10">{{ $t(v.value) }}</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</el-col>
		</el-row>
		<!-- <el-row :gutter="15" class="home-card-two">
			<el-col :xs="24" :sm="14" :md="14" :lg="16" :xl="16">
				<div class="home-card-item">
					<div style="height: 100%" ref="homeLineRef"></div>
				</div>
			</el-col>
			<el-col :xs="24" :sm="10" :md="10" :lg="8" :xl="8" class="home-media">
				<div class="home-card-item">
					<div style="height: 100%" ref="homePieRef"></div>
				</div>
			</el-col>
		</el-row> -->
	</div>
</template>

<script setup lang="ts" name="homes">
// markRaw
import { reactive, onMounted, ref, watch, nextTick, computed, onActivated } from 'vue';
import { useI18n } from 'vue-i18n';

// import * as echarts from 'echarts';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
// import { useTagsViewRoutes } from '/@/stores/tagsViewRoutes';
import { MoreFilled } from '@element-plus/icons-vue';
import { CountUp } from 'countup.js';
import { getTodosApi } from '/@/api/home/index';
import { ElMessage } from 'element-plus';
import commonFunction from '/@/utils/commonFunction';
import { useRouter } from 'vue-router';
// 定义变量内容
const { t } = useI18n();
const { copyText } = commonFunction();
// 定义变量内容
const router = useRouter();
// const homeLineRef = ref();
// const homePieRef = ref();
// const homeBarRef = ref();
// const storesTagsViewRoutes = useTagsViewRoutes();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
// const { isTagsViewCurrenFull } = storeToRefs(storesTagsViewRoutes);
const topCardItemRefs = ref<RefType[]>([]);
const activities = ref([{ generateTime: '', content: '', keyNo: '', no: '', type: 0 }]);
const centeractivities = ref([{ generateTime: '', content: '', keyNo: '', no: '', type: 0 }]);
// const odd = ref();
const state = reactive({
	global: {
		homeChartOne: null,
		homeChartTwo: null,
		homeCharThree: null,
		dispose: [null, '', undefined],
	} as any,
	homeOne: [
		// {
		// 	num1: '3',
		// 	num2: '/15',
		// 	num3: '待办',
		// 	num4: 'iconfont icon-daibanshixiang',
		// 	color1: '#FF6462',
		// 	color2: '--next-color-primary-lighter',
		// 	color3: '--el-color-primary',
		// },
		{
			num1: '20',
			num3: '待維修數量',
			num4: 'iconfont icon-weixiu',
			color1: '#6690F9',
			color2: '--next-color-danger-lighter',
			color3: '--el-color-danger',
		},
		{
			num1: '800',
			num3: '庫存數量',
			num4: 'iconfont icon-kucun',
			color1: '#6690F9',
			color2: '--next-color-primary-lighter',
			color3: '--el-color-primary',
		},
		{
			num1: '10',
			num3: '閒置數量',
			num4: 'iconfont icon-lie-b',
			color1: '#6690F9',
			color2: '--next-color-warning-lighter',
			color3: '--el-color-warning',
		},
		{
			num1: '200',
			num3: '報廢數量',
			num4: 'iconfont icon-baofeishebei',
			color1: '#6690F9',
			color2: '--next-color-success-lighter',
			color3: '--el-color-success',
		},
	],
	homeThree: [
		// {
		// 	icon: 'iconfont icon-btn-daoru',
		// 	label: '模板下載',
		// 	value: '料號導入',
		// 	iconColor: '#F72B3F',
		// 	link: '',
		// },
		// {
		// 	icon: 'iconfont icon-btn-daoru',
		// 	label: '模板下載',
		// 	value: '機種專案導入',
		// 	iconColor: '#91BFF8',
		// 	link: '',
		// },
		{
			icon: 'iconfont icon-btn-daoru',
			label: 'SOP',
			value: 'message.pages.sopDownload',
			iconColor: '#F72B3F',
			link: '/Template/治工具系統SOP-V2.pptx',
		},
		{
			icon: 'iconfont icon-btn-daoru',
			label: 'message.pages.templateDownload',
			value: 'message.pages.acceptanceReportTmport',
			iconColor: '#88D565',
			link: '/Template/ToolCheckReport.pptx',
		},
	],
	myCharts: [] as EmptyArrayType,
	charts: {
		theme: '',
		bgColor: '',
		color: '#303133',
	},
});
// 监听 pinia 中是否开启深色主题
watch(
	() => themeConfig.value.isIsDark,
	(isIsDark) => {
		nextTick(() => {
			state.charts.theme = isIsDark ? 'dark' : '';
			state.charts.bgColor = isIsDark ? 'transparent' : '';
			state.charts.color = isIsDark ? '#dadada' : '#303133';

			setTimeout(() => {
				// initPieChart();
			}, 700);
		});
	},
	{
		deep: true,
		immediate: true,
	}
);
// 饼图
// const initPieChart = () => {
// 	if (!state.global.dispose.some((b: any) => b === state.global.homeChartTwo)) state.global.homeChartTwo.dispose();
// 	state.global.homeChartTwo = markRaw(echarts.init(homePieRef.value, state.charts.theme));
// 	var getname = ['待报废数量', '待维修数量', '待闲置数量', '已维修数量', '已报废数量'];
// 	var getvalue = [34.2, 38.87, 17.88, 9.05, 2.05];
// 	var data = [];
// 	for (var i = 0; i < getname.length; i++) {
// 		data.push({ name: getname[i], value: getvalue[i] });
// 	}
// 	const colorList = ['#51A3FC', '#36C78B', '#FEC279', '#968AF5', '#E790E8'];
// const option = {
// 	backgroundColor: state.charts.bgColor,
// 	title: {
// 		text: '治工具管理',
// 		x: 'left',
// 		textStyle: { fontSize: '15', color: state.charts.color },
// 	},
// 	tooltip: { trigger: 'item', formatter: '{b} <br/> {c}%' },
// 	graphic: {
// 		elements: [
// 			{
// 				type: 'image',
// 				z: -1,
// 				style: {
// 					width: 230,
// 					height: 230,
// 				},
// 				left: '16.5%',
// 				top: 'center',
// 			},
// 		],
// 	},
// 	legend: {
// 		type: 'scroll',
// 		orient: 'vertical',
// 		right: '0%',
// 		left: '65%',
// 		top: 'center',
// 		itemWidth: 14,
// 		itemHeight: 14,
// 		data: getname,
// 		textStyle: {
// 			rich: {
// 				name: {
// 					fontSize: 14,
// 					fontWeight: 400,
// 					width: 200,
// 					height: 35,
// 					padding: [0, 0, 0, 60],
// 					color: state.charts.color,
// 				},
// 				rate: {
// 					fontSize: 15,
// 					fontWeight: 500,
// 					height: 35,
// 					width: 40,
// 					padding: [0, 0, 0, 30],
// 					color: state.charts.color,
// 				},
// 			},
// 		},
// 	},
// 	series: [
// 		{
// 			type: 'pie',
// 			radius: ['52', themeConfig.value.isIsDark ? '50' : '102'],
// 			center: ['32%', '50%'],
// 			itemStyle: {
// 				color: function (params: any) {
// 					return colorList[params.dataIndex];
// 				},
// 			},
// 			label: { show: false },
// 			labelLine: { show: false },
// 			data: data,
// 		},
// 	],
// };
// state.global.homeChartTwo.setOption(option);
// 	state.myCharts.push(state.global.homeChartTwo);
// };
// 点击模版下载
const downloadTemp = (link: string) => {
	if (link) {
		window.open(`${import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : window.webConfig.webApiBaseUrl}${link}`, '_blank');
	} else {
		ElMessage.warning(`${t('message.allButton.noTemplateDownload')}`);
	}
};
// 初始化数字滚动
const initNumCountUp = () => {
	nextTick(() => {
		topCardItemRefs.value.forEach((v: HTMLDivElement) => {
			let arr = v.innerText.split('\n');
			new CountUp(v.querySelector('.countup-card-item-tip-num') as HTMLDivElement, Number(arr[0])).start();
		});
	});
};
// 点击单号跳转到相应的页面
const routePage = (type: number) => {
	const routeTypeMap: EmptyObjectType = {
		0: '/sampleManage/sampleRequirement',
		1: '/sampleManage/acceptance',
		2: '/requistManage/arrivalAcceptance',
		3: '/maintenanceManage/maintenanceCheck',
		4: '/requistManage/issueMaterials',
		5: '/maintenanceManage/maintenanceMaterialIssue',
		6: '/sampleManage/sampleIssue',
		7: '/toolsReturn/entryJob',
		8: '/toolsReturn/maintainEntry',
		9: '/toolsReturn/sampleStorage',
		10: '/requistManage/issueMaterials',
		11: '/maintenanceManage/maintenanceMaterialIssue',
		12: '/sampleManage/sampleIssue',
		13: '/sampleManage/sampleDelivery',
	};
	router.push(routeTypeMap[type]);
};
// 得到待办信息
const getTodos = async () => {
	const res = await getTodosApi();
	// {
	// 	content: '维修单号:CSG-2023252000待收货',
	// 	timestamp: '2018-04-12 20:46',
	// 	size: 'large',
	// 	type: 'primary',
	// 	icon: MoreFilled,
	// },
	// 左邊
	const todoTypeMap: EmptyObjectType = {
		0: 'message.pages.samplesPurchased',
		1: 'message.pages.waitAcceptance',
		2: 'message.pages.waitAcceptance',
		3: 'message.pages.waitAcceptance',
		4: 'message.pages.materialWaitIssued',
		5: 'message.pages.materialWaitIssued',
		6: 'message.pages.materialWaitIssued',
		7: 'message.pages.stockPending',
		8: 'message.pages.stockPending',
		9: 'message.pages.stockPending',
	};
	const noTypeMap: EmptyObjectType = {
		0: 'message.pages.sampleSubmission',
		1: 'message.pages.sampleSubmission',
		2: 'message.pages.applicationForm',
		3: 'message.pages.applicationForm',
		4: 'message.pages.applicationForm',
		5: 'message.pages.maintenanceBill',
		6: 'message.pages.sampleSubmission',
		7: 'message.pages.applicationForm',
		8: 'message.pages.maintenanceBill',
		9: 'message.pages.sampleSubmission',
	};
	// 中間
	const centerTodoTypeMap: EmptyObjectType = {
		10: '待重新發料',
		11: '待重新發料',
		12: '待重新發料',
		13: '待重新提交',
	};
	const centerNoTypeMap: EmptyObjectType = {
		10: '申請單',
		11: '維修單',
		12: '送樣單',
		13: '送樣單',
	};
	let leftData: EmptyArrayType = [];
	let centerData: EmptyArrayType = [];
	let returnData = [10, 11, 12, 13];
	res.data.forEach((item: any) => {
		if (returnData.includes(item.todoType)) {
			centerData.push(item);
		} else {
			leftData.push(item);
		}
	});
	leftData.forEach((item: any) => {
		let type = item.todoType;
		item['type'] = `${item.todoType}`;
		item.todoType = todoTypeMap[item.todoType];
		item['no'] = `${noTypeMap[type]}`;
		item['keyNo'] = `${item.keyNo}`;
		item['content'] = item.todoType;
	});
	centerData.forEach((item: any) => {
		let type = item.todoType;
		item['type'] = `${item.todoType}`;
		item.todoType = centerTodoTypeMap[item.todoType];
		item['no'] = `${centerNoTypeMap[type]}`;
		item['keyNo'] = `${item.keyNo}`;
		item['content'] = item.todoType;
	});
	activities.value = Object.assign([], leftData);
	centeractivities.value = Object.assign([], centerData);
};

// 页面加载时
onMounted(() => {
	getTodos();
	setTimeout(() => {
		initNumCountUp();
	}, 500);
});
// 由于页面缓存原因，keep-alive
onActivated(() => {});

// 监听 pinia 中是否开启深色主题
watch(
	() => themeConfig.value.isIsDark,
	(isIsDark) => {
		nextTick(() => {
			state.charts.theme = isIsDark ? 'dark' : '';
			state.charts.bgColor = isIsDark ? 'transparent' : '';
			state.charts.color = isIsDark ? '#dadada' : '#303133';
		});
	},
	{
		deep: true,
		immediate: true,
	}
);
</script>

<style scoped lang="scss">
$homeNavLengh: 8;
.home-container {
	overflow: hidden;
	.home-card-one,
	.home-card-two,
	.home-card-three {
		.home-card-item {
			width: 100%;
			height: 130px;
			border-radius: 4px;
			transition: all ease 0.3s;
			padding: 20px;
			overflow: hidden;
			background: var(--el-color-white);
			color: var(--el-text-color-primary);
			border: 1px solid var(--next-border-color-light);
			&:hover {
				box-shadow: 0 2px 12px var(--next-color-dark-hover);
				transition: all ease 0.3s;
			}
			&-icon {
				width: 70px;
				height: 70px;
				border-radius: 100%;
				flex-shrink: 1;
				i {
					color: var(--el-text-color-placeholder);
				}
			}
			&-title {
				font-size: 15px;
				font-weight: bold;
				height: 30px;
			}
		}
	}
	.time-line {
		overflow: overlay;
		height: 100%;
		width: 100%;
	}
	::-webkit-scrollbar {
		display: none !important;
	}
	.time-line:hover::-webkit-scrollbar {
		display: block !important;
	}

	.home-card-one {
		@for $i from 0 through 3 {
			.home-one-animation#{$i} {
				opacity: 0;
				animation-name: error-num;
				animation-duration: 0.5s;
				animation-fill-mode: forwards;
				animation-delay: calc($i/4) + s;
			}
		}
	}
	.home-card-two,
	.home-card-three {
		.home-card-item {
			background-image: linear-gradient(164.2deg, rgb(196, 224, 250) 0.5%, rgb(254, 254, 254) 24.8%);
			// height: 400px;
			height: 758px;
			width: 100%;
			overflow: hidden;
			.home-monitor {
				height: 100%;
				.flex-warp-item {
					width: 50%;
					height: 111px;
					display: flex;

					.flex-warp-item-box {
						margin: auto;
						text-align: center;
						color: var(--el-text-color-primary);
						display: flex;
						border-radius: 5px;
						background: var(--next-bg-color);
						cursor: pointer;
						transition: all 0.3s ease;
						&:hover {
							background: var(--el-color-primary-light-9);
							transition: all 0.3s ease;
						}
					}
					@for $i from 0 through $homeNavLengh {
						.home-animation#{$i} {
							opacity: 0;
							animation-name: error-num;
							animation-duration: 0.5s;
							animation-fill-mode: forwards;
							animation-delay: calc($i/10) + s;
						}
					}
				}
			}
		}
	}
}
.big-data-up {
	background: var(--el-color-white);

	// background: linear-gradient(134.15deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary) 100%);
	height: 55px;
	width: 100%;
	display: flex;
	align-items: center;
	padding: 0 15px;
	color: var(--el-color-primary);
	overflow: hidden;
	position: relative;
	.up-left {
		position: absolute;
	}
	.up-center {
		width: 100%;
		display: flex;
		justify-content: center;
		font-weight: 700;
		font-size: 18px;
		letter-spacing: 18px;
		background-image: -webkit-linear-gradient(
			left,
			var(--el-color-primary),
			var(--el-color-primary-light-3) 25%,
			var(--el-color-primary) 50%,
			var(--el-color-primary-light-3) 75%,
			var(--el-color-primary)
		);
		-webkit-text-fill-color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
		background-size: 200% 100%;
		-webkit-animation: masked-animation-data-v-b02d8052 4s linear infinite;
		animation: masked-animation-data-v-b02d8052 4s linear infinite;
		-webkit-box-reflect: below -2px -webkit-gradient(linear, left top, left bottom, from(transparent), to(hsla(0, 0%, 100%, 0.1)));
		position: relative;
		@keyframes masked-animation {
			0% {
				background-position: 0 0;
			}
			100% {
				background-position: -100% 0;
			}
		}
		position: relative;
		&::after {
			content: '';
			width: 250px;
			position: absolute;
			bottom: -15px;
			left: 50%;
			transform: translateX(-50%);
			border: 1px transparent solid;
			border-image: linear-gradient(to right, var(--el-color-primary-light-9), var(--el-color-primary)) 1 10;
		}
		span {
			cursor: pointer;
		}
	}
}
.home-title {
	display: flex;
}
</style>
