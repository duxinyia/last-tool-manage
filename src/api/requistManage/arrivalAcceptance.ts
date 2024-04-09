import request from '/@/utils/request';
// 查询（不用了）
export function getIToolReceivePageListApi(data:Object) {
  return request({
    url:'/api/ToolApply/QueryCheckableApplyReceive',
    // url: '/api/ToolCheck/IToolReceivePageList',
    method: 'POST',
  	data:data
  });
}
// 查詢（新）
export function postToolApplyQueryCheckTaskApi(data:Object) {
  return request({
    url:'/api/ToolApply/QueryCheckTask',
    method: 'POST',
  	data:data
  });
}
// 点击验收得到的数据（没在用了）
export function getReceiveApi(data:object) {
  return request({
    url: '/api/ToolReceive/GetReceive',
    method: 'GET',
  	params:data
  });
}
// 验收
export function getTInsertCheckApi(data:Object) {
  return request({
    url:'/api/ToolApply/ApplyCheck',
    // url: '/api/ToolCheck/InsertCheck',
    method: 'POST',
  	data:data
  });
}
// 重新驗收
export function postToolApplyRecheckApi(data:Object) {
  return request({
    url:'/api/ToolApply/Recheck',
    method: 'POST',
  	data:data
  });
}
// 驗收記錄查询
export function getQueryCheckPageApi(data:Object) {
  return request({
    url:'/api/ToolApply/QueryCheckRecord',
    // url: '/api/ToolCheck/QueryCheckPage',
    method: 'POST',
  	data:data
  });
}
// 送簽（不用了）
export function getSubmitSignApi(comKey:Object) {
  return request({
    url: '/api/ToolCheck/SubmitSign',
    method: 'POST',
  	data:{comKey}
  });
}
// 详情（不用了）
export function getCheckdetailApi(checkNo:Object) {
  return request({
    url: '/api/ToolCheck/GetCheckdetail',
    method: 'GET',
  	params:checkNo
  });
}
// 用於簽核平台的詳情信息
export function getCheckRecordApi(checkNo:Object) {
  return request({
    url: '/api/ToolApply/GetCheckRecord',
    method: 'GET',
  	params:checkNo
  });
}




