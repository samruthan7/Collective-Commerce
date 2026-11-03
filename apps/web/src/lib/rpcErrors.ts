const ERRORS: Record<string, string> = {
  UNAUTHENTICATED: "Please log in first.",
  FORBIDDEN: "You are not allowed to do that.",
  NOT_VERIFIED_SELLER: "Your seller account is not verified yet.",
  GROUP_NOT_FOUND: "This group no longer exists.",
  BIDDING_CLOSED: "Bidding is closed for this group.",
  INVALID_TIERS:
    "Tiers must have rising member counts and falling prices, and the first tier must start at or below the group minimum.",
  QUOTE_NOT_FOUND: "You have no active quotation for this group.",
  SELECTION_CLOSED: "Choosing an offer is closed for this group.",
  NOT_MEMBER: "Only group members can choose an offer.",
  OFFER_NOT_FOUND: "That offer is no longer available.",
  SELLER_NOT_FOUND: "Seller not found.",
};

export function friendlyRpcError(message: string): string {
  for (const [code, text] of Object.entries(ERRORS)) {
    if (message.includes(code)) return text;
  }
  console.error("rpc failed:", message);
  return "Something went wrong. Please try again.";
}
