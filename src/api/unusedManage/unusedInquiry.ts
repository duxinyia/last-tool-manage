import request from '/@/utils/request';
import {LocationQueryValue} from 'vue-router'
// 闲置查询
export function IdleQueryPageListApi(data: Object) {
	return request({
		url: '/api/Idle/IdleQueryPageList',
		method: 'POST',
		data: data,
	});
}
// 闲置详情
export function GetIdleDetailApi(IdleNo: string|LocationQueryValue | LocationQueryValue[] ) {
	return request({
		url: '/api/Idle/GetIdleDetail/IdleNo',
		method: 'GET',
		params: { IdleNo },
	});
}
// 送簽
export function getIdleSubmitSignApi(comKey:Object) {
  return request({
    url: '/api/Idle/SubmitSign',
    method: 'POST',
  	data:{comKey}
  });
}
