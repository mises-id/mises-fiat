
import "./index.less";
import { rampSDK } from '@alchemy-pay/ramp-sdk';
import { useEffect, useState } from "react";
import { logEvent } from "firebase/analytics";
import { Button, Result } from "antd-mobile";
import { useAnalytics } from "@/hooks/useAnalytics";
import Screen from "@/components/screen";

const Home = () => {
  // Definition Ramp SDK
  const initRamp = () => {
    try {
      const ramp = new rampSDK({
        secret: process.env.REACT_APP_SECRET!, 
        appId: process.env.REACT_APP_APPID!, 
        environment: process.env.REACT_APP_NODE_ENV === 'production' ? 'PROD' : 'TEST',
        containerNode: 'rampView',
        language: 'en-US' 
      });
      ramp.init();
  
      // The callback triggered by the return button after the order payment is successful
      ramp.on('RAMP_WIDGET_CLOSE', () => {
        console.log('running ramp.on')
        gotoTradeHistory(ramp)
      })

      setTimeout(() => {
        console.log('close')
        gotoTradeHistory(ramp)
      }, 10000);
      
      return ramp
    } catch (error: any) {
      if (error.toString().indexOf('[Ramp SDK] =>') > -1) {
        seterror(true)
        logEvent(analytics, 'load_fiat_error',{
          error_message: error?.message || "load_fiat_error" 
        })
      }
    }
    
  }

  const analytics = useAnalytics()
  const [error, seterror] = useState(false)

  const gotoTradeHistory = (ramp: { handleUrl: () => string, close:() => void }) =>{
    logEvent(analytics, 'successful_fiat')
    window.location.reload()
  }
  useEffect(() => {
    logEvent(analytics, 'open_fiat_page')
    initRamp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
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
      <Screen />
    </>
  );
};
export default Home;
