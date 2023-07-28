// 导入jsencrypt
import JSEncrypt from 'jsencrypt/bin/jsencrypt';

// 使用加密
export function encryptData(data:String) {
  const encrypt = new JSEncrypt();  // 创建实例
const pubKey: string = '*****';   // 定义用来加密的一个key（加密钥匙）
encrypt.setPublicKey(pubKey);  // 将 pubKey 设置为 encrypt加密key
const res = encrypt.encrypt(data);  // 返回加密后的一串字符串
}

// 使用解密
export function decryptData(data:String) {
  const encrypt = new JSEncrypt();  // 创建实例
  const privateKey: string = '*****';   // 用来解密的一个key（解密钥匙）
  encrypt.setPrivatekey(privateKey);  // 将 pubKey 设置为 encrypt加密key
  
  const res = encrypt.decrypt(data);  // 返回解密后的数据
}

