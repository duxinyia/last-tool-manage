import request from '/@/utils/request';
// 料号下拉框接口
export function getMaterialInputApi() {
			return request({
				url: '/api/Material/GetMaterial/Get',
				method: 'GET',
			
			});
}
// 查询
export function getMaterialListApi(data:Object) {
  return request({
    url: '/api/Material/QueryPage',
    method: 'POST',
  	data:data
  });
}


// 新增
export function getAddMaterialApi(data:Object) {
  return request({
    url: '/api/Material/AddMaterial/Create',
    method: 'POST',
    data:data
  });
}
// 修改
export function getModifyMaterialApi(data:Object) {
  return request({
    url: '/api/Material/ModifyMaterial',
    method: 'POST',
    data:data
  });
}

// 删除 批量删除
export function getInvalidMaterialApi(matNos:Array<string>) {
  return request({
    url: '/api/Material/InvalidMaterial',
    method: 'DELETE',
    data: {
      matNos
    },
  });
}
// 廠區下拉框接口
export function getAreaListApi() {
  return request({
    url: '/api/BaseMachineProcject/GetAreaList',
    method: 'GET',
  });
}
// bu下拉框接口
export function getSelectListApi(data:Object,list:string) {
  return request({
    url: `/api/BaseMachineProcject/${list}`,
    method: 'GET',
    params:data
  });
}
// 提交試產簽核
export function getSubmitTrialSignApi(matNo:string) {
  return request({
    url: '/api/Material/SubmitTrialSign',
    method: 'POST',
    data: {
      matNo
    },
  });
}
// 提交量產簽核
export function getSubmitProduceSignApi(matNo:string) {
  return request({
    url: '/api/Material/SubmitProduceSign',
    method: 'POST',
    data: {
      matNo
    },
  });
}
// 机种模糊查询下拉
export function getMachineTypesApi(machineTypeArg:string) {
  return request({
    url: `/api/BaseMachineProcject/GetMachineTypes`,
    method: 'GET',
    params:{machineTypeArg}
  });
}
// 获取料号下的所有机种
export function getMachineTypesOfMatApi(matNo:any) {
  return request({
    url: `/api/Material/GetMachineTypesOfMat`,
    method: 'GET',
    params:{matNo}
  });
}
// 导出
export function getMatnoDownloadApi(matNo:Array<string>) {
  return request({
    url: '/api/Export/Matno',
    method: 'POST',
    responseType: 'blob', // 设置响应数据类型为 blob
    data: 
      matNo
    ,
  });
}
// 導出更新（最新）
export function getMatnoExportApi(data:EmptyObjectType) {
  return request({
    url: '/api/Export/Mat',
    method: 'POST',
    responseType: 'blob', // 设置响应数据类型为 blob
    data,
  });
}




