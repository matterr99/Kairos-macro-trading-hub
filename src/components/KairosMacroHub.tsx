import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Language } from '../types';

interface MacroEvent {
  time: string;
  ccy: string;
  event: string;
  actual: string;
  forecast: string;
  previous: string;
  coreRuleId?: string | null;
  isCore?: boolean;
}

interface CategoryScore {
  ccy: string;
  score: number;
  title: string;
  eventsSummary: string;
}

interface PrevBreakdownItem {
  label: string;
  score: number;
}

interface MacroHubState {
  daysData: Record<string, MacroEvent[]>;
  categoryScores: Record<string, CategoryScore>;
  matrixEvents: Record<string, number>;
  matrixTotals: Record<string, number>;
  matrixPrev: Record<string, number>;
  matrixPrevBreakdown: Record<string, PrevBreakdownItem[]>;
  intermarketScores: Record<string, number>;
  dailyNotes: Record<string, string>;
}

export interface KairosMacroHubProps {
  onReturnToHub?: () => void;
  language?: Language;
}

const CORE_INDICATOR_RULES = [
  // USD - 9 Indicators
  { id: 'USD_ISM_MFG', ccy: 'USD', match: ['ism manufacturing pmi', 'ism mfg', 'ism manufacturing', 'pmi manufacturero del ism'], avoid: ['prices', 'employment', 'orders', 'services', 'non-manufacturing'] },
  { id: 'USD_ISM_SERVICES', ccy: 'USD', match: ['ism non-manufacturing pmi', 'ism services pmi', 'ism services', 'pmi del sector servicios del ism', 'pmi no manufacturero'], avoid: ['prices', 'employment', 'orders'] },
  { id: 'USD_CPI', ccy: 'USD', match: ['cpi', 'consumer price index', 'ipc'], avoid: ['core', 'ex food', 'subyacente'] },
  { id: 'USD_UNEMP', ccy: 'USD', match: ['unemployment rate', 'tasa de desempleo'], avoid: ['youth', 'underemployment'] },
  { id: 'USD_NFP', ccy: 'USD', match: ['nonfarm payrolls', 'non-farm payrolls', 'nfp', 'nominas no agricolas', 'empleo no agricola'], avoid: ['private', 'manufacturing', 'government'] },
  { id: 'USD_RETAIL', ccy: 'USD', match: ['retail sales', 'ventas minoristas'], avoid: ['core', 'ex gas', 'control group', 'subyacente'] },
  { id: 'USD_CB_CONF', ccy: 'USD', match: ['cb consumer confidence', 'confianza del consumidor de the conference board', 'confianza del consumidor de cb'], avoid: ['michigan'] },
  { id: 'USD_NFIB', ccy: 'USD', match: ['nfib small business optimism', 'nfib small business index', 'nfib'], avoid: [] },
  { id: 'USD_GDPNOW', ccy: 'USD', match: ['atlanta fed gdpnow', 'gdpnow', 'atlanta fed gdp'], avoid: [] },

  // EUR - 9 Indicators
  { id: 'EUR_HCOB_MFG', ccy: 'EUR', match: ['hcob euro zone manufacturing pmi', 'hcob eurozone manufacturing', 'euro zone manufacturing pmi', 'pmi manufacturero de la zona euro'], avoid: ['services', 'composite', 'construction', 'italy', 'france', 'spain', 'german'] },
  { id: 'EUR_HCOB_SERV', ccy: 'EUR', match: ['hcob euro zone services pmi', 'hcob eurozone services', 'euro zone services pmi', 'pmi servicios de la zona euro'], avoid: ['mfg', 'manufacturing', 'composite', 'construction', 'italy', 'france', 'spain', 'german'] },
  { id: 'EUR_CPI', ccy: 'EUR', match: ['cpi', 'hicp', 'ipc'], avoid: ['core', 'subyacente', 'tokyo', 'german', 'french', 'spanish', 'italian'] },
  { id: 'EUR_UNEMP', ccy: 'EUR', match: ['euro zone unemployment rate', 'eurozone unemployment rate', 'tasa de desempleo de la zona euro'], avoid: ['youth', 'germany', 'german', 'french', 'spanish', 'italian', 'change', 'cambio'] },
  { id: 'EUR_GER_UNEMP_CHG', ccy: 'EUR', match: ['german unemployment change', 'germany unemployment change', 'cambio del desempleo en alemania'], avoid: ['rate', 'tasa'] },
  { id: 'EUR_RETAIL', ccy: 'EUR', match: ['euro zone retail sales', 'eurozone retail sales', 'ventas minoristas de la zona euro'], avoid: ['german', 'french', 'spanish', 'italian', 'core', 'subyacente'] },
  { id: 'EUR_CONS_CONF', ccy: 'EUR', match: ['euro zone consumer confidence', 'eurozone consumer confidence', 'confianza del consumidor en la zona euro'], avoid: ['business', 'germany', 'german', 'french', 'spanish', 'gfk'] },
  { id: 'EUR_IFO', ccy: 'EUR', match: ['german ifo business climate', 'ifo business climate', 'indice ifo de confianza empresarial'], avoid: ['current assessment', 'expectations'] },
  { id: 'EUR_IND_PROD', ccy: 'EUR', match: ['euro zone industrial production', 'eurozone industrial production', 'produccion industrial de la zona euro'], avoid: ['german', 'french', 'spanish', 'italian'] },

  // GBP - 9 Indicators
  { id: 'GBP_SP_MFG', ccy: 'GBP', match: ['s&p global/cips uk manufacturing pmi', 's&p global uk manufacturing', 'pmi manufacturero reino unido', 'pmi del sector manufacturero de gran bretaña'], avoid: ['services', 'composite', 'construction'] },
  { id: 'GBP_SP_SERV', ccy: 'GBP', match: ['s&p global/cips uk services pmi', 's&p global uk services', 'pmi servicios reino unido', 'pmi del sector servicios de gran bretaña'], avoid: ['mfg', 'manufacturing', 'composite', 'construction'] },
  { id: 'GBP_CPI', ccy: 'GBP', match: ['cpi', 'uk cpi', 'ipc'], avoid: ['core', 'subyacente'] },
  { id: 'GBP_UNEMP', ccy: 'GBP', match: ['unemployment rate', 'tasa de desempleo'], avoid: ['youth', 'claimant'] },
  { id: 'GBP_CLAIMANT', ccy: 'GBP', match: ['claimant count change', 'claimant count', 'evolucion del desempleo (claimant count)'], avoid: ['rate'] },
  { id: 'GBP_RETAIL', ccy: 'GBP', match: ['retail sales', 'ventas minoristas'], avoid: ['ex fuel', 'core', 'subyacente'] },
  { id: 'GBP_GFK', ccy: 'GBP', match: ['gfk consumer confidence', 'confianza del consumidor de gfk'], avoid: [] },
  { id: 'GBP_CBI', ccy: 'GBP', match: ['cbi industrial trends orders', 'pedidos de tendencias industriales segun el cbi'], avoid: ['distributive', 'selling prices'] },
  { id: 'GBP_GDP', ccy: 'GBP', match: ['monthly gdp', 'gdp', 'pib mensual', 'pib'], avoid: ['3m/3m', 'qoq', 'yoy', 'annualized'] },

  // JPY - 9 Indicators
  { id: 'JPY_JIBUN_MFG', ccy: 'JPY', match: ['au jibun bank japan manufacturing', 'jibun bank manufacturing', 'jibun mfg', 'pmi del sector manufacturero de japon'], avoid: ['services', 'composite', 'construction'] },
  { id: 'JPY_JIBUN_SERV', ccy: 'JPY', match: ['au jibun bank japan services', 'jibun bank services', 'jibun services', 'pmi del sector servicios de japon'], avoid: ['mfg', 'manufacturing', 'composite', 'construction'] },
  { id: 'JPY_TOKYO_CPI', ccy: 'JPY', match: ['tokyo cpi', 'tokyo core cpi', 'ipc de tokio'], avoid: ['ex fresh food', 'national'] },
  { id: 'JPY_UNEMP', ccy: 'JPY', match: ['unemployment rate', 'tasa de desempleo'], avoid: [] },
  { id: 'JPY_EARNINGS', ccy: 'JPY', match: ['labor cash earnings', 'cash earnings', 'ingresos salariales en efectivo'], avoid: [] },
  { id: 'JPY_RETAIL', ccy: 'JPY', match: ['retail sales', 'ventas minoristas'], avoid: [] },
  { id: 'JPY_CONS_SURVEY', ccy: 'JPY', match: ['consumer survey', 'consumer confidence', 'confianza del consumidor'], avoid: [] },
  { id: 'JPY_TANKAN', ccy: 'JPY', match: ['reuters tankan index', 'reuters tankan', 'tankan large manufacturers', 'indice tankan de grandes fabricantes'], avoid: ['non-manufacturers'] },
  { id: 'JPY_JCER_GDP', ccy: 'JPY', match: ['jcer monthly gdp', 'jcer gdp', 'pib mensual de jcer'], avoid: [] },

  // AUD - 9 Indicators
  { id: 'AUD_JUDO_MFG', ccy: 'AUD', match: ['judo bank australia manufacturing', 'judo bank manufacturing', 'judo mfg', 'pmi del sector manufacturero de australia'], avoid: ['services', 'composite', 'construction'] },
  { id: 'AUD_JUDO_SERV', ccy: 'AUD', match: ['judo bank australia services', 'judo bank services', 'judo services', 'pmi del sector servicios de australia'], avoid: ['mfg', 'manufacturing', 'composite', 'construction'] },
  { id: 'AUD_CPI_IND', ccy: 'AUD', match: ['monthly cpi indicator', 'cpi indicator', 'indicador mensual del ipc'], avoid: ['trimmed'] },
  { id: 'AUD_UNEMP', ccy: 'AUD', match: ['unemployment rate', 'tasa de desempleo'], avoid: [] },
  { id: 'AUD_EMP_CHG', ccy: 'AUD', match: ['employment change', 'variacion del empleo', 'cambio en el empleo'], avoid: ['full time', 'part time'] },
  { id: 'AUD_RETAIL', ccy: 'AUD', match: ['retail sales', 'ventas minoristas'], avoid: [] },
  { id: 'AUD_WESTPAC', ccy: 'AUD', match: ['westpac consumer sentiment', 'westpac sentiment', 'confianza del consumidor de westpac'], avoid: [] },
  { id: 'AUD_NAB', ccy: 'AUD', match: ['nab business confidence', 'confianza empresarial de nab'], avoid: ['business conditions'] },
  { id: 'AUD_AIG', ccy: 'AUD', match: ['ai group industry index', 'aig industry index', 'indice de la industria de ai group'], avoid: ['construction', 'services', 'manufacturing'] },

  // NZD - 9 Indicators
  { id: 'NZD_BUSNZ_MFG', ccy: 'NZD', match: ['businessnz manufacturing pmi', 'busnz mfg pmi', 'busnz mfg', 'pmi manufacturero de businessnz'], avoid: ['services'] },
  { id: 'NZD_BUSNZ_SERV', ccy: 'NZD', match: ['businessnz performance of services index', 'busnz services pmi', 'busnz services', 'indice del sector servicios de businessnz'], avoid: ['mfg', 'manufacturing'] },
  { id: 'NZD_FOOD_PRICES', ccy: 'NZD', match: ['food price index', 'food prices', 'indice de precios de los alimentos'], avoid: [] },
  { id: 'NZD_UNEMP', ccy: 'NZD', match: ['unemployment rate', 'tasa de desempleo'], avoid: [] },
  { id: 'NZD_MEI_JOBS', ccy: 'NZD', match: ['mei filled jobs', 'mei jobs change', 'filled jobs', 'empleos cubiertos segun el mei'], avoid: [] },
  { id: 'NZD_CARD', ccy: 'NZD', match: ['electronic card transactions', 'card transactions', 'electronic card retail sales', 'transacciones con tarjeta electronica'], avoid: [] },
  { id: 'NZD_ANZ_CONS', ccy: 'NZD', match: ['anz consumer confidence', 'confianza del consumidor de anz'], avoid: ['business'] },
  { id: 'NZD_ANZ_BIZ', ccy: 'NZD', match: ['anz business confidence', 'confianza empresarial de anz'], avoid: ['activity outlook', 'consumer'] },
  { id: 'NZD_BUSNZ_ACT', ccy: 'NZD', match: ['businessnz activity index', 'busnz activity index', 'indice de actividad de businessnz'], avoid: [] },

  // CAD - 9 Indicators
  { id: 'CAD_SP_MFG', ccy: 'CAD', match: ['s&p global canada manufacturing', 's&p mfg pmi', 's&p global manufacturing pmi', 'pmi del sector manufacturero de canada'], avoid: ['services', 'composite'] },
  { id: 'CAD_IVEY', ccy: 'CAD', match: ['ivey pmi', 'pmi del gestor de compras ivey'], avoid: ['unadjusted', 'employment', 'prices'] },
  { id: 'CAD_CPI', ccy: 'CAD', match: ['cpi', 'ipc'], avoid: ['core', 'subyacente', 'median', 'trimmed', 'common'] },
  { id: 'CAD_UNEMP', ccy: 'CAD', match: ['unemployment rate', 'tasa de desempleo'], avoid: [] },
  { id: 'CAD_NET_EMP', ccy: 'CAD', match: ['net change in employment', 'net employment change', 'employment change', 'variacion neta del empleo'], avoid: ['full time', 'part time'] },
  { id: 'CAD_RETAIL', ccy: 'CAD', match: ['retail sales', 'ventas minoristas'], avoid: ['ex autos', 'core', 'subyacente'] },
  { id: 'CAD_CB_CONS', ccy: 'CAD', match: ['cb consumer survey', 'cb consumer confidence', 'encuesta de confianza del consumidor de cb'], avoid: [] },
  { id: 'CAD_CFIB', ccy: 'CAD', match: ['cfib business barometer', 'barometro empresarial de la cfib'], avoid: [] },
  { id: 'CAD_GDP_MOM', ccy: 'CAD', match: ['monthly gdp', 'gdp (mom)', 'pib mensual'], avoid: ['annualized', 'qoq', 'yoy'] },

  // CHF - 9 Indicators
  { id: 'CHF_PROCURE_MFG', ccy: 'CHF', match: ['procure.ch manufacturing pmi', 'procure mfg pmi', 'procure.ch pmi', 'pmi del sector manufacturero de procure.ch'], avoid: ['services'] },
  { id: 'CHF_PROCURE_SERV', ccy: 'CHF', match: ['procure.ch services pmi', 'procure services pmi', 'pmi del sector servicios de procure.ch'], avoid: ['mfg', 'manufacturing'] },
  { id: 'CHF_CPI', ccy: 'CHF', match: ['cpi', 'ipc'], avoid: ['core', 'subyacente'] },
  { id: 'CHF_UNEMP_RATE', ccy: 'CHF', match: ['unemployment rate', 'unemp rate', 'tasa de desempleo'], avoid: ['non-seasonally', 'change', 'variacion'] },
  { id: 'CHF_UNEMP_CHG', ccy: 'CHF', match: ['unemployment change', 'unemp change', 'variacion del desempleo'], avoid: ['rate', 'tasa'] },
  { id: 'CHF_RETAIL', ccy: 'CHF', match: ['real retail sales', 'retail sales', 'ventas minoristas'], avoid: [] },
  { id: 'CHF_CONS_SENT', ccy: 'CHF', match: ['seco consumer sentiment', 'consumer sentiment', 'clima de consumo de seco'], avoid: [] },
  { id: 'CHF_KOF', ccy: 'CHF', match: ['kof economic barometer', 'kof indicator', 'barometro economico kof'], avoid: [] },
  { id: 'CHF_SECO', ccy: 'CHF', match: ['seco economic forecasts', 'seco economic indicators', 'previsiones economicas de seco'], avoid: [] },

  // CNH
  { id: 'CNH_TSF', ccy: 'CNH', match: ['total social financing', 'aggregate financing', 'new yuan loans', 'financiacion social total'], avoid: [] }
];

const WHITELIST = {
  UNIVERSAL: [
    'interest rate decision', 'monetary policy statement', 'press conference', 'meeting minutes', 
    'speaks', 'speech', 'president speaks', 'summary of opinions', 'fomc', 'ecb', 'boe', 'boc', 
    'rba', 'rbnz', 'snb', 'pboc', 'economic projections', 'dot plot', 'monetary policy assessment', 
    'financial stability report', 'testimony', 'budget', 'autumn statement', 'spring budget', 
    'fiscal statement', 'statement', 'cash rate', 'overnight rate', 'policy rate', 'bank rate',
    'tasas de interes', 'politica monetaria', 'actas', 'rueda de prensa', 'discurso',
    's&p', 's&p global', 'pmi', 'purchasing managers', 'gestores de compras'
  ],
  USD: ['ism', 's&p', 'pmi', 'cpi', 'unemployment rate', 'unemployment', 'nfp', 'nonfarm payrolls', 'non-farm payrolls', 'retail sales', 'cb consumer confidence', 'nfib', 'gdpnow', 'atlanta fed', 'adp', 'average hourly earnings', 'jobless claims', 'pce', 'ppi', 'gdp', 'industrial production', 'building permits', 'home sales', 'trade balance', 'jolts', 'durable goods', 'ipc', 'tasa de desempleo', 'michigan', 'u-mich', 'philly fed', 'empire state', 'employment cost index', 'eci'],
  CAD: ['s&p', 'pmi', 'ivey', 'cpi', 'unemployment rate', 'unemployment', 'net employment change', 'employment change', 'retail sales', 'cb consumer survey', 'cfib', 'monthly gdp', 'gdp', 'monetary policy report', 'ppi', 'ippi', 'trade balance', 'boc business outlook', 'housing starts', 'ipc', 'tasa de desempleo', 'desempleo', 'empleo', 'ventas minoristas', 'pib', 'manufacturing sales', 'wholesale sales', 'average hourly wages', 'hourly wages', 'wages'],
  EUR: ['hcob', 's&p', 'pmi', 'cpi', 'unemployment', 'germany unemp', 'retail sales', 'consumer confidence', 'ifo', 'industrial production', 'ppi', 'gdp', 'zew', 'trade balance', 'hicp', 'negotiated wages', 'factory orders', 'ipc', 'tasa de desempleo', 'desempleo', 'ventas minoristas', 'produccion industrial', 'pib', 'gfk', 'french', 'france'],
  CHF: ['procure', 's&p', 'pmi', 'cpi', 'unemp', 'unemployment', 'retail sales', 'consumer sentiment', 'kof', 'seco', 'ppi', 'gdp', 'industrial production', 'trade balance', 'svme', 'ipc', 'tasa de desempleo', 'desempleo', 'ventas minoristas', 'pib'],
  GBP: ['s&p', 'pmi', 'cpi', 'unemployment rate', 'unemployment', 'claimant count', 'retail sales', 'gfk', 'cbi', 'monthly gdp', 'gdp', 'rpi', 'ppi', 'average earnings', 'public sector net borrowing', 'ipc', 'tasa de desempleo', 'desempleo', 'ventas minoristas', 'pib', 'industrial production', 'manufacturing production', 'halifax', 'nationwide', 'current account'],
  JPY: ['jibun', 's&p', 'pmi', 'tokyo cpi', 'unemployment rate', 'unemployment', 'cash earnings', 'retail sales', 'consumer survey', 'tankan', 'jcer', 'ppi', 'cgpi', 'national cpi', 'gdp', 'trade balance', 'household spending', 'machine orders', 'ipc', 'tasa de desempleo', 'desempleo', 'ventas minoristas', 'pib', 'industrial production', 'current account'],
  AUD: ['judo', 's&p', 'pmi', 'cpi indicator', 'cpi', 'unemployment rate', 'unemployment', 'employment change', 'retail sales', 'westpac', 'nab', 'aig', 'ppi', 'gdp', 'trade balance', 'building approvals', 'private capex', 'caixin', 'ipc', 'tasa de desempleo', 'desempleo', 'empleo', 'ventas minoristas', 'pib', 'wage price index', 'wpi'],
  NZD: ['busnz', 's&p', 'pmi', 'psi', 'cpi', 'food prices', 'unemployment rate', 'unemployment', 'mei jobs', 'filled jobs', 'card transactions', 'retail sales', 'anz', 'ppi', 'gdt', 'gdp', 'trade balance', 'building consents', 'ipc', 'tasa de desempleo', 'desempleo', 'pib', 'caixin'],
  CNH: ['lpr', 'loan prime rate', 'cpi', 'ppi', 'gdp', 'pmi', 's&p', 'industrial production', 'retail sales', 'trade balance', 'caixin', 'tsf', 'total social financing', 'new yuan loans', 'aggregate financing', 'm2', 'ipc', 'pib']
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF', 'CNH', 'CNY', 'DE', 'DEU', 'FR', 'FRA', 'UK', 'EU', 'CH', 'CHE', 'CA', 'CAN', 'US', 'USA', 'JP', 'JPN', 'AU', 'AUS', 'NZ', 'NZL', 'GB', 'GBR', 'CN', 'CHN'];
const CURRENCY_HIERARCHY = ['EUR', 'GBP', 'AUD', 'NZD', 'USD', 'CAD', 'CHF', 'JPY'];

function normalizeText(str: string): string {
  if (!str) return '';
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCoreRuleId(ccy: string, eventName: string): string | null {
  if (!eventName || !ccy) return null;
  const cleanEvent = normalizeText(eventName);
  
  for (const rule of CORE_INDICATOR_RULES) {
    if (rule.ccy !== ccy) continue;
    
    const matches = rule.match.some(m => {
      const cleanMatch = normalizeText(m);
      return cleanEvent.includes(cleanMatch);
    });

    if (matches) {
      const avoids = rule.avoid.some(a => {
        const cleanAvoid = normalizeText(a);
        return cleanEvent.includes(cleanAvoid);
      });
      if (!avoids) return rule.id;
    }
  }
  return null;
}

function isWhitelisted(ccy: string, eventName: string): boolean {
  if (!eventName) return false;
  const lower = normalizeText(eventName);

  const blacklist = [
    'opec', 'crude oil', 'oil inventories', 'eia crude', 'gasoline inventories', 'distillate stocks', 
    'baker hughes', 'fed regional', 'mpc member', 'executive board member', 'construction pmi',
    'car registration', 'auction', 'obligacion', 'bonos',
    'private nonfarm payrolls', 'manufacturing payrolls', 'government payrolls'
  ];
  if (blacklist.some(term => lower.includes(normalizeText(term)))) return false;

  if (ccy === 'EUR') {
    const regionalNoise = ['italy', 'italian', 'spain', 'spanish', 'belgium', 'austria', 'greece', 'portugal'];
    const isEurozoneGermanyFrance = lower.includes('euro zone') || lower.includes('eurozone') || lower.includes('german') || lower.includes('germany') || lower.includes('french') || lower.includes('france') || lower.includes('ifo');
    if (regionalNoise.some(term => lower.includes(term)) && !isEurozoneGermanyFrance) {
      return false;
    }
  }

  const coreRuleId = getCoreRuleId(ccy, eventName);
  if (coreRuleId) return true;

  if (WHITELIST.UNIVERSAL.some(term => lower.includes(normalizeText(term)))) return true;
  
  const targetCcy = (ccy === 'CNY' || ccy === 'CN') ? 'CNH' : ccy;
  const terms = (WHITELIST as any)[targetCcy] || [];
  return terms.some((term: string) => lower.includes(normalizeText(term)));
}

function getCategorySentimentTitle(ccy: string, eventName: string, isEs: boolean): string {
  if (!eventName) return isEs ? `SENTIMIENTO DE ${ccy}` : `${ccy} SENTIMENT`;
  const lower = normalizeText(eventName);
  
  if (lower.includes('nonfarm') || lower.includes('non farm') || lower.includes('nfp') || lower.includes('nominas no agricolas') || lower.includes('empleo no agricola')) {
    return isEs ? `${ccy} - NFP (NÓMINAS NO AGRÍCOLAS)` : `${ccy} - NONFARM PAYROLLS (NFP)`;
  }
  if (lower.includes('ism')) return `${ccy} - ${isEs ? 'PMI ISM' : 'ISM PMI'}`;
  if (lower.includes('s p') || lower.includes('markit') || lower.includes('hcob') || lower.includes('caixin') || lower.includes('cips')) return `${ccy} - S&P / MARKIT PMI`;
  if (lower.includes('judo')) return `${ccy} - JUDO BANK PMI`;
  if (lower.includes('jibun')) return `${ccy} - JIBUN BANK PMI`;
  if (lower.includes('procure')) return `${ccy} - PROCURE.CH PMI`;
  if (lower.includes('busnz') || lower.includes('businessnz')) return `${ccy} - BUSINESSNZ PMI`;
  if (lower.includes('ivey')) return `${ccy} - IVEY PMI`;
  if (lower.includes('chicago pmi')) return `${ccy} - CHICAGO PMI`;
  if (lower.includes('pmi')) return isEs ? `${ccy} - ÍNDICES PMI` : `${ccy} - PMI DIFFUSION INDEXES`;

  if (lower.includes('interest rate') || lower.includes('monetary policy') || lower.includes('press conference') || lower.includes('fomc') || lower.includes('rate decision') || lower.includes('loan prime') || lower.includes('boj') || lower.includes('bank of japan') || lower.includes('meeting minutes') || lower.includes('speaks') || lower.includes('speech') || lower.includes('dot plot') || lower.includes('projections') || lower.includes('cash rate') || lower.includes('overnight rate') || lower.includes('bank rate') || lower.includes('tasas de interes') || lower.includes('politica monetaria')) {
    return isEs ? `${ccy} - POLÍTICA MONETARIA Y TASAS` : `${ccy} - MONETARY POLICY & RATES`;
  }
  if (lower.includes('cpi') || lower.includes('ipc') || lower.includes('pce') || lower.includes('rpi') || lower.includes('inflation') || lower.includes('inflacion') || lower.includes('tokyo cpi') || lower.includes('consumer price') || lower.includes('hicp') || lower.includes('food prices')) {
    return isEs ? `${ccy} - INFLACIÓN (IPC)` : `${ccy} - INFLATION METRICS (CPI / PCE)`;
  }
  if (lower.includes('ppi') || lower.includes('ipp') || lower.includes('ippi') || lower.includes('producer price') || lower.includes('cgpi')) {
    return isEs ? `${ccy} - PRECIOS DE PRODUCTOR (IPP)` : `${ccy} - PRODUCER PRICES (PPI)`;
  }
  if (lower.includes('unemployment') || lower.includes('desempleo') || lower.includes('adp') || lower.includes('nominas') || lower.includes('nóminas') || lower.includes('claimant') || lower.includes('jobless') || lower.includes('employment change') || lower.includes('variacion del empleo') || lower.includes('cambio en el empleo') || lower.includes('earnings') || lower.includes('salarios') || lower.includes('cash earnings') || lower.includes('jolts') || lower.includes('employment cost') || lower.includes('eci') || lower.includes('challenger') || lower.includes('mei filled jobs') || lower.includes('wage price index') || lower.includes('wpi')) {
    return isEs ? `${ccy} - MERCADO LABORAL Y SALARIOS` : `${ccy} - LABOR MARKET & WAGES`;
  }
  if (lower.includes('retail sales') || lower.includes('ventas minoristas') || lower.includes('card transactions')) {
    return isEs ? `${ccy} - VENTAS MINORISTAS Y CONSUMO` : `${ccy} - RETAIL SALES & CONSUMPTION`;
  }
  if (lower.includes('gdp') || lower.includes('pib') || lower.includes('gdpnow') || lower.includes('activity index')) {
    return isEs ? `${ccy} - PRODUCTO INTERNO BRUTO (PIB)` : `${ccy} - GROSS DOMESTIC PRODUCT (GDP)`;
  }
  if (lower.includes('consumer confidence') || lower.includes('consumer sentiment') || lower.includes('confianza del consumidor') || lower.includes('clima de consumo') || lower.includes('consumer survey') || lower.includes('michigan') || lower.includes('gfk') || lower.includes('westpac') || lower.includes('seco')) {
    return isEs ? `${ccy} - CONFIANZA DEL CONSUMIDOR` : `${ccy} - CONSUMER CONFIDENCE`;
  }
  if (lower.includes('tankan')) return isEs ? `${ccy} - ENCUESTA TANKAN` : `${ccy} - TANKAN SURVEY`;
  if (lower.includes('ifo') || lower.includes('zew') || lower.includes('cbi') || lower.includes('nfib') || lower.includes('cfib') || lower.includes('nab') || lower.includes('anz') || lower.includes('aig') || lower.includes('kof') || lower.includes('philly fed') || lower.includes('empire state')) {
    return isEs ? `${ccy} - CONFIANZA Y CLIMA DE NEGOCIOS` : `${ccy} - BUSINESS CLIMATE & SENTIMENT`;
  }
  if (lower.includes('industrial production') || lower.includes('manufacturing production') || lower.includes('produccion industrial') || lower.includes('factory orders') || lower.includes('machine orders') || lower.includes('durable goods') || lower.includes('manufacturing sales') || lower.includes('wholesale sales')) {
    return isEs ? `${ccy} - PRODUCCIÓN INDUSTRIAL` : `${ccy} - INDUSTRIAL PRODUCTION`;
  }
  if (lower.includes('trade balance') || lower.includes('balanza comercial') || lower.includes('exports') || lower.includes('imports') || lower.includes('current account')) {
    return isEs ? `${ccy} - BALANZA COMERCIAL Y CUENTA CORRIENTE` : `${ccy} - TRADE BALANCE & CURRENT ACCOUNT`;
  }
  if (lower.includes('building') || lower.includes('housing') || lower.includes('home sales') || lower.includes('halifax') || lower.includes('nationwide')) {
    return isEs ? `${ccy} - MERCADO INMOBILIARIO` : `${ccy} - HOUSING & REAL ESTATE`;
  }

  const cleanName = eventName.replace(/^(French|German|Italian|Spanish|Eurozone|US|UK|Japanese|Australian|Canadian|Swiss|Chinese)\s+/i, '');
  const firstWord = cleanName.split(' ')[0].toUpperCase();
  return `${ccy} - ${firstWord}`;
}

function getSmartGroupTitle(ccy: string, blockEvents: MacroEvent[], isEs: boolean): string {
  if (!blockEvents || blockEvents.length === 0) return isEs ? `${ccy} - EVENTO MACRO` : `${ccy} - MACRO EVENT`;
  const uniqueNames = Array.from(new Set(blockEvents.map(e => e.event.trim())));
  if (uniqueNames.length === 1) return `${ccy} - ${uniqueNames[0]}`;
  if (uniqueNames.length === 2) return `${ccy} - ${uniqueNames[0]} / ${uniqueNames[1]}`;
  return getCategorySentimentTitle(ccy, blockEvents[0].event, isEs);
}

function formatDayLabel(dayStr: string, isEs: boolean): string {
  if (!dayStr) return dayStr;
  let str = dayStr.toUpperCase();
  if (isEs) {
    const replacements: Record<string, string> = {
      'MONDAY': 'LUNES', 'TUESDAY': 'MARTES', 'WEDNESDAY': 'MIÉRCOLES', 'THURSDAY': 'JUEVES', 'FRIDAY': 'VIERNES', 'SATURDAY': 'SÁBADO', 'SUNDAY': 'DOMINGO',
      'JANUARY': 'ENERO', 'FEBRUARY': 'FEBRERO', 'MARCH': 'MARZO', 'APRIL': 'ABRIL', 'MAY': 'MAYO', 'JUNE': 'JUNIO', 'JULY': 'JULIO', 'AUGUST': 'AGOSTO', 'SEPTEMBER': 'SEPTIEMBRE', 'OCTOBER': 'OCTUBRE', 'NOVEMBER': 'NOVIEMBRE', 'DECEMBER': 'DICIEMBRE'
    };
    Object.keys(replacements).forEach(key => {
      str = str.replace(new RegExp('\\b' + key + '\\b', 'g'), replacements[key]);
    });
  } else {
    const replacements: Record<string, string> = {
      'LUNES': 'MONDAY', 'MARTES': 'TUESDAY', 'MIÉRCOLES': 'WEDNESDAY', 'MIERCOLES': 'WEDNESDAY', 'JUEVES': 'THURSDAY', 'VIERNES': 'FRIDAY', 'SÁBADO': 'SATURDAY', 'SABADO': 'SATURDAY', 'DOMINGO': 'SUNDAY',
      'ENERO': 'JANUARY', 'FEBRERO': 'FEBRUARY', 'MARZO': 'MARCH', 'ABRIL': 'APRIL', 'MAYO': 'MAY', 'JUNIO': 'JUNE', 'JULIO': 'JULY', 'AGOSTO': 'AUGUST', 'SEPTIEMBRE': 'SEPTEMBER', 'OCTUBRE': 'OCTOBER', 'NOVIEMBRE': 'NOVEMBER', 'DICIEMBRE': 'DECEMBER'
    };
    Object.keys(replacements).forEach(key => {
      str = str.replace(new RegExp('\\b' + key + '\\b', 'g'), replacements[key]);
    });
  }
  return str;
}

const DEFAULT_SAMPLE_EVENTS: Record<string, MacroEvent[]> = {
  "MONDAY, OCTOBER 6": [
    { time: "08:30", ccy: "EUR", event: "HCOB Eurozone Manufacturing PMI", actual: "45.8", forecast: "45.0", previous: "44.8", isCore: true, coreRuleId: "EUR_HCOB_MFG" },
    { time: "09:00", ccy: "EUR", event: "German Unemployment Change", actual: "-12K", forecast: "+15K", previous: "+10K", isCore: true, coreRuleId: "EUR_GER_UNEMP_CHG" },
    { time: "09:30", ccy: "GBP", event: "S&P Global/CIPS UK Manufacturing PMI", actual: "51.5", forecast: "50.5", previous: "50.2", isCore: true, coreRuleId: "GBP_SP_MFG" },
    { time: "14:00", ccy: "USD", event: "ISM Manufacturing PMI", actual: "49.2", forecast: "47.5", previous: "47.2", isCore: true, coreRuleId: "USD_ISM_MFG" }
  ],
  "TUESDAY, OCTOBER 7": [
    { time: "04:30", ccy: "AUD", event: "RBA Interest Rate Decision", actual: "4.35%", forecast: "4.35%", previous: "4.35%", isCore: false },
    { time: "07:00", ccy: "EUR", event: "German Ifo Business Climate", actual: "88.6", forecast: "87.0", previous: "86.6", isCore: true, coreRuleId: "EUR_IFO" },
    { time: "14:00", ccy: "USD", event: "JOLTs Job Openings", actual: "7.74M", forecast: "7.65M", previous: "7.71M", isCore: false },
    { time: "14:00", ccy: "USD", event: "CB Consumer Confidence", actual: "108.7", forecast: "99.5", previous: "99.2", isCore: true, coreRuleId: "USD_CB_CONF" }
  ],
  "WEDNESDAY, OCTOBER 8": [
    { time: "01:30", ccy: "JPY", event: "Tokyo Core CPI (YoY)", actual: "2.1%", forecast: "1.8%", previous: "1.7%", isCore: true, coreRuleId: "JPY_TOKYO_CPI" },
    { time: "13:15", ccy: "USD", event: "ADP Nonfarm Employment Change", actual: "233K", forecast: "114K", previous: "159K", isCore: false },
    { time: "14:00", ccy: "USD", event: "ISM Services PMI", actual: "56.0", forecast: "53.8", previous: "54.9", isCore: true, coreRuleId: "USD_ISM_SERVICES" },
    { time: "15:00", ccy: "CAD", event: "Ivey PMI", actual: "53.5", forecast: "51.0", previous: "50.8", isCore: true, coreRuleId: "CAD_IVEY" }
  ],
  "THURSDAY, OCTOBER 9": [
    { time: "07:30", ccy: "CHF", event: "CPI (MoM)", actual: "-0.1%", forecast: "0.0%", previous: "0.0%", isCore: true, coreRuleId: "CHF_CPI" },
    { time: "12:15", ccy: "EUR", event: "ECB Monetary Policy Statement & Rate", actual: "3.25%", forecast: "3.25%", previous: "3.50%", isCore: false },
    { time: "13:30", ccy: "USD", event: "CPI (MoM)", actual: "0.2%", forecast: "0.2%", previous: "0.2%", isCore: true, coreRuleId: "USD_CPI" },
    { time: "13:30", ccy: "USD", event: "Initial Jobless Claims", actual: "216K", forecast: "230K", previous: "228K", isCore: false }
  ],
  "FRIDAY, OCTOBER 10": [
    { time: "07:00", ccy: "GBP", event: "Monthly GDP (MoM)", actual: "0.2%", forecast: "0.2%", previous: "0.0%", isCore: true, coreRuleId: "GBP_GDP" },
    { time: "13:30", ccy: "CAD", event: "Net Change in Employment", actual: "+46.7K", forecast: "+25.0K", previous: "+47.0K", isCore: true, coreRuleId: "CAD_NET_EMP" },
    { time: "13:30", ccy: "USD", event: "Nonfarm Payrolls (NFP)", actual: "254K", forecast: "147K", previous: "159K", isCore: true, coreRuleId: "USD_NFP" },
    { time: "13:30", ccy: "USD", event: "Unemployment Rate", actual: "4.1%", forecast: "4.2%", previous: "4.2%", isCore: true, coreRuleId: "USD_UNEMP" }
  ]
};

const DEFAULT_CATEGORY_SCORES: Record<string, CategoryScore> = {
  "MONDAY--OCTOBER-6-EUR-EUR---S-P---MARKIT-PMI": { ccy: "EUR", score: 1, title: "EUR - HCOB Eurozone Manufacturing PMI", eventsSummary: "HCOB Eurozone Manufacturing PMI" },
  "MONDAY--OCTOBER-6-EUR-EUR---LABOR-MARKET---WAGES": { ccy: "EUR", score: 1, title: "EUR - German Unemployment Change", eventsSummary: "German Unemployment Change" },
  "MONDAY--OCTOBER-6-USD-USD---ISM-PMI": { ccy: "USD", score: 1, title: "USD - ISM Manufacturing PMI", eventsSummary: "ISM Manufacturing PMI" },
  "TUESDAY--OCTOBER-7-USD-USD---CONSUMER-CONFIDENCE": { ccy: "USD", score: 2, title: "USD - CB Consumer Confidence", eventsSummary: "CB Consumer Confidence" },
  "WEDNESDAY--OCTOBER-8-JPY-JPY---INFLATION-METRICS--CPI---PCE-": { ccy: "JPY", score: 1, title: "JPY - Tokyo Core CPI (YoY)", eventsSummary: "Tokyo Core CPI (YoY)" },
  "WEDNESDAY--OCTOBER-8-USD-USD---ISM-PMI": { ccy: "USD", score: 2, title: "USD - ISM Services PMI", eventsSummary: "ISM Services PMI" },
  "FRIDAY--OCTOBER-10-USD-USD---NONFARM-PAYROLLS--NFP-": { ccy: "USD", score: 2, title: "USD - Nonfarm Payrolls (NFP)", eventsSummary: "Nonfarm Payrolls (NFP)" },
  "FRIDAY--OCTOBER-10-USD-USD---LABOR-MARKET---WAGES": { ccy: "USD", score: 1, title: "USD - Unemployment Rate", eventsSummary: "Unemployment Rate" },
  "FRIDAY--OCTOBER-10-CAD-CAD---LABOR-MARKET---WAGES": { ccy: "CAD", score: 1, title: "CAD - Net Change in Employment", eventsSummary: "Net Change in Employment" }
};

export const KairosMacroHub: React.FC<KairosMacroHubProps> = ({ onReturnToHub, language = 'en' }) => {
  const isEs = language === 'es';

  const [globalState, setGlobalState] = useState<MacroHubState>(() => {
    const saved = localStorage.getItem('kairos_macro_engine_state_v16');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.daysData && Object.keys(parsed.daysData).length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error loading state from localStorage', e);
      }
    }
    return {
      daysData: DEFAULT_SAMPLE_EVENTS,
      categoryScores: DEFAULT_CATEGORY_SCORES,
      matrixEvents: { USD: 0, EUR: 0, GBP: 0, JPY: 0, CAD: 0, AUD: 0, NZD: 0, CHF: 0, CNH: 0, VIX: 0, Oil: 0, Gold: 0 },
      matrixTotals: { USD: 0, EUR: 0, GBP: 0, JPY: 0, CAD: 0, AUD: 0, NZD: 0, CHF: 0, CNH: 0, VIX: 0, Oil: 0, Gold: 0 },
      matrixPrev: { USD: 2, EUR: -1, GBP: 0, JPY: -3, CAD: 1, AUD: 0, NZD: -1, CHF: 0, CNH: 0, VIX: 0, Oil: 1, Gold: 2 },
      matrixPrevBreakdown: {
        USD: [{ label: isEs ? "Semana Previa Fija" : "Prior Week Baseline", score: 2 }],
        EUR: [{ label: isEs ? "Semana Previa Fija" : "Prior Week Baseline", score: -1 }],
        GBP: [],
        JPY: [{ label: isEs ? "Giro BoJ Dovish" : "BoJ Dovish Shift", score: -3 }],
        CAD: [{ label: isEs ? "Rally de Crudo" : "Crude Rally Flow", score: 1 }],
        AUD: [],
        NZD: [{ label: isEs ? "Expectativa RBNZ" : "RBNZ Easing Pricing", score: -1 }],
        CHF: [],
        CNH: [],
        VIX: [],
        Oil: [{ label: isEs ? "Prima Geopolítica" : "Geopolitical Premium", score: 1 }],
        Gold: [{ label: isEs ? "Flujo de Refugio" : "Safe Haven Flow", score: 2 }]
      },
      intermarketScores: { VIX: 0, Oil: 1, Gold: 1 },
      dailyNotes: {
        "MONDAY, OCTOBER 6": isEs ? "Apertura semanal con volatilidad contenida. Flujos defensivos en bonos soberanos." : "Weekly open with contained variance. Defensive flows in sovereign yields.",
        "FRIDAY, OCTOBER 10": isEs ? "NFP superó ampliamente el consenso (254K vs 147K esperado). Fortalecimiento acelerado del USD." : "NFP strongly beat consensus (254K vs 147K exp). Broad USD appreciation catalyst."
      }
    };
  });

  const [activeCurrencyFilter, setActiveCurrencyFilter] = useState<string>('ALL');
  const [filterCoreOnly, setFilterCoreOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDivergenceExpanded, setIsDivergenceExpanded] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kairos_macro_engine_state_v16', JSON.stringify(globalState));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [globalState]);

  // Recalculate matrix event sums whenever categoryScores change
  const computedMatrix = useMemo(() => {
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF', 'CNH'];
    const intermarket = ['VIX', 'Oil', 'Gold'];

    const evSums: Record<string, number> = {};
    currencies.forEach(c => (evSums[c] = 0));
    intermarket.forEach(i => (evSums[i] = globalState.intermarketScores[i] || 0));

    Object.values(globalState.categoryScores || {}).forEach(item => {
      if (item && item.ccy && typeof item.score === 'number') {
        evSums[item.ccy] = (evSums[item.ccy] || 0) + item.score;
      }
    });

    const totals: Record<string, number> = {};
    [...currencies, ...intermarket].forEach(c => {
      const prev = parseInt(String(globalState.matrixPrev[c] || 0), 10) || 0;
      const ev = evSums[c] || 0;
      totals[c] = prev + ev;
    });

    return { events: evSums, totals };
  }, [globalState.categoryScores, globalState.matrixPrev, globalState.intermarketScores]);

  // Evaluated list generator for currency details
  const getCurrencyEvaluatedEventsList = (ccy: string) => {
    const list: Array<{ label: string; score: number }> = [];
    const matchedCatIds = new Set<string>();

    if (['VIX', 'Oil', 'Gold'].includes(ccy)) {
      const score = globalState.intermarketScores[ccy] || 0;
      if (score !== 0) list.push({ label: isEs ? `Evaluación de ${ccy}` : `${ccy} Assessment`, score });
      return list;
    }

    if (globalState.daysData) {
      Object.keys(globalState.daysData).forEach(day => {
        const rawEv = globalState.daysData[day] || [];
        const events = rawEv.filter(e => isWhitelisted(e.ccy, e.event) && e.ccy === ccy);
        if (!events || events.length === 0) return;

        let currentBlockEvents: MacroEvent[] = [];
        events.forEach((item, idx) => {
          currentBlockEvents.push(item);
          const nextItem = events[idx + 1];
          const currentCategory = getCategorySentimentTitle(item.ccy, item.event, isEs);
          const nextCategory = nextItem ? getCategorySentimentTitle(nextItem.ccy, nextItem.event, isEs) : null;

          if (!nextItem || nextCategory !== currentCategory) {
            const categoryId = `${day}-${item.ccy}-${currentCategory}`.replace(/[^a-zA-Z0-9]/g, '-');
            const scoreObj = globalState.categoryScores[categoryId];

            if (scoreObj && scoreObj.score !== 0) {
              matchedCatIds.add(categoryId);
              const uniqueNames = Array.from(new Set(currentBlockEvents.map(e => e.event.trim())));
              list.push({ label: uniqueNames.join(' / '), score: scoreObj.score });
            }
            currentBlockEvents = [];
          }
        });
      });
    }

    if (globalState.categoryScores) {
      Object.keys(globalState.categoryScores).forEach(catId => {
        const item = globalState.categoryScores[catId];
        if (item && item.ccy === ccy && item.score !== 0 && !matchedCatIds.has(catId)) {
          let label = item.title || item.eventsSummary || (isEs ? 'Evento Macro' : 'Macro Event');
          label = label.replace(new RegExp(`^${ccy}\\s*-\\s*`, 'i'), '');
          list.push({ label, score: item.score });
        }
      });
    }

    return list;
  };

  const getFullCurrencyBreakdownGrouped = (ccy: string) => {
    let prevList = globalState.matrixPrevBreakdown ? globalState.matrixPrevBreakdown[ccy] || [] : [];
    const prevTotal = parseInt(String(globalState.matrixPrev[ccy] || 0), 10) || 0;

    if (prevList.length === 0 && prevTotal !== 0) {
      prevList = [{ label: isEs ? 'Fuerza Previa Manual' : 'Manual Baseline Factor', score: prevTotal }];
    }

    const currList = getCurrencyEvaluatedEventsList(ccy);
    return { prevList, prevTotal, currList };
  };

  // Divergences Scanner
  const divergences = useMemo(() => {
    const forexList = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF'];
    const results: Array<{
      pair: string;
      actionBadge: string;
      strong: string;
      weak: string;
      strongScore: number;
      weakScore: number;
      diff: number;
    }> = [];

    for (let i = 0; i < forexList.length; i++) {
      for (let j = i + 1; j < forexList.length; j++) {
        const cA = forexList[i];
        const cB = forexList[j];
        const scoreA = computedMatrix.totals[cA] || 0;
        const scoreB = computedMatrix.totals[cB] || 0;
        const diff = Math.abs(scoreA - scoreB);

        if (diff >= 3) {
          const strong = scoreA > scoreB ? cA : cB;
          const weak = scoreA > scoreB ? cB : cA;
          const rank1 = CURRENCY_HIERARCHY.indexOf(cA);
          const rank2 = CURRENCY_HIERARCHY.indexOf(cB);

          let base = '';
          let quote = '';
          let actionText = '';

          if (rank1 !== -1 && rank2 !== -1) {
            if (rank1 < rank2) {
              base = cA;
              quote = cB;
              actionText = strong === cA 
                ? (isEs ? `COMPRA ${base}/${quote}` : `BUY ${base}/${quote}`) 
                : (isEs ? `VENTA ${base}/${quote}` : `SELL ${base}/${quote}`);
            } else {
              base = cB;
              quote = cA;
              actionText = strong === cB 
                ? (isEs ? `COMPRA ${base}/${quote}` : `BUY ${base}/${quote}`) 
                : (isEs ? `VENTA ${base}/${quote}` : `SELL ${base}/${quote}`);
            }
          } else {
            base = strong;
            quote = weak;
            actionText = isEs ? `COMPRA ${base}/${quote}` : `BUY ${base}/${quote}`;
          }

          results.push({
            pair: `${base}/${quote}`,
            actionBadge: actionText,
            strong,
            weak,
            strongScore: computedMatrix.totals[strong] || 0,
            weakScore: computedMatrix.totals[weak] || 0,
            diff
          });
        }
      }
    }

    results.sort((a, b) => b.diff - a.diff);
    return results;
  }, [computedMatrix.totals, isEs]);

  // Handlers for Score Buttons
  const setCategoryScore = (categoryId: string, ccy: string, scoreVal: number, title: string, eventsSummary: string) => {
    setGlobalState(prev => ({
      ...prev,
      categoryScores: {
        ...prev.categoryScores,
        [categoryId]: {
          ccy,
          score: scoreVal,
          title,
          eventsSummary
        }
      }
    }));
  };

  const setIntermarketScore = (asset: string, scoreVal: number) => {
    setGlobalState(prev => ({
      ...prev,
      intermarketScores: {
        ...prev.intermarketScores,
        [asset]: scoreVal
      }
    }));
  };

  const updatePrevMatrix = (asset: string, val: string) => {
    const num = parseInt(val, 10) || 0;
    setGlobalState(prev => ({
      ...prev,
      matrixPrev: {
        ...prev.matrixPrev,
        [asset]: num
      }
    }));
  };

  const updateDailyNote = (day: string, note: string) => {
    setGlobalState(prev => ({
      ...prev,
      dailyNotes: {
        ...prev.dailyNotes,
        [day]: note
      }
    }));
  };

  // Lock Current as Previous Week
  const lockCurrentAsPreviousWeek = () => {
    if (!globalState.daysData || Object.keys(globalState.daysData).length === 0) {
      alert(isEs 
        ? 'Primero debes cargar o tener eventos evaluados para poder congelarlos como semana previa.'
        : 'You must have evaluated events loaded before freezing them as the prior week baseline.');
      return;
    }

    const confirmMsg = isEs
      ? '¿Deseas fijar la semana actual como "Semana Previa"?\n\nEsto tomará los eventos evaluados, congelará su desglose como base histórica de la matriz, y limpiará el calendario para que cargues el archivo de la SEMANA NUEVA.'
      : 'Lock current week as "Previous Week Baseline"?\n\nThis will freeze current evaluated scores as historical baseline factors, and reset the active calendar for your new week file.';

    if (!confirm(confirmMsg)) {
      return;
    }

    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF', 'CNH', 'VIX', 'Oil', 'Gold'];
    const newPrevBreakdown: Record<string, PrevBreakdownItem[]> = {};
    const newPrevTotals: Record<string, number> = {};

    currencies.forEach(ccy => {
      const eventsList = getCurrencyEvaluatedEventsList(ccy);
      newPrevBreakdown[ccy] = eventsList;
      newPrevTotals[ccy] = eventsList.reduce((acc, item) => acc + item.score, 0);
    });

    setGlobalState(prev => ({
      ...prev,
      matrixPrev: newPrevTotals,
      matrixPrevBreakdown: newPrevBreakdown,
      daysData: {},
      categoryScores: {},
      dailyNotes: {}
    }));

    alert(isEs
      ? '📌 ¡Semana anterior congelada con éxito como Base Previa!\n\nAhora puedes arrastrar o seleccionar el archivo Excel de la SEMANA ACTUAL.'
      : '📌 Prior week successfully locked as baseline!\n\nYou can now upload or drop the Excel calendar for the active trading week.');
  };

  // Reset Everything
  const resetAllScores = () => {
    const confirmMsg = isEs
      ? '¿Reiniciar todo el tablero? Esto borrará los datos cargados y puntuaciones.'
      : 'Reset entire dashboard? This will clear all uploaded data and scored event factors.';

    if (confirm(confirmMsg)) {
      localStorage.removeItem('kairos_macro_engine_state_v16');
      setGlobalState({
        daysData: {},
        categoryScores: {},
        matrixEvents: { USD: 0, EUR: 0, GBP: 0, JPY: 0, CAD: 0, AUD: 0, NZD: 0, CHF: 0, CNH: 0, VIX: 0, Oil: 0, Gold: 0 },
        matrixTotals: { USD: 0, EUR: 0, GBP: 0, JPY: 0, CAD: 0, AUD: 0, NZD: 0, CHF: 0, CNH: 0, VIX: 0, Oil: 0, Gold: 0 },
        matrixPrev: { USD: 0, EUR: 0, GBP: 0, JPY: 0, CAD: 0, AUD: 0, NZD: 0, CHF: 0, CNH: 0, VIX: 0, Oil: 0, Gold: 0 },
        matrixPrevBreakdown: { USD: [], EUR: [], GBP: [], JPY: [], CAD: [], AUD: [], NZD: [], CHF: [], CNH: [], VIX: [], Oil: [], Gold: [] },
        intermarketScores: { VIX: 0, Oil: 0, Gold: 0 },
        dailyNotes: {}
      });
    }
  };

  // Export JSON Backup
  const exportStateJSON = () => {
    try {
      const fullState = {
        ...globalState,
        matrixEvents: computedMatrix.events,
        matrixTotals: computedMatrix.totals
      };
      const dataStr = JSON.stringify(fullState, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kairos_macro_hub_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (err) {
      console.error(err);
      alert(isEs ? 'Error al exportar el archivo JSON.' : 'Error exporting JSON backup file.');
    }
  };

  // Import JSON Backup
  const importStateJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          if (parsed.daysData && Object.keys(parsed.daysData).length > 0) {
            const reevaluatedDaysData: Record<string, MacroEvent[]> = {};
            Object.keys(parsed.daysData).forEach(day => {
              const events = parsed.daysData[day] || [];
              reevaluatedDaysData[day] = events.map((item: any) => {
                const ruleId = getCoreRuleId(item.ccy, item.event);
                return {
                  ...item,
                  coreRuleId: ruleId,
                  isCore: Boolean(ruleId)
                };
              });
            });

            setGlobalState({
              daysData: reevaluatedDaysData,
              categoryScores: parsed.categoryScores || {},
              matrixEvents: parsed.matrixEvents || {},
              matrixTotals: parsed.matrixTotals || {},
              matrixPrev: Object.assign({ USD: 0, EUR: 0, GBP: 0, JPY: 0, CAD: 0, AUD: 0, NZD: 0, CHF: 0, CNH: 0, VIX: 0, Oil: 0, Gold: 0 }, parsed.matrixPrev || {}),
              matrixPrevBreakdown: Object.assign({ USD: [], EUR: [], GBP: [], JPY: [], CAD: [], AUD: [], NZD: [], CHF: [], CNH: [], VIX: [], Oil: [], Gold: [] }, parsed.matrixPrevBreakdown || {}),
              intermarketScores: Object.assign({ VIX: 0, Oil: 0, Gold: 0 }, parsed.intermarketScores || {}),
              dailyNotes: parsed.dailyNotes || {}
            });
            alert(isEs
              ? '¡Respaldo cargado con éxito! Todos los eventos fueron re-evaluados con las reglas actuales.'
              : 'Backup loaded successfully! All events re-evaluated under current macro rules.');
          } else {
            alert(isEs ? 'El archivo JSON no contiene un calendario estructurado válido.' : 'JSON file does not contain a valid calendar structure.');
          }
        }
      } catch (err) {
        console.error(err);
        alert(isEs ? 'Error al leer el archivo JSON.' : 'Error reading JSON backup file.');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Process Excel File
  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, dateNF: 'yyyy-mm-dd' });

        const parsedDaysData: Record<string, MacroEvent[]> = {};
        let currentDay = isEs ? 'LUNES' : 'MONDAY';

        rawRows.forEach(row => {
          if (!row || row.length === 0) return;
          const cleanRow = row.map(cell => (cell === null || cell === undefined ? '' : String(cell).trim()));
          const rowString = cleanRow.join(' ').trim();
          if (!rowString) return;

          if (/Time/i.test(cleanRow[1] || '') && /Cur/i.test(cleanRow[2] || '') && /Event/i.test(cleanRow[3] || '')) return;

          let detectedDay: string | null = null;
          if (/^(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|DOMINGO|LUNES|MARTES|MIÉRCOLES|MIERCOLES|JUEVES|VIERNES|SÁBADO|SABADO)/i.test(rowString)) {
            detectedDay = rowString.toUpperCase();
          } else {
            for (const cell of cleanRow) {
              if (/^\d{4}-\d{2}-\d{2}/.test(cell) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(cell) || /^\d{5}(\.\d+)?$/.test(cell)) {
                let d: Date | null = null;
                if (/^\d{5}(\.\d+)?$/.test(cell)) {
                  const serial = parseFloat(cell);
                  if (serial > 40000 && serial < 60000) d = new Date(Math.round((serial - 25569) * 86400 * 1000));
                } else {
                  const dateVal = cell.includes(' ') ? cell.split(' ')[0] : cell;
                  if (dateVal.includes('-')) {
                    const parts = dateVal.split('-');
                    d = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
                  } else if (dateVal.includes('/')) {
                    const parts = dateVal.split('/');
                    const p0 = parseInt(parts[0], 10);
                    const p1 = parseInt(parts[1], 10);
                    const p2 = parseInt(parts[2], 10);
                    const year = p2 < 100 ? p2 + 2000 : p2;
                    let month = 0;
                    let day = 1;
                    if (p0 > 12) {
                      day = p0;
                      month = p1 - 1;
                    } else {
                      month = p0 - 1;
                      day = p1;
                    }
                    d = new Date(Date.UTC(year, month, day));
                  }
                }

                if (d && !isNaN(d.getTime())) {
                  const dayNames = isEs
                    ? ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
                    : ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                  const dayName = dayNames[d.getUTCDay()];
                  const dateStr = d.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
                  detectedDay = `${dayName}, ${dateStr}`;
                  break;
                }
              }
            }
          }

          if (detectedDay) {
            currentDay = detectedDay;
            if (!parsedDaysData[currentDay]) parsedDaysData[currentDay] = [];
            return;
          }

          let time = '';
          let ccy = '';
          let event = '';
          let actual = '';
          let forecast = '';
          let previous = '';
          let foundCcyIdx = -1;

          for (let i = 0; i < Math.min(cleanRow.length, 5); i++) {
            const cellVal = cleanRow[i].toUpperCase();
            if (cellVal.length <= 3 && CURRENCIES.includes(cellVal)) {
              foundCcyIdx = i;
              ccy = cellVal;
              break;
            }
          }

          if (foundCcyIdx !== -1) {
            for (let i = 0; i < foundCcyIdx; i++) {
              if (/^\d{1,2}:\d{2}/.test(cleanRow[i]) || /^\d{1,2}\.\d{2}/.test(cleanRow[i])) {
                time = cleanRow[i];
                break;
              }
            }

            let eventIdx = -1;
            for (let i = foundCcyIdx + 1; i < cleanRow.length; i++) {
              const val = cleanRow[i].trim();
              if (/^(high|medium|low|vol\.|bull|\d|★|\s*)$/i.test(val)) continue;
              eventIdx = i;
              event = val;
              break;
            }

            if (eventIdx !== -1) {
              const postEvent = cleanRow.slice(eventIdx + 1).filter(c => c.trim() !== '');
              if (postEvent.length >= 3) {
                actual = postEvent[0];
                forecast = postEvent[1];
                previous = postEvent[2];
              } else if (postEvent.length === 2) {
                actual = postEvent[0];
                forecast = postEvent[1];
              } else if (postEvent.length === 1) {
                actual = postEvent[0];
              }
            }
          }

          if (!ccy || !event) return;

          let mappedCCY = ccy;
          if (['DE', 'DEU', 'FR', 'FRA', 'EU', 'EUR'].includes(ccy)) mappedCCY = 'EUR';
          if (['UK', 'GB', 'GBR'].includes(ccy)) mappedCCY = 'GBP';
          if (['CH', 'CHE'].includes(ccy)) mappedCCY = 'CHF';
          if (['CA', 'CAN'].includes(ccy)) mappedCCY = 'CAD';
          if (['US', 'USA'].includes(ccy)) mappedCCY = 'USD';
          if (['JP', 'JPN'].includes(ccy)) mappedCCY = 'JPY';
          if (['AU', 'AUS'].includes(ccy)) mappedCCY = 'AUD';
          if (['NZ', 'NZL'].includes(ccy)) mappedCCY = 'NZD';
          if (['CN', 'CHN', 'CNY'].includes(ccy)) mappedCCY = 'CNH';

          if (isWhitelisted(mappedCCY, event)) {
            if (!parsedDaysData[currentDay]) parsedDaysData[currentDay] = [];
            const ruleId = getCoreRuleId(mappedCCY, event);
            parsedDaysData[currentDay].push({
              time,
              ccy: mappedCCY,
              event,
              actual,
              forecast,
              previous,
              coreRuleId: ruleId,
              isCore: Boolean(ruleId)
            });
          }
        });

        if (Object.keys(parsedDaysData).length > 0) {
          setGlobalState(prev => ({
            ...prev,
            daysData: parsedDaysData,
            categoryScores: {}
          }));
          alert(isEs
            ? `✅ Archivo Excel cargado correctamente. Se identificaron ${Object.keys(parsedDaysData).length} jornadas de calendario.`
            : `✅ Excel calendar parsed successfully. Identified ${Object.keys(parsedDaysData).length} trading sessions.`);
        } else {
          alert(isEs
            ? 'No se pudieron extraer eventos con formato macro del archivo Excel. Asegúrate de usar el formato de Investing.com.'
            : 'Could not extract macro event records. Ensure the file follows Investing.com export format.');
        }
      } catch (err) {
        console.error('Excel parse error:', err);
        alert(isEs
          ? 'Error al procesar el archivo Excel. Verifica que sea un archivo .xlsx válido.'
          : 'Error parsing Excel spreadsheet. Please ensure it is a valid .xlsx file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getScoreScaleStyle = (score: number) => {
    if (score >= 4) return 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 font-black shadow-[0_0_8px_rgba(16,185,129,0.2)]';
    if (score >= 1) return 'bg-yellow-950/70 text-yellow-300 border border-yellow-500/50 font-bold';
    if (score === 0) return 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-medium';
    if (score >= -3) return 'bg-orange-950/70 text-orange-300 border border-orange-500/50 font-bold';
    return 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-black shadow-[0_0_8px_rgba(244,63,94,0.2)]';
  };

  const getCurrencyBadgeClass = (ccy: string) => {
    switch (ccy) {
      case 'USD': return 'bg-[#D9E1F2] text-[#0f172a]';
      case 'EUR': return 'bg-[#FFF2CC] text-[#0f172a]';
      case 'GBP': return 'bg-[#E2EFDA] text-[#0f172a]';
      case 'JPY': return 'bg-[#FCE4D6] text-[#0f172a]';
      case 'CAD': return 'bg-[#E1D5E7] text-[#0f172a]';
      case 'AUD': return 'bg-[#D5E8D4] text-[#0f172a]';
      case 'NZD': return 'bg-[#DAE8FC] text-[#0f172a]';
      case 'CHF': return 'bg-[#F8CECC] text-[#0f172a]';
      case 'CNH':
      case 'CNY': return 'bg-[#FFE6CC] text-[#0f172a]';
      default: return 'bg-[#E2E8F0] text-[#0f172a]';
    }
  };

  const forexCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF', 'CNH'];
  const intermarketAssets = [
    { id: 'VIX', name: isEs ? 'VIX (Volatilidad)' : 'VIX Volatility' },
    { id: 'Oil', name: isEs ? 'Petróleo (Crudo WTI)' : 'Crude Oil (WTI)' },
    { id: 'Gold', name: isEs ? 'Oro (XAU/USD)' : 'Gold (XAU/USD)' }
  ];

  return (
    <div className="w-full bg-[#020203] text-zinc-300 font-sans antialiased min-h-screen space-y-6 pb-16 selection:bg-cyan-900 selection:text-cyan-100">
      
      {/* 1. TOP HEADER & COMMAND TOOLBAR */}
      <div className="w-full bg-[#07080d] border-b border-zinc-800/80 p-5 md:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-24 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                {isEs ? '// MOTOR CUANTITATIVO DE CALENDARIO' : '// QUANTITATIVE CALENDAR ENGINE'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>⚡</span> {isEs ? 'Kairos Macro Hub' : 'Kairos Macro Hub'}
            </h1>
            <p className="text-zinc-400 text-xs mt-1 max-w-2xl font-light">
              {isEs 
                ? 'Motor Unificado de Riesgo, Divergencias y Filtrado Cuantitativo de Calendario Económico'
                : 'Unified Event Risk, Macro Divergence Scanner & Quantitative Economic Calendar Engine'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            {onReturnToHub && (
              <button
                type="button"
                onClick={onReturnToHub}
                className="text-[11px] text-zinc-400 hover:text-cyan-300 transition-colors border border-zinc-800 hover:border-cyan-500/40 bg-[#0c0d12] px-3 py-2 rounded-lg cursor-pointer"
              >
                {isEs ? '← Volver al Centro' : '← Return to Hub'}
              </button>
            )}
            
            <button
              type="button"
              onClick={lockCurrentAsPreviousWeek}
              className="bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 text-xs px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title={isEs ? 'Congelar semana actual como base previa' : 'Lock current week as baseline factors'}
            >
              <span>📌</span> {isEs ? 'Fijar como Semana Previa' : 'Lock as Prior Week'}
            </button>
            
            <button
              type="button"
              onClick={exportStateJSON}
              className="bg-[#0c0d12] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <span>📥</span> {isEs ? 'Exportar Backup' : 'Export JSON'}
            </button>
            
            <button
              type="button"
              onClick={() => jsonInputRef.current?.click()}
              className="bg-[#0c0d12] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <span>📤</span> {isEs ? 'Cargar Backup' : 'Load JSON'}
            </button>
            <input
              type="file"
              ref={jsonInputRef}
              accept=".json"
              className="hidden"
              onChange={importStateJSON}
            />

            <button
              type="button"
              onClick={resetAllScores}
              className="bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-900/40 text-xs px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <span>🗑️</span> {isEs ? 'Reiniciar Todo' : 'Reset All'}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs px-4 py-2 rounded-lg font-bold shadow-md transition cursor-pointer"
            >
              {isEs ? 'Exportar PDF →' : 'Export PDF →'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">

        {/* 2. DROP ZONE FOR EXCEL UPLOAD */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files.length) processExcelFile(e.dataTransfer.files[0]);
          }}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition cursor-pointer group bg-[#07080d] ${
            isDragOver ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_25px_rgba(6,182,212,0.2)]' : 'border-zinc-800 hover:border-cyan-500/60 hover:bg-[#090b12]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls"
            className="hidden"
            onChange={e => {
              if (e.target.files?.length) processExcelFile(e.target.files[0]);
            }}
          />
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-xs sm:text-sm font-medium text-zinc-200">
              {isEs ? (
                <>Arrastra tu archivo <span className="text-cyan-400 font-bold">Excel de Investing.com (.xlsx) aquí</span> o haz clic para explorar</>
              ) : (
                <>Drop your <span className="text-cyan-400 font-bold">Investing.com Excel (.xlsx) file here</span> or click to browse</>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              {isEs 
                ? 'Filtrado automático de eventos Tier-1 para USD, EUR, GBP, JPY, CAD, AUD, NZD, CHF, CNH'
                : 'Automated Tier-1 event parsing for USD, EUR, GBP, JPY, CAD, AUD, NZD, CHF, CNH'}
            </p>
          </div>
        </div>

        {/* 3. DIVERGENCE SCANNER */}
        <div className="bg-[#07080d] border border-zinc-800/80 p-5 rounded-2xl font-mono space-y-4 shadow-2xl transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 pb-3 gap-2">
            <div>
              <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <span>⚡</span> {isEs ? 'Escáner de Divergencias Macro Detectadas' : 'Macro Divergence Opportunities Scanner'}
              </span>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                {isEs ? 'Pares de divisas con asimetría direccional ≥ 3 puntos' : 'Currency crosses with directional score differential ≥ 3 pts'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-lg font-bold">
                {divergences.length} {isEs ? 'Pares Aprobados' : 'Approved Pairs'}
              </span>
              {divergences.length > 2 && (
                <button
                  type="button"
                  onClick={() => setIsDivergenceExpanded(!isDivergenceExpanded)}
                  className="bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-[11px] px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  {isDivergenceExpanded 
                    ? (isEs ? '↑ Mostrar Menos (Top 2)' : '↑ Show Less (Top 2)') 
                    : (isEs ? `↕️ Ver todos (${divergences.length} Pares)` : `↕️ View All (${divergences.length} Pairs)`)}
                </button>
              )}
            </div>
          </div>

          {divergences.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs items-start">
              {(isDivergenceExpanded ? divergences : divergences.slice(0, 2)).map(d => {
                const strongData = getFullCurrencyBreakdownGrouped(d.strong);
                const weakData = getFullCurrencyBreakdownGrouped(d.weak);
                const isBuy = d.actionBadge.includes('COMPRA') || d.actionBadge.includes('BUY');

                return (
                  <div key={d.pair} className="bg-[#05060a] border border-zinc-800 hover:border-cyan-500/50 p-4 sm:p-5 rounded-xl space-y-3 transition shadow-lg flex flex-col justify-start h-full">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase font-mono block">
                          {isEs ? 'Oportunidad Macro' : 'Macro Opportunity'}
                        </span>
                        <span className="font-black text-cyan-400 text-lg font-mono tracking-tight">{d.pair}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className={`${isBuy ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'bg-rose-950/90 text-rose-400 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.2)]'} border px-3 py-1 rounded-lg text-xs font-black block mb-1`}>
                          {d.actionBadge}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {isEs ? 'Diferencial:' : 'Spread:'} <strong className="text-white">{d.diff} pts</strong>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                      {/* STRONG CURRENCY CARD */}
                      <div className="bg-[#090b12] border border-emerald-500/30 rounded-xl p-3 space-y-2">
                        <div className="flex justify-between items-center border-b border-emerald-500/20 pb-1 font-mono">
                          <span className="font-bold text-emerald-400 text-xs">
                            {d.strong} (+{d.strongScore})
                          </span>
                          <span className="text-[9px] text-emerald-500 font-bold uppercase">{isEs ? 'Fuerte' : 'Strong'}</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="space-y-1">
                            <span className="text-[9px] text-amber-300 font-mono font-bold uppercase tracking-wider block">
                              📌 {isEs ? 'Sem. Previa' : 'Prior Week'} ({strongData.prevTotal > 0 ? '+' : ''}{strongData.prevTotal}):
                            </span>
                            {strongData.prevList.length > 0 ? (
                              strongData.prevList.map((b, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[10px] text-zinc-300 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/60">
                                  <span className="pr-1 truncate">{b.label}</span>
                                  <span className={`font-mono font-bold ${b.score > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {b.score > 0 ? '+' : ''}{b.score}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[9px] text-zinc-600 italic block pl-1">{isEs ? 'Sin eventos previos' : 'No prior events'}</span>
                            )}
                          </div>

                          <div className="space-y-1 pt-1 border-t border-zinc-800/60">
                            <span className="text-[9px] text-cyan-300 font-mono font-bold uppercase tracking-wider block">
                              ⚡ {isEs ? 'Esta Semana:' : 'This Week:'}
                            </span>
                            {strongData.currList.length > 0 ? (
                              strongData.currList.map((b, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[10px] text-zinc-100 bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-700/60">
                                  <span className="pr-1 truncate">{b.label}</span>
                                  <span className={`font-mono font-bold ${b.score > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {b.score > 0 ? '+' : ''}{b.score}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[9px] text-zinc-600 italic block pl-1">{isEs ? 'Pendiente evaluar' : 'Pending evaluation'}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* WEAK CURRENCY CARD */}
                      <div className="bg-[#090b12] border border-rose-500/30 rounded-xl p-3 space-y-2">
                        <div className="flex justify-between items-center border-b border-rose-500/20 pb-1 font-mono">
                          <span className="font-bold text-rose-400 text-xs">
                            {d.weak} ({d.weakScore})
                          </span>
                          <span className="text-[9px] text-rose-500 font-bold uppercase">{isEs ? 'Débil' : 'Weak'}</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="space-y-1">
                            <span className="text-[9px] text-amber-300 font-mono font-bold uppercase tracking-wider block">
                              📌 {isEs ? 'Sem. Previa' : 'Prior Week'} ({weakData.prevTotal > 0 ? '+' : ''}{weakData.prevTotal}):
                            </span>
                            {weakData.prevList.length > 0 ? (
                              weakData.prevList.map((b, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[10px] text-zinc-300 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/60">
                                  <span className="pr-1 truncate">{b.label}</span>
                                  <span className={`font-mono font-bold ${b.score > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {b.score > 0 ? '+' : ''}{b.score}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[9px] text-zinc-600 italic block pl-1">{isEs ? 'Sin eventos previos' : 'No prior events'}</span>
                            )}
                          </div>

                          <div className="space-y-1 pt-1 border-t border-zinc-800/60">
                            <span className="text-[9px] text-cyan-300 font-mono font-bold uppercase tracking-wider block">
                              ⚡ {isEs ? 'Esta Semana:' : 'This Week:'}
                            </span>
                            {weakData.currList.length > 0 ? (
                              weakData.currList.map((b, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[10px] text-zinc-100 bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-700/60">
                                  <span className="pr-1 truncate">{b.label}</span>
                                  <span className={`font-mono font-bold ${b.score > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {b.score > 0 ? '+' : ''}{b.score}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[9px] text-zinc-600 italic block pl-1">{isEs ? 'Pendiente evaluar' : 'Pending evaluation'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-zinc-500 bg-[#05060a] border border-zinc-800 rounded-xl space-y-1">
              <span className="text-xl block mb-1">⚖️</span>
              <p className="text-xs font-semibold text-zinc-300">
                {isEs 
                  ? 'No hay divergencias macro ≥ 3 puntos detectadas actualmente'
                  : 'No macro divergences ≥ 3 points currently detected'}
              </p>
              <p className="text-[11px] text-zinc-500">
                {isEs
                  ? 'Evalúa los eventos económicos en las secciones inferiores para alimentar las puntuaciones en vivo.'
                  : 'Evaluate economic releases in the sessions below to feed live scoring parameters.'}
              </p>
            </div>
          )}
        </div>

        {/* 4. CONSOLIDATED QUANTITATIVE MATRIX */}
        <div className="bg-[#07080d] border border-zinc-800/80 p-5 rounded-2xl space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-3 gap-2">
            <div>
              <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider block font-mono">
                {isEs ? 'Matriz Cuantitativa Consolidada' : 'Consolidated Quantitative Score Matrix'}
              </span>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                {isEs 
                  ? 'Base histórica fija combinada con catalizadores evaluados de la semana'
                  : 'Fixed prior baseline combined with live evaluated event catalysts'}
              </p>
            </div>

            {/* Score scale legend */}
            <div className="flex items-center gap-1.5 text-[9px] font-mono flex-wrap">
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 font-bold">+4 a +10</span>
              <span className="px-2 py-0.5 rounded bg-yellow-950/70 text-yellow-300 border border-yellow-500/50 font-bold">+1 a +3</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 font-bold">0</span>
              <span className="px-2 py-0.5 rounded bg-orange-950/70 text-orange-300 border border-orange-500/50 font-bold">-1 a -3</span>
              <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/50 font-bold">-4 a -10</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section A: Forex Core */}
            <div className="overflow-x-auto bg-[#05060a] p-4 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-2.5 font-mono">
                {isEs ? '// SECCIÓN A: DIVISAS FOREX CORE' : '// SECTION A: G10 CORE FOREX'}
              </span>
              <table className="w-full text-xs text-left min-w-[320px]">
                <thead>
                  <tr className="text-zinc-500 text-[10px] border-b border-zinc-800 font-mono uppercase">
                    <th className="p-2">{isEs ? 'Divisa' : 'Currency'}</th>
                    <th className="p-2 text-center">{isEs ? 'Previo (Fijo)' : 'Prior (Fixed)'}</th>
                    <th className="p-2 text-center">{isEs ? 'Eventos (Auto)' : 'Events (Auto)'}</th>
                    <th className="p-2 text-center">{isEs ? 'Total Combinado' : 'Combined Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {forexCurrencies.map(asset => {
                    const prev = globalState.matrixPrev[asset] !== undefined ? globalState.matrixPrev[asset] : 0;
                    const ev = computedMatrix.events[asset] || 0;
                    const tot = computedMatrix.totals[asset] || 0;
                    return (
                      <tr key={asset} className="border-b border-zinc-800/40 hover:bg-[#0a0a0f] transition">
                        <td className="p-2 font-bold text-white flex items-center gap-2">
                          <span className={`${getCurrencyBadgeClass(asset)} text-[10px] px-2.5 py-0.5 rounded font-mono font-bold`}>
                            {asset}
                          </span>
                        </td>
                        <td className="p-2 text-center text-zinc-400 font-mono">
                          <input
                            type="number"
                            value={prev}
                            onChange={e => updatePrevMatrix(asset, e.target.value)}
                            className="w-14 bg-[#020203] border border-zinc-700/80 rounded px-1.5 py-0.5 text-center text-xs text-white focus:outline-none focus:border-cyan-400 font-mono font-bold"
                          />
                        </td>
                        <td className="p-2 text-center font-mono text-xs text-zinc-300 font-bold">
                          {ev > 0 ? `+${ev}` : ev}
                        </td>
                        <td className="p-2 text-center font-mono text-xs">
                          <span className={`px-2.5 py-1 rounded inline-block ${getScoreScaleStyle(tot)}`}>
                            {tot > 0 ? `+${tot}` : tot}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Section B: Commodities & Cross-Asset Risk */}
            <div className="overflow-x-auto bg-[#05060a] p-4 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-2.5 font-mono">
                {isEs ? '// SECCIÓN B: MATERIAS PRIMAS Y RIESGO' : '// SECTION B: COMMODITIES & CROSS-ASSET RISK'}
              </span>
              <table className="w-full text-xs text-left min-w-[340px]">
                <thead>
                  <tr className="text-zinc-500 text-[10px] border-b border-zinc-800 font-mono uppercase">
                    <th className="p-2">{isEs ? 'Activo' : 'Asset'}</th>
                    <th className="p-2 text-center">{isEs ? 'Previo (Fijo)' : 'Prior (Fixed)'}</th>
                    <th className="p-2 text-center">{isEs ? 'Evaluación' : 'Rating'}</th>
                    <th className="p-2 text-center">{isEs ? 'Total Combinado' : 'Combined Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {intermarketAssets.map(item => {
                    const prev = globalState.matrixPrev[item.id] !== undefined ? globalState.matrixPrev[item.id] : 0;
                    const curScore = globalState.intermarketScores[item.id] || 0;
                    const tot = computedMatrix.totals[item.id] || 0;

                    return (
                      <tr key={item.id} className="border-b border-zinc-800/40 hover:bg-[#0a0a0f] transition">
                        <td className="p-2 font-bold text-white text-xs">{item.name}</td>
                        <td className="p-2 text-center text-zinc-400 font-mono">
                          <input
                            type="number"
                            value={prev}
                            onChange={e => updatePrevMatrix(item.id, e.target.value)}
                            className="w-14 bg-[#020203] border border-zinc-700/80 rounded px-1.5 py-0.5 text-center text-xs text-white focus:outline-none focus:border-cyan-400 font-mono font-bold"
                          />
                        </td>
                        <td className="p-2 text-center font-mono">
                          <div className="flex items-center justify-center gap-1">
                            {[2, 1, 0, -1, -2].map(scoreOption => {
                              const isActive = curScore === scoreOption;
                              const activeClass =
                                scoreOption === 2
                                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                                  : scoreOption === 1
                                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                                  : scoreOption === 0
                                  ? 'bg-zinc-700 text-white border-zinc-500 shadow-sm'
                                  : scoreOption === -1
                                  ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                                  : 'bg-rose-700 text-white border-rose-500 shadow-sm';

                              return (
                                <button
                                  key={scoreOption}
                                  type="button"
                                  onClick={() => setIntermarketScore(item.id, scoreOption)}
                                  className={`w-7 h-6 inline-flex items-center justify-center rounded text-[10px] font-bold border transition cursor-pointer ${
                                    isActive
                                      ? activeClass
                                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                  }`}
                                >
                                  {scoreOption > 0 ? `+${scoreOption}` : scoreOption}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-2 text-center font-mono text-xs">
                          <span className={`px-2.5 py-1 rounded inline-block ${getScoreScaleStyle(tot)}`}>
                            {tot > 0 ? `+${tot}` : tot}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 5. CALENDAR FILTER BAR */}
        <div className="bg-[#07080d] border border-zinc-800/80 p-3.5 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-center text-xs font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-zinc-500 text-[10px] font-bold uppercase mr-1">
              {isEs ? 'Filtrar:' : 'Filter:'}
            </span>
            {['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF', 'CNH'].map(c => {
              const isSelected = activeCurrencyFilter === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCurrencyFilter(c)}
                  className={`px-2.5 py-1 rounded font-bold cursor-pointer transition text-xs ${
                    isSelected
                      ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {c === 'ALL' ? (isEs ? 'TODAS' : 'ALL') : c}
                </button>
              );
            })}

            <span className="text-zinc-700 mx-1">|</span>
            <button
              type="button"
              onClick={() => setFilterCoreOnly(!filterCoreOnly)}
              className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 cursor-pointer text-xs ${
                filterCoreOnly
                  ? 'bg-amber-500 text-black border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60'
              }`}
            >
              <span>🎯</span> {isEs ? 'Solo Core Principal' : 'Core Indicators Only'}
            </button>
          </div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isEs ? '🔍 Buscar evento...' : '🔍 Search event...'}
              className="w-full md:w-52 bg-[#030305] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>

        {/* 6. INTERACTIVE WEEKLY CALENDAR & SENTIMENT GRADING */}
        <div className="space-y-6">
          {Object.keys(globalState.daysData).map(day => {
            const rawEvents = globalState.daysData[day] || [];
            let events = rawEvents.filter(e => isWhitelisted(e.ccy, e.event));

            if (filterCoreOnly) events = events.filter(e => e.isCore);
            if (activeCurrencyFilter !== 'ALL') events = events.filter(e => e.ccy === activeCurrencyFilter);
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              events = events.filter(e => (e.event || '').toLowerCase().includes(q) || (e.ccy || '').toLowerCase().includes(q));
            }

            if (events.length === 0) return null;

            const coreCount = events.filter(e => e.isCore).length;
            const formattedDayTitle = formatDayLabel(day, isEs);

            // Group events for sentiment blocks
            const blocks: Array<{ events: MacroEvent[]; smartTitle: string; categoryId: string; ccy: string }> = [];
            let currentBlock: MacroEvent[] = [];

            events.forEach((item, idx) => {
              currentBlock.push(item);
              const nextItem = events[idx + 1];
              const currentCategory = getCategorySentimentTitle(item.ccy, item.event, isEs);
              const nextCategory = nextItem ? getCategorySentimentTitle(nextItem.ccy, nextItem.event, isEs) : null;

              if (!nextItem || nextItem.ccy !== item.ccy || nextCategory !== currentCategory) {
                const smartTitle = getSmartGroupTitle(item.ccy, currentBlock, isEs);
                const categoryId = `${day}-${item.ccy}-${currentCategory}`.replace(/[^a-zA-Z0-9]/g, '-');
                blocks.push({
                  events: [...currentBlock],
                  smartTitle,
                  categoryId,
                  ccy: item.ccy
                });
                currentBlock = [];
              }
            });

            return (
              <div
                key={day}
                className="day-card bg-[#07090e] border border-zinc-800/90 rounded-2xl shadow-xl space-y-4 overflow-hidden transition hover:border-zinc-700/80"
              >
                {/* Day Header */}
                <div className="bg-[#0b0f19] border-b border-zinc-800/80 px-5 py-3.5 flex justify-between items-center">
                  <div className="flex items-center gap-2 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-cyan-300 font-bold font-mono text-xs shadow-sm">
                    <span>📅</span>
                    <span className="tracking-wider">{formattedDayTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    {coreCount > 0 && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
                        🎯 {coreCount} {isEs ? 'Core' : 'Core'}
                      </span>
                    )}
                    <span className="text-cyan-200/80 bg-zinc-900/80 px-2.5 py-0.5 rounded-lg border border-zinc-700/60 font-bold">
                      {events.length} {isEs ? 'Eventos' : 'Events'}
                    </span>
                  </div>
                </div>

                {/* Day Table */}
                <div className="px-4 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse table-fixed min-w-[620px]">
                    <thead>
                      <tr className="text-zinc-500 text-[10px] border-b border-zinc-800 uppercase tracking-wider">
                        <th className="p-2.5 w-[10%]">{isEs ? 'Hora' : 'Time (UTC)'}</th>
                        <th className="p-2.5 w-[10%]">{isEs ? 'Divisa' : 'Currency'}</th>
                        <th className="p-2.5 w-[44%]">{isEs ? 'Evento Económico' : 'Economic Indicator'}</th>
                        <th className="p-2.5 w-[12%]">{isEs ? 'Actual' : 'Actual'}</th>
                        <th className="p-2.5 w-[12%]">{isEs ? 'Pronóstico' : 'Forecast'}</th>
                        <th className="p-2.5 w-[12%]">{isEs ? 'Previo' : 'Previous'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blocks.map(block => {
                        const scoreObj = globalState.categoryScores[block.categoryId];
                        const currentScore = scoreObj ? scoreObj.score : 0;
                        const summaryText = Array.from(new Set(block.events.map(e => e.event))).join(' / ');

                        return (
                          <React.Fragment key={block.categoryId}>
                            {block.events.map((item, itemIdx) => {
                              const isCore = item.isCore;
                              const rowClass = isCore
                                ? 'bg-gradient-to-r from-amber-500/10 via-cyan-500/5 to-transparent border-l-3 border-l-amber-500 border-b border-amber-500/20 text-zinc-100'
                                : itemIdx % 2 === 0
                                ? 'bg-transparent border-b border-zinc-800/30'
                                : 'bg-zinc-900/20 border-b border-zinc-800/30';

                              return (
                                <tr key={`${item.event}-${itemIdx}`} className={`${rowClass} hover:bg-zinc-800/40 transition`}>
                                  <td className="p-2.5 text-zinc-400 font-mono text-[11px] font-bold">{item.time || '—'}</td>
                                  <td className="p-2.5">
                                    <span className={`${getCurrencyBadgeClass(item.ccy)} px-2 py-0.5 rounded font-bold text-[9px] tracking-wide`}>
                                      {item.ccy}
                                    </span>
                                  </td>
                                  <td className="p-2.5 font-sans text-xs font-medium truncate pr-2">
                                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                                      <span className={`${isCore ? 'text-amber-200 font-bold' : 'text-zinc-200'} truncate`}>
                                        {item.event}
                                      </span>
                                      {isCore && (
                                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0.5 rounded font-bold font-mono tracking-wider shrink-0">
                                          🎯 CORE
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-2.5 font-bold text-white font-mono truncate">{item.actual || '—'}</td>
                                  <td className="p-2.5 text-zinc-400 font-mono truncate">{item.forecast || '—'}</td>
                                  <td className="p-2.5 text-zinc-500 font-mono truncate">{item.previous || '—'}</td>
                                </tr>
                              );
                            })}

                            {/* Group Sentiment Assessment Box */}
                            <tr>
                              <td colSpan={6} className="py-2.5 px-1">
                                <div className="bg-gradient-to-r from-amber-950/20 via-zinc-900/40 to-zinc-900/20 border border-amber-500/30 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 my-1">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="text-amber-400 text-xs shrink-0">📊</span>
                                    <span className="text-xs font-bold text-amber-200 tracking-wide truncate">
                                      {block.smartTitle}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 font-mono shrink-0 self-end sm:self-auto">
                                    <span className="text-[10px] text-zinc-400 mr-1 uppercase">
                                      {isEs ? 'Puntuación:' : 'Score:'}
                                    </span>
                                    {[2, 1, 0, -1, -2].map(scoreVal => {
                                      const isScoreActive = currentScore === scoreVal;
                                      const activeColor =
                                        scoreVal === 2
                                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                                          : scoreVal === 1
                                          ? 'bg-emerald-500 text-white border-emerald-300 shadow-sm'
                                          : scoreVal === 0
                                          ? 'bg-zinc-700 text-white border-zinc-500 shadow-sm'
                                          : scoreVal === -1
                                          ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                                          : 'bg-rose-700 text-white border-rose-500 shadow-sm';

                                      return (
                                        <button
                                          key={scoreVal}
                                          type="button"
                                          onClick={() => setCategoryScore(block.categoryId, block.ccy, scoreVal, block.smartTitle, summaryText)}
                                          className={`w-8 h-6 inline-flex items-center justify-center rounded text-[10px] font-bold border transition cursor-pointer ${
                                            isScoreActive
                                              ? activeColor
                                              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600'
                                          }`}
                                        >
                                          {scoreVal > 0 ? `+${scoreVal}` : scoreVal}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Day Notes Textarea */}
                <div className="px-4 pb-4">
                  <textarea
                    value={globalState.dailyNotes[day] || ''}
                    onChange={e => updateDailyNote(day, e.target.value)}
                    rows={1.5}
                    placeholder={isEs
                      ? `Notas de la jornada para ${formattedDayTitle} (noticias inesperadas, eventos geopolíticos)...`
                      : `Session notes for ${formattedDayTitle} (unscheduled speeches, geopolitical breaking events)...`}
                    className="w-full bg-[#030305] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/60 font-mono transition placeholder-zinc-600"
                  />
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
