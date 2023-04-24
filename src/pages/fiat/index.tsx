
import "./index.less";
import { rampSDK } from '@alchemy-pay/ramp-sdk';
import { useEffect, useState } from "react";
import { logEvent } from "firebase/analytics";
import { Button, Result, Toast } from "antd-mobile";
import { useAnalytics } from "@/hooks/useAnalytics";

const Home = () => {
  const config: {
    secret: string,
    appId: string,
    environment:  "TEST" | 'PROD'
  } = process.env.REACT_APP_NODE_ENV === 'production' ? {
    secret: '4Yn8RkxDXN71Q3p0', 
    appId: 'f83Is2y7L425rxl8', 
    environment: 'PROD'
  } : {
    secret: '4Yn8RkxDXN71Q3p0', 
    appId: 'f83Is2y7L425rxl8', 
    environment: 'TEST'
  }
  // Definition Ramp SDK
  const initRamp = () => {
    return new rampSDK({
      ...config,
      containerNode: 'rampView',
      language: 'en-US' 
    });
  }

  const analytics = useAnalytics()
  const [error, seterror] = useState(false)

  const gotoTradeHistory = (ramp: { handleUrl: () => any; }) =>{
    logEvent(analytics, 'successful_fiat')
    const iframe = document.querySelector('iframe')
      if(iframe){
        iframe.src = `${ramp.handleUrl()}#/tradeHistory`
      }else{
        Toast.show('Unknown Failed')
      }
  }

  useEffect(() => {
    logEvent(analytics, 'open_fiat_page')
    try {
      const ramp = initRamp()
      ramp.init();

      // The callback triggered by the return button after the order payment is successful
      ramp.on('RAMP_WIDGET_CLOSE', () => {
        gotoTradeHistory(ramp)
      })

      window.addEventListener('message', res=>{
        if(res.origin === 'https://ramptest.alchemypay.org'){
          gotoTradeHistory(ramp)
        }
      })

    } catch (error: any) {
      if (error.toString().indexOf('[Ramp SDK] =>') > -1) {
        seterror(true)
        logEvent(analytics, 'load_fiat_error',{
          error_message: error?.message || "load_fiat_error" 
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="container">
      {/* <div className="top-bar">
        <div className="header">
          <NavBar backArrow={false}>Pay</NavBar>
        </div>
      </div> */}
      {error && <div>
        <Result
          status="error"
          title="Error"
          description="Init failed, please try again"
        />
        <div className="flex items-center justify-center" onClick={()=>window.location.reload()}>
          <Button color='primary' fill='none'>Refresh Page</Button>
        </div>
      </div>}
      {!error && <div id="rampView"></div>}
    </div>
  );
};
export default Home;
