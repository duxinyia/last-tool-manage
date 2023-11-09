import request from '/@/utils/request';
// 闲置接口	// url: '/api/Idle/SetExitStoreIdle',
export function postIdleSubmitApi(data: Object) {
	return request({
		url:'/api/Idle/Submit',
		method: 'POST',
		data: data,
	});
}
