import request from '/@/utils/request';
// 闲置查询
export function IdleQueryPageListApi(data: Object) {
	return request({
		url: '/api/Idle/IdleQueryPageList',
		method: 'POST',
		data: data,
	});
}
// 闲置详情
export function GetIdleDetailApi(IdleNo: string) {
	return request({
		url: '/api/Idle/GetIdleDetail/IdleNo',
		method: 'GET',
		params: { IdleNo },
	});
}
