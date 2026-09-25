import { useState, useEffect, useRef } from 'react';
import { ToolSubTab, MacroIndicator, Language } from '../types';
import {
  VOLATILITY_DATA,
  CENTRAL_BANKS,
  INITIAL_CONSENSUS_EVENTS,
  DEFAULT_CURRENCY_INDICATORS,
  PAIRS_LIST
} from '../data/macroData';
import { TRANSLATIONS } from '../locales/translations';
import { KairosMacroHub } from '../components/KairosMacroHub';
import { ValuationRankingChart } from '../components/ValuationRankingChart';
import { CurrencyIndicatorChart } from '../components/CurrencyIndicatorChart';
import { SectionDivider } from '../components/SectionDivider';

interface ToolsViewProps {
  initialSubTab?: ToolSubTab;
  onSubTabChange?: (tab: ToolSubTab) => void;
  language?: Language;
}

interface CalendarCountry {
  id: string;
  code: string;
  name: string;
  flag: string;
}

const CALENDAR_COUNTRIES: CalendarCountry[] = [
  { id: "5", code: "USD", name: "United States", flag: "🇺🇸" },
  { id: "72", code: "EUR", name: "Eurozone", flag: "🇪🇺" },
  { id: "4", code: "GBP", name: "United Kingdom", flag: "🇬🇧" },
  { id: "25", code: "AUD", name: "Australia", flag: "🇦🇺" },
  { id: "12", code: "CHF", name: "Switzerland", flag: "🇨🇭" },
  { id: "43", code: "NZD", name: "New Zealand", flag: "🇳🇿" },
  { id: "6", code: "CAD", name: "Canada", flag: "🇨🇦" },
  { id: "17", code: "DEU", name: "Germany", flag: "🇩🇪" },
  { id: "22", code: "FRA", name: "France", flag: "🇫🇷" },
  { id: "35", code: "JPY", name: "Japan", flag: "🇯🇵" },
  { id: "37", code: "CNH", name: "China", flag: "🇨🇳" },
];

interface LiveMacroEvent {
  id: string;
  time: string;
  country: string;
  countryId: string;
  event: string;
  impact: 'HIGH' | 'MED' | 'LOW';
  actual: string;
  forecast: string;
  previous: string;
  day: string;
}

const SAMPLE_MACRO_SCHEDULE: LiveMacroEvent[] = [
  { id: "ev1", time: "08:30 UTC", country: "USD", countryId: "5", event: "Non-Farm Employment Change (NFP)", impact: "HIGH", actual: "-23K", forecast: "+145K", previous: "+57K", day: "Friday" },
  { id: "ev2", time: "08:30 UTC", country: "USD", countryId: "5", event: "Unemployment Rate", impact: "HIGH", actual: "4.1%", forecast: "4.1%", previous: "4.2%", day: "Friday" },
  { id: "ev3", time: "10:00 UTC", country: "USD", countryId: "5", event: "ISM Services PMI", impact: "HIGH", actual: "54.1", forecast: "54.6", previous: "54.0", day: "Wednesday" },
  { id: "ev4", time: "05:00 UTC", country: "EUR", countryId: "72", event: "Eurozone Core CPI Flash Estimate YoY", impact: "HIGH", actual: "2.8%", forecast: "2.8%", previous: "2.9%", day: "Tuesday" },
  { id: "ev5", time: "04:30 UTC", country: "GBP", countryId: "4", event: "UK S&P Global Services PMI Final", impact: "MED", actual: "52.8", forecast: "51.6", previous: "52.1", day: "Thursday" },
  { id: "ev6", time: "09:30 UTC", country: "AUD", countryId: "25", event: "RBA Official Cash Rate Decision", impact: "HIGH", actual: "4.35%", forecast: "4.35%", previous: "4.35%", day: "Tuesday" },
  { id: "ev7", time: "08:30 UTC", country: "CAD", countryId: "6", event: "Canada Net Change in Employment", impact: "HIGH", actual: "-2.8K", forecast: "+22.0K", previous: "-1.4K", day: "Friday" },
  { id: "ev8", time: "03:30 UTC", country: "CHF", countryId: "12", event: "Swiss CPI Inflation MoM", impact: "MED", actual: "-0.1%", forecast: "+0.1%", previous: "-0.2%", day: "Monday" },
  { id: "ev9", time: "21:45 UTC", country: "NZD", countryId: "43", event: "New Zealand Card Transactions MoM", impact: "LOW", actual: "+0.2%", forecast: "+0.1%", previous: "-0.3%", day: "Thursday" },
  { id: "ev10", time: "19:30 UTC", country: "JPY", countryId: "35", event: "Tokyo Core CPI YoY", impact: "HIGH", actual: "2.2%", forecast: "2.1%", previous: "2.2%", day: "Tuesday" },
  { id: "ev11", time: "01:30 UTC", country: "CNH", countryId: "37", event: "China Manufacturing PMI (Caixin)", impact: "HIGH", actual: "50.4", forecast: "50.1", previous: "49.8", day: "Monday" },
  { id: "ev12", time: "07:00 UTC", country: "DEU", countryId: "17", event: "German Ifo Business Climate Index", impact: "MED", actual: "86.5", forecast: "86.0", previous: "85.5", day: "Wednesday" },
];

export function ToolsView({ initialSubTab = 'all', onSubTabChange, language = 'en' }: ToolsViewProps) {
  const [activeTab, setActiveTab] = useState<ToolSubTab>(initialSubTab);

  const t = TRANSLATIONS[language];

  const handleTabSwitch = (tab: ToolSubTab) => {
    setActiveTab(tab);
    onSubTabChange?.(tab);
  };

  // Calendar Filter Tool State
  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>([
    "5", "72", "4", "25", "12", "43", "6", "17", "22", "35", "37"
  ]);
  const [calendarImpactFilter, setCalendarImpactFilter] = useState<'ALL' | 'HIGH' | 'MED_HIGH'>('ALL');
  const [calendarSearch, setCalendarSearch] = useState<string>('');
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState<boolean>(false);
  const [showCalendarScheduleTable, setShowCalendarScheduleTable] = useState<boolean>(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#calendar-dropdown-container')) {
        setCalendarDropdownOpen(false);
      }
    };
    if (calendarDropdownOpen) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [calendarDropdownOpen]);

  const getCalendarDropdownLabel = () => {
    if (selectedCountryIds.length === 0) return "No Channels Selected";
    if (selectedCountryIds.length === CALENDAR_COUNTRIES.length) return "All Major Economies";
    return `${selectedCountryIds.length} Markets Selected`;
  };

  // Volatility state
  const [volatilitySort, setVolatilitySort] = useState<'symbol' | 'pips' | 'cash' | 'range'>('pips');
  const [volatilitySortAsc, setVolatilitySortAsc] = useState<boolean>(false);
  const [volatilitySearch, setVolatilitySearch] = useState<string>('');

  // Risk Calculator state
  const [calcAcctCurr, setCalcAcctCurr] = useState<string>('USD');
  const [calcPair, setCalcPair] = useState<string>('EURUSD');
  const [calcBalance, setCalcBalance] = useState<number>(10000);
  const [calcRiskPct, setCalcRiskPct] = useState<number>(1.0);
  const [calcStopPips, setCalcStopPips] = useState<number>(25);

  // Central Banks state
  const [selectedBankKey, setSelectedBankKey] = useState<string>('Overview');

  // Consensus state
  const [consensusEvents, setConsensusEvents] = useState(INITIAL_CONSENSUS_EVENTS);
  const [consensusGeoFilter, setConsensusGeoFilter] = useState<string>('ALL');
  const [consensusSearch, setConsensusSearch] = useState<string>('');

  // Currency Strength state
  const [currencyIndicators, setCurrencyIndicators] = useState<Record<string, MacroIndicator[]>>(() => {
    try {
      const saved = localStorage.getItem('forex_dashboard_data_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return DEFAULT_CURRENCY_INDICATORS;
  });
  const [currencyActiveTab, setCurrencyActiveTab] = useState<string>('dashboard');
  const [currencySort, setCurrencySort] = useState<'divergence' | 'bullish' | 'bearish' | 'default'>('divergence');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'strong' | 'bullish' | 'bearish'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save currencyIndicators to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('forex_dashboard_data_v2', JSON.stringify(currencyIndicators));
    } catch {}
  }, [currencyIndicators]);

  // --- Calendar Filter Functions ---
  const toggleCountry = (id: string) => {
    setSelectedCountryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const selectAllCountries = () => {
    setSelectedCountryIds(CALENDAR_COUNTRIES.map((c) => c.id));
  };

  const selectMajorG7 = () => {
    // US (5), Eurozone (72), UK (4), Japan (35), Canada (6), Germany (17), France (22)
    setSelectedCountryIds(["5", "72", "4", "35", "6", "17", "22"]);
  };

  const clearAllCountries = () => {
    setSelectedCountryIds([]);
  };

  const filteredMacroSchedule = SAMPLE_MACRO_SCHEDULE.filter((ev) => {
    const matchesCountry = selectedCountryIds.includes(ev.countryId);
    const matchesImpact =
      calendarImpactFilter === 'ALL' ||
      (calendarImpactFilter === 'HIGH' && ev.impact === 'HIGH') ||
      (calendarImpactFilter === 'MED_HIGH' && (ev.impact === 'HIGH' || ev.impact === 'MED'));
    const matchesSearch =
      ev.event.toLowerCase().includes(calendarSearch.toLowerCase()) ||
      ev.country.toLowerCase().includes(calendarSearch.toLowerCase());
    return matchesCountry && matchesImpact && matchesSearch;
  });

  const calendarIframeSrc = `https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=${selectedCountryIds.join(',')}&calType=week&timeZone=8&lang=1`;

  // --- Volatility table sorting logic ---
  const sortedVolatility = [...VOLATILITY_DATA]
    .filter((v) => v.symbol.toLowerCase().includes(volatilitySearch.toLowerCase()))
    .sort((a, b) => {
      const colMap = {
        symbol: 'symbol',
        pips: 'avgPips',
        cash: 'cashValue100k',
        range: 'rangePct',
      } as const;
      const key = colMap[volatilitySort];
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'string') {
        return volatilitySortAsc ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
      }
      return volatilitySortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  const toggleVolSort = (col: 'symbol' | 'pips' | 'cash' | 'range') => {
    if (volatilitySort === col) {
      setVolatilitySortAsc(!volatilitySortAsc);
    } else {
      setVolatilitySort(col);
      setVolatilitySortAsc(false);
    }
  };

  // --- Risk Calculator Math ---
  const calculateRiskValues = () => {
    const cashRisk = calcBalance * (calcRiskPct / 100);
    const quoteCurr = calcPair.substring(3, 6);
    const pipSize = quoteCurr === 'JPY' ? 0.01 : 0.0001;
    const contractUnits = 100000;
    
    const rateToUSD: Record<string, number> = {
      USD: 1.0,
      EUR: 1.0845,
      GBP: 1.2982,
      AUD: 0.6588,
      NZD: 0.5974,
      CAD: 1 / 1.3615,
      CHF: 1 / 0.8842,
      JPY: 1 / 154.22
    };

    const quoteToUsdRate = rateToUSD[quoteCurr] || 1.0;
    const acctToUsdRate = rateToUSD[calcAcctCurr] || 1.0;
    const quoteToAcctFactor = quoteToUsdRate / acctToUsdRate;

    const pipValueInQuotePerLot = pipSize * contractUnits;
    const pipValueInAcctPerLot = pipValueInQuotePerLot * quoteToAcctFactor;

    let standardLots = 0;
    if (calcStopPips > 0 && pipValueInAcctPerLot > 0) {
      standardLots = cashRisk / (calcStopPips * pipValueInAcctPerLot);
    }
    const finalLots = Math.max(0.01, +(standardLots.toFixed(2)));
    const totalPipVal = finalLots * pipValueInAcctPerLot;

    return {
      cashRisk,
      standardLots: finalLots,
      pipValue: totalPipVal,
      standardPipValue: pipValueInAcctPerLot
    };
  };

  const riskResult = calculateRiskValues();

  // --- Central Bank Tone Classifier ---
  const classifyTone = (deltaBps: number, outcome: string) => {
    if (deltaBps >= 20) {
      return { label: "Strongly Hawkish", class: "text-emerald-300 bg-emerald-950/80 border-emerald-500/50" };
    } else if (deltaBps >= 10 && outcome === "HIKE") {
      return { label: "Hawkish / Hike Bias", class: "text-emerald-400 bg-emerald-950/50 border-emerald-500/30" };
    } else if (outcome === "HOLD" && deltaBps > 5) {
      return { label: "Hawkish Hold", class: "text-teal-300 bg-teal-950/50 border-teal-500/30" };
    } else if (Math.abs(deltaBps) <= 5) {
      return { label: "Neutral / Data-Dependent", class: "text-zinc-300 bg-zinc-800/60 border-zinc-700" };
    } else if (outcome === "HOLD" && deltaBps < -5) {
      return { label: "Dovish Hold", class: "text-amber-300 bg-amber-950/50 border-amber-500/30" };
    } else if (deltaBps <= -6 && deltaBps > -18) {
      return { label: "Dovish Pivot", class: "text-rose-300 bg-rose-950/50 border-rose-500/30" };
    } else {
      return { label: "Strongly Dovish", class: "text-rose-400 bg-rose-950/80 border-rose-500/50" };
    }
  };

  // --- Currency Strength Mathematical Evaluator ---
  const parseInputValue = (input: any, type: string): number | null => {
    if (input === null || input === undefined || input === '') return null;
    const strVal = input.toString().trim().toUpperCase().replace('K', '');
    if (strVal === '-' || strVal === 'N/A') return null;
    const isExplicitPercent = strVal.includes('%');
    const num = parseFloat(strVal.replace('%', ''));
    if (isNaN(num)) return null;
    const percentTypes = ["CPI", "UNEMP_RATE", "PCT_GROWTH", "EUR_UNEMP_FIXED", "CARD_TRANS"];
    if (percentTypes.includes(type) && (isExplicitPercent || Math.abs(num) >= 0.08)) return num / 100.0;
    return num;
  };

  const evaluateIndicator = (ind: MacroIndicator) => {
    let netChange = 0;
    if (ind.actual !== null && ind.previous !== null) {
      netChange = ind.actual - ind.previous;
    }
    netChange = parseFloat(netChange.toFixed(4));
    let score = 0;

    switch (ind.type) {
      case "PMI":
      case "AUD_SERVICES":
        if (netChange >= 2.0) score = 2;
        else if (netChange >= 0.5) score = 1;
        else if (netChange > -0.5) score = 0;
        else if (netChange > -2.0) score = -1;
        else score = -2;
        break;
      case "CPI":
      case "PCT_GROWTH":
      case "GBP_RETAIL":
      case "CARD_TRANS":
        if (netChange >= 0.003) score = 2;
        else if (netChange >= 0.001) score = 1;
        else if (netChange > -0.001) score = 0;
        else if (netChange > -0.003) score = -1;
        else score = -2;
        break;
      case "UNEMP_RATE":
      case "EUR_UNEMP_FIXED":
        if (netChange <= -0.002) score = 2;
        else if (netChange <= -0.001) score = 1;
        else if (netChange === 0) score = 0;
        else if (netChange < 0.002) score = -1;
        else score = -2;
        break;
      case "GBP_CLAIMANT":
      case "GER_UNEMP_CHANGE":
      case "CHF_UNEMP_CHANGE":
        if (netChange <= -15.0) score = 2;
        else if (netChange <= -3.0) score = 1;
        else if (netChange < 3.0) score = 0;
        else if (netChange < 15.0) score = -1;
        else score = -2;
        break;
      case "JOBS_K":
      case "CAD_JOBS":
        if (netChange >= 40.0) score = 2;
        else if (netChange >= 10.0) score = 1;
        else if (netChange > -10.0) score = 0;
        else if (netChange > -40.0) score = -1;
        else score = -2;
        break;
      case "NFP":
        if (netChange >= 50) score = 2;
        else if (netChange >= 15) score = 1;
        else if (netChange > -15) score = 0;
        else if (netChange > -50) score = -1;
        else score = -2;
        break;
      case "CONFIDENCE":
      case "INDEX_SMALL":
      case "SURVEY_5":
      case "ANZ_BIZ":
        if (netChange >= 4.0) score = 2;
        else if (netChange >= 1.0) score = 1;
        else if (netChange > -1.0) score = 0;
        else if (netChange > -4.0) score = -1;
        else score = -2;
        break;
      default:
        score = netChange > 0 ? 1 : netChange < 0 ? -1 : 0;
    }
    return { netChange, score };
  };

  const calculateCurrencyTotals = () => {
    const totals: Record<string, number> = {};
    for (const c in currencyIndicators) {
      let sum = 0;
      currencyIndicators[c].forEach((ind) => {
        const res = evaluateIndicator(ind);
        sum += res.score;
      });
      totals[c] = sum;
    }
    return totals;
  };

  const currencyTotals = calculateCurrencyTotals();

  // 28 Cross Pairs Directional Bias Calculation
  const pairsBiasData = PAIRS_LIST.map((pair) => {
    const base = pair.substring(0, 3);
    const quote = pair.substring(3, 6);
    const diff = (currencyTotals[base] || 0) - (currencyTotals[quote] || 0);
    const absDiff = Math.abs(diff);
    const longPct = Math.max(5, Math.min(95, Math.round(50 + diff * 2.5)));
    const shortPct = 100 - longPct;

    let biasText = 'NEUTRAL';
    let badgeBg = 'bg-[#111116] text-zinc-400 border-zinc-800';
    if (diff >= 8) {
      biasText = 'STRONG BULL';
      badgeBg = 'bg-cyan-950/60 text-cyan-400 border-cyan-700/60';
    } else if (diff >= 3) {
      biasText = 'BULLISH';
      badgeBg = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
    } else if (diff <= -8) {
      biasText = 'STRONG BEAR';
      badgeBg = 'bg-rose-950/60 text-rose-400 border-rose-700/60';
    } else if (diff <= -3) {
      biasText = 'BEARISH';
      badgeBg = 'bg-orange-950/40 text-orange-400 border-orange-800/40';
    }

    return { pair, diff, absDiff, longPct, shortPct, biasText, badgeBg };
  });

  const filteredPairs = pairsBiasData
    .filter((p) => {
      if (currencyFilter === 'strong') return p.absDiff >= 8;
      if (currencyFilter === 'bullish') return p.diff > 0;
      if (currencyFilter === 'bearish') return p.diff < 0;
      return true;
    })
    .sort((a, b) => {
      if (currencySort === 'divergence') return b.absDiff - a.absDiff;
      if (currencySort === 'bullish') return b.diff - a.diff;
      if (currencySort === 'bearish') return a.diff - b.diff;
      return 0;
    });

  const updateIndicatorValue = (curr: string, idx: number, field: keyof MacroIndicator, rawVal: string) => {
    setCurrencyIndicators((prev) => {
      const list = [...prev[curr]];
      const item = { ...list[idx] };
      if (field === 'date' || field === 'name' || field === 'weight' || field === 'type') {
        (item[field] as any) = rawVal;
      } else {
        (item[field] as any) = parseInputValue(rawVal, item.type);
      }
      list[idx] = item;
      return { ...prev, [curr]: list };
    });
  };

  const handleExportData = () => {
    const jsonStr = JSON.stringify(currencyIndicators, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kairos_valuation_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          setCurrencyIndicators(parsed);
          alert('Backup restored successfully!');
        }
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    if (confirm("Reset indicators to default baseline?")) {
      setCurrencyIndicators(DEFAULT_CURRENCY_INDICATORS);
      localStorage.removeItem('forex_dashboard_data_v2');
    }
  };

  return (
    <div className="w-full flex flex-col">
      
      {/* SECTION 1: HERO HEADER (Full Width, Alternating Dark #020203) */}
      <section className="relative w-full py-12 sm:py-16 border-b border-zinc-900 bg-[#020203]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center gap-3 font-mono">
            <span className="text-cyan-500 font-bold text-[10px] sm:text-[11px] tracking-[0.25em] uppercase">
              // SYSTEM OPERATIONS SUITE
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-emerald-400 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ALL ENGINES ONLINE
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight">
            {t.tools.title}
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 font-sans max-w-3xl font-light leading-relaxed">
            {t.tools.subtitle}
          </p>
        </div>
      </section>

      {/* SUB-NAVIGATION BAR - STICKY FULL WIDTH */}
      <div className="w-full bg-[#040406] border-b border-zinc-900 py-3.5 sticky top-20 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar font-mono text-xs">
          {[
            { id: 'all', label: t.tools.subTabs.all },
            { id: 'calendar-filter', label: t.tools.subTabs.calendarFilter, isPrimary: true },
            { id: 'currency-strength', label: t.tools.subTabs.currencyStrength },
            { id: 'volatility', label: t.tools.subTabs.volatility },
            { id: 'calculator', label: t.tools.subTabs.calculator },
            { id: 'central-banks', label: t.tools.subTabs.centralBanks },
            { id: 'consensus', label: t.tools.subTabs.consensus },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id as ToolSubTab)}
              className={`px-3 py-1.5 rounded-sm uppercase tracking-wider text-[11px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : tab.isPrimary
                  ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-700/70 hover:border-cyan-400 hover:text-white font-semibold'
                  : 'bg-[#0c0c12] text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {tab.isPrimary && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-VIEW: SUITE HUB OVERVIEW (Alternating Clear Full-Width Sections) */}
      {activeTab === 'all' && (
        <>
          {/* SECTION SEPARATION DIVIDER BAR */}
          <SectionDivider label="// DIVISION 01 • CALENDAR FILTERING & SENTIMENT" />

          {/* SECTION 1: MACRO RISK & CALENDAR ENGINES (Dark Grey #121316) */}
          <section className="w-full py-16 sm:py-24 border-b border-zinc-800/40 bg-[#121316]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-800/40">
                <div>
                  <span className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                    Event Risk & Pipeline
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    Macro Filter & Sentiment Engines
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-md font-light leading-relaxed">
                  Real-time event filtering across G10 markets, country selection, and live currency strength divergence calculations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. CALENDAR FILTER TOOL - HIGHLIGHTED PRIMARY */}
                <div
                  onClick={() => handleTabSwitch('calendar-filter')}
                  className="group bg-[#040406] border-2 border-cyan-500/50 hover:border-cyan-400 p-6 sm:p-8 rounded-sm transition-all cursor-pointer flex flex-col justify-between shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-125 transition-transform" />
                  
                  <div className="space-y-4 font-mono relative z-10">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-cyan-400 font-bold uppercase tracking-widest">// CALENDAR_FILTER_V2</span>
                      <span className="bg-cyan-950 text-cyan-300 border border-cyan-700/80 px-2.5 py-0.5 rounded-sm font-bold uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                        PRIMARY ENGINE
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-wide">
                      Kairos Macro Hub (Motor Unificado)
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed font-light">
                      Motor de análisis macro, calendario inteligente y escáner de divergencias. Incluye importación Excel (.xlsx) de Investing.com, reglas Core para G10, escáner de divergencias en pares aprobados, puntuación intermercado y reportes imprimibles.
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-between items-center font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider relative z-10">
                    <span>Abrir Motor de Riesgo y Divergencias</span>
                    <span className="group-hover:translate-x-2 transition-transform text-base">&rarr;</span>
                  </div>
                </div>

                {/* 2. CURRENCY STRENGTH ENGINE - HIGHLIGHTED PRIMARY */}
                <div
                  onClick={() => handleTabSwitch('currency-strength')}
                  className="group bg-[#040406] border border-zinc-800 hover:border-cyan-500/50 p-6 sm:p-8 rounded-sm transition-all cursor-pointer flex flex-col justify-between shadow-2xl relative overflow-hidden"
                >
                  <div className="space-y-4 font-mono">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 uppercase tracking-widest">// VALUATION_INDEX_V2</span>
                      <span className="bg-zinc-900 text-cyan-400 border border-cyan-900/50 px-2.5 py-0.5 rounded-sm font-bold uppercase">
                        28 CROSS PAIRS
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-wide">
                      Currency Strength & Valuation Engine
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed font-light">
                      Fundamental valuation dashboard tracking economic indicators across 8 major currencies. Computes directional bias ratios, divergence rankings, and editable actual/forecast values.
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-between items-center font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider">
                    <span>Open Valuation Console</span>
                    <span className="group-hover:translate-x-2 transition-transform text-base">&rarr;</span>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* SECTION SEPARATION DIVIDER BAR */}
          <SectionDivider label="// DIVISION 02 • VOLATILITY & RISK SIZING" />

          {/* SECTION 2: VOLATILITY & SIZING EXECUTION (Obsidian Dark #040406) */}
          <section className="w-full py-16 sm:py-24 border-b border-zinc-800/40 bg-[#040406]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-800/40">
                <div>
                  <span className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                    Risk Management
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    Volatility & Position Sizing
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-md font-light">
                  Statistical range realizations and mathematical invalidation positioning for capital preservation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Volatility Index */}
                <div
                  onClick={() => handleTabSwitch('volatility')}
                  className="group bg-[#040406] border border-zinc-900 hover:border-cyan-500/50 p-6 sm:p-8 rounded-sm transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3 font-mono">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 uppercase">// MATRIX_V3</span>
                      <span className="text-cyan-400 font-bold uppercase">70-DAY CYCLE</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase">
                      Volatility Index
                    </h3>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed font-light">
                      Realized variance matrix calculating average daily pip ranges, 100k cash equivalencies, and % realized ranges for 28 currency pairs.
                    </p>
                  </div>
                  <div className="mt-8 pt-3 border-t border-zinc-900 flex justify-between font-mono text-xs text-cyan-500 font-bold uppercase">
                    <span>Open Volatility Grid</span>
                    <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </div>
                </div>

                {/* Risk Calculator */}
                <div
                  onClick={() => handleTabSwitch('calculator')}
                  className="group bg-[#040406] border border-zinc-900 hover:border-emerald-500/50 p-6 sm:p-8 rounded-sm transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3 font-mono">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 uppercase">// RISK_MODEL_V1</span>
                      <span className="text-emerald-400 font-bold uppercase">PARITY SIZING</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors uppercase">
                      Risk & Position Size Calculator
                    </h3>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed font-light">
                      Calculate standard lot sizes and pip cash values based on invalidation points, account equity, and dynamic cross-rate parities.
                    </p>
                  </div>
                  <div className="mt-8 pt-3 border-t border-zinc-900 flex justify-between font-mono text-xs text-emerald-400 font-bold uppercase">
                    <span>Launch Calculator</span>
                    <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* SECTION SEPARATION DIVIDER BAR */}
          <SectionDivider label="// DIVISION 03 • POLICY & CONSENSUS RADAR" />

          {/* SECTION 3: CENTRAL BANK & CONSENSUS INTELLIGENCE (Dark Grey #121316) */}
          <section className="w-full py-16 sm:py-24 border-b border-zinc-800/40 bg-[#121316]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-800/40">
                <div>
                  <span className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                    Central Banks & Data
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    Policy Expectations & Consensus
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-md font-light">
                  Implied forward rates, policy classification, and economic surprise indicators.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Central Bank Terminal */}
                <div
                  onClick={() => handleTabSwitch('central-banks')}
                  className="group bg-[#040406] border border-zinc-900 hover:border-cyan-500/50 p-6 rounded-sm transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3 font-mono">
                    <span className="text-cyan-400 text-[10px] font-bold uppercase">// POLICY_RADAR_V2</span>
                    <h3 className="text-base font-bold text-white uppercase tracking-wide">
                      Central Bank Rate Terminal
                    </h3>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed font-light">
                      Monetary policy rate expectations, automated Hawkish/Dovish classifications, and decision countdown timers.
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-zinc-900 flex justify-between font-mono text-xs text-cyan-500 font-bold uppercase">
                    <span>Open Bank Terminal</span>
                    <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </div>
                </div>

                {/* Consensus Engine */}
                <div
                  onClick={() => handleTabSwitch('consensus')}
                  className="group bg-[#040406] border border-zinc-900 hover:border-cyan-500/50 p-6 rounded-sm transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3 font-mono">
                    <span className="text-cyan-400 text-[10px] font-bold uppercase">// EXPECTATIONS_V1</span>
                    <h3 className="text-base font-bold text-white uppercase tracking-wide">
                      Consensus Filter Hub
                    </h3>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed font-light">
                      Macroeconomic expectation ranges, actual result deviations, and Beat/Miss surprise tracking.
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-zinc-900 flex justify-between font-mono text-xs text-cyan-500 font-bold uppercase">
                    <span>Open Consensus Hub</span>
                    <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </div>
                </div>

              </div>

            </div>
          </section>
        </>
      )}

      {/* SUB-VIEW: CALENDAR FILTER TOOL (Kairos Macro Hub - Motor Unificado de Riesgo y Divergencias) */}
      {activeTab === 'calendar-filter' && (
        <div className="w-full space-y-0">
          <SectionDivider label={language === 'es' ? '// DIVISIÓN 01 • MOTOR UNIFICADO DE RIESGO Y DIVERGENCIAS' : '// DIVISION 01 • UNIFIED MACRO RISK & DIVERGENCES'} />
          <KairosMacroHub onReturnToHub={() => handleTabSwitch('all')} language={language} />
        </div>
      )}

      {/* SUB-VIEW: CURRENCY STRENGTH & VALUATION ENGINE */}
      {activeTab === 'currency-strength' && (
        <div className="w-full space-y-0">
          
          {/* Section 1: Valuation Scorecards & Ranking (Alternating Dark #020203) */}
          <section className="w-full py-12 sm:py-16 border-b border-zinc-900 bg-[#020203]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-mono">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-900">
                <div>
                  <span className="text-cyan-500 text-[10px] font-bold uppercase tracking-widest block">
                    // AGGREGATE G10 SCOREBOARD
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                    Currency Strength Matrix
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <button
                    onClick={handleExportData}
                    className="px-3 py-1.5 text-[10px] uppercase tracking-wider bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 rounded-sm border border-cyan-800/60 transition cursor-pointer font-bold"
                  >
                    Export Backup
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-[10px] uppercase tracking-wider bg-[#0c0c12] hover:bg-zinc-800 text-zinc-300 rounded-sm border border-zinc-800 transition cursor-pointer"
                  >
                    Import Backup
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                  <button
                    onClick={handleResetData}
                    className="px-3 py-1.5 text-[10px] uppercase tracking-wider bg-[#0c0c12] hover:bg-zinc-800 text-rose-400 rounded-sm border border-zinc-800 transition cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>

              {/* 8 Currency Scorecards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {Object.keys(currencyTotals).map((curr) => {
                  const score = currencyTotals[curr];
                  const isSelected = currencyActiveTab === curr;
                  return (
                    <div
                      key={curr}
                      onClick={() => setCurrencyActiveTab(curr)}
                      className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                          : 'bg-[#0d0e12] border-zinc-800/80 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest">{curr}</div>
                        <div className={`text-2xl font-black mt-1 ${
                          score > 0 ? 'text-cyan-400' : score < 0 ? 'text-rose-400' : 'text-zinc-500'
                        }`}>
                          {score > 0 ? `+${score}` : score}
                        </div>
                      </div>

                      {/* Mini Bipolar Currency Strength Chart Meter */}
                      <div className="mt-2.5 w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800 relative">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-700 z-10 -ml-px" />
                        <div className="w-1/2 flex justify-end">
                          {score < 0 && (
                            <div
                              className="bg-rose-500 h-full rounded-l-full shadow-[0_0_6px_rgba(244,63,94,0.7)]"
                              style={{ width: `${Math.min(100, (Math.abs(score) / 10) * 100)}%` }}
                            />
                          )}
                        </div>
                        <div className="w-1/2 flex justify-start">
                          {score > 0 && (
                            <div
                              className="bg-cyan-400 h-full rounded-r-full shadow-[0_0_6px_rgba(34,211,238,0.7)]"
                              style={{ width: `${Math.min(100, (score / 10) * 100)}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CURRENCY VALUATION RANKING MATRIX BAR CHART */}
              <div className="pt-2">
                <ValuationRankingChart
                  totals={currencyTotals}
                  selectedCurrency={currencyActiveTab === 'dashboard' ? 'USD' : currencyActiveTab}
                  onSelectCurrency={(curr) => setCurrencyActiveTab(curr)}
                />
              </div>

            </div>
          </section>

          {/* Section 2: 28 Cross-Pair Directional Bias Engine (Dark Grey #121316) */}
          <section className="w-full py-12 sm:py-16 border-b border-zinc-800/40 bg-[#121316]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-mono">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-800/60">
                <div>
                  <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider block">
                    Spread Differentials
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                    Directional Bias Engine (28 Pairs)
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1 bg-[#181920] border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-400">
                    <span>Sort:</span>
                    <select
                      value={currencySort}
                      onChange={(e) => setCurrencySort(e.target.value as any)}
                      className="bg-transparent text-zinc-200 font-bold outline-none cursor-pointer"
                    >
                      <option value="divergence" className="bg-[#181920]">Max Divergence (|Diff|)</option>
                      <option value="bullish" className="bg-[#181920]">Most Bullish (+Diff)</option>
                      <option value="bearish" className="bg-[#181920]">Most Bearish (-Diff)</option>
                      <option value="default" className="bg-[#181920]">Default Pair Order</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 bg-[#181920] border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-400">
                    <span>Filter:</span>
                    <select
                      value={currencyFilter}
                      onChange={(e) => setCurrencyFilter(e.target.value as any)}
                      className="bg-transparent text-zinc-200 font-bold outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-[#181920]">All Pairs (28)</option>
                      <option value="strong" className="bg-[#181920]">Strong Div (≥ 8)</option>
                      <option value="bullish" className="bg-[#181920]">Bullish Only</option>
                      <option value="bearish" className="bg-[#181920]">Bearish Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 28 Pairs Grid - Rendered in a Single Column as requested */}
              <div className="grid grid-cols-1 gap-3 max-w-3xl mx-auto">
                {filteredPairs.map((p) => (
                  <div key={p.pair} className="bg-[#0c0d11] p-4 rounded-xl border border-zinc-800/80 hover:border-cyan-500/50 transition-colors space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm tracking-wide">{p.pair}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${p.badgeBg}`}>
                          {p.biasText}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 uppercase">
                        Spread: <span className="font-bold text-white">{p.diff > 0 ? `+${p.diff}` : p.diff}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-rose-400 font-bold w-7 text-right tabular-nums">{p.shortPct}%</span>
                      <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-700/60">
                        <div className="bg-rose-500 h-full" style={{ width: `${p.shortPct}%` }} />
                        <div className="bg-cyan-500 h-full" style={{ width: `${p.longPct}%` }} />
                      </div>
                      <span className="text-cyan-400 font-bold w-7 tabular-nums">{p.longPct}%</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>

          {/* Section 3: Detailed Indicator Inputs & Breakdown Table (Alternating Dark #020203) */}
          <section className="w-full py-12 sm:py-16 border-b border-zinc-900 bg-[#020203]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-mono">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-900">
                <div className="space-y-1">
                  <span className="text-cyan-500 text-[10px] font-bold uppercase tracking-widest block">
                    // MACROECONOMIC METRICS BREAKDOWN
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                    {currencyActiveTab === 'dashboard' ? 'USD' : currencyActiveTab} Indicators (Editable Live)
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                  {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrencyActiveTab(c)}
                      className={`px-3 py-1 rounded-sm uppercase tracking-wider text-[10px] transition cursor-pointer ${
                        (currencyActiveTab === c || (currencyActiveTab === 'dashboard' && c === 'USD'))
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'bg-[#0c0c12] text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fundamental Factor Breakdown Chart for Selected Currency */}
              <CurrencyIndicatorChart
                currency={currencyActiveTab === 'dashboard' ? 'USD' : currencyActiveTab}
                indicators={(currencyIndicators[currencyActiveTab === 'dashboard' ? 'USD' : currencyActiveTab] || []).map(ind => {
                  const evalResult = evaluateIndicator(ind);
                  return {
                    ...ind,
                    score: evalResult.score,
                    netChange: evalResult.netChange
                  };
                })}
                totalScore={currencyTotals[currencyActiveTab === 'dashboard' ? 'USD' : currencyActiveTab] || 0}
              />

              {/* Indicator Table */}
              <div className="bg-[#040406] border border-zinc-900 rounded-sm overflow-x-auto shadow-2xl">
                <table className="w-full text-left font-mono text-xs min-w-[700px]">
                  <thead>
                    <tr className="text-zinc-500 text-[10px] border-b border-zinc-900 uppercase tracking-wider bg-[#07080d]">
                      <th className="p-3.5 pl-6">Indicator Name</th>
                      <th className="p-3.5 w-36">Release Date</th>
                      <th className="p-3.5 w-28">Previous</th>
                      <th className="p-3.5 w-28">Forecast</th>
                      <th className="p-3.5 w-28">Actual</th>
                      <th className="p-3.5 text-right">Net Change</th>
                      <th className="p-3.5 text-center">Score</th>
                      <th className="p-3.5 text-right pr-6">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {(currencyIndicators[currencyActiveTab === 'dashboard' ? 'USD' : currencyActiveTab] || []).map((ind, idx) => {
                      const evaluated = evaluateIndicator(ind);
                      const isPercentType = ["CPI", "UNEMP_RATE", "PCT_GROWTH", "EUR_UNEMP_FIXED", "CARD_TRANS"].includes(ind.type);
                      const formatDisplay = (val: number | null) => (val === null ? '' : isPercentType ? (val * 100).toFixed(2) + '%' : val);
                      const curr = currencyActiveTab === 'dashboard' ? 'USD' : currencyActiveTab;

                      return (
                        <tr key={ind.name} className="hover:bg-[#08080f] transition-colors">
                          <td className="p-3.5 pl-6 font-bold text-white">{ind.name}</td>
                          <td className="p-3.5">
                            <input
                              type="date"
                              value={ind.date || ''}
                              onChange={(e) => updateIndicatorValue(curr, idx, 'date', e.target.value)}
                              className="w-full bg-[#0c0c12] border border-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-sm outline-none focus:border-cyan-500 font-mono"
                            />
                          </td>
                          <td className="p-3.5">
                            <input
                              type="text"
                              value={formatDisplay(ind.previous)}
                              onChange={(e) => updateIndicatorValue(curr, idx, 'previous', e.target.value)}
                              className="w-full bg-[#0c0c12] border border-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-sm outline-none focus:border-cyan-500 font-mono"
                            />
                          </td>
                          <td className="p-3.5">
                            <input
                              type="text"
                              value={formatDisplay(ind.forecast)}
                              onChange={(e) => updateIndicatorValue(curr, idx, 'forecast', e.target.value)}
                              className="w-full bg-[#0c0c12] border border-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-sm outline-none focus:border-cyan-500 font-mono"
                            />
                          </td>
                          <td className="p-3.5">
                            <input
                              type="text"
                              value={formatDisplay(ind.actual)}
                              onChange={(e) => updateIndicatorValue(curr, idx, 'actual', e.target.value)}
                              className="w-full bg-[#0c0c12] border border-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-sm outline-none focus:border-cyan-500 font-mono"
                            />
                          </td>
                          <td className="p-3.5 text-right tabular-nums text-zinc-300">
                            {evaluated.netChange > 0 ? `+${evaluated.netChange}` : evaluated.netChange}
                          </td>
                          <td className="p-3.5 text-center font-bold">
                            <span className={evaluated.score > 0 ? 'text-cyan-400' : evaluated.score < 0 ? 'text-rose-400' : 'text-zinc-500'}>
                              {evaluated.score > 0 ? `+${evaluated.score}` : evaluated.score}
                            </span>
                          </td>
                          <td className="p-3.5 text-right pr-6 text-zinc-500">{ind.weight}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </section>

        </div>
      )}

      {/* SUB-VIEW: VOLATILITY MATRIX */}
      {activeTab === 'volatility' && (
        <section className="w-full py-12 sm:py-16 border-b border-zinc-900 bg-[#020203]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-900">
              <div>
                <span className="text-cyan-500 text-[10px] font-bold uppercase tracking-widest block">
                  // REALIZED VARIANCE TABLE
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                  Currency Pair Daily Average Volatility
                </h2>
              </div>
              <input
                type="text"
                value={volatilitySearch}
                onChange={(e) => setVolatilitySearch(e.target.value)}
                placeholder="Filter by pair (e.g. JPY, EUR)..."
                className="bg-[#0c0c12] border border-zinc-800 text-white text-xs px-3 py-1.5 rounded-sm outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="bg-[#040406] border border-zinc-900 rounded-sm overflow-x-auto shadow-2xl">
              <table className="w-full text-left font-mono text-xs min-w-[620px]">
                <thead>
                  <tr className="text-zinc-500 text-[10px] border-b border-zinc-900 uppercase tracking-wider bg-[#07080d]">
                    <th onClick={() => toggleVolSort('symbol')} className="p-3.5 pl-4 cursor-pointer hover:text-cyan-400">
                      Pair Symbol {volatilitySort === 'symbol' && (volatilitySortAsc ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleVolSort('pips')} className="p-3.5 text-right cursor-pointer hover:text-cyan-400">
                      Avg Daily Pips {volatilitySort === 'pips' && (volatilitySortAsc ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleVolSort('cash')} className="p-3.5 text-right cursor-pointer hover:text-cyan-400">
                      $ Cash Value (100k) {volatilitySort === 'cash' && (volatilitySortAsc ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleVolSort('range')} className="p-3.5 text-right pr-4 cursor-pointer hover:text-cyan-400">
                      % Realized Range {volatilitySort === 'range' && (volatilitySortAsc ? '▲' : '▼')}
                    </th>
                    <th className="p-3.5 text-center">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {sortedVolatility.map((p) => (
                    <tr key={p.symbol} className="hover:bg-[#08080f] transition-colors">
                      <td className="p-3.5 pl-4 font-bold text-zinc-100">{p.symbol}</td>
                      <td className="p-3.5 text-right tabular-nums text-zinc-300 font-semibold">{p.avgPips.toFixed(1)}</td>
                      <td className="p-3.5 text-right tabular-nums text-zinc-400">${p.cashValue100k.toFixed(2)}</td>
                      <td className="p-3.5 text-right pr-4 tabular-nums text-cyan-400 font-bold">{p.rangePct.toFixed(2)}%</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          p.tier === 'High'
                            ? 'bg-rose-950/40 text-rose-300 border-rose-900/50'
                            : p.tier === 'Medium'
                            ? 'bg-cyan-950/40 text-cyan-300 border-cyan-900/50'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}>
                          {p.tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* SUB-VIEW: RISK CALCULATOR */}
      {activeTab === 'calculator' && (
        <section className="w-full py-12 sm:py-16 border-b border-zinc-900 bg-[#020203]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-mono">
            <div className="pb-4 border-b border-zinc-900">
              <span className="text-cyan-500 text-[10px] font-bold uppercase tracking-widest block">
                // MATHEMATICAL SIZING ENGINE
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                Risk & Position Size Calculator
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#040406] border border-zinc-900 p-6 rounded-sm space-y-4">
                <span className="text-zinc-500 text-[10px] uppercase tracking-widest block pb-2 border-b border-zinc-900">
                  // INPUT PARAMETERS
                </span>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase">Account Base Currency</label>
                  <select
                    value={calcAcctCurr}
                    onChange={(e) => setCalcAcctCurr(e.target.value)}
                    className="w-full bg-[#0c0c12] border border-zinc-800 text-white text-xs p-2.5 rounded-sm outline-none focus:border-cyan-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase">Currency Pair</label>
                  <select
                    value={calcPair}
                    onChange={(e) => setCalcPair(e.target.value)}
                    className="w-full bg-[#0c0c12] border border-zinc-800 text-white text-xs p-2.5 rounded-sm outline-none focus:border-cyan-500"
                  >
                    {PAIRS_LIST.map((p) => (
                      <option key={p} value={p}>{p.substring(0, 3)}/{p.substring(3, 6)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase">Account Balance ({calcAcctCurr})</label>
                  <input
                    type="number"
                    value={calcBalance}
                    onChange={(e) => setCalcBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0c0c12] border border-zinc-800 text-white text-xs p-2.5 rounded-sm outline-none focus:border-cyan-500 tabular-nums"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase">Risk Allocation (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcRiskPct}
                    onChange={(e) => setCalcRiskPct(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0c0c12] border border-zinc-800 text-white text-xs p-2.5 rounded-sm outline-none focus:border-cyan-500 tabular-nums"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase">Stop Loss Distance (Pips)</label>
                  <input
                    type="number"
                    value={calcStopPips}
                    onChange={(e) => setCalcStopPips(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0c0c12] border border-zinc-800 text-white text-xs p-2.5 rounded-sm outline-none focus:border-cyan-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="bg-[#07080d] border border-zinc-800 p-6 rounded-sm flex flex-col justify-between space-y-6">
                <div className="space-y-6">
                  <span className="text-zinc-500 text-[10px] uppercase tracking-widest block pb-2 border-b border-zinc-800">
                    // SIZING ALLOCATION OUTPUT
                  </span>

                  <div className="space-y-4 divide-y divide-zinc-800/80 text-xs">
                    <div className="pt-1 flex justify-between items-center">
                      <span className="text-zinc-400 uppercase">Absolute Cash Risk:</span>
                      <span className="text-xl font-bold text-rose-400 tabular-nums">
                        ${riskResult.cashRisk.toFixed(2)} {calcAcctCurr}
                      </span>
                    </div>

                    <div className="pt-3 flex justify-between items-center">
                      <span className="text-zinc-400 uppercase">Recommended Position Size:</span>
                      <span className="text-2xl font-black text-cyan-400 tabular-nums">
                        {riskResult.standardLots} <span className="text-xs font-normal text-zinc-500">Lots</span>
                      </span>
                    </div>

                    <div className="pt-3 flex justify-between items-center">
                      <span className="text-zinc-400 uppercase">Running Pip Value (Total Position):</span>
                      <span className="text-sm font-semibold text-zinc-200 tabular-nums">
                        ${riskResult.pipValue.toFixed(2)} {calcAcctCurr} / pip
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-[#040406] border border-zinc-800 rounded-sm text-[10px] text-zinc-500 leading-relaxed font-sans font-light">
                  Standard contract assumes 100,000 units. Conversions dynamically reflect G10 currency parities.
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SUB-VIEW: CENTRAL BANK TERMINAL */}
      {activeTab === 'central-banks' && (
        <section className="w-full py-12 sm:py-16 border-b border-zinc-900 bg-[#020203]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-900">
              <div>
                <span className="text-cyan-500 text-[10px] font-bold uppercase tracking-widest block">
                  // MONETARY POLICY MATRIX
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                  G10 Central Bank Terminal
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 uppercase">Filter:</span>
                <select
                  value={selectedBankKey}
                  onChange={(e) => setSelectedBankKey(e.target.value)}
                  className="bg-[#0c0c12] border border-zinc-800 text-white text-xs px-3 py-1.5 rounded-sm outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="Overview">Overview (All Banks)</option>
                  {Object.keys(CENTRAL_BANKS).map((k) => (
                    <option key={k} value={k}>{CENTRAL_BANKS[k].name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-[#040406] border border-zinc-900 rounded-sm overflow-x-auto shadow-2xl">
              <table className="w-full text-left font-mono text-xs min-w-[680px]">
                <thead>
                  <tr className="text-zinc-500 text-[10px] border-b border-zinc-900 uppercase tracking-wider bg-[#07080d]">
                    <th className="p-3.5 pl-4">Next Decision</th>
                    <th className="p-3.5">Central Bank</th>
                    <th className="p-3.5 text-center">Current Rate</th>
                    <th className="p-3.5 text-center">Implied Rate</th>
                    <th className="p-3.5 text-center">Delta (bps)</th>
                    <th className="p-3.5 text-center">Probability</th>
                    <th className="p-3.5 text-center">Automated Tone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {Object.values(CENTRAL_BANKS).map((b) => {
                    const deltaBps = (b.impliedRate - b.currentRate) * 100;
                    const prob = Math.min(Math.max(Math.abs(deltaBps) / (b.step * 100) * 100, 0), 100);
                    const outcome = deltaBps > (b.step * 50) ? "HIKE" : deltaBps < -(b.step * 50) ? "CUT" : "HOLD";
                    const tone = classifyTone(deltaBps, outcome);

                    return (
                      <tr key={b.code} className="hover:bg-[#08080f] transition-colors">
                        <td className="p-3.5 pl-4 text-zinc-400 font-bold">{b.nextMeeting.split('T')[0]}</td>
                        <td className="p-3.5 font-bold text-white">{b.name}</td>
                        <td className="p-3.5 text-center text-zinc-200 tabular-nums">{b.currentRate.toFixed(2)}%</td>
                        <td className="p-3.5 text-center text-cyan-400 font-bold tabular-nums">{b.impliedRate.toFixed(2)}%</td>
                        <td className="p-3.5 text-center tabular-nums text-zinc-300">
                          {deltaBps > 0 ? '+' : ''}{deltaBps.toFixed(1)}
                        </td>
                        <td className="p-3.5 text-center tabular-nums text-zinc-400">{prob.toFixed(0)}%</td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold border tracking-wide ${tone.class}`}>
                            {tone.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* SUB-VIEW: CONSENSUS ENGINE */}
      {activeTab === 'consensus' && (
        <section className="w-full py-12 sm:py-16 border-b border-zinc-900 bg-[#020203]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-900">
              <div>
                <span className="text-cyan-500 text-[10px] font-bold uppercase tracking-widest block">
                  // EXPECTATIONS & REACTION MATRIX
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                  Consensus Filter Hub
                </h2>
              </div>
              <input
                type="text"
                value={consensusSearch}
                onChange={(e) => setConsensusSearch(e.target.value)}
                placeholder="Search indicator..."
                className="bg-[#0c0c12] border border-zinc-800 text-white text-xs px-3 py-1.5 rounded-sm outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="bg-[#040406] border border-zinc-900 rounded-sm overflow-x-auto shadow-2xl">
              <table className="w-full text-left font-mono text-xs min-w-[720px]">
                <thead>
                  <tr className="text-zinc-500 text-[10px] border-b border-zinc-900 uppercase tracking-wider bg-[#07080d]">
                    <th className="p-3.5 pl-4">Time (UTC)</th>
                    <th className="p-3.5">Jurisdiction</th>
                    <th className="p-3.5">Economic Indicator</th>
                    <th className="p-3.5 text-center">Consensus</th>
                    <th className="p-3.5 text-center">Expectation Range</th>
                    <th className="p-3.5 text-center">Prior</th>
                    <th className="p-3.5 text-center">Outcome Evaluator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {consensusEvents.map((e) => (
                    <tr
                      key={e.id}
                      className={`transition-colors ${
                        e.status === 'green'
                          ? 'bg-emerald-950/20 text-emerald-100'
                          : e.status === 'red'
                          ? 'bg-rose-950/20 text-rose-100'
                          : 'hover:bg-[#08080f] text-zinc-300'
                      }`}
                    >
                      <td className="p-3.5 pl-4 text-zinc-400 tabular-nums">{e.time}</td>
                      <td className="p-3.5 font-bold text-cyan-400">{e.country}</td>
                      <td className="p-3.5 font-sans font-medium text-zinc-100">{e.indicator}</td>
                      <td className="p-3.5 text-center text-cyan-300 font-bold">{e.consensus}</td>
                      <td className="p-3.5 text-center text-zinc-400">{e.range}</td>
                      <td className="p-3.5 text-center text-zinc-500">{e.prior}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            setConsensusEvents((prev) =>
                              prev.map((ev) =>
                                ev.id === e.id
                                  ? { ...ev, status: ev.status === 'none' ? 'green' : ev.status === 'green' ? 'red' : 'none' }
                                  : ev
                              )
                            );
                          }}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                            e.status === 'green'
                              ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                              : e.status === 'red'
                              ? 'bg-rose-500/30 text-rose-300 border-rose-500/50'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {e.status === 'green' ? '🟢 BEAT' : e.status === 'red' ? '🔴 MISS' : '⚪ EVALUATE'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
