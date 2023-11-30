import request from '/@/utils/request';

// 上传文件
export function getUploadFileApi(funcType:number,file:any) {
  return request({
    url: '/api/File/UploadFile',
    method: 'POST',
    headers: {
      "Content-Type": "multipart/form-data",
  },
    params:{
      funcType
    },
    data:{
      file
    }
  });
}
// 拿到工程验收人接口
export function getEngieerGroupApi(userId:string) {
  return request({
    url: '/api/Group/GetEngieerGroup',
    method: 'GET',
  	params:{userId}
  });}
  // 仓库类型下拉框数据
export function getLegalStoreTypesApi() {
  return request({
    url: '/api/BaseStore/GetLegalStoreTypes',
    method: 'GET',
  
  });
}
// 不分页查询仓库位置模糊查询下拉
export function getQueryStoreHouseNoPageApi(storeType: string,sLocation:string) {
	return request({
		url: '/api/BaseStore/QueryStoreHouseNoPage',
		method: 'GET',
		params: {storeType,sLocation},
	});
}
// 仓库类型下拉框数据(不含閒置倉)
export function getLegalStoreTypesExceptIdleStoreApi() {
  return request({
    url: '/api/BaseStore/GetLegalStoreTypesExceptIdleStore',
    method: 'GET',
  
  });
}
// 不分页查询仓库位置模糊查询下拉(不含閒置倉)
export function getQueryStoreHouseExceptIdleStoreNoPageApi(storeType: string,sLocation:string) {
	return request({
		url: '/api/BaseStore/QueryStoreHouseExceptIdleStoreNoPage',
		method: 'GET',
		params: {storeType,sLocation},
	});
}
// 根據工號拿姓名
export function getUserNameApi(userId: string) {
	return request({
		url: '/api/User/GetUserName',
		method: 'GET',
		params: {userId},
	});
}
// 導入
export function getImportApplyDetailsApi(file:any) {
  return request({
    url: '/api/ToolApply/ImportApplyDetails',
    method: 'POST',
    headers: {
      "Content-Type": "multipart/form-data",
  },

    data:{
      file
    }
  });
}
