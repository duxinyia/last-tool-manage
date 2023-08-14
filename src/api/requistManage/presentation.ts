import request from '/@/utils/request';

// 输入料号获取信息
export function getQueryNoPageApi(matNo:string) {
  return request({
    url: '/api/Material/QueryNoPage',
    method: 'GET',
  	params:{matNo}
  });
}
// 提交
export function getToolApplyHeadInsertApi(data:Object) {
  return request({
    url: '/api/ToolApply/ToolApplyHeadInsert',
    method: 'POST',
  	data:data
  });
}
