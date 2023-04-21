import { NavBar } from "antd-mobile";
import "./index.less";
import { rampSDK } from '@alchemy-pay/ramp-sdk';
import { useEffect } from "react";

const Home = () => {

  // Definition Ramp SDK
  const initRamp = () => {
    return new rampSDK({
      secret: '<you-secret-key>', // (Required)
      appId: '<your-app-id>', // (Required)
      environment: process.env.REACT_APP_NODE_ENV==='production' ? 'PROD' : 'TEST', // (Required)
      containerNode: 'rampView', // (Required) Dom node id
      language: 'en-US',
      optionalParameter: {
        crypto: "BTC",//指定币种为BTC
      },
    });
  }
  useEffect(() => {
    const ramp = initRamp()
    ramp.init();

    // The callback triggered by the return button after the order payment is successful
    ramp.on('RAMP_WIDGET_CLOSE', () => {
      // Destroy Ramp SDK
      ramp.close()
    })
    // or
    ramp.on('*', (cb: { eventName: string; }) => {
      // Destroy Ramp SDK
      if (cb.eventName === 'RAMP_WIDGET_CLOSE') {
        ramp.close()
      }
    })
  }, [])


  // Initialization Ramp SDK

  return (
    <div className="container">
      <div className="top-bar">
        <div className="header">
          <NavBar backArrow={false}>Pay</NavBar>
        </div>
        <div id="rampView" style={{ width: 350, height: 700 }}></div>
      </div>
    </div>
  );
};
export default Home;
