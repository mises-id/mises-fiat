// import { getMerSign } from "@/utils";
import request from "@/utils/rampRequest";

// export function getCryptoList(): Promise<any>{
//   const timestamp = new Date().getTime()
//   const appId =  process.env.REACT_APP_APPID!
//   return request({
//     url:'/merchant/crypto/list',
//     params:{
//       fiat: 'USD'
//     },
//     headers: {
//       appId,
//       timestamp,
//       sign: getMerSign(appId, process.env.REACT_APP_SECRET!, timestamp)
//     }
//   })
// }

export function getCryptoList(): Promise<any>{
  const appId =  process.env.REACT_APP_APPID!
  return request({
    url:'/crypto/buy/v2',
    params:{
      appId
    }
  })
}