const user = {
  playFabId: { type: "string" },
  email: { type: "string", format: "email" },
  walletAddress: { type: "string" },
  created: { type: "string", format: "date-time" },
  updated: { type: "string", format: "date-time" },
};

export const getUserResponse = {
  status: 200,
  description: "Return specific user data according to PlayFab session ticket",
  schema: {
    type: "object",
    properties: user,
  },
};

export const linkWalletApiResponse = {
  status: 200,
  description: "Link wallet to user",
  schema: {
    properties: user,
  },
};
