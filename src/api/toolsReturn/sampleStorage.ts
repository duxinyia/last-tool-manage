import request from '/@/utils/request';
// 查询樣品入庫數據
export function GetQueryStoragableSampleCheckDetailsApi(data: Object) {
	return request({
		url: '/api/Material/QueryStoragableSampleCheckDetails',
		method: 'POST',
		data: data,
	});
}
// 樣品入庫
export function getSamplePutStorageApi(data: Object) {
	return request({
		url: '/api/Material/SamplePutStorage',
		method: 'POST',
		data: data,
	});
}
// 獲取入庫操作草稿
export function getOrCreatePutStorageDraftApi(data: Object) {
	return request({
		url: '/api/StockOperDraft/GetOrCreatePutStorageDraft',
		method: 'POST',
		data: data,
	});
}
// 向入庫操作草稿中添加暫存的碼
export function getStockOperDraftAddCodesApi(data: Object) {
	return request({
		url: '/api/StockOperDraft/AddCodesToPutStorageDraft',
		method: 'POST',
		data: data,
	});
}
// 修改入庫描述草稿
export function getStockOperDraftModifyPutStorageDraftApi(data: Object) {
	return request({
		url: '/api/StockOperDraft/ModifyPutStorageDraft',
		method: 'POST',
		data: data,
	});
}

// 清空刪除所有的碼
export function getStockOperDraftResetCodesOfPutStorageDraftApi(draftId: string) {
	return request({
		url: `/api/StockOperDraft/ResetCodesOfPutStorageDraft/${draftId}`,
		method: 'DELETE',
	});
}
// 刪除入庫草稿中暫存的碼
export function getStockOperDraftRemoveCodeFromPutStorageDraftApi(data: Object) {
	return request({
		url: `/api/StockOperDraft/RemoveCodeFromPutStorageDraft`,
		method: 'POST',
		data:data
	});
}
// 查詢樣品入庫記錄
export function getQuerySamplePutStorageRecordApi(data: Object) {
	return request({
		url: '/api/Material/QuerySamplePutStorageRecord',
		method: 'POST',
		data: data,
	});
}
export function getCodesOfSamplePutStorageRecordApi(samplePutStorageNo: string) {
	return request({
		url: `/api/Material/GetCodesOfSamplePutStorageRecord/${samplePutStorageNo}`,
		method: 'GET',
	});
}
// 退回
export function getToolApplyRejectDispatchApi(data: Object) {
	return request({
		url: '/api/ToolApply/RejectDispatch',
		method: 'POST',
		data: data,
	});
}
// 样品发料退回
export function getRejectSampleDispatchApi(data: Object) {
	return request({
		url: '/api/Material/RejectSampleDispatch',
		method: 'POST',
		data: data,
	});
}


