import request from '/@/utils/request';

// 治工具维修清单查询
export function getQueryUselessInventoryApi(data:Object) {
  return request({
    url: '/api/Report/QueryUselessInventory',
    method: 'POST',
  	data:data
  });
}