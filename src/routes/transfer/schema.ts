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

export const getTransferHistoryResponse = {
  description: "Return item, achievement transfer records",
  status: 200,
  schema: {
    type: "object",
    properties: {
      itemTransfers: {
        type: "array",
        items: { type: "object", properties: itemTransfer },
      },
      achievementTransfers: {
        type: "array",
        items: { type: "object", properties: achievementTransfer },
      },
    },
  },
};

export const postTransferResponse = {
  description: "Return transfer transaction hash",
  status: 200,
  schema: {
    type: "object",
    properties: {
      txHash: {
        type: "string",
      },
    },
  },
};
