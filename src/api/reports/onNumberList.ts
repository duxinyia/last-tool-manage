import request from '/@/utils/request';

// 治工具在册数量清单查询
export function getQueryStoredInventoryApi(data:Object) {
  return request({
    url: '/api/Report/QueryStoredInventory',
    method: 'POST',
  	data:data
  });
}