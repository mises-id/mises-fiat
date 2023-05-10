// import { getMerSign } from "@/utils";
import { getMerSign } from "@/utils";
import request from "@/utils/rampRequest";

export function getTokenList(fiat: string ='USD'): Promise<any>{
  const timestamp = new Date().getTime()
  const appId =  process.env.REACT_APP_APPID!
  return request({
    url:'/merchant/crypto/list',
    params:{
      fiat
    },
    headers: {
      appId,
      timestamp,
      sign: getMerSign(appId, process.env.REACT_APP_SECRET!, timestamp)
    }
  })
}

export function getCryptoList(): Promise<any> {
  const appId = process.env.REACT_APP_APPID!
  return request({
    url: '/crypto/buy/v2',
    params: {
      appId
    }
  })
}

export function getFiatList(): Promise<any> {
  const appId = process.env.REACT_APP_APPID!
  const timestamp = new Date().getTime()
  return request({
    url: '/merchant/fiat/list',
    headers: {
      appId,
      timestamp,
      sign: getMerSign(appId, process.env.REACT_APP_SECRET!, timestamp)
    }
  })
}

export function quote(data: any): Promise<any> {
  const appId = process.env.REACT_APP_APPID!
  const timestamp = new Date().getTime()
  return request({
    url: `/merchant/order/quote`,
    method: 'post',
    headers: {
      appId,
      timestamp,
      sign: getMerSign(appId, process.env.REACT_APP_SECRET!, timestamp)
    },
    data: data
  })
}