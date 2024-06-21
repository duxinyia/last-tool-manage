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
// 廠商模糊查詢下拉
export function getVendorsApi(vendor:string) {
  return request({
    url: '/api/Material/GetVendors',
    method: 'GET',
  	params:{vendor}
  });
}
// 采购查看送样详情进度
export function getSampleDetailProgressApi(sampleNo:string) {
  return request({
    url: '/api/Material/GetSampleDetailProgress',
    method: 'GET',
  	params:{sampleNo}
  });
}
// 退回
export function getRejectSampleNeedApi(data:Object) {
  return request({
    url: '/api/Material/RejectSampleNeed',
    method: 'POST',
  	data:data
  });
}

