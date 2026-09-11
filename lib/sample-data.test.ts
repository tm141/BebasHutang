import { describe, expect, it } from "vitest";
import { SAMPLE_DEBTS, SAMPLE_EXPENSES, SAMPLE_INCOME, getSampleData } from "./sample-data";

describe("getSampleData", () => {
  it("keeps the IDR pack unchanged", () => {
    const sample = getSampleData("IDR", "id");
    expect(sample.income).toBe(SAMPLE_INCOME);
    expect(sample.debts).toEqual(SAMPLE_DEBTS);
    expect(sample.expenses).toEqual(SAMPLE_EXPENSES);
  });

  it("sizes USD so income is not millions of dollars", () => {
    const sample = getSampleData("usd", "en");
    expect(sample.income).toBe(4_500);
    expect(sample.debts[0]?.name).toBe("Visa card");
    expect(sample.debts.every((debt) => debt.balance < 100_000)).toBe(true);
    expect(sample.debts.every((debt) => debt.originalBalance >= debt.balance)).toBe(true);
    expect(sample.expenses.rent).toBeLessThan(sample.income);
  });

  it("uses Malaysian names and ringgit-scale income", () => {
    const sample = getSampleData("MYR", "ms");
    expect(sample.income).toBe(6_500);
    expect(sample.debts.map((debt) => debt.name)).toEqual([
      "CIMB Credit Card",
      "Maybank Personal Loan",
      "Proton X50 Car Loan",
      "PTPTN Study Loan",
    ]);
  });

  it("treats an unknown currency as USD", () => {
    expect(getSampleData("CHF", "en")).toEqual(getSampleData("USD", "en"));
  });
});
