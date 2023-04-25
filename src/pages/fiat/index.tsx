
import "./index.less";
import { rampSDK } from '@alchemy-pay/ramp-sdk';
import { useEffect, useState } from "react";
import { logEvent } from "firebase/analytics";
import { Button, FloatingBubble, Image, Result } from "antd-mobile";
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

  const gotoTelegram = ()=> window.open('https://t.me/+2KK5JivrORwzODg1', 'target=_blank')
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
      <FloatingBubble
        style={{
          '--initial-position-bottom': '20vh',
          '--initial-position-right': '5px',
          '--edge-distance': '5px',
          "--size": '48px',
          '--background': 'none'
        }}
        onClick={gotoTelegram}
      >
        <Image src="/images/question.jpg" width={48} height={48} lazy={false} />
      </FloatingBubble>
    </>
  );
};
export default Home;
