import request from '/@/utils/request';
// 查询待入庫列表
export function GetTStockInputPageListApi(data: Object) {
	return request({
		url: '/api/TStockInput/GetCheckDetailPageList',
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
		url: '/api/TStockInput/TStockAdd',
		method: 'POST',
		data: data,
	});
}
