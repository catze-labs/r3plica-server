const playFabRegisterResponse = {
  PlayFabId: { type: "string" },
  SessionTicket: { type: "string" },
  SettingsForUser: {
    type: "object",
    properties: {
      NeedsAttribution: { type: "boolean" },
      GatherDeviceInfo: { type: "boolean" },
      GatherFocusInfo: { type: "boolean" },
    },
  },
  EntityToken: {
    type: "object",
    properties: {
      EntityToken: { type: "string" },
      TokenExpiration: { type: "string" },
      Entity: {
        type: "object",
        properties: {
          Id: { type: "string" },
          Type: { type: "string" },
          TypeString: { type: "string" },
        },
      },
    },
  },
};

const playFabLoginResponse = {
  SessionTicket: { type: "string" },
  PlayFabId: { type: "string" },
  NewlyCreated: { type: "boolean" },
  SettingsForUser: {
    type: "object",
    properties: {
      NeedsAttribution: { type: "boolean" },
      GatherDeviceInfo: { type: "boolean" },
      GatherFocusInfo: { type: "boolean" },
    },
  },
  LastLoginTime: { type: "string" },
  EntityToken: {
    type: "object",
    properties: {
      EntityToken: { type: "string" },
      TokenExpiration: { type: "string" },
      Entity: {
        type: "object",
        properties: {
          Id: { type: "string" },
          Type: { type: "string" },
          TypeString: { type: "string" },
        },
      },
    },
  },
  TreatmentAssignment: {
    type: "object",
    properties: {
      Variants: { type: "array" },
      Variables: { type: "array" },
    },
  },
};

const linkWalletResponse = {
  test: { type: "string" },
};

const itemTransfer = {
  id: { type: "integer" },
  txHash: { type: "string" },
  item: { type: "object" },
  playFabId: { type: "string" },
  tokenId: { type: "string", nullable: true },
  contractAddress: { type: "string" },
  created: { type: "string", format: "date-time" },
  updated: { type: "string", format: "date-time" },
};

const entitlementTransfer = {
  id: { type: "integer" },
  txHash: { type: "string" },
  entitlement: { type: "object" },
  playFabId: { type: "string" },
  tokenId: { type: "string", nullable: true },
  contractAddress: { type: "string" },
  created: { type: "string", format: "date-time" },
  updated: { type: "string", format: "date-time" },
};

const item = {
  itemName: { type: "string" },
  itemID: { type: "number" },
  id: { type: "number" },
  rdmItemID: { type: "number" },
  state: { type: "number" },
  gainDate: { type: "string" },
  rarity: { type: "string" },
  enchantmentID: { type: "number" },
  enchantmentTierIndex: { type: "number" },
  sockets: { type: "array" },
  isTransferred: { type: "boolean" },
  transfer: { type: "object", properties: itemTransfer, nullable: true },
};

const entitlement = {
  questID: { type: "number" },
  questTitle: { type: "string" },
  description: { type: "string" },
  state: { type: "number", enum: [0, 1, 2, 3, 4] },
  objectives: { type: "array", items: { type: "object" } },
  isTransferred: { type: "boolean" },
  transfer: { type: "object", properties: entitlementTransfer, nullable: true },
};

export const registerApiResponse = {
  status: 200,
  description: "Register user in server and PlayFab",
  schema: {
    properties: playFabRegisterResponse,
  },
};

export const loginApiResponse = {
  status: 200,
  description: "User login",
  schema: {
    properties: playFabLoginResponse,
  },
};

export const linkWalletApiResponse = {
  status: 200,
  description: "Link wallet to user",
  schema: {
    properties: linkWalletResponse,
  },
};

export const inventoryApiResponse = {
  status: 200,
  description: "Get User in-game inventory items",
  schema: {
    type: "object",
    properties: {
      list: {
        type: "array",
        items: {
          type: "object",
          properties: item,
        },
      },
    },
  },
};

export const entitlementsApiResponse = {
  status: 200,
  description: "Get User in-game inventory items",
  schema: {
    type: "object",
    properties: {
      list: {
        type: "array",
        items: {
          type: "object",
          properties: entitlement,
        },
      },
    },
  },
};
