import request from '/@/utils/request';

// 治工具验收清单查询
export function getQueryApplyCheckInventoryApi(data:Object) {
  return request({
    url: '/api/Report/QueryApplyCheckInventory',
    method: 'POST',
  	data:data
  });
}
// 獲取一個料号的全部詳情
export function getCheckDetailsOfMatApi(matNo:string) {
  return request({
    url: `/api/Report/GetCheckDetailsOfMat/${matNo}`,
    method: 'GET',
  });
}
