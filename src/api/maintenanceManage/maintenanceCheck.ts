import request from '/@/utils/request';
// 查询接口
export function getQueryCheckableRepairReceiveHeadApi(data:Object) {
  return request({
    url: '/api/ToolRepair/QueryCheckableRepairReceiveHead',
    method: 'POST',
  	data:data
  });
}
// 点击查看详情页
export function getRepariReceiveDetailsForCheckApi(repairReceiveNo:string) {
  return request({
    url: `/api/ToolRepair/GetRepariReceiveDetailsForCheck/${repairReceiveNo}`,
    method: 'GET',
  });
}
// 验收接口
export function getCheckApi(data:Object) {
  return request({
    url: '/api/ToolRepair/Check',
    method: 'POST',
  	data:data
  });
}