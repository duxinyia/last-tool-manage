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
export function getSubmitDraftApi(data:Object) {
  return request({
    // url: '/api/ToolApply/ToolApplyInsert',
    url: '/api/ToolApply/SubmitDraft',
    method: 'POST',
    data:data,
  });
}
// 保存
export function getCreateOrUpdateDraftApi(data:Object) {
  return request({
    url: '/api/ToolApply/CreateOrUpdateDraft',
    method: 'POST',
  	data:data
  });
}
// 請購單記錄查詢接口
export function getQueryApplyRecordApi(data:Object) {
  return request({
    url: '/api/ToolApply/QueryApplyRecord',
    method: 'POST',
  	data:data
  });
}
// 點擊詳情按鈕
export function getApplyRecordDetailApi(reqNo:string) {
  return request({
    url: '/api/ToolApply/GetApplyRecordDetail',
    method: 'GET',
    params:{reqNo}
  });
}
// 刪除草稿

export function getDeleteDraftApi(reqNo:string) {
  return request({
    url: `/api/ToolApply/DeleteDraft/${reqNo}`,
    method: 'DELETE',
  });
}
// 详情业务进度
export function getProgressOfApplyRecordDetailApi(applyDetailId:string) {
  return request({
    url: '/api/ToolApply/GetProgressOfApplyRecordDetail',
    method: 'GET',
    params:{applyDetailId}
  });
}


