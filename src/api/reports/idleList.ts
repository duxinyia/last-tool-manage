import request from '/@/utils/request';

// 治工具闲置单查询
export function getQueryIdleInventoryApi(data:Object) {
  return request({
    url: '/api/Report/QueryIdleInventory',
    method: 'POST',
  	data:data
  });
}
