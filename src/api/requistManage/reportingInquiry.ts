import request from '/@/utils/request';
// 查询
export function getToolApplyHeadPageApi(data:Object) {
  return request({
    url: '/api/ToolApply/ToolApplyHeadPage',
    method: 'POST',
  	data:data
  });
}