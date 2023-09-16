import request from '/@/utils/request';

// 治工具维修清单查询
export function getQueryDrawInventoryApi(data:Object) {
  return request({
    url: '/api/Report/QueryDrawInventory',
    method: 'POST',
  	data:data
  });
}