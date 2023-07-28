import request from '/@/utils/request';

export function getParentIdListApi() {
			return request({
				url: '/api/BaseData/ParentIdList',
				method: 'GET',
			
			});
}
export function getBaseDaListApi(data:Object) {
  return request({
    url: '/api/BaseData/BaseDaList',
    method: 'POST',
  	data:data
  });
}
export function getBaseDownloadApi() {
  return request({
    url: '/api/BaseData/download',
    method: 'GET',
    responseType: 'blob', // 设置响应数据类型为 blob
  });
}