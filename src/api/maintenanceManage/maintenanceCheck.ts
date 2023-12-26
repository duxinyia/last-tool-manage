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
    url: '/api/ToolRepair/RepairCheck',
    method: 'POST',
  	data:data
  });
}
// 驗收記錄查询接口
export function getQueryRepairCheckRecordApi(data:Object) {
  return request({
    url: '/api/ToolRepair/QueryRepairCheckRecord',
    method: 'POST',
  	data:data
  });
}
// 点击驗收記錄查看详情页
export function getRepairCheckRecordDetailApi(repairCheckNo:string) {
  return request({
    url: `/api/ToolRepair/GetRepairCheckRecordDetail`,
    method: 'GET',
    params:{repairCheckNo}
  });
}