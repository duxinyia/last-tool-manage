import request from '/@/utils/request';
// 查询
export function getQueryStoreHouseInfo(data:Object) {
			return request({
				url: '/api/BaseStore/QueryStoreHouseInfo',
				method: 'POST',
        data:data
			});
}
// 新增
export function getAddStoreHouseApi(data:Object) {
  return request({
    url: '/api/BaseStore/AddStoreHouse',
    method: 'POST',
    data:data
  });
}
// 编辑
export function getUpdateStoreHouseApi(data:Object) {
  return request({
    url: '/api/BaseStore/UpdateStoreHouse',
    method: 'POST',
    data:data
  });
}
// 删除
export function getDeleteStoreHouseApi(storeId:string|number) {
  return request({
    url: `/api/BaseStore/DeleteStoreHouse/${storeId}`,
    method: 'POST'
  });
}
// 获取仓库信息
export function getStoreHouseInfoApi(storeId:string|number) {
  return request({
    url: `/api/BaseStore/GetStoreHouseInfo/${storeId}`,
    method: 'GET'
  });
}
// 为仓库新增管理员
export function getAddAdminsToStoreHouseApi(data:Object) {
  return request({
    url: `/api/BaseStore/AddAdminsToStoreHouse`,
    method: 'POST',
    data:data
  });
}
// 删除仓库管理员
export function getRemoveAdminFromStoreHouseApi(data:Object) {
  return request({
    url: `/api/BaseStore/RemoveAdminFromStoreHouse`,
    method: 'POST',
    data:data
  });
}
// 得到仓库管理员信息
export function getAdminsInfosOfStoreHouseApi(storeId:string|number) {
  return request({
    url: `/api/BaseStore/GetAdminsInfosOfStoreHouse`,
    method: 'GET',
    params:{storeId}
  });
}

// 下拉框数据
export function getLegalStoreTypesApi() {
  return request({
    url: '/api/BaseStore/GetLegalStoreTypes',
    method: 'GET',
  
  });
}

