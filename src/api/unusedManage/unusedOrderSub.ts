import request from '/@/utils/request';
// 闲置接口
export function SetExitStoreIdleApi(data: Object) {
	return request({
		url: '/api/Idle/SetExitStoreIdle',
		method: 'POST',
		data: data,
	});
}
