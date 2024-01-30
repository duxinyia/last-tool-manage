import request from '/@/utils/request';
// 料号接口comkey
export function getMaterialApi(matNo:any) {
			return request({
				url: '/api/Material/GetMaterial',
				method: 'GET',
			  params:{matNo}
			});
}
//簽核平台查看料號信息的接口
export function getMatSignInfoApi(comkey:any) {
	return request({
		url: '/api/Material/GetMatSignInfo',
		method: 'GET',
		params:{comkey}
	});
}
//获取料号修改签核信息
export function getMatModifySignInfoApi(comkey:any) {
	return request({
		url: '/api/Material/GetMatModifySignInfo',
		method: 'GET',
		params:{comkey}
	});
}
