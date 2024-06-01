import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts"

import {
  OverlayV1UniswapV3Market,
} from "../generated/templates/OverlayV1UniswapV3Market/OverlayV1UniswapV3Market"

import {
    Account,
    Balance,
    BalanceOVL,
    CollateralManager,
    Market,
    MarketManifest,
    MarketMonitor,
    Position,
    PricePoint,
    PricePointCount
} from "../generated/schema"

import {
    ZERO_ADDR
} from "./constants"

export function loadMarketManifest(): MarketManifest {

    let manifest = MarketManifest.load('1') 
    if (manifest == null) manifest = new MarketManifest('1')
    return manifest as MarketManifest
  
}
  
export function loadMarketMonitor (market: Address): MarketMonitor {
  
    let monitor = MarketMonitor.load(market.toHexString()) 
    if (monitor == null) monitor = new MarketMonitor(market.toHexString())
    return monitor as MarketMonitor
  
}

export function loadMarket (address: string, block: BigInt = BigInt.fromI32(0)): Market {

  let market = Market.load(address)

  if (market == null) {

    monitorMarket(address)

    market = new Market(address)
    market.created = block
    market.save()

    let monitor = new MarketMonitor(address)
    monitor.save()

  }

  return market as Market

}

function monitorMarket (_market: string): void {

  let marketAddr = Address.fromString(_market)

  let market = OverlayV1UniswapV3Market.bind(marketAddr)

  let manifest = loadMarketManifest()

  let markets = manifest.markets
  let compoundings = manifest.compoundings

  let compounded = market.compounded()
  let compoundPeriod = market.compoundingPeriod()

  markets.push(_market)
  compoundings.push(compounded.plus(compoundPeriod))

  manifest.markets = markets
  manifest.compoundings = compoundings

  manifest.save()

}

export function loadPosition(
    collateralManager: CollateralManager, 
    id: BigInt, 
    market: string = ZERO_ADDR
): Position {

	let positionId = collateralManager.id.concat('-').concat(id.toString())

	let position = Position.load(positionId)

	if (position == null) {

		position = new Position(positionId)

		position.collateralManager = collateralManager.address
    position.market = market
		position.number = id
		position.totalSupply = BigInt.fromI32(0)

    position.save()

    monitorPosition(market, position)

	}

	return position as Position

}

function monitorPosition(market: string, position: Position): void {
  
    let marketAddr = Address.fromString(market)

    let monitor = loadMarketMonitor(marketAddr)

    let positions = monitor.positions

    positions.push(position.id)

    monitor.positions = positions

    monitor.save()

}

export function loadBalance(position: Position, account: Account): Balance {

  let balanceid = position.id.concat('-').concat(account.id);
  let balance = Balance.load(balanceid);

  if (balance == null) {

    balance = new Balance(balanceid);
    balance.position = position.id;
    balance.account = account.id;
    balance.shares = BigInt.fromI32(0)

  }

  return balance as Balance

}

export function loadBalanceOVL(account: Address): BalanceOVL {

  let balance = BalanceOVL.load(account.toHexString());

  if (balance == null) {

    balance = new BalanceOVL(account.toHexString());
    balance.account = account.toHexString();
    balance.balance = BigInt.fromI32(0)
    balance.locked = BigInt.fromI32(0)

  }

  return balance as BalanceOVL

}

export function countPricePoint (market: string): string {

    let count = PricePointCount.load(market)

    if (count == null) count = new PricePointCount(market)

    let number = count.count;

    count.count = number.plus(BigInt.fromI32(1));

    count.save()

    return number.toString()

}

export function loadPricePoint (
    _market: string, 
    _type: string = ""
): PricePoint {

  let market = OverlayV1UniswapV3Market.bind(Address.fromString(_market))

  if (_type == "current") {

    let pricePointId = _market.concat('-current')

    let pricePoint = PricePoint.load(pricePointId)
    if (pricePoint == null) pricePoint = new PricePoint(pricePointId)

    let price = market.pricePointCurrent()


    pricePoint.bid = price.value0
    pricePoint.ask = price.value1
    pricePoint.depth = price.value2

    pricePoint.save()

    return pricePoint

  } else {

    let number = countPricePoint(_market)

    let pricePointId = _market.concat('-').concat(number.toString())

    let pricePoint = new PricePoint(pricePointId)

    pricePoint.number = BigInt.fromString(number)

    return pricePoint

  }

}

const decimals = BigInt.fromI32(10**18).toBigDecimal()

export function morphd (val: BigInt): BigDecimal {

    let decimal = val.toBigDecimal()
  
    return decimal / decimals
  
}

export function loadAccount(address: Address): Account {

  let accountId = address.toHex()
  
  let account = Account.load(accountId)

  if (account == null) {
    
    account = new Account(accountId)
    account.address = address.toHexString()
    account.save()

  }

  return account

}

export function loadCollateralManager(address: Address): CollateralManager {

  let collateralId = address.toHexString()

  let collateralManager = CollateralManager.load(collateralId)

  if (collateralManager == null) {

    collateralManager = new CollateralManager(collateralId)
    collateralManager.address = address.toHexString()
    collateralManager.save()

  }

  return collateralManager

}

export function isCollateral (address: string): boolean {
    let collateral = CollateralManager.load(address)
    return collateral != null
}

export function increment(num: BigInt, amount: BigInt = BigInt.fromI32(1)): BigInt {
    return num.plus(amount)
}

export function decrement(num: BigInt, amount: BigInt = BigInt.fromI32(1)): BigInt {
    return num.minus(amount)
}
