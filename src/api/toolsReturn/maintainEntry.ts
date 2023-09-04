import request from '/@/utils/request';
// 查询维修入庫查询列表
export function GetQueryStorableRepairCheckDetailsApi(data: Object) {
	return request({
		url: '/api/ToolRepair/QueryStorableRepairCheckDetails',
		method: 'POST',
		data: data,
	});
}

// 入库操作

export function GetPutStorageApi(data: Object) {
	return request({
		url: '/api/ToolRepair/PutStorage',
		method: 'POST',
		data: data,
	});
}