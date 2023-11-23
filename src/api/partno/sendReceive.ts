import request from '/@/utils/request';

// 查询（不分页，暂时无参数）
export function GetRecieveTaskApi(data:Object) {
  return request({
    url: '/api/Material/GetRecieveTask',
    method: 'POST',
    data:data
  });
}
// 点击送样获取送样弹窗表格详情
export function GetSampleDetailApi(sampleNo:string) {
  return request({
    url: '/api/Material/GetSampleDetail',
    method: 'get',
    params:{sampleNo}
  });
}
// 确认收货
export function SampleRecieveApi(data:Object) {
  return request({
    url: '/api/Material/SampleRecieve',
    method: 'POST',
    data:data
  });
}

