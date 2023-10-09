import request from '/@/utils/request';
// 查询
export function getQuerySampleNeedsApi(MatNo:string) {
  return request({
    url: '/api/Material/QuerySampleNeeds',
    method: 'GET',
  	params:{MatNo}
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