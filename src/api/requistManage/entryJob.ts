import request from '/@/utils/request';
// 查询待入庫列表
export function GetTStockInputPageListApi(data: Object) {
	return request({
		url:'/api/ToolApply/QueryStorableApplyCheck',
		// url: '/api/TStockInput/GetCheckDetailPageList',
		method: 'POST',
		data: data,
	});
}

//入库弹窗获取收货仓库
export function GetUserManagedStoreHouseApi() {
	return request({
		url: '/api/BaseStore/GetUserManagedStoreHouse',
		method: 'GET',
	});
}

// 入库操作

export function GetTStockAddApi(data: Object) {
	return request({
		url:'/api/ToolApply/PutStorage',
		// url: '/api/TStockInput/TStockAdd',
		method: 'POST',
		data: data,
	});
}
// 入库记录查询
export function GetQueryPutStorageRecordApi(data: Object) {
	return request({
		url:'/api/ToolApply/QueryPutStorageRecord',
		method: 'POST',
		data: data,
	});
}

// 查看入庫的碼
export function getCodesOfApplyPutStorageApi(applyPutStorageId: string) {
	return request({
		url: `/api/ToolApply/GetCodesOfApplyPutStorage/${applyPutStorageId}`,
		method: 'GET',
	});
}