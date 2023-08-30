import request from '/@/utils/request';
// 查询接口
export function getQueryExitPageApi(data:Object) {
  return request({
    url: '/api/Idle/UselessPageList',
    method: 'POST',
  	data:data
  });
}