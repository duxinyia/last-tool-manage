import request from '/@/utils/request';
// 查询
export function getGetWaitRecievePageListApi(data:Object) {
  return request({
    url: '/api/ToolApply/QueryReceivableApplyDetails',
    method: 'POST',
  	data:data
  });
}
// 收货
export function getAddReceiveApi(data:Object) {
  return request({
    url:'/api/ToolApply/Receive',
    // url: '/api/ToolReceive/AddReceive',
    method: 'POST',
  	data:data
  });
}
// 收貨記錄
export function getQueryReceiveRecordApi(data:Object) {
  return request({
    url: '/api/ToolApply/QueryReceiveRecord',
    method: 'POST',
  	data:data
  });
}

