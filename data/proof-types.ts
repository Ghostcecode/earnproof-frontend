export type ProofType = {
  id: string;
  name: string;
  description: string;
  status: "available" | "planned";
  category: string;
  requirements: string[];
  estimatedTime: string;
  supportedNetworks: string[];
};

export const proofTypes: ProofType[] = [
  {
    id: "minimum-income",
    name: "Minimum Income",
    description: "Prove your income meets or exceeds a threshold amount without revealing exact earnings or transaction details.",
    status: "available",
    category: "Income Verification",
    requirements: [
      "Stellar testnet wallet with payment history",
      "Qualifying payments within specified period",
      "Minimum threshold amount"
    ],
    estimatedTime: "5-10 minutes",
    supportedNetworks: ["testnet"]
  },
  {
    id: "recurring-income",
    name: "Recurring Income",
    description: "Demonstrate consistent income patterns over multiple periods while maintaining payment privacy.",
    status: "planned",
    category: "Income Verification",
    requirements: [
      "Multiple payment periods",
      "Consistent income sources",
      "Pattern verification"
    ],
    estimatedTime: "Coming soon",
    supportedNetworks: ["testnet"]
  },
  {
    id: "payment-receipt",
    name: "Payment Receipt",
    description: "Verify specific payment transactions without exposing wallet balances or other financial data.",
    status: "planned",
    category: "Transaction Verification",
    requirements: [
      "Specific transaction reference",
      "Payment verification data",
      "Network confirmation"
    ],
    estimatedTime: "Coming soon",
    supportedNetworks: ["testnet"]
  }
];

export function searchProofTypes(types: ProofType[], query: string): ProofType[] {
  if (!query.trim()) {
    return types;
  }

  const searchTerm = query.toLowerCase();
  return types.filter(type =>
    type.name.toLowerCase().includes(searchTerm) ||
    type.description.toLowerCase().includes(searchTerm) ||
    type.category.toLowerCase().includes(searchTerm)
  );
}

export function getProofTypeStats(types: ProofType[]) {
  const available = types.filter(t => t.status === "available").length;
  const planned = types.filter(t => t.status === "planned").length;
  const total = types.length;

  return {
    available,
    planned,
    total
  };
}