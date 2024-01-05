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
// 樣品發料記錄
export function getQuerySampleDispatchRecordApi(data:Object) {
  return request({
    url: '/api/Material/QuerySampleDispatchRecord',
    method: 'POST',
  	data:data
  });
}

