import request from '/@/utils/request';
// 查询
export function getToolApplyHeadPageApi(data:Object) {
  return request({
    url: '/api/ToolApply/ToolApplyPage',
    method: 'POST',
  	data:data
  });
}
// 点击查看详情页
export function getreqNoApi(data:Object) {
  return request({
    url: '/api/ToolApply/GetReqs/reqNo',
    method: 'GET',
  	params:data
  });
}
// 修改
export function getModifyApplyReqApi(data:Object) {
  return request({
    url: '/api/ToolApply/ModifyApplyReq',
    method: 'POST',
  	data:data
  });
}
// 删除
export function getDeleApplyItemApi(data:Object) {
  return request({
    url: `/api/ToolApply/DeleApplyItem`,
    method: 'DELETE',
    data:data
  });
}


