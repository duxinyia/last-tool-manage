import request from '/@/utils/request';

// 查询（不分页，暂时无参数）
export function GetCheckTaskApi() {
	return request({
		url: '/api/Material/GetCheckTask',
		method: 'get',
	});
}
//驗收

export function SampleCheckApi(data: Object) {
	return request({
		url: '/api/Material/SampleCheck',
		method: 'POST',
		data: data,
	});
}
// // 点击送样获取送样弹窗表格详情
// export function GetSampleDetailApi(sampleNo:string) {
//   return request({
//     url: '/api/Material/GetSampleDetail',
//     method: 'get',
//     params:{sampleNo}
//   });
// }
