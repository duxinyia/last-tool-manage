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