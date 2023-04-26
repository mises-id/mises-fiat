import { Button, CenterPopup, Image, Swiper } from 'antd-mobile'
import React, { FC, useEffect, useState } from 'react'
import './index.less'
interface Iprops {
  close?: ()=> void
}

const Screen:FC<Iprops> = (props) => {
  const [open, setopen] = useState(false)
  useEffect(() => {
    const isFirstLoad = localStorage.getItem('isFirstLoad')
    if (!isFirstLoad) {
      setopen(true)
      localStorage.setItem('isFirstLoad', 'true')
    }else{
      props.close?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const screenList = [{
    description: `Buy and sell cryptocurrencies easily and 
    quickly`,
    url: '1@2x.png'
  }, {
    description: `Support mainstream payment methods 
    including credit cards, debit cards.
      E-wallets, etc.`,
    url: '2@2x.png'
  }, {
    description: `Viewable transaction history and 
    progress in "Menu-Transactions" (a 
      complete transaction may take several 
      minutes)`,
    url: '3@2x.png'
  },]
  const items = screenList.map((item, index) => (
    <Swiper.Item key={index}>
      <div>
        <p className='item-desc'>{item.description}</p>
        <div className='flex items-center justify-center image-box'>
          <Image
              width="100%"
              src={`images/${item.url}`}
          />
        </div>
      </div>
    </Swiper.Item>
  ))
  return (
    <CenterPopup
      visible={open}
      closeOnMaskClick
      destroyOnClose
      showCloseButton
      onClose={()=>{
        setopen(false)
        props.close?.()
      }}
      className="screen-container">
      <p className='screen-title'>Crypto Ramp</p>
      <div className='screen-content'>
        <Swiper>
          {items}
        </Swiper>
        <Button type="button" color='primary' shape='rounded' block className='apply-btn' onClick={()=>{
          setopen(false)
          props.close?.()
        }}>Apply Now</Button>
      </div>
    </CenterPopup>
  )
}
export default Screen