// 导入jsencrypt
import JSEncrypt from 'jsencrypt/bin/jsencrypt';

// 使用加密
export function encryptData(data:String) {
  const encrypt = new JSEncrypt();  // 创建实例
const pubKey: string = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvnuBHhh9/Mwi4Z8Ea2IfVc7SJYyKkJT+4m4LBJbgxRVPa+ej1iAvJAJ++1CNfH6oVr6tw/wqEIZybTG7+iPm7SzfoW9eb/LYsLR43zLqriYWy7qAd7S/13zILiAGLUy/h9CDYwoXYaNXanVGe0iJb+NXmg7f4MAEo7rR15QHQ8zDtomPI/Fz9vz+o/xzHqsLVnxZIpn4dlCp+7QtzOePnvEda5xqWk4DNaVV2fr9gwfBFd8MyAP+CyBXLAWpmxinRU6knsLKAlqcbOLNjk2+aPNvH9EWHODKWBuMPpdDwQexD+V3/nOp8c07NzSfwXmlZuRKod9SqVY88Pg1r84WwQIDAQAB';   // 定义用来加密的一个key（加密钥匙）
encrypt.setPublicKey('-----BEGIN PUBLIC KEY-----' +pubKey+'-----END PUBLIC KEY-----');  // 将 pubKey 设置为 encrypt加密key
return encrypt.encrypt(data);  // 返回加密后的一串字符串
}

// 使用解密
export function decryptData(data:String) {
  const encrypt = new JSEncrypt();  // 创建实例
  const privateKey: string = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvnuBHhh9/Mwi4Z8Ea2IfVc7SJYyKkJT+4m4LBJbgxRVPa+ej1iAvJAJ++1CNfH6oVr6tw/wqEIZybTG7+iPm7SzfoW9eb/LYsLR43zLqriYWy7qAd7S/13zILiAGLUy/h9CDYwoXYaNXanVGe0iJb+NXmg7f4MAEo7rR15QHQ8zDtomPI/Fz9vz+o/xzHqsLVnxZIpn4dlCp+7QtzOePnvEda5xqWk4DNaVV2fr9gwfBFd8MyAP+CyBXLAWpmxinRU6knsLKAlqcbOLNjk2+aPNvH9EWHODKWBuMPpdDwQexD+V3/nOp8c07NzSfwXmlZuRKod9SqVY88Pg1r84WwQIDAQAB';   // 用来解密的一个key（解密钥匙）
  encrypt.setPrivatekey(privateKey);  // 将 pubKey 设置为 encrypt加密key
  
  return encrypt.decrypt(data);  // 返回解密后的数据
}

