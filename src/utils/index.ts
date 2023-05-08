/**
 * 获取设备指纹id
 * fingerprint - 设备指纹 ｜ 设备唯一id
 * @url https://dashboard.fingerprint.com
 */
import Fingerprint2 from 'fingerprintjs2';
import { AES_Encrypt } from './encryp';
import sha1 from 'js-sha1';
export function fingerprintId(): Promise<string> {
  return new Promise(resolve => {
    return Fingerprint2.get((components)=> {
      const values = components.map((component, index)=> {
        if (index === 0) {
          //把微信浏览器里UA的wifi或4G等网络替换成空,不然切换网络会ID不一样
          return component.value.replace(/\bNetType\/\w+\b/, '');
        }
        return component.value;
      });
      let id = Fingerprint2.x64hash128(values.join(''), 31);
      window.localStorage.setItem('fingerprint_id', AES_Encrypt(id));
      resolve(AES_Encrypt(id));
    });
  });
}



export function getMerSign(appId: string, appSecret: string, timestamp: number) {
  return sha1(appId + appSecret + String(timestamp));
}