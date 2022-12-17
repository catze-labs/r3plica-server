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

export const getTransferResponse = {
  description: "Return item, entitlement transfer record",
  status: 200,
  schema: {
    type: "object",
    properties: {
      itemTransfers: {
        type: "array",
        items: { type: "object", properties: itemTransfer },
      },
      entitlementTransfers: {
        type: "array",
        items: { type: "object", properties: entitlementTransfer },
      },
    },
  },
};

export const postTransferResponse = {
  description: "Return item, entitlement transfer record",
  status: 200,
  schema: {
    type: "object",
    properties: {},
  },
};
