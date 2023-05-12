
import "./index.less";
// import { rampSDK } from '@alchemy-pay/ramp-sdk';
import { useEffect, useMemo, useState } from "react";
import { logEvent } from "firebase/analytics";
// import { Button, Result } from "antd-mobile";
import { useAnalytics } from "@/hooks/useAnalytics";
import Screen from "@/components/screen";
import { Button, Skeleton } from "antd-mobile";
// eslint-disable-next-line
import crypto from 'crypto-browserify';
import { Buffer } from "buffer";
import TokenInput from "@/components/tokenInput";
import { getFiatList, getTokenList } from "@/api/ramp";
import BigNumber from "bignumber.js";
// import { useRequest } from "ahooks";

const isIos = /(iPhone|iPad)/i.test(navigator.userAgent)

export enum rampType {
  buy = 'Buy',
  sell = 'Sell'
}

const Home = () => {
  const analytics = useAnalytics()
  const [tokens, settokens] = useState<token[]>([])
  const [selectedToken, setselectedToken] = useState<string>()
  const [buyTokens, setbuyTokens] = useState<token[]>([])
  const [selectedBuyToken, setselectedBuyToken] = useState<string>()
  const [selectedSellToken, setselectedSellToken] = useState<string>()
  const [fiats, setfiats] = useState<fiat[]>([])

  const [currentType, setcurrentType] = useState<rampType>(rampType.buy)

  // const getQuote = async (amount: string) =>{
  //   try {
  //     // seterrorMessage('')
  //     const token = currentType === rampType.sell ? tokens.find(token => token.id === selectedToken) : buyTokens.find(token => token.id === selectedBuyToken)
  //     const data = {
  //       crypto: token?.crypto,
  //       network: token?.network,
  //       country: currentTokenItem?.country || 'US',
  //       fiat: currentTokenItem?.currency || 'USD',
  //       amount,
  //       payWayCode: currentTokenItem?.payWayCode,
  //       side: currentType.toLocaleUpperCase()
  //     }
  //     // const params = getUrlParmas(rampType.buy, data, fiat?.payMin as unknown as string)
  //     const res = await quote(data)
  //     // const plus = new BigNumber(res.rampFee).plus(res.networkFee)
  //     // setdisable(false)
  //     console.log(res)
  //   } catch (error: any) {
  //     // seterrorMessage(error)
  //     console.log(error, amount)
  //   }
  //   // if(res.alpha2 === fiat?.country){
  //   //   return res
  //   // }
  // }
  const getLocalSelect = () =>{
    const local = localStorage.getItem("rampParams")
    if(local) return JSON.parse(local)
    return {}
  }
  
  const initSelectList = async (val: string = "USD") => {
    const cryptoData = await getTokenList(val)

    const sellList = cryptoData.filter((val: any) => val.sellEnable === 1).map((val: token) => {
      val.id = `${val.network}-${val.crypto}`
      return val
    })

    // select token for sell
    settokens(sellList)

    const buyList = cryptoData.filter((val: any) => val.buyEnable === 1).map((val: token) => {
      val.id = `${val.network}-${val.crypto}`
      return val
    })
    
    // select token for buy
    setbuyTokens(buyList)
    const localSelect = getLocalSelect()
    const findBtc = buyList.find((val: token) => val.network === "BTC" && val.crypto === 'BTC') || buyList[0]
    if (findBtc) setselectedBuyToken(localSelect.buyToken || findBtc.id)
  }

  const initFiatList = async () => {
    const fiatData = await getFiatList()
    let fiatList: any = [];

    fiatData.forEach((element: any) => {
      const hasFiatForList = fiatList.some((val: any) => val.country === element.country && val.currency === element.currency)

      if (!hasFiatForList) {
        fiatList.push(element)
        return
      }

      if ((!isIos && element.payWayName === 'Apple Pay') || element.payMin === 0 || element.payMax === 0) return;

      const findFiatIndex = fiatList.findIndex((val: any) => val.country === element.country && val.currency === element.currency && val.payWayName !== element.payWayName)
      if (findFiatIndex > -1) {
        const fiat = fiatList[findFiatIndex]
        const isMin = fiat.payMin ? BigNumber(fiat.payMin).comparedTo(element.payMin) : 0;

        if (isMin === 1) {
          fiatList[findFiatIndex] = element
        }
        const isMax = fiat.payMax ? BigNumber(element.payMax).comparedTo(fiat.payMax) : 0;

        if(isMax === 1){
          fiatList[findFiatIndex].payMax = element.payMax
        }
      }
    });
    fiatList = fiatList.map((val: fiat) => {
      val.crypto = val.countryName
      val.network = val.currency
      val.id = `${val.network}-${val.crypto}`
      val.icon = `https://static.alchemypay.org/alchemypay/flag/${val.country}.png`
      return val
    }).filter((val: fiat) => val.countryName)

    const findUs = fiatList.find((val: fiat) => val.country === 'US') || fiatList[0]
    const localSelect = getLocalSelect()

    if (findUs) {
      setselectedToken(localSelect[currentType] || findUs.id)
      setselectedSellToken(localSelect.sellFiatToken ||findUs.id)
      // fistTokenChange(fiatList, getAllBuyTokens)
    }
    setfiats(fiatList)
  }

  useEffect(() => {
    logEvent(analytics, 'open_fiat_page')
    const localSelect = getLocalSelect()
    const currency = localSelect[currentType]?.split('-')[0]
    initFiatList()
    initSelectList(currency)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatUrlParams = (params: any) => {
    let urlParams = '';

    for (const key in params) {
      const element = params[key]

      urlParams += `&${key}=${element}`
    }

    return urlParams
  }

  const encrypt = (params: any) => {
    try {
      const secretKeyData = process.env.REACT_APP_SECRET!
      const plainTextData = Buffer.from(
        formatUrlParams({
          appId: process.env.REACT_APP_APPID!,
          ...params
        }).replace('&', ''),
        'utf8');
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

  const Header = () => {
    return <div className="header">
      <div className="header-container flex justify-between items-center">
        <div>
          <span className="company-name">Mises</span>
          <span className="feature-name">Ramp</span>
        </div>
      </div>
    </div>
  }

  const tokenList = useMemo(
    () => currentType === rampType.buy ? fiats : tokens,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentType, fiats, tokens],
  )

  const currentTokenItem = useMemo(
    (): token & fiat | undefined => {
      const getTokenList: any = tokenList
      return getTokenList.find((val: token | fiat) => val.id === selectedToken)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedToken],
  )

  const [amount, setamount] = useState('')
  const [errorMessage, seterrorMessage] = useState('');
  const getMaxOrMin = (value: string, max?: number, min?: number,) => {
    const isMax = max ? BigNumber(value).comparedTo(max) : -1
    const isMin = min ? BigNumber(min).comparedTo(value) : -1
    return {
      isMin: [1].includes(isMin) || false,
      isMax: [1].includes(isMax) || false
    }
  }
  const getInputChange = (val: string) => {
    if (val) {
      const value = val.replace(/[^\d^.?]+/g, "")?.replace(/^0+(\d)/, "$1")?.replace(/^\./, "0.")?.match(/^\d*(\.?\d{0,8})/g)?.[0] || "";
      setamount(value)

      if (value === '0' || Number(value) === 0) {
        return
      }

      if (currentType === rampType.sell) {
        let message = ''
        const token = currentTokenItem
        const { isMin, isMax } = getMaxOrMin(value, token?.maxSellAmount, token?.minSellAmount)
        
        if (isMin) {
          message = `Minimum selling amount ${token?.minSellAmount} ${token?.crypto}.`
        }

        if (isMax) {
          message = `Maximum selling amount ${token?.maxSellAmount} ${token?.crypto}.`
        }

        seterrorMessage(message)
      } else {
        let message = ''
        const token = buyTokens.find(token => token.id === selectedBuyToken)
        const findFiat = fiats.find(val=>val.id === currentTokenItem?.id)

        let maxNumber = token?.maxPurchaseAmount
        let minNumber = token?.minPurchaseAmount

        if(findFiat){
          const isMin = BigNumber(findFiat.payMin).comparedTo(token?.minPurchaseAmount || 0);
          const isMax = BigNumber(findFiat.payMax).comparedTo(token?.maxPurchaseAmount || 0);

          console.log(token, findFiat, isMax, isMin)
          if(isMin === 1) minNumber = BigNumber(findFiat.payMin || 0).plus((findFiat.payMin || 0) * 0.01).toNumber()
          if(isMax === 1) maxNumber = token?.maxPurchaseAmount
        }

        const { isMin, isMax } = getMaxOrMin(value, maxNumber, minNumber)

        if (isMin) {
          message = `The minimum transaction amount is ${currentTokenItem?.currency}${minNumber}.`
        }

        if (isMax) {
          message = `The maximum transaction amount is ${currentTokenItem?.currency}${maxNumber}.`
        }

        seterrorMessage(message)
      }

    } else {
      setamount('')
      seterrorMessage('')
    }
  }

  const getUrlParmas = (type: rampType = rampType.buy) => {
    const urlType = type.toLocaleLowerCase()
    let params = `?appId=${process.env.REACT_APP_APPID!}&showtable=${urlType}&type=${urlType}`

    if (type === rampType.sell) {
      const sellToken = fiats.find(val => val.id === selectedSellToken)

      const ciphertext = encrypt({
        cryptoAmount: amount,
        fiat: sellToken?.currency,
      })

      if (ciphertext) {
        const urlEncodeText = encodeURIComponent(ciphertext)
        const urlParams = formatUrlParams({
          sign: urlEncodeText,
          cryptoAmount: amount,
          crypto: currentTokenItem?.crypto,
          network: currentTokenItem?.network,
          fiat: sellToken?.currency,
          country: sellToken?.country,
        })
        params += urlParams
      }
    } else {
      const buyToken = buyTokens.find(val => val.id === selectedBuyToken)
      // const ciphertext = encrypt({
      //   fiatAmount: amount
      // })
      console.log(buyToken, currentTokenItem)
      // if (ciphertext) {
        // const urlEncodeText = encodeURIComponent(ciphertext)
        const urlParams = formatUrlParams({
          // sign: urlEncodeText,
          fiatAmount: amount,
          fiat: currentTokenItem?.currency,
          country: currentTokenItem?.country,
          network: buyToken?.network,
          crypto: buyToken?.crypto
        })
        params += urlParams
      // }

    }
    return params
  }

  const createOrder = () => {
    const url = 'https://ramp.alchemypay.org/'
    const params = getUrlParmas(currentType)
    console.log(`${url}${params}`)
    // window.open(`${url}${params}`, '_blank')
    window.location.href = `${url}${params}`
  }
  const saveSelect = (params: any) => {
    let getLocal: any = localStorage.getItem('rampParams')
    if(getLocal){
      getLocal = JSON.parse(getLocal)
      getLocal = {
        ...getLocal, 
        ...params
      }
      localStorage.setItem('rampParams', JSON.stringify(getLocal))
    }else{
      localStorage.setItem('rampParams', JSON.stringify(params))
    }
  }

  const getTokenChange = (val: string | undefined) => {
    if (val) {
      setselectedToken(val)
      setamount('')
      seterrorMessage('')
      saveSelect({
        [`${currentType}`]: val
      })
      if (currentType === rampType.buy) {
        const currentTokens: any = tokenList
        const token = currentTokens.find((item: token) => item.id === val)
        initSelectList(token?.currency)
        setselectedSellToken(val)
      }
    }
  }

  const setcurrentRampType = (val: rampType) => {
    setcurrentType(val)
    if(selectedSellToken && val === rampType.buy){
      setselectedToken(selectedSellToken)
    }else {
      const localSelect = getLocalSelect()
      const findItem = val === rampType.sell ? tokens.find((val: token) => val.network === "BTC" && val.crypto === 'BTC') || tokens[0] : fiats.find((val: fiat) => val.country === 'US') || fiats[0]
      if (findItem) setselectedToken(localSelect[val] || findItem.id)
      setselectedSellToken(selectedToken)
    }
    setamount('')
    seterrorMessage('')
  }

  const getBuyTokenChange = (val: string | undefined) => {
    if (val) {
      setselectedBuyToken(val)
      setamount('')
      seterrorMessage('')
      saveSelect({
        buyToken: val
      })
    }
  }

  const getFiatTokenChange = (val: string | undefined) => {
    if (val) {
      setselectedSellToken(val)
      setamount('')
      seterrorMessage('')
      const currentTokens: any = fiats
      const token = currentTokens.find((item: token) => item.id === val)
      initSelectList(token?.currency)
      setselectedSellToken(val)
      saveSelect({
        sellFiatToken: val,
        Buy: val
      })
    }
  }

  const isDisabled = useMemo(
    () => {
      if (amount === '' || !amount || amount === '0' || Number(amount) === 0 || errorMessage) {
        // Toast.show('Please enter the amount')
        return true
      }
      return false
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [amount],
  )

  return (
    <>
      <div className="nav-page">
        <Header />
        <div className="sell-title">
          <span className={currentType === rampType.buy ? 'active' : ''} onClick={() => setcurrentRampType(rampType.buy)}>Buy</span>
          <span className={currentType === rampType.sell ? 'active' : ''} onClick={() => setcurrentRampType(rampType.sell)}>Sell</span>
          <div className="dot" style={{left: currentType === rampType.buy ? '5px': 'calc(50% - 5px)'}}></div>
        </div>
        <div className="sell-container">
          <p className="token-to-buy-title">{currentType === rampType.buy ? 'Token to buy' : 'Fiat to receive'}</p>
          {!selectedToken && <Skeleton animated className="custom-skeleton" />}
          {selectedToken && <div>
            <div className="toInput">
              {currentType === rampType.buy ?
                (
                  selectedBuyToken ?
                    <TokenInput
                      className="buycrypto"
                      type='buycrypto'
                      onTokenChange={getBuyTokenChange}
                      tokens={buyTokens}
                      defaultTokenAddress={selectedBuyToken} />
                    :
                    <Skeleton animated className="custom-skeleton" />
                ) : (
                  selectedSellToken ?
                    <TokenInput
                      className="buycrypto"
                      type='sellcrypto'
                      onTokenChange={getFiatTokenChange}
                      tokens={fiats as unknown as token[]}
                      defaultTokenAddress={selectedSellToken} />
                    :
                    <Skeleton animated className="custom-skeleton" />
                )
              }
            </div>
            <TokenInput
              type={currentType}
              onChange={getInputChange}
              value={amount}
              onTokenChange={getTokenChange}
              tokens={tokenList as token[]}
              placeholder='0'
              defaultTokenAddress={selectedToken}
              pattern='^[0-9]*[.,]?[0-9]*$'
              inputMode='decimal' />

          </div>}
          {errorMessage && <div className="erorr-message">{errorMessage}</div>}
          <Button block disabled={isDisabled} shape="rounded"
            onClick={createOrder} style={{
              "backgroundImage": 'linear-gradient(to right, #5D61FF 30%, #19B1F1)',
              '--text-color': 'white',
              'height': 45,
              marginTop: 20
            }}>
            <span>
              {currentType} Crypto
            </span>
          </Button>
        </div>
      </div>
      <Screen />
    </>
  );
};
export default Home;
