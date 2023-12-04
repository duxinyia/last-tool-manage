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
// 查询维修入庫记录
export function GetQueryRepairPutStorageRecordApi(data: Object) {
	return request({
		url: '/api/ToolRepair/QueryRepairPutStorageRecord',
		method: 'POST',
		data: data,
	});
}
// 查看入庫的碼
export function getCodesOfRepairPutStorageApi(repairPutNo: string) {
	return request({
		url: `/api/ToolRepair/GetCodesOfRepairPutStorage/${repairPutNo}`,
		method: 'GET',
	});
}
