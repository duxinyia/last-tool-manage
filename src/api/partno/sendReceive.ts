import request from '/@/utils/request';

// 查询
export function getMaterialListApi(data:Object) {
  return request({
    url: '/api/Material/QueryPage',
    method: 'POST',
  	data:data
  });
}

