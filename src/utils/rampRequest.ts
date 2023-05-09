/*
 * @Author: lmk
 * @Date: 2022-05-05 20:50:25
 * @LastEditTime: 2022-10-14 11:42:19
 * @LastEditors: lmk
 * @Description:
 */
import { Toast } from 'antd-mobile';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { fingerprintId } from '.';
const headers:{[key: string]: string} = {
  'Content-Type': 'application/json'
}

// const isProd = process.env.REACT_APP_NODE_ENV==='production'
// if(istest){
//   headers['Mises-Env'] = 'development'
// }
// const baseURL = isProd ? 'https://api.alb.mises.site/api/v1/' : 'https://api.test.mises.site/api/v1/'
const request = axios.create({
  headers,
  baseURL: 'https://api.alchemypay.org',
  timeout: 10000,
});

// add request interceptors
request.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    if(!config.headers){
      config.headers = {}
    }
    config.headers['fingerprint-id'] = await fingerprintId();
    return config;
  },
  function (error:any) {
    return Promise.reject(error);
  },
);

// add response interceptors
request.interceptors.response.use((response: AxiosResponse) => {
  const { data } = response;
  if (data.returnCode === '0000') return data.data;
  Toast.show(data.returnMsg);
  return Promise.reject(data.data);
});

export default request;
