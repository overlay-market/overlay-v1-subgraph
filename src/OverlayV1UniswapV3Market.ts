import { Address, BigDecimal, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts"

import {
  FundingPaid,
  NewPricePoint,
  OverlayV1UniswapV3Market,
  OverlayV1UniswapV3Market__oiResult
} from "../generated/templates/OverlayV1UniswapV3Market/OverlayV1UniswapV3Market"

import {
  OverlayV1OVLCollateral
} from "../generated/templates/OverlayV1OVLCollateral/OverlayV1OVLCollateral"

import {
  loadMarket,
  loadMarketManifest,
  loadMarketMonitor,
  loadPricePoint,
  morphd
} from "./utils"

import {
  Market,
  Position,
  PricePoint
} from "../generated/schema"

export function handleFundingPaid(event: FundingPaid): void { }

export function handleNewPricePoint(event: NewPricePoint): void {

  loadMarket(event.address.toHexString(), event.block.number)

  let pricePoint = loadPricePoint( event.address.toHexString() ) 

  pricePoint.bid = event.params.bid
  pricePoint.ask = event.params.ask
  pricePoint.depth = event.params.depth

  pricePoint.save()

}

export function handleBlock(block: ethereum.Block): void {

  let now = block.timestamp

  let manifest = loadMarketManifest()

  let markets = manifest.markets 
  let compoundings = manifest.compoundings

  for (let i = 0; i < manifest.markets.length; i++) {

    let marketAddr = markets[i]
    let compounding = compoundings[i]

    let marketInstance = OverlayV1UniswapV3Market.bind(Address.fromString(marketAddr))

    let market = loadMarket(marketAddr)

    if (market.created == block.number) continue

    let oiCap = marketInstance.oiCap()

    let oi = marketInstance.oi()

    let currentPrice = loadPricePoint(marketAddr, "current")

    market.oiLong = oi.value0
    market.oiLongShares = oi.value2

    market.oiShort = oi.value1
    market.oiShortShares = oi.value3

    market.oiCap = oiCap

    market.currentPrice = currentPrice.id

    if (now > compounding) {

      // remasterLiquidations(market, currentPrice, oi)

      // compoundings[i] = compounding.plus(market.compoundPeriod)

    }

    market.save()

  }

  manifest.compoundings = compoundings
  manifest.save()

}

function remasterLiquidations (
  market: Market,
  pricePoint: PricePoint,
  oi: OverlayV1UniswapV3Market__oiResult
): void {

  let marketAddr = Address.fromString(market.id) 

  let monitor = loadMarketMonitor(marketAddr)

  let positions = monitor.positions

  for (let j = 0; j < positions.length; j++) {

    let position = Position.load(positions[j]) as Position

    let collateralManager = OverlayV1OVLCollateral.bind(Address.fromString(position.collateralManager))

    let marginMaintenance = morphd(collateralManager.marginMaintenance(marketAddr))

    setLiquidationPrice(
      position, 
      pricePoint, 
      oi, 
      marginMaintenance
    ) 

  }

}


function setLiquidationPrice (
  position: Position, 
  pricePoint: PricePoint,
  openInterest: OverlayV1UniswapV3Market__oiResult,
  marginMaintenance: BigDecimal
): void {

  let oi = position.isLong
    ? morphd(openInterest.value0)
    : morphd(openInterest.value1)
 
  let oiShares = position.isLong
    ? morphd(openInterest.value2)
    : morphd(openInterest.value3)

  let liquidationPrice = _liquidationPrice(
    position, 
    pricePoint,
    oi, 
    oiShares, 
    marginMaintenance
  )

  position.liquidationPrice = liquidationPrice

  position.save()

}

function _liquidationPrice (
  position: Position, 
  pricePoint: PricePoint,
  totalOi: BigDecimal, 
  totalOiShares: BigDecimal,
  marginMaintenance: BigDecimal
): BigDecimal {

  let entryPrice = position.isLong
    ? morphd(pricePoint.ask)
    : morphd(pricePoint.bid)

  let oiShares = morphd(position.oiShares)
  let cost = morphd(position.cost)
  let debt = morphd(position.debt)

  // let oi = oiShares * totalOi / totalOiShares;
  // let initialOi = cost + debt;

  // let _oiFrame = ( ( initialOi * marginMaintenance ) + debt ) / oi

  let liquidationPrice = BigInt.fromI32(0).toBigDecimal()

  // if (position.isLong) liquidationPrice = entryPrice * _oiFrame;
  // else liquidationPrice = entryPrice * ( BigInt.fromI32(2).toBigDecimal() - _oiFrame );

  return liquidationPrice
            
}