import { Input, InputProps } from 'antd-mobile'
import { FC } from 'react'
import './index.less'
import SelectTokens from '../selectToken'
import { rampType } from '@/pages/fiat'
interface Iprops extends InputProps {
  tokens?: token[],
  type: rampType | 'buycrypto',
  defaultTokenAddress?: number,
  onTokenChange?: (val: number | undefined) => void
}

const TokenInput: FC<Iprops> = (props) => {

  return <div className='token-container'>
    <div className='flex items-center'>
      {props.type !== 'buycrypto' &&
        <Input
          className='token-input flex-1'
          {...props} />
      }

      <SelectTokens
        selectedType={props.type}
        tokens={props.tokens}
        onChange={props.onTokenChange}
        selectTokenAddress={props.defaultTokenAddress} />
    </div>
  </div>
}
export default TokenInput