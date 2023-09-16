import request from '/@/utils/request';
// 查询
export function getQuerySampleNeedsApi(MatNo:string) {
  return request({
    url: '/api/Material/QuerySampleNeeds',
    method: 'GET',
  	params:{MatNo}
  });
}