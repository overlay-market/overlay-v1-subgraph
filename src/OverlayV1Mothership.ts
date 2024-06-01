import { BigInt, log } from "@graphprotocol/graph-ts"
import {
  OverlayV1Mothership,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  UpdateCollateral,
  UpdateMarket
} from "../generated/OverlayV1Mothership/OverlayV1Mothership"

import { OverlayV1UniswapV3Market as UniswapV3MarketTemplate } from "../generated/templates"

import { OverlayV1OVLCollateral as OVLCollateralTemplate } from "../generated/templates"

export function handleRoleAdminChanged(event: RoleAdminChanged): void { }

export function handleRoleGranted(event: RoleGranted): void {}

export function handleRoleRevoked(event: RoleRevoked): void {}

export function handleCollateralUpdate (event: UpdateCollateral): void {

  OVLCollateralTemplate.create(event.params.collateral)

}

export function handleMarketUpdate (event: UpdateMarket): void {

  UniswapV3MarketTemplate.create(event.params.market)

}

