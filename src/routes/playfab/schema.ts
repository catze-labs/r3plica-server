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

const achievementTransfer = {
  id: { type: "integer" },
  txHash: { type: "string" },
  achievement: { type: "object" },
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

const achievement = {
  questID: { type: "number" },
  questTitle: { type: "string" },
  description: { type: "string" },
  state: { type: "number", enum: [0, 1, 2, 3, 4] },
  objectives: { type: "array", items: { type: "object" } },
  isTransferred: { type: "boolean" },
  transfer: { type: "object", properties: achievementTransfer, nullable: true },
};

export const registerApiResponse = {
  status: 200,
  description: "Register user in server and PlayFab",
  schema: {
    properties: playFabRegisterResponse,
    example: {
      PlayFabId: "71C1D74D171B9959",
      SessionTicket:
        "71C1D74D171B9959-428981242E65B591-E8C661C7955F6F40-C329F-8DAE8A41B265959-fseDcmCapPUIxLDgSTpCjPLRJ8Dh/ulLsdJO1qR3t7g=",
      SettingsForUser: {
        NeedsAttribution: false,
        GatherDeviceInfo: true,
        GatherFocusInfo: true,
      },
      EntityToken: {
        EntityToken:
          "NHxJSTFib3FTdkFYa3JGZkc1dzV1cGcyYjVpMUUyazNwc1VGUzhWSURNY3E4PXx7ImkiOiIyMDIyLTEyLTI4VDA3OjIxOjE1LjQxMjUxNDVaIiwiaWRwIjoiUGxheUZhYiIsImUiOiIyMDIyLTEyLTI5VDA3OjIxOjE1LjQxMjUxNDVaIiwidGlkIjoiMTFmZTU3MWM1MDBiNDYzYmE3NzRlMTNjYWFhZTAwMWYiLCJpZGkiOiI3MUMxRDc0RDE3MUI5OTU5IiwiaCI6IkVGNUUyQjA1MDIzMEZEMDEiLCJlYyI6InRpdGxlX3BsYXllcl9hY2NvdW50ITQyODk4MTI0MkU2NUI1OTEvQzMyOUYvNzFDMUQ3NEQxNzFCOTk1OS9FOEM2NjFDNzk1NUY2RjQwLyIsImVpIjoiRThDNjYxQzc5NTVGNkY0MCIsImV0IjoidGl0bGVfcGxheWVyX2FjY291bnQifQ==",
        TokenExpiration: "2022-12-29T07:21:15.412Z",
        Entity: {
          Id: "E8C661C7955F6F40",
          Type: "title_player_account",
          TypeString: "title_player_account",
        },
      },
      txHash:
        "0x198001f700cea99a5f7bf46e3c2cdd2b9f78d412fe50905c05c65c877a969cf4",
    },
  },
};

export const loginApiResponse = {
  status: 200,
  description: "User login",
  schema: {
    properties: playFabLoginResponse,
  },
};

export const itemsApiResponse = {
  status: 200,
  description: "Get User in-game items",
  schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: item,
        },
      },
    },
  },
};

export const achievementsApiResponse = {
  status: 200,
  description: "Get User in-game inventory items",
  schema: {
    type: "object",
    properties: {
      achievements: {
        type: "array",
        items: {
          type: "object",
          properties: achievement,
        },
      },
    },
  },
};
