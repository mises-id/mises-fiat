// interface token {
//   [key: string]: {
//     "symbol": string,
//     "name": string,
//     "address": `0x${string}`,
//     "decimals": number,
//     "logoURI": string
//   }
// }
interface token {
  id: string,
  crypto: string,
  networkName: string,
  logo: string,
  networkLogo: string
  coin: string
  network: string,
  maxPurchaseAmount: number,
  maxSellAmount: number,
  minPurchaseAmount: number,
  minSellAmount: number,
  currency: string,
  icon: string
}

interface fiat {
  icon: string
  id: string,
  crypto: string,
  networkName: string,
  logo: string,
  networkLogo: string
  coin: string
  network: string,
  payMin: number,
  payMax: number,
  country: string,
  countryName: string,
  currency: string,
  payWayName: string,
  payWayCode: string,
  alpha2: string
}
