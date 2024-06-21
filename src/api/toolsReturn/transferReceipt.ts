import request from '/@/utils/request';
// 查询仓库接收查询列表
export function getQueryTransferPageApi(data: Object) {
	return request({
		url: '/api/Stock/QueryTransferPage',
		method: 'POST',
		data: data,
	});
}
// 接收仓库
export function getReceiveTransferApi(data: Object) {
	return request({
		url: '/api/Stock/ReceiveTransfer',
		method: 'POST',
		data: data,
	});
}
// 转仓退回
export function getRejectTransferStorageApi(data: Object) {
	return request({
		url: '/api/Stock/RejectTransferStorage',
		method: 'POST',
		data: data,
	});
}

