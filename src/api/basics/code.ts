import request from '/@/utils/request';
// 查询
export function getSearchBaseMachine(data:Object) {
			return request({
				url: '/api/BaseMachineProcject/SearchBaseMachine',
				method: 'POST',
        data:data
			});
}
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
// 删除
export function getBaseMachineDeleteApi(runId:Array<string>) {
  return request({
    url: '/api/BaseMachineProcject/BaseMachineDelete',
    method: 'DELETE',
    data: {
      runId,
    },
  });
}
// 批量刪除
export function getDeleteBaseMachineBatchApi(ids:Array<string>) {
  return request({
    url: '/api/BaseMachineProcject/DeleteBaseMachineBatch',
    method: 'DELETE',
    data: {
      ids,
    },
  });
}

// 导出
// 下载模版
// 导入
