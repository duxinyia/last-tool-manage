import request from '/@/utils/request';
// 查询
export function getIToolReceivePageListApi(data:Object) {
  return request({
    url: '/api/ToolCheck/IToolReceivePageList',
    method: 'POST',
  	data:data
  });
}
// 点击验收得到的数据
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
    url: '/api/ToolCheck/InsertCheck',
    method: 'POST',
  	data:data
  });
}
// 驗收記錄查询
export function getQueryCheckPageApi(data:Object) {
  return request({
    url: '/api/ToolCheck/QueryCheckPage',
    method: 'POST',
  	data:data
  });
}
// 送簽
export function getSubmitSignApi(comKey:Object) {
  return request({
    url: '/api/ToolCheck/SubmitSign',
    method: 'POST',
  	data:{comKey}
  });
}
// 详情
export function getCheckdetailApi(checkNo:Object) {
  return request({
    url: '/api/ToolCheck/GetCheckdetail',
    method: 'GET',
  	params:checkNo
  });
}



