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
} from "../generated/OverlayV1OVLCollateral/OverlayV1OVLCollateral"
import {
  OverlayV1UniswapV3Market,
  FundingPaid,
  NewPrice
} from "../generated/OverlayV1UniswapV3Market/OverlayV1UniswapV3Market"

import { 
  Account,
  Balance,
  CollateralManager,
  Position
} from "../generated/schema"

import {
  constants,
  events,
  integers,
  transactions,
} from '@amxx/graphprotocol-utils';

function getCollateralManager(address: Address): CollateralManager {

  let collateralId = address.toHex()

  let collateralManager = CollateralManager.load(collateralId)

  if (collateralManager == null) {

    collateralManager = new CollateralManager(collateralId)
    collateralManager.address = address
    collateralManager.save()

  }

  return collateralManager

}

function getAccount(address: Address): Account {

  let accountId = address.toHex()
  
  let account = Account.load(accountId)

  if (account == null) {
    
    account = new Account(accountId)
    account.address = address
    account.save()

  }

  return account

}

function getPosition(collateralManager: CollateralManager, id: BigInt): Position {
	let positionId = collateralManager.id.concat('-').concat(id.toHex())
	let position = Position.load(positionId)
	if (position == null) {
		position = new Position(positionId)
		position.collateralManager  = collateralManager.address
		position.number             = id
		position.totalSupply        = constants.BIGINT_ZERO
	}
	return position as Position
}

function getBalance(position: Position, account: Account): Balance {

  let balanceid = position.id.concat('-').concat(account.id);
  let balance = Balance.load(balanceid);
  if (balance == null) {
    balance = new Balance(balanceid);
    balance.position = position.id;
    balance.account = account.id;
    balance.value = constants.BIGINT_ZERO;
  }

  return balance as Balance

}

export function handleApprovalForAll(event: ApprovalForAll): void { }

export function handleBuild(event: Build): void { }

export function handleLiquidate(event: Liquidate): void {}

function registerTransfer(
	collateral:   CollateralManager,
  position:     Position,
	from:         Account,
	to:           Account,
	value:        BigInt
) : void {

	if (from.id == constants.ADDRESS_ZERO) {

		position.totalSupply = integers.increment(position.totalSupply, value)

	} else {

		let balance = getBalance(position, from)
		balance.value = integers.decrement(balance.value, value)
		balance.save()

	}

	if (to.id == constants.ADDRESS_ZERO) {

		position.totalSupply = integers.decrement(position.totalSupply, value)

	} else {

		let balance = getBalance(position, to)
		balance.value = integers.increment(balance.value, value)
		balance.save()

	}

	position.save()

}


export function handleTransferBatch(event: TransferBatch): void { 

}

export function handleTransferSingle(event: TransferSingle): void {

  let collateralManager = getCollateralManager(event.address)
  let from              = getAccount(event.params.from)
	let to                = getAccount(event.params.to)

  log.info("\n\ncollateral manager: {}\n\n", [collateralManager.id])

  log.info("\n\nfrom: {}\n\n", [from.id])

  log.info("\n\nto: {}\n\n", [to.id])

}

export function handleURI(event: URI): void {}

export function handleUnwind(event: Unwind): void {}

export function handleUpdate(event: Update): void {}

export function handleFundingPaid(event: FundingPaid): void {}

export function handleNewPrice(event: NewPrice): void {}