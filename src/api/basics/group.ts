import request from '/@/utils/request';

// 查询
export function getGroupListApi(data:Object) {
  return request({
    url: '/api/Group/QueryPage',
    method: 'POST',
  	data:data
  });
}
// 新增
export function getAddGroupMemberApi(data:Object) {
  return request({
    url: '/api/Group/AddGroupMember',
    method: 'POST',
    params:data
  });
}
// 删除 批量删除
export function getRemoveGroupMemberApi(runid:Array<string>) {
  return request({
    url: '/api/Group/RemoveGroupMember',
    method: 'DELETE',
    data: {
      runid,
    },
  });
}