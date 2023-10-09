import request from '/@/utils/request';

// 治工具验收清单查询
export function getTodosApi() {
  return request({
    url: '/api/HomePage/GetTodos',
    method: 'GET',
  });
}