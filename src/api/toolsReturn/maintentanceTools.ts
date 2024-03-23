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
// 獲取退庫操作草稿
export function getOrCreateExitStoreDraftApi(data: Object) {
	return request({
		url: '/api/StockOperDraft/GetOrCreateExitStoreDraft',
		method: 'POST',
		data: data,
	});
}
// 向退庫操作草稿中添加暫存的碼
export function getStockOperDraftAddCodesToExitStoreDraftApi(data: Object) {
	return request({
		url: '/api/StockOperDraft/AddCodesToExitStoreDraft',
		method: 'POST',
		data: data,
	});
}
// 修改退庫草稿
export function getStockOperDraftModifyExitStoreDraftApi(data: Object) {
	return request({
		url: '/api/StockOperDraft/ModifyExitStoreDraft',
		method: 'POST',
		data: data,
	});
}

// 清空刪除所有的碼
export function getStockOperDraftResetCodesOfExitStoreDraftApi(draftId: string) {
	return request({
		url: `/api/StockOperDraft/ResetCodesOfExitStoreDraft/${draftId}`,
		method: 'DELETE',
	});
}
// 刪除退庫草稿中暫存的碼
export function getStockOperDraftRemoveCodeFromExitStoreDraftApi(data: Object) {
	return request({
		url: `/api/StockOperDraft/RemoveCodeFromExitStoreDraft`,
		method: 'POST',
		data:data
	});
}
// 獲取轉倉操作草稿
export function getOrCreateStockTransferDraftApi(data: Object) {
	return request({
		url: '/api/StockOperDraft/GetOrCreateStockTransferDraft',
		method: 'POST',
		data: data,
	});
}
// 向轉倉操作草稿中添加暫存的碼
export function getStockOperDraftAddCodesToStockTransferDraftApi(data: Object) {
	return request({
		url: '/api/StockOperDraft/AddCodesToStockTransferDraft',
		method: 'POST',
		data: data,
	});
}
// 修改轉倉草稿
export function getStockOperDraftModifyStockTransferDraftApi(data: Object) {
	return request({
		url: '/api/StockOperDraft/ModifyStockTransferDraft',
		method: 'POST',
		data: data,
	});
}

// 清空刪除所有轉倉的碼
export function getStockOperDraftResetCodesOfStockTransferDraftApi(draftId: string) {
	return request({
		url: `/api/StockOperDraft/ResetCodesOfStockTransferDraft/${draftId}`,
		method: 'DELETE',
	});
}
// 刪除轉倉草稿中暫存的碼
export function getStockOperDraftRemoveCodeFromStockTransferDraftApi(data: Object) {
	return request({
		url: `/api/StockOperDraft/RemoveCodeFromStockTransferDraft`,
		method: 'POST',
		data:data
	});
}
//查询退庫記錄
export function getQueryExitStoreRecordApi(data: Object) {
	return request({
		url: '/api/Stock/QueryExitStoreRecord',
		method: 'POST',
		data: data,
	});
}
// 轉倉記錄
export function getQueryTransferStorageRecordApi(data: Object) {
	return request({
		url: '/api/Stock/QueryTransferStorageRecord',
		method: 'POST',
		data: data,
	});
}
// 查看轉倉二維碼
export function getStockTransferCodesApi(stockTransferId: Object) {
	return request({
		url: '/api/Stock/GetStockTransferCodes',
		method: 'GET',
		params: { stockTransferId },
	});
}
// 有碼管理提交之前調的接口
export function getStockPreExitStoreApi(data: Object) {
	return request({
		url: '/api/Stock/PreExitStore',
		method: 'POST',
		data: data,
	});
}

