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
// 单条删除
export function getRemoveGroupMemberApi(GroupType:number,UserId:string) {
  return request({
    url: `/api/Group/RemoveGroupMember`,
    method: 'DELETE',
    params:{
      GroupType,UserId
    }
  });
}
// 批量删除
export function getRemoveGroupMemberBatchApi(groupType:number,userIds:Array<string>) {
  return request({
    url: `/api/Group/RemoveGroupMemberBatch`,
    method: 'DELETE',
    data:{
      groupType,userIds
    }
  });
}