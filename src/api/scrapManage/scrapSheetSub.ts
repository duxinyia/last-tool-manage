import request from '/@/utils/request';
// 查询接口
export function getQueryExitPageApi(data:Object) {
  return request({
    url: '/api/Stock/QueryExitPage',
    method: 'POST',
  	data:data
  });
}