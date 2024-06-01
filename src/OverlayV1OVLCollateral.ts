import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts"
import {
  OverlayV1OVLCollateral,
  ApprovalForAll,
  Build,
  Liquidate,
  TransferBatch,
  TransferSingle,
  URI,
  Unwind,
  Update,
} from "../generated/templates/OverlayV1OVLCollateral/OverlayV1OVLCollateral"
import {
  OverlayV1UniswapV3Market,
  FundingPaid,
  NewPricePoint
} from "../generated/templates/OverlayV1UniswapV3Market/OverlayV1UniswapV3Market"

import { 
  Account,
  Balance,
  CollateralManager,
  MarketMonitor,
  Position
} from "../generated/schema"

import {
  decrement,
  increment,
  loadAccount,
  loadBalance,
  loadCollateralManager,
  loadPosition
} from "./utils"

import {
  ZERO_ADDR
} from "./constants"


export function handleApprovalForAll(event: ApprovalForAll): void { }

export function handleBuild(event: Build): void { 

  let collateralManager = loadCollateralManager(event.address)
  let position = loadPosition(collateralManager, event.params.positionId, event.params.market.toHexString())

  let collateralManagerContract = OverlayV1OVLCollateral.bind(event.address)

  let positionStruct = collateralManagerContract.positions(event.params.positionId)

  position.isLong = positionStruct.value1
  position.leverage = positionStruct.value2
  position.pricePoint = event.params.market.toHexString().concat('-')
              .concat(positionStruct.value3.toString())
  position.oiShares = positionStruct.value4
  position.debt = positionStruct.value5
  position.cost = positionStruct.value6

  position.save()

}

export function handleLiquidate(event: Liquidate): void {}

function registerTransfer(
	collateral:   CollateralManager,
  position:     Position,
	from:         Account,
	to:           Account,
	value:        BigInt
) : void {

	if (from.id == ZERO_ADDR) {

		position.totalSupply = increment(position.totalSupply, value)

	} else {

		let balance = loadBalance(position, from)
		balance.shares = decrement(balance.shares, value)
		balance.save()

	}

	if (to.id == ZERO_ADDR) {

		position.totalSupply = decrement(position.totalSupply, value)

	} else {

		let balance = loadBalance(position, to)
		balance.shares = increment(balance.shares, value)
		balance.save()

	}

	position.save()

}


export function handleTransferBatch(event: TransferBatch): void { 

  let collateral = loadCollateralManager(event.address)
  let from = loadAccount(event.params.from)
	let to = loadAccount(event.params.to)

	let ids = event.params.ids
	let values = event.params.values

	for (let i = 0;  i < ids.length; ++i) {

    let position = loadPosition(collateral, ids[i])

		registerTransfer(
      collateral,
      position,
			from,
			to,
			values[i]
		)

	}

}

export function handleTransferSingle(event: TransferSingle): void {

  let collateralManager = loadCollateralManager(event.address)
  let position = loadPosition(collateralManager, event.params.id)
  let from = loadAccount(event.params.from)
	let to = loadAccount(event.params.to)

  registerTransfer(
    collateralManager,
    position,
    from,
    to,
    event.params.value
  )

}

export function handleURI(event: URI): void {}

export function handleUnwind(event: Unwind): void {

  let collateral = loadCollateralManager(event.address)

  let position = loadPosition(collateral, event.params.positionId)

  let collateralInstance = OverlayV1OVLCollateral.bind(event.address)

  let positionStruct = collateralInstance.positions(event.params.positionId)

  position.oiShares = positionStruct.value4
  position.debt = positionStruct.value5
  position.cost = positionStruct.value6

  position.save()

}

export function handleUpdate(event: Update): void {}

export function handleFundingPaid(event: FundingPaid): void {}

export function handleNewPricePoint(event: NewPricePoint): void {}