import request from '/@/utils/request';

//查询可退库列表(库存)
export function getStockListApi(data: Object) {
	return request({
		url: '/api/Stock/QueryPage',
		method: 'POST',
		data: data,
	});
}

//退库
export function ExitStoreApi(data: Object) {
	return request({
		url: '/api/Stock/ExitStore',
		method: 'POST',
		data: data,
	});
}

//根据退库类型查询退库原因

export function getExitReasonApi(datacode: string) {
	return request({
		url: '/api/BaseData/GetDataBaseByCode',
		method: 'GET',
		params: { datacode },
	});
}

// 转仓提交
export function getTransferStorageApi(data: Object) {
	return request({
		url: '/api/Stock/TransferStorage',
		method: 'POST',
		data: data,
	});
}
