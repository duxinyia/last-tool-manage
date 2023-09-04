import request from '/@/utils/request';
// 料号接口comkey
export function getMaterialApi(matNo:any) {
			return request({
				url: '/api/Material/GetMaterial',
				method: 'GET',
			  params:{matNo}
			});
}