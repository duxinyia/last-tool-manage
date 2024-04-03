import request from '/@/utils/request';
// 獲取當前用戶管理的bu中的所有料號DRI
export function getAllMatDRIOfBuApi() {
	return request({
		url: '/api/MatDRIManage/GetAllMatDRIOfBu',
		method: 'GET',
	});
}
// 獲取以某人為DRI的料號
export function getMatsOfDRIApi(dri:string) {
	return request({
		url: '/api/MatDRIManage/GetMatsOfDRI',
		method: 'GET',
    params:{dri}
	});
}



