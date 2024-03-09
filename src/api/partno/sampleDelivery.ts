import request from '/@/utils/request';
// 查询
export function getMaterialListApi(data:Object) {
  return request({
    url: '/api/Material/QueryPage',
    method: 'POST',
  	data:data
  });
}
// 送样(不用了)
export function getTakeSampleApi(data:Object) {
  return request({
    url: '/api/Material/TakeSample',
    method: 'POST',
  	data:data
  });
}
// 保存草稿
export function getSaveTakeSampleApi(data:Object) {
  return request({
    url: '/api/Material/SaveTakeSample',
    method: 'POST',
  	data:data
  });
}
// 提交送樣
export function getSubmitTaskSampleApi(data:Object) {
  return request({
    url: '/api/Material/SubmitTaskSample',
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
// 保存样品需求
export function getAddSampleNeedsApi(data:Object) {
  return request({
    url: '/api/Material/AddSampleNeeds',
    method: 'POST',
  	data:data
  });
}
// 采购人员下拉
export function getPurchaserGroupApi(userId:string) {
  return request({
    url: `/api/Group/GetPurchaserGroup`,
    method: 'GET',
    params:{userId}
  });
}
// 新增樣品需求
export function getSubmitSampleNeedsApi(data:Object) {
  return request({
    url: '/api/Material/SubmitSampleNeeds',
    method: 'POST',
  	data:data
  });
}
// 删除草稿
export function getDeleteSampleNeedsDraftApi(sampleNo:string) {
  return request({
    url: '/api/Material/DeleteSampleNeedsDraft',
    method: 'DELETE',
    params:{sampleNo}
  });
}



