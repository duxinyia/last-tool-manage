import request from '/@/utils/request';
// 查询接口
export function getQueryExitPageApi(data: Object) {
	return request({
		url: '/api/Useless/UselessPageList',
		method: 'POST',
		data: data,
	});
}
// 详情接口

export function getUselessDetailApi(UselessNo: string) {
	return request({
		url: '/api/Useless/GetUselessDetail/UselessNo',
		method: 'GET',
		params: { UselessNo },
	});
}
// 送簽
export function getUselessSubmitSignApi(comKey:Object) {
  return request({
    url: '/api/Useless/SubmitSign',
    method: 'POST',
  	data:{comKey}
  });
}