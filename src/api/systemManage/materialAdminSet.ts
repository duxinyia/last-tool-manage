import request from '/@/utils/request';

//获取BU列表
export function getBuMatManagerBUsApi() {
	return request({
		url: '/api/BuMatManager/GetBUs',
		method: 'GET',
	});
}
// 新增BU
export function postBuMatManagerCreateBuApi(buCode:string) {
  return request({
    url: '/api/BuMatManager/CreateBu',
    method: 'POST',
  	params:{buCode}
  });
}
// 刪除bu
export function deleteBuMatManagerApi(buCode:string) {
	return request({
		url: `/api/BuMatManager/DeleteBu/${buCode}`,
		method: 'DELETE',
	});
}
// 獲取bu的料號管理員
export function getBuMatManagerGetMatManagersOfBuApi(buCode:string) {
	return request({
		url: `/api/BuMatManager/GetMatManagersOfBu/${buCode}`,
		method: 'GET',
	});
}
// 為bu添加料號管理員
export function postBuMatManagerAddMatManagersToBuBuApi(data:object) {
  return request({
    url: '/api/BuMatManager/AddMatManagersToBu',
    method: 'POST',
  	data:data
  });
}
// 刪除bu料號管理員
export function deleteRemoveBuMatManagersApi(data:object) {
	return request({
		url: `/api/BuMatManager/RemoveBuMatManagers`,
		method: 'DELETE',
    data:data
	});
}
