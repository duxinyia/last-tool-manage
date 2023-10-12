import request from '/@/utils/request';
// 下拉框接口
export function getParentIdListApi() {
			return request<parentIdListType[]>({
				url: '/api/BaseData/ParentIdList',
				method: 'GET',
			});
}
// 查询
export function getBaseDaListApi(data:Object) {
  return request({
    url: '/api/BaseData/BaseDaList',
    method: 'POST',
  	data:data
  });
}
// 导出
export function getBaseDownloadApi(runid:Array<string>) {
  return request({
    url: '/api/BaseData/download',
    method: 'POST',
    responseType: 'blob', // 设置响应数据类型为 blob
    data: {
      runid,
    },
  });
}
// 导入表格
export function getImportDataApi(file:any) {
  return request({
    url: '/api/BaseData/UpLoadData',
    method: 'POST',
    headers: {
      "Content-Type": "multipart/form-data",
  },

    data:{
      file
    }
  });
}
// 新增
export function getBaseDaInsertApi(data:Object) {
  return request({
    url: '/api/BaseData/BaseDaInsert',
    method: 'POST',
    data:data
  });
}
// 修改
export function getBaseDaUpdateApi(data:Object) {
  return request({
    url: '/api/BaseData/BaseDaUpdate',
    method: 'POST',
    data:data
  });
}
// 下载模版
export function getDownloadTemplateApi() {
  return request({
    url: `/api/BaseData/DownloadTemplate`,
    method: 'GET',
    responseType: 'blob', // 设置响应数据类型为 blob
    
  });
}
// 删除 批量删除
export function getBaseDaDeleteApi(runid:Array<string>) {
  return request({
    url: '/api/BaseData/BaseDaDelete',
    method: 'DELETE',
    data: {
      runid,
    },
  });
}
