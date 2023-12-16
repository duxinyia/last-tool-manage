import request from '/@/utils/request';
// 查询
export function getQueryDispatchableCheckDetailsApi(data:Object) {
  return request({
    url: '/api/Material/QueryDispatchableCheckDetails',
    method: 'POST',
  	data:data
  });
}
// 樣品發料
export function getSampleDispatchApi(data:Object) {
  return request({
    url: '/api/Material/SampleDispatch',
    method: 'POST',
  	data:data
  });
}
