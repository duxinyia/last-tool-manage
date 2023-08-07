import request from '/@/utils/request';

// 新增
export function getBaseMachineAddApi(data:Object) {
  return request({
    url: '/api/BaseMachineProcject/BaseMachineAdd',
    method: 'POST',
    data:data
  });
}
// 编辑
export function getBaseMachineUpdateApi(data:Object) {
  return request({
    url: '/api/BaseMachineProcject/BaseMachineUpdate',
    method: 'POST',
    data:data
  });
}