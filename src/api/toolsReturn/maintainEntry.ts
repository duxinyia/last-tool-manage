import request from '/@/utils/request';
// 查询维修入庫查询列表
export function GetQueryStorableRepairCheckDetailsApi(data: Object) {
	return request({
		url: '/api/ToolRepair/QueryStorableRepairCheckDetails',
		method: 'POST',
		data: data,
	});
}

//入库弹窗获取收货仓库
// export function GetUserManagedStoreHouseApi() {
// 	return request({
// 		url: '/api/BaseStore/GetUserManagedStoreHouse',
// 		method: 'GET',
// 	});
// }

// 入库操作

// export function GetTStockAddApi(data: Object) {
// 	return request({
// 		url: '/api/TStockInput/TStockAdd',
// 		method: 'POST',
// 		data: data,
// 	});
// }