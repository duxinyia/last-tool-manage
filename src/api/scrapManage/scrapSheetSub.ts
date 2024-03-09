import request from '/@/utils/request';
// 查询接口
export function getQueryExitPageApi(data:Object) {
  return request({
    url: '/api/Stock/QueryExitPage',
    method: 'POST',
  	data:data
  });
}
// 报废
export function getUselessBackStockApi(data:Object) {
  return request({
    url: '/api/Useless/UselessBackStock',
    method: 'POST',
  	data:data
  });
}
//获取報廢单草稿
export function getUselessDraftApi() {
	return request({
		url: '/api/UselessDraft/Get',
		method: 'GET',
	});
}
// 创建報廢单草稿
export function getUselessDraftCreateApi(data: Object) {
	return request({
		url: '/api/UselessDraft/Create',
		method: 'POST',
		data: data,
	});
}
// 更新報廢单草稿
export function getUselessDraftUpdateApi(data: Object) {
	return request({
		url: '/api/UselessDraft/Update',
		method: 'POST',
		data: data,
	});
}
// 重置報廢單草稿
export function getUselessDraftDeleteApi() {
	return request({
		url: '/api/UselessDraft/Delete',
		method: 'DELETE',
	});
}