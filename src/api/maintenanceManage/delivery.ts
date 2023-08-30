import request from '/@/utils/request';
// 查询接口
export function getQueryReceivableRepairOrdersApi(data:Object) {
  return request({
    url: '/api/ToolRepair/QueryReceivableRepairOrders',
    method: 'POST',
  	data:data
  });
}
// 点击维修单号得到详情接口
export function getRepariDetailsForReceiveApi(repairNo:string) {
  return request({
    url: `/api/ToolRepair/GetRepariDetailsForReceive/${repairNo}`,
    method: 'GET',
  });
}
// 收货接口
export function getReceiveApi(data:Object) {
  return request({
    url: '/api/ToolRepair/Receive',
    method: 'POST',
  	data:data
  });
}
