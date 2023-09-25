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
