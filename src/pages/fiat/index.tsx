
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
import { getCryptoList, getFiatList, quote } from "@/api/ramp";
import BigNumber from "bignumber.js";

const isIos = /(iPhone|iPad)/i.test(navigator.userAgent)

export enum rampType {
  buy = 'Buy',
  sell = 'Sell'
}

const Home = () => {
  const analytics = useAnalytics()
  const [tokens, settokens] = useState<token[]>([])
  const [selectedToken, setselectedToken] = useState<number>()
  const [buyTokens, setbuyTokens] = useState<token[]>([])
  const [selectedBuyToken, setselectedBuyToken] = useState<number>()
  const [fiats, setfiats] = useState<fiat[]>([])

  const [currentType, setcurrentType] = useState<rampType>(rampType.buy)

  const getQuote = async (buyToken: token, fiat?: fiat) =>{
    const data = {
      currency: fiat?.currency,
      country: fiat?.country,
      network: buyToken?.network,
      cryptoName: buyToken?.crypto
    }
    const params = getUrlParmas(rampType.buy, data, fiat?.payMin as unknown as string)
    const res = await quote(params)
    if(res.alpha2 === fiat?.country){
      return res
    }
  }

  const fistTokenChange = async (fiats: fiat[], buyTokens: token[]) => {
    const [fiat] = fiats;
    const [buytoken] = buyTokens
    const res = await getQuote(buytoken, fiat)
    if(res){
      fiats[0].payMin = res.minAmount
      fiats[0].payMax = res.maxAmount
      setfiats([...fiats])
    }
  }

  const initRamp = async () => {
    const cryptoData = await getCryptoList()
    const tokenList = cryptoData.cryptoCurrencyResponse.cryptoCurrencyList
    const sellTokenList = tokenList.filter((val: any) => val.isSell === 1)
    let getAllTokens: token[] = []
    sellTokenList.forEach((element: any) => {
      if (element.sellNetworkList) {
        element.sellNetworkList.forEach((val: token) => {
          val.networkLogo = element.logoUrl
          val.crypto = val.coin
        });
        getAllTokens = [...getAllTokens, ...element.sellNetworkList]
      }
    });
    settokens(getAllTokens)

    let getAllBuyTokens: token[] = []
    const findETH = cryptoData.cryptoCurrencyResponse.sellPopularList.find((val: any) => val.name === 'ETH')
    if (findETH) {
      tokenList.unshift(findETH)
    }
    tokenList.forEach((element: any) => {
      if (element.buyNetworkList) {
        element.buyNetworkList.forEach((val: token) => {
          val.networkLogo = element.logoUrl
          val.crypto = val.coin
        });
        getAllBuyTokens = [...getAllBuyTokens, ...element.buyNetworkList]
      }
    });

    const [findFirst] = getAllBuyTokens
    setselectedBuyToken(findFirst.id)
    setbuyTokens(getAllBuyTokens)

    await getFiatList().then(res => {
      let fiatList: any = [];

      res.forEach((element: any) => {
        const hasFiatForList = fiatList.some((val: any) => val.country === element.country && val.currency === element.currency)
        if (!hasFiatForList) {
          fiatList.push(element)
          return
        }

        if (!isIos && element.payWayName === 'Apple Pay') return;

        const findFiatIndex = fiatList.findIndex((val: any) => val.country === element.country && val.currency === element.currency && val.payWayName !== element.payWayName)

        if (findFiatIndex > -1) {
          const fiat = fiatList[findFiatIndex]
          const isMin = fiat.payMin ? BigNumber(fiat.payMin).comparedTo(element.payMin) : 0;

          if (isMin === 1) {
            fiatList[findFiatIndex] = element
          }
        }
      });
      fiatList = fiatList.map((val: fiat) => {
        const findCountry = cryptoData.worldList.find((item: fiat) => item.alpha2 === val.country)
        if (findCountry) {
          val.networkLogo = findCountry.flag
          val.crypto = val.countryName
          val.networkName = val.currency
          val.id = val.networkName + val.countryName
          return val
        }
        return null
      }).filter((val: fiat) => val)

      const [findFirst] = fiatList
      setfiats(fiatList)
      setselectedToken(findFirst.id)
      fistTokenChange(fiatList, getAllBuyTokens)
    })
  }

  useEffect(() => {
    logEvent(analytics, 'open_fiat_page')
    initRamp()
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

  const getUrlParmas = (type: rampType = rampType.buy, networkParams: {
    cryptoName?: string,
    network?: string
  } & {
    currency?: string,
    country?: string
  }, paramsAmount?: string) => {
    const urlType = type.toLocaleLowerCase()
    let params = `?appId=${process.env.REACT_APP_APPID!}&showtable=${urlType}&type=${urlType}`

    if (type === rampType.sell) {
      const cryptoName = networkParams?.cryptoName
      const network = networkParams?.network
      const ciphertext = encrypt({
        cryptoAmount: paramsAmount || amount
      })

      if (ciphertext) {
        const urlEncodeText = encodeURIComponent(ciphertext)
        const urlParams = formatUrlParams({
          sign: urlEncodeText,
          cryptoAmount: paramsAmount || amount,
          crypto: cryptoName,
          network: network
        })
        params += urlParams
      }
    } else {
      const fiat = networkParams?.currency
      const country = networkParams?.country
      const buyToken = buyTokens.find(val => val.id === selectedBuyToken)
      const urlParams = formatUrlParams({
        fiatAmount: paramsAmount || amount,
        fiat,
        country,
        network: networkParams.network || buyToken?.network,
        crypto: networkParams.cryptoName || buyToken?.crypto
      })
      params += urlParams
    }
    return params
  }

  const navTo = (type: rampType = rampType.buy, networkParams: {
    cryptoName?: string,
    network?: string
  } & {
    currency?: string,
    country?: string
  }) => {
    const url = process.env.REACT_APP_NODE_ENV === 'production' ? 'https://ramp.alchemypay.org/' : 'https://ramptest.alchemypay.org/';
    const params = getUrlParmas(type, networkParams)
    console.log(`${url}${params}`)
    window.location.href = `${url}${params}`
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
    const isMax = max ? BigNumber(value).comparedTo(max) : 0
    const isMin = min ? BigNumber(min).comparedTo(value) : 0
    return {
      isMin: isMin === 1,
      isMax: isMax === 1
    }
  }

  const getInputChange = (val: string) => {
    if (val) {
      const value = val.replace(/[^\d^.?]+/g, "")?.replace(/^0+(\d)/, "$1")?.replace(/^\./, "0.")?.match(/^\d*(\.?\d{0,6})/g)?.[0] || "";
      setamount(value)

      if (value === '0' || Number(value) === 0) {
        seterrorMessage('')
        return
      }
      if (currentType === rampType.sell) {
        let message = ''
        const token: token | undefined = currentTokenItem
        const { isMin, isMax } = getMaxOrMin(value, token?.maxSell, token?.minSell)

        if (isMin) {
          message = `Minimum selling amount ${token?.minSell} ${token?.crypto}.`
        }

        if (isMax) {
          message = `Maximum selling amount ${token?.maxSell} ${token?.crypto}.`
        }

        seterrorMessage(message)
      } else {
        const token = currentTokenItem as unknown as fiat
        let message = ''
        const { isMin, isMax } = getMaxOrMin(value, token?.payMax, token?.payMin)

        if (isMin) {
          message = `The minimum transaction amount is ${token?.currency}${token?.payMin.toFixed()}.`
        }

        if (isMax) {
          message = `The maximum transaction amount is ${token?.currency}${token?.payMax}.`
        }

        seterrorMessage(message)
      }

    } else {
      setamount('')
      seterrorMessage('')
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

  const createOrder = () => {
    const params = currentTokenItem

    if (params) {
      const data = currentType === rampType.sell ? {
        cryptoName: params.crypto,
        network: params.network
      } : {
        currency: params.currency,
        country: params.country
      }
      navTo(currentType, data)
    }

  }

  const getTokenChange = (val: number | undefined) => {
    if (val) {
      setselectedToken(val)
      setamount('')
      seterrorMessage('')
      if(currentType === rampType.buy){
        (async ()=>{
          const fiatIndex = fiats.findIndex(fiat => fiat.id === val as unknown as string);
          const token = buyTokens.find(token=> token.id === selectedBuyToken)
          if(fiatIndex > -1 && token){
            const res = await getQuote(token, fiats[fiatIndex])
            if(res){
              fiats[fiatIndex].payMin = res.minAmount
              fiats[fiatIndex].payMax = res.maxAmount
              setfiats([...fiats])
            }
          }
        })()
      }
    }
  }

  const setcurrentRampType = (val: rampType) => {
    setcurrentType(val)
    const [findFirst] = (val === rampType.sell ? tokens : fiats) as unknown as token[]
    setselectedToken(findFirst.id)
  }

  const getBuyTokenChange = (val: number | undefined) => {
    if (val) {
      setselectedBuyToken(val)
      setamount('')
      seterrorMessage('')
      const token = buyTokens.find(item=>item.id === val)
      if(token) {
        (async ()=>{
          const res = await getQuote(token, currentTokenItem)
          if(res){
            const selectTokenIndex = tokens.findIndex((val: token) => val.id === selectedToken)
            if(selectTokenIndex > -1){
              fiats[selectTokenIndex].payMin = res.minAmount
              fiats[selectTokenIndex].payMax = res.maxAmount
              setfiats([...fiats])
            }
          }
          
        })()
      }
    }
  }


  return (
    <>
      <div className="nav-page">
        <Header />
        <div className="sell-container">
          <p className="sell-title">
            <span className={currentType === rampType.buy ? 'active' : ''} onClick={() => setcurrentRampType(rampType.buy)}>Buy</span>
            <span className={currentType === rampType.sell ? 'active' : ''} onClick={() => setcurrentRampType(rampType.sell)}>Sell</span>
          </p>

          {!selectedToken && <Skeleton animated className="custom-skeleton" />}
          {selectedToken && <div>
            {currentType === rampType.buy && <div className="select-token">
              <p className="token-to-buy-title">Token to buy</p>
              <TokenInput
                className="buycrypto"
                type='buycrypto'
                onTokenChange={getBuyTokenChange}
                tokens={buyTokens}
                defaultTokenAddress={selectedBuyToken} />
            </div>}
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
