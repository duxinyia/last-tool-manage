import request from '/@/utils/request';
// 維修發料查詢
export function getQueryDispatchedRepairCheckDetailsApi(data:Object) {
  return request({
    url: '/api/ToolRepair/QueryDispatchedRepairCheckDetails',
    method: 'POST',
  	data:data
  });
}
// 維修發料
export function getToolRepairDispatchApi(data:Object) {
  return request({
    url:'/api/ToolRepair/Dispatch',
    method: 'POST',
  	data:data
  });
}
// 發料記錄查詢
export function getQueryDispatchRecordApi(data:Object) {
  return request({
    url: '/api/ToolRepair/QueryDispatchRecord',
    method: 'POST',
  	data:data
  });
}
