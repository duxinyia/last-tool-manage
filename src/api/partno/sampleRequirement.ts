import request from '/@/utils/request';
// 查询
export function getQuerySampleNeedsApi(data:Object) {
  return request({
    url: '/api/Material/QuerySampleNeeds',
    method: 'POST',
  	data:data
  });
}
// 获取送样单已有的厂商信息
export function getSampleDetailsForTakeSampleApi(sampleNo:string) {
  return request({
    url: '/api/Material/GetSampleDetailsForTakeSample',
    method: 'GET',
  	params:{sampleNo}
  });
}
// 採購送樣記錄查詢
export function getQueryTakeSampleApi(data:Object) {
  return request({
    url: '/api/Material/QueryTakeSample',
    method: 'POST',
  	data:data
  });
}
