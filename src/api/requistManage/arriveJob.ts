import request from '/@/utils/request';
// 查询
export function getGetWaitRecievePageListApi(data:Object) {
  return request({
    url: '/api/ToolReceive/GetWaitRecievePageList',
    method: 'POST',
  	data:data
  });
}
// 收货
export function getAddReceiveApi(data:Object) {
  return request({
    url: '/api/ToolReceive/AddReceive',
    method: 'POST',
  	data:data
  });
}
