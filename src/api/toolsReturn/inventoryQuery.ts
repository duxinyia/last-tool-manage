import request from '/@/utils/request';
// 根据runid查询有码库存量的条码
export function GetStockQrListApi(stockId: string) {
	return request({
		url: '/api/Stock/GetStockQrList',
		method: 'GET',
		params: { stockId },
	});
}
