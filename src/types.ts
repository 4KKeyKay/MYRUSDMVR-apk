export interface CalculatorInputs {
  myrWithdrawn: number;
  assumedMyrPerUsd: number;
  actualUsdCharge: number;
  usdSellingRate: number;
  bankRepaymentRate: number;
}

export interface CalculationResults {
  estimatedUsd: number;
  mvrReceived: number;
  mvrRepayment: number;
  netProfit: number;
  breakEvenRate: number;
  isProfitable: boolean;
  rateSpread: number; // usdSellingRate - breakEvenRate
  profitMarginPercent: number; // (netProfit / mvrRepayment) * 100
  effectiveMyrPerUsdActual: number; // myrWithdrawn / actualUsdCharge
  effectiveMvrPerMyr: number; // mvrRepayment / myrWithdrawn
}

export interface SavedTransaction {
  id: string;
  timestamp: number;
  dateStr: string;
  note?: string;
  inputs: CalculatorInputs;
  results: {
    estimatedUsd: number;
    mvrReceived: number;
    mvrRepayment: number;
    netProfit: number;
    breakEvenRate: number;
  };
}
