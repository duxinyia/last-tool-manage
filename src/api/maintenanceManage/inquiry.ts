import request from '/@/utils/request';
// 查询接口
export function getQueryRepairOrderApi(data:Object) {
  return request({
    url: '/api/ToolRepair/QueryRepairOrder',
    method: 'POST',
  	data:data
  });
}
// 点击维修单号得到详情接口
export function getRepairDetailsApi(repairNo:string) {
  return request({
    url: `/api/ToolRepair/GetRepairDetails/${repairNo}`,
    method: 'GET',
  });
}
// 导出
export function getRepairDownloadApi(repairNo:Array<string>) {
  return request({
    url: '/api/Export/Repair',
    method: 'POST',
    responseType: 'blob', // 设置响应数据类型为 blob
    data: repairNo,
  });
}
