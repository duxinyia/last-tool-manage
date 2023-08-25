import request from '/@/utils/request';
// 查询接口
export function getQueryRepairOrderApi(data:Object) {
  return request({
    url: '/api/ToolRepair/QueryRepairOrder',
    method: 'POST',
  	data:data
  });
}
// 点击维修单号得到详情接口
export function getRepairDetailsApi(repairNo:string) {
  return request({
    url: `/api/ToolRepair/GetRepairDetails/${repairNo}`,
    method: 'GET',
  });
}
