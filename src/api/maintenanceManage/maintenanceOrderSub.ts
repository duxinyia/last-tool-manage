import request from '/@/utils/request';
// 查询接口
export function getQueryExitPageApi(data: Object) {
	return request({
		url: '/api/Stock/QueryExitPage',
		method: 'POST',
		data: data,
	});
}
// 提报单提报接口
export function getSubmitRepairOrderApi(data: Object) {
	return request({
		url: '/api/ToolRepair/SubmitRepairOrder',
		method: 'POST',
		data: data,
	});
}
// 根据退库id查询退库的条码
export function GetExitStoreQrCodeListApi(exitId: string) {
	return request({
		url: '/api/Stock/GetExitStoreQrCodeList',
		method: 'GET',
		params: { exitId },
	});
}
// 記錄查询接口
export function getQueryRepairRecordApi(data: Object) {
	return request({
		url: '/api/ToolRepair/QueryRepairRecord',
		method: 'POST',
		data: data,
	});
}
// 詳情接口
export function getRepairRecordDetailApi(repairNo: string) {
	return request({
		url: '/api/ToolRepair/GetRepairRecordDetail',
		method: 'GET',
		params: { repairNo },
	});
}
//获取维修单草稿
export function getRepairDraftApi() {
	return request({
		url: '/api/RepairDraft/Get',
		method: 'GET',
	});
}
// 创建维修单草稿
export function getRepairDraftCreateApi(data: Object) {
	return request({
		url: '/api/RepairDraft/Create',
		method: 'POST',
		data: data,
	});
}
// 更新维修单草稿
export function getRepairDraftUpdateApi(data: Object) {
	return request({
		url: '/api/RepairDraft/Update',
		method: 'POST',
		data: data,
	});
}
// 重置維修單草稿
export function getRepairDraftDeleteApi() {
	return request({
		url: '/api/RepairDraft/Delete',
		method: 'DELETE',
	});
}



