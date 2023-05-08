
import "./index.less";
// import { rampSDK } from '@alchemy-pay/ramp-sdk';
import { useCallback, useEffect, useState } from "react";
import { logEvent } from "firebase/analytics";
// import { Button, Result } from "antd-mobile";
import { useAnalytics } from "@/hooks/useAnalytics";
import Screen from "@/components/screen";
import { Button, Skeleton } from "antd-mobile";
// eslint-disable-next-line
import crypto from 'crypto-browserify';
import { Buffer } from "buffer";
import TokenInput from "@/components/tokenInput";
import { getCryptoList } from "@/api/ramp";
import BigNumber from "bignumber.js";
const Home = () => {
  const analytics = useAnalytics()
  const [tokens, settokens] = useState<token[]>([])
  const [defaultTokenAddress, setdefaultTokenAddress] = useState<number>()
  useEffect(() => {
    logEvent(analytics, 'open_fiat_page')
    // navTo('sell')
    getCryptoList().then((res: any)=>{
      const tokenList = res.cryptoCurrencyResponse.cryptoCurrencyList.filter((val: any)=>val.isSell === 1)

      let getAllTokens:token[] = []
      tokenList.forEach((element: any) => {
        element.sellNetworkList.forEach((val: token) => {
          val.networkLogo = element.logoUrl
          val.crypto = val.coin
        });
        getAllTokens = [...getAllTokens, ...element.sellNetworkList]
      });

      settokens(getAllTokens)
      
      const [findFirst] = getAllTokens
      setdefaultTokenAddress(findFirst.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatUrlParams = (params: any) => {
    let urlParams = '';

    for (const key in params) {
      const element = params[key]

      urlParams+=`&${key}=${element}`
    }

    return urlParams
  }

  const encrypt = (cryptoAmount: string)=>{
    try {
      const secretKeyData = process.env.REACT_APP_SECRET!
      const plainTextData = Buffer.from(
        formatUrlParams({
          appId: process.env.REACT_APP_APPID!,
          cryptoAmount: cryptoAmount
        }).replace('&', ''), 
      'utf8');
      console.log(formatUrlParams({
        cryptoAmount: cryptoAmount,
        appId: process.env.REACT_APP_APPID!
      }).replace('&', ''))
      const secretKey = Buffer.from(secretKeyData, 'utf8');
      const iv = secretKeyData.substring(0, 16);
      const cipher = crypto.createCipheriv('aes-128-cbc', secretKey, iv);
  
      let encrypted = cipher.update(plainTextData);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
  
      return encrypted.toString('base64');
    } catch (e: any) {
      console.log(`AES encrypting exception, msg is ${e.toString()}`);
    }
    return null;
  }

  const navTo = (type: 'buy'| 'sell' = 'buy', networkParams?: {
    cryptoName: string,
    network: string
  }) => {
    const url = process.env.REACT_APP_NODE_ENV !== 'production' ? 'https://ramp.alchemypay.org/' : 'https://ramptest.alchemypay.org/';
    let params = `?appId=${process.env.REACT_APP_APPID!}&showtable=${type}&type=${type}`

    if(type === 'sell') {
      const cryptoName = networkParams?.cryptoName
      const network = networkParams?.network
      const ciphertext = encrypt(amount)
      
      if(ciphertext){
        const urlEncodeText = encodeURIComponent(ciphertext)
        const urlParams = formatUrlParams({
          sign: urlEncodeText,
          cryptoAmount: amount,
          crypto: cryptoName,
          network: network
        })
        params+=urlParams
      }
    }
    // console.log(`${url}${params}`)
    window.location.href = `${url}${params}`
  }

  const Header = ()=>{
    return <div className="header">
      <div className="header-container flex justify-between items-center">
        <div>
          <span className="company-name">Mises</span>
          <span className="feature-name">Ramp</span>
        </div>
        <div>
          <Button color="primary" onClick={() => navTo('buy')} fill="outline" shape="rounded" size="mini" >
            On Ramp
          </Button>
        </div>
      </div>
    </div>
  }
  const getTokenItem = useCallback(
    (): token | undefined => {
      return tokens.find(val=>val.id === defaultTokenAddress)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultTokenAddress],
  )
  
  const [amount, setamount] = useState('')
  const [errorMessage, seterrorMessage] = useState('');
  
  const getInputChange = (val: string) => {
    if(val){
      const value = val.replace(/[^\d^\.?]+/g, "")?.replace(/^0+(\d)/, "$1")?.replace(/^\./, "0.")?.match(/^\d*(\.?\d{0,6})/g)?.[0] || "";
      setamount(value)

      if(value === '0' || Number(value) === 0) {
        seterrorMessage('')
        return
      }
      const token = getTokenItem()
      const isMax = token?.maxSell ? BigNumber(value).comparedTo(token.maxSell) : 0
      const isMin = token?.minSell ? BigNumber(token.minSell).comparedTo(value) : 0

      let message = ''
      if(isMin === 1){
        message = `Minimum selling amount ${token?.minSell} ${token?.crypto}.`
      }

      if(isMax === 1){
        message = `Maximum selling amount ${token?.maxSell} ${token?.crypto}.`
      }

      seterrorMessage(message)
    }else{
      setamount('')
      seterrorMessage('')
    }
  }
  const isDisabled = useCallback(
    () => {
      if(amount === '' || !amount || amount === '0' || Number(amount) === 0 || errorMessage) {
        // Toast.show('Please enter the amount')
        return true
      }
      return false
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [amount],
  )
  
  const sell = ()=>{
    const params = getTokenItem()

    if(params){
      navTo('sell', {
        cryptoName: params.crypto,
        network: params.network
      })
    }
    
  }

  const getTokenChange = (val: number | undefined)=>{
    if(val){
      setdefaultTokenAddress(val)
      setamount('')
      seterrorMessage('')
    }
  }

  return (
    <>
      <div className="nav-page">
        <Header />
        <div className="sell-container">
          <p className="sell-title">Off Ramp</p>
          {!defaultTokenAddress && <Skeleton animated className="custom-skeleton" />}
          {defaultTokenAddress && <TokenInput
            type="from"
            onChange={getInputChange}
            onTokenChange={getTokenChange}
            tokens={tokens}
            placeholder='0'
            defaultTokenAddress={defaultTokenAddress}
            pattern='^[0-9]*[.,]?[0-9]*$'
            inputMode='decimal'
            value={amount} />}
            {errorMessage && <div className="erorr-message">{errorMessage}</div>}
            <Button block disabled={isDisabled()} shape="rounded"
              onClick={sell} style={{
                "backgroundImage": 'linear-gradient(to right, #5D61FF 30%, #19B1F1)',
                '--text-color': 'white',
                'height': 45,
                marginTop: 20
              }}>
              <span>
                Sell Crypto
              </span>
              {/* <Image src="/images/arrow_blue@2x.png" width={14} height={12}  className="arrow"/> */}
            </Button>
        </div>
        {/* <Image src="/images/logo@2x.png" width={120} height={73} className="nav-logo" /> */}
        
        {/* <Button block shape="rounded"
          onClick={() => navTo('sell')}
          className="sell-btn" style={{
            "backgroundImage": 'linear-gradient(to right, #5D61FF 30%, #19B1F1)',
            '--text-color': '#0B7DE3',
            'height': 45,
          }}>
          <span>
            Sell Crypto
          </span>
          <Image src="/images/arrow_blue@2x.png" width={14} height={12}  className="arrow"/>
        </Button> */}
      </div>
      <Screen />
    </>
  );
};
export default Home;
