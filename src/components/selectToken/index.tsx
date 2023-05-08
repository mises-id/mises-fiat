import { ButtonProps, CenterPopup, DotLoading, Image, Input, List } from 'antd-mobile'
import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react'
import './index.less'
import { CheckOutline, DownOutline, SearchOutline } from 'antd-mobile-icons'

import { useRequest } from 'ahooks';

interface Iprops extends ButtonProps {
  tokens?: token[],
  selectTokenAddress?: number,
  setTokenAddress?: Dispatch<SetStateAction<number | undefined>>
}

const SelectTokens: FC<Iprops> = (props) => {
  const [searchName, setsearchName] = useState('')
  const tokenList = useCallback(
    () => {
      if (props.tokens) {
        const getTokenList = props.tokens.filter(val => {
            if (searchName && val) {
              const regex = new RegExp(searchName.split('').join('|'))
              return regex.test(val.crypto.toLocaleLowerCase())
            }
            return val
          })
        const findAllNameList = getTokenList.filter(val=>val?.crypto?.toLocaleLowerCase() === searchName)
        return findAllNameList.length > 0 ? findAllNameList : getTokenList
      }
      return []
    },
    [props.tokens, searchName],
  )

  const findToken = useCallback(
    () => {
      if (props.selectTokenAddress && props.tokens) {
        return props.tokens && props.tokens.find(val=>props.selectTokenAddress === val.id)
      }
    },
    [props.selectTokenAddress, props.tokens],
  )

  const SelectedToken = () => {
    const token = findToken()
    return <div className='token-item flex'>
      <div className="flex items-center">
        <Image
          width={24}
          height={24}
          src={token?.networkLogo}
        />
        <span className='symbol'>{token?.crypto}</span>
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
    props.setTokenAddress?.(token?.id)
    setopen(false)
  }
  return <div>
    <div>
      <div onClick={showTokenList}>
        {props.selectTokenAddress ? <SelectedToken /> : <UnSelectedToken />}
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
          <p className='dialog-title'>Select a token</p>
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
            height: window.innerHeight / 2,
            overflow: 'auto'
          }}>
          {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
          {tokenList().map((item,index)=>{
            return <List.Item
              key={index}
              arrow={false}
              onClick={()=>selectToken(item)}
              className={props.selectTokenAddress === item?.id ? 'selected-item' : ''}
              extra={
                <div className='token-balance'>
                  {props.selectTokenAddress === item?.id && <CheckOutline className='selected-icon'/>}
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
                  <div className='networkLogo'>
                    <Image
                      src={item?.logo}
                      style={{ borderRadius: 20 }}
                      fit='cover'
                      width={15}
                      height={15}
                    />
                  </div>
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
export default SelectTokens