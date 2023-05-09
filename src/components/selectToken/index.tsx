import { ButtonProps, CenterPopup, DotLoading, Image, Input, List } from 'antd-mobile'
import { FC, memo, useEffect, useState } from 'react'
import './index.less'
import { CheckOutline, DownOutline, SearchOutline } from 'antd-mobile-icons'

import { useRequest } from 'ahooks';
import { rampType } from '@/pages/fiat';
import { useMemo } from 'react';

interface Iprops extends ButtonProps {
  tokens?: token[],
  selectTokenAddress?: number,
  selectedType: rampType | 'buycrypto',
  onChange?: (value: number | undefined) => void
}

const SelectTokens: FC<Iprops> = (props) => {
  const [searchName, setsearchName] = useState('')
  const [tokenAddress, setTokenAddress] = useState(props.selectTokenAddress)
  useEffect(() => {
    setTokenAddress(props.selectTokenAddress)
  }, [props.selectTokenAddress])
  
  const tokenList = useMemo(
    () => {
      if (props.tokens) {
        const searchListName = props.selectedType === rampType.buy ? 'currency' : 'crypto'
        const getTokenList = props.tokens.filter(val => {
          if (searchName && val) {
            const regex = new RegExp(searchName.split('').join('|'))
            return regex.test(val[`${searchListName}`].toLocaleLowerCase())
          }
          return val
        })
        const findAllNameList = getTokenList.filter(val => val?.[`${searchListName}`]?.toLocaleLowerCase() === searchName)
        return findAllNameList.length > 0 ? findAllNameList : getTokenList
      }
      return []
    },
    // eslint-disable-next-line 
    [props.tokens, searchName],
  )

  const findToken = useMemo(
    () => {
      if (tokenAddress && props.tokens) {
        return props.tokens && props.tokens.find(val => tokenAddress === val.id)
      }
    },
    [tokenAddress, props.tokens],
  )

  const SelectedToken = () => {
    const token = findToken
    if (props.selectedType === "buycrypto") {
      return <div className='buycrypto-token-item flex items-center justify-between'>
        <div className="flex items-center">
          <Image
            width={24}
            height={24}
            lazy={false}
            src={token?.networkLogo}
          />
          <span className='buycrypto-symbol'>{token?.crypto}</span>
        </div>
        <div className='networkName'>- {token?.networkName}</div>
      </div>
    }
    return <div className='token-item flex'>
      <div className="flex items-center">
        <Image
          width={24}
          height={24}
          lazy={false}
          src={token?.networkLogo}
        />
        <span className='symbol'>{props.selectedType === rampType.sell ? token?.crypto : token?.networkName}</span>
      </div>
      <DownOutline className='downOutline' />
    </div>
  }

  const UnSelectedToken = () => {
    return <div className='un-select-token-item flex'>
      <div>Select token</div>
      <DownOutline className='downOutline' />
    </div>
  }

  const [open, setopen] = useState(false)
  const showTokenList = () => {
    setopen(true)
    setsearchName('')
  }

  const search = async (value: string) => {
    setsearchName(value)
  }

  const { run } = useRequest(search, {
    debounceWait: 350,
    manual: true,
  });

  const selectToken = (token?: token) => {
    setTokenAddress(token?.id)
    setopen(false)
    props.onChange?.(token?.id)
  }

  return <div>
    <div>
      <div onClick={showTokenList}>
        {tokenAddress ? <SelectedToken /> : <UnSelectedToken />}
      </div>

      <CenterPopup
        visible={open}
        closeOnMaskClick
        destroyOnClose
        showCloseButton
        onClose={() => {
          setopen(false)
          setsearchName('')
        }}
        className="dialog-container">
        <div className='dialog-header-container'>
          <p className='dialog-title'>{props.selectedType === rampType.buy ? 'Select country / region' : 'Select token'}</p>
          <div className='search-input-container'>
            <SearchOutline className='search-icon' />
            <Input className='search-input' placeholder='Search name' onChange={run}></Input>
          </div>
        </div>
        {!props.tokens && <DotLoading color='primary' />}
        <List className='token-list-container'
          style={{
            '--border-inner': 'none',
            '--border-bottom': 'none',
            '--border-top': 'none',
            '--padding-right': '4px',
            height: window.innerHeight / 2,
            overflow: 'auto'
          }}>
          {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
          {tokenList.map((item, index) => {
            return <List.Item
              key={index}
              arrow={false}
              onClick={() => selectToken(item)}
              className={tokenAddress === item?.id ? 'selected-item' : ''}
              extra={
                <div className='token-balance'>
                  {tokenAddress === item?.id && <CheckOutline className='selected-icon' />}
                </div>
              }
              prefix={
                <div className='relative'>
                  <Image
                    src={item?.networkLogo}
                    style={{ borderRadius: 20 }}
                    fit='cover'
                    width={36}
                    height={36}
                  />
                  {item.logo && <div className='networkLogo'>
                    <Image
                      src={item.logo}
                      style={{ borderRadius: 20 }}
                      fit='cover'
                      width={15}
                      height={15}
                    />
                  </div>}
                </div>
              }
            >
              <div className='flex items-center'>
                <span className='token-name'>{item?.crypto}</span>
                <span className='network-name'>-{item?.networkName}</span>
              </div>
            </List.Item>
          })}
        </List>
      </CenterPopup>
    </div>
  </div>
}
export default memo(SelectTokens, ((prevProps: Readonly<Iprops>, nextProps: Readonly<Iprops>) => {
  return prevProps.selectedType === nextProps.selectedType
}))

