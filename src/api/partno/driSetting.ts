import request from '/@/utils/request';

// 查询
export function postMatDRIManageQueryMatsOfUserBuApi(data:Object) {
  return request({
    url: '/api/MatDRIManage/QueryMatsOfUserBu',
    method: 'POST',
  	data:data
  });
}
// 批量更改料號DRI
export function postMatDRIManageChangeMatsDRIApi(data:Object) {
  return request({
    url: '/api/MatDRIManage/ChangeMatsDRI',
    method: 'POST',
  	data:data
  });
}



