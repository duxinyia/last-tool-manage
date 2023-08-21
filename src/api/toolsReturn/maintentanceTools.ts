import request from '/@/utils/request';

// 点击料号获取信息
export function getMaterialDetailApi(matNo: string) {
	return request({
		url: '/api/Material/GetMaterial/Get',
		method: 'GET',
		params: { matNo },
	});
}
