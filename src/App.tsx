import React, { useState, useEffect, useMemo } from 'react';
import {
  CalculatorInputs,
  CalculationResults,
  SavedTransaction,
} from './types';
import {
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Save,
  Trash2,
  Copy,
  Check,
  Settings2,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  Scale,
  Sparkles,
  Plus,
  Minus,
  CheckCircle2,
  HelpCircle,
  History,
  Coins,
  Banknote,
  Sliders
} from 'lucide-react';

const DEFAULT_INPUTS: CalculatorInputs = {
  myrWithdrawn: 800,
  assumedMyrPerUsd: 4.00,
  actualUsdCharge: 228.03,
  usdSellingRate: 19.00,
  bankRepaymentRate: 15.42,
};

const STORAGE_KEY = 'mvr_profit_calculator_history_v1';
const BANK_RATE_STORAGE_KEY = 'mvr_profit_calculator_bank_rate';

export default function App() {
  // Input states as raw strings to allow seamless typing with decimals
  const [myrWithdrawnStr, setMyrWithdrawnStr] = useState<string>('800');
  const [assumedRateStr, setAssumedRateStr] = useState<string>('4.00');
  const [actualUsdChargeStr, setActualUsdChargeStr] = useState<string>('228.03');
  const [usdSellingRateStr, setUsdSellingRateStr] = useState<string>('19.00');
  const [bankRateStr, setBankRateStr] = useState<string>('15.42');

  // UI state
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);
  const [showSensitivity, setShowSensitivity] = useState<boolean>(false);
  const [saveNote, setSaveNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<SavedTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Load custom bank rate if previously saved
  useEffect(() => {
    try {
      const savedBankRate = localStorage.getItem(BANK_RATE_STORAGE_KEY);
      if (savedBankRate) {
        setBankRateStr(savedBankRate);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Parsed numerical inputs
  const inputs: CalculatorInputs = useMemo(() => {
    const myr = parseFloat(myrWithdrawnStr) || 0;
    const assumed = parseFloat(assumedRateStr) || 0;
    const actualUsd = parseFloat(actualUsdChargeStr) || 0;
    const sellingRate = parseFloat(usdSellingRateStr) || 0;
    const bankRate = parseFloat(bankRateStr) || 15.42;

    return {
      myrWithdrawn: myr,
      assumedMyrPerUsd: assumed,
      actualUsdCharge: actualUsd,
      usdSellingRate: sellingRate,
      bankRepaymentRate: bankRate,
    };
  }, [myrWithdrawnStr, assumedRateStr, actualUsdChargeStr, usdSellingRateStr, bankRateStr]);

  // Full-precision calculation results
  const results: CalculationResults = useMemo(() => {
    const { myrWithdrawn, assumedMyrPerUsd, actualUsdCharge, usdSellingRate, bankRepaymentRate } = inputs;

    // Formula A: Estimated USD = MYR Withdrawn / Assumed MYR per USD Rate
    const estimatedUsd = assumedMyrPerUsd > 0 ? myrWithdrawn / assumedMyrPerUsd : 0;

    // Formula B: MVR Received = Estimated USD * USD Selling Rate
    const mvrReceived = estimatedUsd * usdSellingRate;

    // Formula C: MVR Repayment = Actual USD Card Charge * Bank Repayment Rate
    const mvrRepayment = actualUsdCharge * bankRepaymentRate;

    // Formula D: Net Profit = MVR Received - MVR Repayment
    const netProfit = mvrReceived - mvrRepayment;

    // Formula E: Break-even Rate = MVR Repayment / Estimated USD
    const breakEvenRate = estimatedUsd > 0 ? mvrRepayment / estimatedUsd : 0;

    const isProfitable = netProfit >= 0;
    const rateSpread = usdSellingRate - breakEvenRate;
    const profitMarginPercent = mvrRepayment > 0 ? (netProfit / mvrRepayment) * 100 : 0;
    const effectiveMyrPerUsdActual = actualUsdCharge > 0 ? myrWithdrawn / actualUsdCharge : 0;
    const effectiveMvrPerMyr = myrWithdrawn > 0 ? mvrRepayment / myrWithdrawn : 0;

    return {
      estimatedUsd,
      mvrReceived,
      mvrRepayment,
      netProfit,
      breakEvenRate,
      isProfitable,
      rateSpread,
      profitMarginPercent,
      effectiveMyrPerUsdActual,
      effectiveMvrPerMyr,
    };
  }, [inputs]);

  // Restore defaults
  const handleReset = () => {
    setMyrWithdrawnStr('800');
    setAssumedRateStr('4.00');
    setActualUsdChargeStr('228.03');
    setUsdSellingRateStr('19.00');
    setBankRateStr('15.42');
    try {
      localStorage.removeItem(BANK_RATE_STORAGE_KEY);
    } catch {
      // ignore
    }
    showToast('Defaults restored (800 MYR, 4.00 rate, $228.03 charge, 19.00 MVR)');
  };

  // Toast feedback
  const showToast = (message: string) => {
    setCopiedNotification(message);
    setTimeout(() => {
      setCopiedNotification(null);
    }, 2800);
  };

  // Save current calculation to history
  const handleSaveTransaction = () => {
    if (inputs.myrWithdrawn <= 0 || inputs.actualUsdCharge <= 0) {
      showToast('Please enter valid withdrawal and charge amounts');
      return;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newTx: SavedTransaction = {
      id: 'tx_' + Date.now(),
      timestamp: Date.now(),
      dateStr: dateFormatted,
      note: saveNote.trim() || undefined,
      inputs: { ...inputs },
      results: {
        estimatedUsd: results.estimatedUsd,
        mvrReceived: results.mvrReceived,
        mvrRepayment: results.mvrRepayment,
        netProfit: results.netProfit,
        breakEvenRate: results.breakEvenRate,
      },
    };

    setHistory((prev) => [newTx, ...prev]);
    setSaveNote('');
    setIsSaving(false);
    showToast('Transaction saved to history');
  };

  // Load a saved transaction back into calculator
  const handleLoadTransaction = (tx: SavedTransaction) => {
    setMyrWithdrawnStr(tx.inputs.myrWithdrawn.toString());
    setAssumedRateStr(tx.inputs.assumedMyrPerUsd.toString());
    setActualUsdChargeStr(tx.inputs.actualUsdCharge.toString());
    setUsdSellingRateStr(tx.inputs.usdSellingRate.toString());
    setBankRateStr(tx.inputs.bankRepaymentRate.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded transaction: RM ${tx.inputs.myrWithdrawn} (${tx.dateStr})`);
  };

  // Delete single history item
  const handleDeleteTransaction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('Transaction removed from history');
  };

  // Clear all history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all saved transactions?')) {
      setHistory([]);
      showToast('All transaction history cleared');
    }
  };

  // Export history to CSV
  const handleExportCsv = () => {
    if (history.length === 0) {
      showToast('No history to export');
      return;
    }

    const headers = [
      'Date',
      'Note',
      'MYR Withdrawn',
      'Assumed MYR/USD Rate',
      'Estimated USD',
      'Actual USD Charge',
      'USD Selling Rate (MVR)',
      'Bank Repayment Rate (MVR)',
      'MVR Received',
      'MVR Repayment',
      'Break-even Rate',
      'Net Profit MVR',
    ];

    const rows = history.map((item) => [
      `"${item.dateStr}"`,
      `"${item.note || ''}"`,
      item.inputs.myrWithdrawn.toFixed(2),
      item.inputs.assumedMyrPerUsd.toFixed(4),
      item.results.estimatedUsd.toFixed(2),
      item.inputs.actualUsdCharge.toFixed(2),
      item.inputs.usdSellingRate.toFixed(2),
      item.inputs.bankRepaymentRate.toFixed(2),
      item.results.mvrReceived.toFixed(2),
      item.results.mvrRepayment.toFixed(2),
      item.results.breakEvenRate.toFixed(2),
      item.results.netProfit.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mvr_currency_profit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('History exported to CSV');
  };

  // Copy full summary breakdown
  const handleCopySummary = () => {
    const text = `📊 MVR Currency Profit Calculator Summary
----------------------------------------
🇲🇾 MYR Withdrawn: RM ${inputs.myrWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Assumed MYR/USD Rate: ${inputs.assumedMyrPerUsd.toFixed(2)}
💵 Estimated USD: $${results.estimatedUsd.toFixed(2)} USD

🇺🇸 Actual USD Card Charge: $${inputs.actualUsdCharge.toFixed(2)} USD
USD Selling Rate: ${inputs.usdSellingRate.toFixed(2)} MVR / USD
Bank Repayment Rate: ${inputs.bankRepaymentRate.toFixed(2)} MVR / USD

----------------------------------------
💰 Total MVR Received: ${results.mvrReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MVR
💳 Total MVR Repayment: ${results.mvrRepayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MVR
🎯 Break-even Selling Rate: ${results.breakEvenRate.toFixed(2)} MVR / USD
Spread vs Break-even: ${results.rateSpread >= 0 ? '+' : ''}${results.rateSpread.toFixed(2)} MVR

----------------------------------------
🏁 ${results.isProfitable ? '✅ NET PROFIT' : '⚠️ NET LOSS'}: ${results.netProfit >= 0 ? '+' : ''}${results.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MVR
Return Margin: ${results.profitMarginPercent.toFixed(2)}%
Effective Cost per RM: ${results.effectiveMvrPerMyr.toFixed(3)} MVR/MYR`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('Full breakdown copied to clipboard!');
    });
  };

  // Quick preset handlers
  const handleSetMyr = (amount: number) => {
    setMyrWithdrawnStr(amount.toString());
  };

  const handleAdjustSellingRate = (delta: number) => {
    const current = parseFloat(usdSellingRateStr) || 19.0;
    const updated = Math.max(0, current + delta);
    setUsdSellingRateStr(updated.toFixed(2));
  };

  // Format helpers
  const formatMvr = (val: number) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatRate = (val: number, decimals: number = 2) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Sensitivity table steps
  const sensitivityRows = useMemo(() => {
    const baseRate = results.breakEvenRate > 0 ? results.breakEvenRate : 17.58;
    const rates = [
      Number((baseRate - 1.0).toFixed(2)),
      Number((baseRate - 0.5).toFixed(2)),
      Number(baseRate.toFixed(2)), // exact break-even
      Number((baseRate + 0.5).toFixed(2)),
      18.5,
      19.0,
      19.5,
      20.0,
    ]
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b);

    return rates.map((r) => {
      const mvrRec = results.estimatedUsd * r;
      const profit = mvrRec - results.mvrRepayment;
      const isCurrent = Math.abs(r - inputs.usdSellingRate) < 0.01;
      const isBreakEven = Math.abs(r - results.breakEvenRate) < 0.01;
      return {
        rate: r,
        mvrReceived: mvrRec,
        profit,
        isCurrent,
        isBreakEven,
      };
    });
  }, [results.breakEvenRate, results.estimatedUsd, results.mvrRepayment, inputs.usdSellingRate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Toast Alert */}
      {copiedNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-800 text-white border border-slate-700 rounded-full shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Main Container - Mobile Centric Vertical Layout */}
      <div className="w-full max-w-xl mx-auto px-4 py-4 md:py-8 flex-1 flex flex-col gap-5">
        {/* Header Bar */}
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-bold text-lg">
              🇲🇻
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                MVR Profit Calc
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  MYR · USD · MVR
                </span>
              </h1>
              <p className="text-xs text-slate-400">Three-Currency Card Withdrawal & Arbitrage</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              title="How the 3-currency loop works"
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                showHowItWorks
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Flow</span>
            </button>

            <button
              onClick={handleReset}
              title="Restore default test values"
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors flex items-center gap-1.5 text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <a
              href="#history-section"
              title="View saved transactions"
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors flex items-center gap-1.5 text-xs relative"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 flex items-center justify-center -top-1 -right-1 absolute">
                  {history.length}
                </span>
              )}
            </a>
          </div>
        </header>

        {/* Currency Loop Explainer Drawer */}
        {showHowItWorks && (
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 text-xs space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5 text-sm">
                <Coins className="w-4 h-4" /> How This 3-Currency Loop Works
              </span>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5"
              >
                Close ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <span>1. 🇲🇾 ATM Withdrawal</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  You withdraw <span className="text-emerald-300 font-mono">MYR</span> using your USD card. You estimate receiving USD equivalent by dividing MYR by your assumed rate.
                </p>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <span>2. 🇲🇻 USD to MVR Sale</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  You sell that estimated <span className="text-emerald-300 font-mono">USD</span> to a buyer/changer at your selling rate to receive actual <span className="text-emerald-300 font-mono">MVR</span> cash.
                </p>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <span>3. 🇺🇸 Bank Repayment</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Your bank bills the actual <span className="text-rose-300 font-mono">USD</span> card charge (with fees). You repay the bank in MVR at the bank rate (<span className="text-slate-200 font-mono">15.42</span>).
                </p>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Crucial Rule:</strong> The estimated USD determines how much you sell. The actual USD card charge determines what you owe the bank. Everything is measured in <strong>MVR</strong>.
              </span>
            </div>
          </div>
        )}

        {/* 1. TRANSACTION INPUTS SECTION (AT THE TOP) */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 flex flex-col gap-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Transaction Inputs</span>
                <span className="text-[11px] font-normal text-slate-400">(Live Updates)</span>
              </h2>
              <p className="text-xs text-slate-400">Enter your 4 variables to compute your net profit below</p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Variable 1: MYR Withdrawn */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 focus-within:border-emerald-500/70 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="myr-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="text-base">🇲🇾</span>
                    <span>1. MYR Withdrawn</span>
                  </label>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    MYR (RM)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Amount of Malaysian Ringgit withdrawn from ATM.
                </p>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
                  RM
                </span>
                <input
                  id="myr-input"
                  type="number"
                  inputMode="decimal"
                  step="50"
                  min="0"
                  value={myrWithdrawnStr}
                  onChange={(e) => setMyrWithdrawnStr(e.target.value)}
                  placeholder="800"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-3 py-2.5 text-lg font-bold text-white font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Preset Buttons for MYR */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[400, 800, 1000, 1500, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSetMyr(amt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      inputs.myrWithdrawn === amt
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    RM {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Variable 2: Assumed MYR to USD Exchange Rate */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 focus-within:border-emerald-500/70 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="assumed-rate-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="text-base">💱</span>
                    <span>2. Assumed MYR/USD Rate</span>
                  </label>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    MYR per $1 USD
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Estimated rate to calculate USD amount (RM 800 ÷ 4.00 = $200).
                </p>
              </div>

              <div className="relative">
                <input
                  id="assumed-rate-input"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.1"
                  value={assumedRateStr}
                  onChange={(e) => setAssumedRateStr(e.target.value)}
                  placeholder="4.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-lg font-bold text-white font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
                  MYR / USD
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span>Estimated USD to receive:</span>
                <span className="font-bold text-emerald-400 font-mono-numbers">
                  ${formatRate(results.estimatedUsd)} USD
                </span>
              </div>
            </div>

            {/* Variable 3: Actual USD Card Charge */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 focus-within:border-emerald-500/70 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="actual-charge-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="text-base">🇺🇸</span>
                    <span>3. Actual USD Card Charge</span>
                  </label>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    USD ($)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Charged to USD statement (includes cash advance fee already).
                </p>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
                  $
                </span>
                <input
                  id="actual-charge-input"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={actualUsdChargeStr}
                  onChange={(e) => setActualUsdChargeStr(e.target.value)}
                  placeholder="228.03"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-lg font-bold text-white font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span>Effective Card Rate:</span>
                <span className="font-semibold text-slate-300 font-mono-numbers">
                  {results.effectiveMyrPerUsdActual > 0
                    ? `${results.effectiveMyrPerUsdActual.toFixed(2)} MYR/USD`
                    : '—'}
                </span>
              </div>
            </div>

            {/* Variable 4: USD Selling Rate in MVR */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 focus-within:border-emerald-500/70 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="selling-rate-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="text-base">🇲🇻</span>
                    <span>4. USD Selling Rate in MVR</span>
                  </label>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    MVR per $1 USD
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Rate at which you sell USD to receive Maldivian Rufiyaa.
                </p>
              </div>

              <div className="relative flex items-center gap-1.5">
                <input
                  id="selling-rate-input"
                  type="number"
                  inputMode="decimal"
                  step="0.05"
                  min="1"
                  value={usdSellingRateStr}
                  onChange={(e) => setUsdSellingRateStr(e.target.value)}
                  placeholder="19.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-lg font-bold text-white font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleAdjustSellingRate(-0.1)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors shrink-0"
                  title="Decrease rate by 0.10"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustSellingRate(0.1)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors shrink-0"
                  title="Increase rate by 0.10"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick rate presets */}
              <div className="flex flex-wrap gap-1 pt-1">
                {[18.5, 18.8, 19.0, 19.2, 19.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setUsdSellingRateStr(rate.toFixed(2))}
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                      Math.abs(inputs.usdSellingRate - rate) < 0.01
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {rate.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ADVANCED SETTINGS: Fixed Bank Repayment Rate */}
          <div className="border-t border-slate-800/80 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-slate-400" />
                <span>Advanced Settings: Bank Repayment Rate (Fixed: 15.42 MVR)</span>
              </div>
              {showAdvancedSettings ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAdvancedSettings && (
              <div className="mt-3 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <label
                      htmlFor="bank-rate-input"
                      className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                    >
                      <span>Bank Repayment Exchange Rate</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fixed rate used by bank to repay USD card balance using MVR (Default: 1 USD = 15.42 MVR).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBankRateStr('15.42');
                      try {
                        localStorage.removeItem(BANK_RATE_STORAGE_KEY);
                      } catch {
                        // ignore
                      }
                      showToast('Bank rate reset to standard 15.42');
                    }}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 underline shrink-0"
                  >
                    Reset to 15.42
                  </button>
                </div>

                <div className="relative max-w-xs">
                  <input
                    id="bank-rate-input"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="1"
                    value={bankRateStr}
                    onChange={(e) => {
                      setBankRateStr(e.target.value);
                      try {
                        localStorage.setItem(BANK_RATE_STORAGE_KEY, e.target.value);
                      } catch {
                        // ignore
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white font-mono-numbers focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    MVR / USD
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. PROFIT AMOUNTS SECTION (DIRECTLY BELOW INPUTS) */}
        <section
          className={`relative overflow-hidden rounded-3xl p-6 md:p-7 border transition-all duration-300 shadow-2xl ${
            results.isProfitable
              ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-emerald-950/30 border-emerald-500/40 shadow-emerald-950/30'
              : 'bg-gradient-to-br from-rose-950/60 via-slate-900 to-rose-950/30 border-rose-500/40 shadow-rose-950/30'
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 ${
              results.isProfitable ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                    results.isProfitable
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {results.isProfitable ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" /> NET PROFIT
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" /> NET LOSS
                    </>
                  )}
                </span>
                <span className="text-xs text-slate-400">Final Outcome</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopySummary}
                  title="Copy full summary"
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 flex items-center gap-1 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </button>
                <button
                  onClick={() => setIsSaving(!isSaving)}
                  title="Save to history"
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 flex items-center gap-1 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              </div>
            </div>

            {/* Giant Profit Display */}
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-4xl sm:text-5xl font-black tracking-tight font-mono-numbers ${
                    results.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {results.netProfit >= 0 ? '+' : ''}
                  {formatMvr(results.netProfit)}
                </span>
                <span className="text-lg font-bold text-slate-300">MVR</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                <span>
                  Margin:{' '}
                  <strong
                    className={`font-semibold ${
                      results.isProfitable ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {results.netProfit >= 0 ? '+' : ''}
                    {results.profitMarginPercent.toFixed(2)}%
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Effective Cost:{' '}
                  <strong className="text-slate-200 font-mono-numbers">
                    {results.effectiveMvrPerMyr.toFixed(3)} MVR
                  </strong>{' '}
                  / 1 MYR
                </span>
              </div>
            </div>

            {/* In vs Out Comparison Strip */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                <div className="text-slate-400 mb-0.5 flex items-center justify-between">
                  <span>MVR Received</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Cash In</span>
                </div>
                <div className="text-base font-bold text-white font-mono-numbers">
                  {formatMvr(results.mvrReceived)} <span className="text-xs font-normal text-slate-400">MVR</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  ${formatRate(results.estimatedUsd)} USD @ {formatRate(inputs.usdSellingRate)}
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                <div className="text-slate-400 mb-0.5 flex items-center justify-between">
                  <span>MVR Repayment</span>
                  <span className="text-[10px] text-rose-400 font-semibold">Bank Debt</span>
                </div>
                <div className="text-base font-bold text-white font-mono-numbers">
                  {formatMvr(results.mvrRepayment)} <span className="text-xs font-normal text-slate-400">MVR</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  ${formatRate(inputs.actualUsdCharge)} USD @ {formatRate(inputs.bankRepaymentRate)}
                </div>
              </div>
            </div>

            {/* Save Note Drawer (inline) */}
            {isSaving && (
              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Optional note (e.g. Maybank KL Sentral ATM)..."
                  value={saveNote}
                  onChange={(e) => setSaveNote(e.target.value)}
                  className="flex-1 bg-slate-950/80 border border-slate-700 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveTransaction}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Record
                  </button>
                  <button
                    onClick={() => setIsSaving(false)}
                    className="px-3 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. BREAK-EVEN INDICATOR */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Break-Even Selling Rate</h2>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-white font-mono-numbers">
                {formatRate(results.breakEvenRate)}
              </span>{' '}
              <span className="text-xs text-slate-400 font-semibold">MVR / USD</span>
            </div>
          </div>

          {/* Visual Rate Delta Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Your Selling Rate:{' '}
                <strong className="text-white font-mono-numbers">{formatRate(inputs.usdSellingRate)} MVR</strong>
              </span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  results.rateSpread >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {results.rateSpread >= 0 ? (
                  <>
                    +{formatRate(results.rateSpread)} MVR/USD above break-even
                  </>
                ) : (
                  <>
                    -{formatRate(Math.abs(results.rateSpread))} MVR/USD below break-even
                  </>
                )}
              </span>
            </div>

            {/* Gauge progress bar */}
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  results.isProfitable
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                    : 'bg-gradient-to-r from-amber-500 to-rose-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      8,
                      results.breakEvenRate > 0
                        ? (inputs.usdSellingRate / (results.breakEvenRate * 1.25)) * 100
                        : 50
                    )
                  )}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Low (Loss)</span>
              <span>Break-even: {formatRate(results.breakEvenRate)} MVR</span>
              <span>High (Profit)</span>
            </div>
          </div>

          {/* Sensitivity trigger toggle */}
          <button
            onClick={() => setShowSensitivity(!showSensitivity)}
            className="mt-1 text-xs text-slate-400 hover:text-emerald-400 flex items-center justify-between py-1 border-t border-slate-800/80 transition-colors"
          >
            <span>View Selling Rate Sensitivity Analysis</span>
            {showSensitivity ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Collapsible Sensitivity Table */}
          {showSensitivity && (
            <div className="pt-2 animate-in fade-in duration-200">
              <div className="text-[11px] text-slate-400 mb-2">
                Simulated net profit/loss across different USD selling rates in MVR:
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Selling Rate</th>
                      <th className="py-2 px-3">MVR Received</th>
                      <th className="py-2 px-3 text-right">Net Profit / Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
                    {sensitivityRows.map((row) => (
                      <tr
                        key={row.rate}
                        className={`transition-colors ${
                          row.isCurrent
                            ? 'bg-emerald-500/15 font-semibold text-white'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <td className="py-2 px-3 flex items-center gap-1.5">
                          <span>{row.rate.toFixed(2)} MVR</span>
                          {row.isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300">
                              Current
                            </span>
                          )}
                          {row.isBreakEven && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300">
                              Break-Even
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-400">{formatMvr(row.mvrReceived)}</td>
                        <td
                          className={`py-2 px-3 text-right font-semibold ${
                            row.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {row.profit >= 0 ? '+' : ''}
                          {formatMvr(row.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* 4. RESULTS DASHBOARD: DETAILED AUDIT GRID */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span>Complete Transaction Audit</span>
            </h2>
            <span className="text-xs text-slate-400">All 9 Core Figures</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* 1. MYR Withdrawn */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">1. MYR Withdrawn</span>
              <span className="text-sm font-bold text-white font-mono-numbers">
                RM {formatRate(inputs.myrWithdrawn)}
              </span>
            </div>

            {/* 2. Assumed MYR/USD rate */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">2. Assumed Rate</span>
              <span className="text-sm font-bold text-white font-mono-numbers">
                {formatRate(inputs.assumedMyrPerUsd)} <span className="text-[10px] text-slate-400">MYR/$</span>
              </span>
            </div>

            {/* 3. Estimated USD received */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">3. Estimated USD</span>
              <span className="text-sm font-bold text-emerald-400 font-mono-numbers">
                ${formatRate(results.estimatedUsd)} <span className="text-[10px] text-slate-400">USD</span>
              </span>
            </div>

            {/* 4. Actual USD Card Charge */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">4. Actual USD Charge</span>
              <span className="text-sm font-bold text-rose-300 font-mono-numbers">
                ${formatRate(inputs.actualUsdCharge)} <span className="text-[10px] text-slate-400">USD</span>
              </span>
            </div>

            {/* 5. USD Selling Rate */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">5. Selling Rate</span>
              <span className="text-sm font-bold text-white font-mono-numbers">
                {formatRate(inputs.usdSellingRate)} <span className="text-[10px] text-slate-400">MVR/$</span>
              </span>
            </div>

            {/* 6. Total MVR received */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">6. Total MVR Received</span>
              <span className="text-sm font-bold text-emerald-400 font-mono-numbers">
                {formatMvr(results.mvrReceived)} <span className="text-[10px] text-slate-400">MVR</span>
              </span>
            </div>

            {/* 7. Bank Repayment Rate */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">7. Bank Repayment Rate</span>
              <span className="text-sm font-bold text-white font-mono-numbers">
                {formatRate(inputs.bankRepaymentRate)} <span className="text-[10px] text-slate-400">MVR/$</span>
              </span>
            </div>

            {/* 8. Total MVR required for repayment */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">8. Total MVR Repayment</span>
              <span className="text-sm font-bold text-rose-300 font-mono-numbers">
                {formatMvr(results.mvrRepayment)} <span className="text-[10px] text-slate-400">MVR</span>
              </span>
            </div>

            {/* 9. Break-even selling rate */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">9. Break-Even Rate</span>
              <span className="text-sm font-bold text-amber-400 font-mono-numbers">
                {formatRate(results.breakEvenRate)} <span className="text-[10px] text-slate-400">MVR/$</span>
              </span>
            </div>
          </div>
        </section>

        {/* 5. STEP-BY-STEP MATHEMATICAL BREAKDOWN (Explainer) */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Step-by-Step Calculation Formulas</span>
            </h2>
            <span className="text-xs text-slate-400">Substituted Values</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Step A */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-medium">
                <span>A. Estimated USD Received</span>
                <span className="text-[11px] font-mono text-slate-500">MYR Withdrawn ÷ Assumed Rate</span>
              </div>
              <div className="text-slate-200 font-mono-numbers">
                {inputs.myrWithdrawn} MYR ÷ {inputs.assumedMyrPerUsd} ={' '}
                <strong className="text-emerald-400 font-bold">${formatRate(results.estimatedUsd)} USD</strong>
              </div>
            </div>

            {/* Step B */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-medium">
                <span>B. Total MVR Received from Selling USD</span>
                <span className="text-[11px] font-mono text-slate-500">Estimated USD × Selling Rate</span>
              </div>
              <div className="text-slate-200 font-mono-numbers">
                ${formatRate(results.estimatedUsd)} USD × {inputs.usdSellingRate} MVR ={' '}
                <strong className="text-emerald-400 font-bold">{formatMvr(results.mvrReceived)} MVR</strong>
              </div>
            </div>

            {/* Step C */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-medium">
                <span>C. Actual MVR Repayment</span>
                <span className="text-[11px] font-mono text-slate-500">Actual Card Charge × Bank Rate</span>
              </div>
              <div className="text-slate-200 font-mono-numbers">
                ${inputs.actualUsdCharge} USD × {inputs.bankRepaymentRate} MVR ={' '}
                <strong className="text-rose-300 font-bold">{formatMvr(results.mvrRepayment)} MVR</strong>
              </div>
            </div>

            {/* Step D */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-medium">
                <span>D. Net Profit or Loss</span>
                <span className="text-[11px] font-mono text-slate-500">MVR Received − MVR Repayment</span>
              </div>
              <div className="text-slate-200 font-mono-numbers">
                {formatMvr(results.mvrReceived)} MVR − {formatMvr(results.mvrRepayment)} MVR ={' '}
                <strong
                  className={`font-bold ${
                    results.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {results.netProfit >= 0 ? '+' : ''}
                  {formatMvr(results.netProfit)} MVR
                </strong>
              </div>
            </div>

            {/* Step E */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-medium">
                <span>E. Break-Even Selling Rate</span>
                <span className="text-[11px] font-mono text-slate-500">MVR Repayment ÷ Estimated USD</span>
              </div>
              <div className="text-slate-200 font-mono-numbers">
                {formatMvr(results.mvrRepayment)} MVR ÷ ${formatRate(results.estimatedUsd)} USD ={' '}
                <strong className="text-amber-400 font-bold">
                  {formatRate(results.breakEvenRate)} MVR per USD
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* 6. TRANSACTION HISTORY SECTION */}
        <section
          id="history-section"
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 flex flex-col gap-4 scroll-mt-6"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Saved Transactions</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {history.length}
              </span>
            </div>

            {history.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCsv}
                  title="Export to CSV"
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={handleClearHistory}
                  title="Clear history"
                  className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400">
                <Save className="w-5 h-5" />
              </div>
              <p>No saved transactions yet.</p>
              <p className="text-[11px] text-slate-600 max-w-xs">
                Click &quot;Save&quot; in the profit section above anytime to record your withdrawals and exchange calculations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => handleLoadTransaction(tx)}
                  className="group p-4 bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 rounded-2xl transition-all cursor-pointer flex flex-col gap-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        RM {tx.inputs.myrWithdrawn.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400">
                        (${tx.inputs.actualUsdCharge.toFixed(2)} USD charge)
                      </span>
                      {tx.note && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                          {tx.note}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold font-mono-numbers px-2 py-0.5 rounded-full ${
                          tx.results.netProfit >= 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {tx.results.netProfit >= 0 ? '+' : ''}
                        {formatMvr(tx.results.netProfit)} MVR
                      </span>
                      <button
                        onClick={(e) => handleDeleteTransaction(tx.id, e)}
                        title="Delete transaction"
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-2">
                    <div className="flex items-center gap-3">
                      <span>Rate: {tx.inputs.usdSellingRate.toFixed(2)} MVR</span>
                      <span>•</span>
                      <span>Break-even: {tx.results.breakEvenRate.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{tx.dateStr}</span>
                      <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                        Load →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-slate-500 space-y-1">
          <p>MVR Currency Profit Calculator • Optimized for Mobile & Fast Arbitrage</p>
          <p className="text-[11px] text-slate-600">
            Internal calculations run at full floating precision • Rounded to 2 decimals for display
          </p>
        </footer>
      </div>
    </div>
  );
}
