import request from '/@/utils/request';
// 闲置接口	// url: '/api/Idle/SetExitStoreIdle',
export function postIdleSubmitApi(data: Object) {
	return request({
		url:'/api/Idle/Submit',
		method: 'POST',
		data: data,
	});
}
//获取閒置单草稿
export function getIdleDraftApi() {
	return request({
		url: '/api/IdleDraft/Get',
		method: 'GET',
	});
}
// 创建閒置单草稿
export function getIdleDraftCreateApi(data: Object) {
	return request({
		url: '/api/IdleDraft/Create',
		method: 'POST',
		data: data,
	});
}
// 更新閒置单草稿
export function getIdleDraftUpdateApi(data: Object) {
	return request({
		url: '/api/IdleDraft/Update',
		method: 'POST',
		data: data,
	});
}
// 重置閒置單草稿
export function getIdleDraftDeleteApi() {
	return request({
		url: '/api/IdleDraft/Delete',
		method: 'DELETE',
	});
}
