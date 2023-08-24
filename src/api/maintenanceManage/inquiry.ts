import request from '/@/utils/request';
// 查询接口
export function getQueryRepairOrderApi(data:Object) {
  return request({
    url: '/api/ToolRepair/QueryRepairOrder',
    method: 'POST',
  	data:data
  });
}
