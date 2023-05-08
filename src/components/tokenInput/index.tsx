import { Input, InputProps } from 'antd-mobile'
import { FC, useEffect, useState } from 'react'
import './index.less'
import SelectTokens from '../selectToken'
interface Iprops extends InputProps {
  tokens?: token[],
  type: 'from' | 'to',
  defaultTokenAddress?: number,
  onTokenChange?: (val: number | undefined) => void
}

const TokenInput: FC<Iprops> = (props) => {
  const [tokenAddress, setTokenAddress] = useState(props.defaultTokenAddress)

  useEffect(() => {
    props.onTokenChange?.(tokenAddress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress])
  
  return <div className='token-container'>
    <div className='flex items-center'>
       <Input
        className='token-input flex-1'
        {...props} />
        <SelectTokens 
        tokens={props.tokens} 
        selectTokenAddress={tokenAddress} 
        setTokenAddress={setTokenAddress}/>
    </div>
  </div>
}
export default TokenInput