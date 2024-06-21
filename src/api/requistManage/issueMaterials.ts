import request from '/@/utils/request';
// 查询
export function getQueryDispatchableApplyCheckApi(data:Object) {
  return request({
    url: '/api/ToolApply/QueryDispatchableApplyCheck',
    method: 'POST',
  	data:data
  });
}
// 發料
export function getDispatchApi(data:Object) {
  return request({
    url:'/api/ToolApply/Dispatch',
    method: 'POST',
  	data:data
  });
}
// 發料記錄查詢
export function getQueryDispatchRecordApi(data:Object) {
  return request({
    url: '/api/ToolApply/QueryDispatchRecord',
    method: 'POST',
  	data:data
  });
}
// 退回的数据
export function getRejectedDispatchApi() {
  return request({
    url: '/api/ToolApply/GetRejectedDispatch',
    method: 'GET',

  });
}
// 重新發料
export function postResubmitDispatchApi(data:Object) {
  return request({
    url:'/api/ToolApply/ResubmitDispatch',
    method: 'POST',
  	data:data
  });
}

