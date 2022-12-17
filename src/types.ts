import { entitlementTransfer, itemTransfer } from "@prisma/client";

export type UserItem = {
  itemName: string;
  itemID: number;
  id: number;
  rdmItemID: number;
  state: number;
  gainDate: string;
  rarity: string;
  enchantmentID: number;
  enchantmentTierIndex: number;
  sockets: any[];
};

export enum EntitlementState {
  "ON_GOING" = 0,
  "COMPLETE" = 1,
  "ABANDONED" = 2,
  "FAILED" = 3,
  "TURNED_IN" = 4,
}

export type UserEntitlement = {
  questID: number;
  questTitle: string;
  description: string;
  state: EntitlementState;
  objectives: any[];
};

export interface UserItemWrapper extends UserItem {
  isTransferred: boolean;
  transfer?: itemTransfer;
}

export interface UserEntitlementWrapper extends UserEntitlement {
  isTransferred: boolean;
  transfer?: entitlementTransfer;
}

export interface ItemTransferRequest {
  playFabId: string;
  walletAddress: string;
  itemId: number;
  itemName: string;
  itemRarity: string;
}

export interface EntitlementTransferRequest {
  playFabId: string;
  walletAddress: string;
  entitlementId: number;
  entitlementTitle: string;
  entitlementDescription: string;
}
