declare module '@alchemy-pay/ramp-sdk' {
  export class rampSDK {
    constructor(options: {
      secret: string,
      appId: string,
      environment: "TEST" | 'PROD',
      containerNode: string,
      language?: 'en-US' | 'es' | 'zh-HK',
      optionalParameter?: {
        crypto: string
      },
      showTable?: string
      redirectUrl?: string
    })
    init: ()=> void
    close: ()=> void
    on(target: string, callback: (params: any)=> void)
    handleUrl: ()=> string
  }
}