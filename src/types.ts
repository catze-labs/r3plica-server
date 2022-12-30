import { achievementTransfer, itemTransfer } from "@prisma/client";

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

export enum AchievementState {
  "ON_GOING" = 0,
  "COMPLETE" = 1,
  "ABANDONED" = 2,
  "FAILED" = 3,
  "TURNED_IN" = 4,
}

export type UserAchievement = {
  questID: number;
  questTitle: string;
  description: string;
  state: AchievementState;
  objectives: any[];
};

export interface UserItemWrapper extends UserItem {
  isTokenized: boolean;
  isTransferred: boolean;
  transfer?: itemTransfer;
}

export interface UserAchievementWrapper extends UserAchievement {
  isTokenized: boolean;
  isTransferred: boolean;
  transfer?: achievementTransfer;
}
