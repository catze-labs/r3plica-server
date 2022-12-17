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
  "onGoing" = 0,
  "complete" = 1,
  "abandonned" = 2,
  "failed" = 3,
  "turnedIn" = 4,
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
