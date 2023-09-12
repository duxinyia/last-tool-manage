import request from '/@/utils/request';

// 治工具维修清单查询
export function getQueryRepairInventoryApi(data:Object) {
  return request({
    url: '/api/Report/QueryRepairInventory',
    method: 'POST',
  	data:data
  });
}
