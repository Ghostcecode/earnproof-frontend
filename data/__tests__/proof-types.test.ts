import { proofTypes, searchProofTypes, getProofTypeStats } from "../proof-types";

describe("proof-types data", () => {
  describe("proofTypes fixture", () => {
    it("contains exactly three proof types", () => {
      expect(proofTypes).toHaveLength(3);
    });

    it("includes minimum-income as available", () => {
      const minimumIncome = proofTypes.find(pt => pt.id === "minimum-income");
      expect(minimumIncome).toBeDefined();
      expect(minimumIncome?.status).toBe("available");
      expect(minimumIncome?.name).toBe("Minimum Income");
    });

    it("includes recurring-income as planned", () => {
      const recurringIncome = proofTypes.find(pt => pt.id === "recurring-income");
      expect(recurringIncome).toBeDefined();
      expect(recurringIncome?.status).toBe("planned");
      expect(recurringIncome?.name).toBe("Recurring Income");
    });

    it("includes payment-receipt as planned", () => {
      const paymentReceipt = proofTypes.find(pt => pt.id === "payment-receipt");
      expect(paymentReceipt).toBeDefined();
      expect(paymentReceipt?.status).toBe("planned");
      expect(paymentReceipt?.name).toBe("Payment Receipt");
    });

    it("has required properties for each proof type", () => {
      proofTypes.forEach(proofType => {
        expect(proofType).toHaveProperty("id");
        expect(proofType).toHaveProperty("name");
        expect(proofType).toHaveProperty("description");
        expect(proofType).toHaveProperty("status");
        expect(proofType).toHaveProperty("category");
        expect(proofType).toHaveProperty("requirements");
        expect(proofType).toHaveProperty("estimatedTime");
        expect(proofType).toHaveProperty("supportedNetworks");
        
        expect(typeof proofType.id).toBe("string");
        expect(typeof proofType.name).toBe("string");
        expect(typeof proofType.description).toBe("string");
        expect(["available", "planned"]).toContain(proofType.status);
        expect(Array.isArray(proofType.requirements)).toBe(true);
        expect(Array.isArray(proofType.supportedNetworks)).toBe(true);
      });
    });
  });

  describe("searchProofTypes function", () => {
    it("returns all types for empty query", () => {
      expect(searchProofTypes(proofTypes, "")).toEqual(proofTypes);
      expect(searchProofTypes(proofTypes, "   ")).toEqual(proofTypes);
    });

    it("filters by name", () => {
      const results = searchProofTypes(proofTypes, "minimum");
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("minimum-income");
    });

    it("filters by description", () => {
      const results = searchProofTypes(proofTypes, "threshold");
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("minimum-income");
    });

    it("filters by category", () => {
      const results = searchProofTypes(proofTypes, "income verification");
      expect(results).toHaveLength(2);
      expect(results.every(r => r.category === "Income Verification")).toBe(true);
    });

    it("is case insensitive", () => {
      const lowerResults = searchProofTypes(proofTypes, "minimum");
      const upperResults = searchProofTypes(proofTypes, "MINIMUM");
      const mixedResults = searchProofTypes(proofTypes, "Minimum");
      
      expect(lowerResults).toEqual(upperResults);
      expect(lowerResults).toEqual(mixedResults);
    });

    it("returns empty array for no matches", () => {
      const results = searchProofTypes(proofTypes, "nonexistent");
      expect(results).toEqual([]);
    });

    it("handles partial matches", () => {
      const results = searchProofTypes(proofTypes, "pay");
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("payment-receipt");
    });
  });

  describe("getProofTypeStats function", () => {
    it("returns correct statistics for the fixture data", () => {
      const stats = getProofTypeStats(proofTypes);
      
      expect(stats.total).toBe(3);
      expect(stats.available).toBe(1);
      expect(stats.planned).toBe(2);
    });

    it("handles empty array", () => {
      const stats = getProofTypeStats([]);
      
      expect(stats.total).toBe(0);
      expect(stats.available).toBe(0);
      expect(stats.planned).toBe(0);
    });

    it("handles only available types", () => {
      const availableOnly = proofTypes.filter(pt => pt.status === "available");
      const stats = getProofTypeStats(availableOnly);
      
      expect(stats.total).toBe(1);
      expect(stats.available).toBe(1);
      expect(stats.planned).toBe(0);
    });

    it("handles only planned types", () => {
      const plannedOnly = proofTypes.filter(pt => pt.status === "planned");
      const stats = getProofTypeStats(plannedOnly);
      
      expect(stats.total).toBe(2);
      expect(stats.available).toBe(0);
      expect(stats.planned).toBe(2);
    });
  });
});