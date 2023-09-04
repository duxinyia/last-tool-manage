import request from '/@/utils/request';
// 查询接口
export function getQueryExitPageApi(data: Object) {
	return request({
		url: '/api/Idle/UselessPageList',
		method: 'POST',
		data: data,
	});
}
// 详情接口

export function getUselessDetailApi(UselessNo: string) {
	return request({
		url: '/api/Idle/GetUselessDetail/UselessNo',
		method: 'GET',
		params: { UselessNo },
	});
}
