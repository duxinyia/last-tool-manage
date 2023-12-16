import request from '/@/utils/request';
// 查询樣品入庫數據
export function GetQueryStoragableSampleCheckDetailsApi(data: Object) {
	return request({
		url: '/api/Material/QueryStoragableSampleCheckDetails',
		method: 'POST',
		data: data,
	});
}
// 樣品入庫
export function getSamplePutStorageApi(data: Object) {
	return request({
		url: '/api/Material/SamplePutStorage',
		method: 'POST',
		data: data,
	});
}