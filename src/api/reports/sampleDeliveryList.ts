import request from '/@/utils/request';

// 送样清单查询
export function getQueryMatSampleInventoryApi(data:Object) {
  return request({
    url: '/api/Report/QueryMatSampleInventory',
    method: 'POST',
  	data:data
  });
}
// 獲取一個送樣單的全部詳情
export function getMatSampleDetailsBySampleNoApi(sampleNo:string) {
  return request({
    url: `/api/Report/GetMatSampleDetailsBySampleNo/${sampleNo}`,
    method: 'GET',
  });
}


