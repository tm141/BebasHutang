import { describe, expect, it } from "vitest";
import { computePayoffSchedule, type SimulationDebt } from "./payoff";

const highInterest: SimulationDebt = {
  id: "high",
  name: "High interest",
  balance: 1000,
  interestRate: 20,
  minimumPayment: 50,
};

const smallBalance: SimulationDebt = {
  id: "small",
  name: "Small balance",
  balance: 400,
  interestRate: 5,
  minimumPayment: 40,
};

describe("computePayoffSchedule", () => {
  it("pays the highest interest first with avalanche", () => {
    const result = computePayoffSchedule([smallBalance, highInterest], "avalanche", 100);
    expect(result.payoffOrder[0]).toBe("high");
  });

  it("pays the smallest balance first with snowball", () => {
    const result = computePayoffSchedule([highInterest, smallBalance], "snowball", 100);
    expect(result.payoffOrder[0]).toBe("small");
  });

  it("rolls a freed minimum into the next target", () => {
    const paidOffSoon: SimulationDebt = {
      id: "a",
      name: "A",
      balance: 100,
      interestRate: 0,
      minimumPayment: 100,
    };
    const remaining: SimulationDebt = {
      id: "b",
      name: "B",
      balance: 1000,
      interestRate: 0,
      minimumPayment: 10,
    };

    const result = computePayoffSchedule([paidOffSoon, remaining], "snowball", 0);
    expect(result.payoffMonth).toBe(10);
    expect(result.payoffOrder).toEqual(["a", "b"]);
  });

  it("still produces a schedule when leftover is zero", () => {
    const result = computePayoffSchedule([highInterest], "avalanche", 0);
    expect(result.snapshots[0]?.balance).toBe(1000);
    expect(result.payoffMonth).not.toBeNull();
    expect(result.interestSaved).toBe(0);
  });

  it("ignores debts that are already paid", () => {
    const result = computePayoffSchedule(
      [
        { id: "gone", name: "Gone", balance: 0, interestRate: 18, minimumPayment: 100 },
        smallBalance,
      ],
      "snowball",
      0,
    );
    expect(result.payoffOrder).toEqual(["small"]);
    expect(result.milestones.some((item) => item.debtId === "gone")).toBe(false);
  });

  it("never reports negative interest saved", () => {
    const result = computePayoffSchedule([highInterest, smallBalance], "avalanche", 0);
    expect(result.interestSaved).toBeGreaterThanOrEqual(0);
  });

  it("saves interest when extra is applied to a positive rate", () => {
    const result = computePayoffSchedule([highInterest], "avalanche", 200);
    expect(result.interestSaved).toBeGreaterThan(0);
  });
});
