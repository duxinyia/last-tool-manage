import request from '/@/utils/request';
// 查询
export function getMaterialListApi(data:Object) {
  return request({
    url: '/api/Material/QueryPage',
    method: 'POST',
  	data:data
  });
}
// 送样
export function getTakeSampleApi(data:Object) {
  return request({
    url: '/api/Material/TakeSample',
    method: 'POST',
  	data:data
  });
}
// 点击料号信息
export function getGetSampleApi(matNo:string) {
  return request({
    url: '/api/Material/GetSample',
    method: 'GET',
  	params:{matNo}
  });
}
// 新增样品需求
export function getAddSampleNeedsApi(data:Object) {
  return request({
    url: '/api/Material/AddSampleNeeds',
    method: 'POST',
  	data:data
  });
}




