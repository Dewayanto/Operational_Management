
export enum AppLevel {
  BASIC = 'BASIC',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export enum ToolType {
  DASHBOARD = 'DASHBOARD',
  INFOGRAPHIC = 'INFOGRAPHIC',
}

export interface Metric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ProcessStep {
  step: string;
  description: string;
}

export interface ChartItem {
  name: string;
  value: number;
}

export interface InfographicData {
  title: string;
  summary: string;
  metrics: Metric[];
  processFlow: ProcessStep[];
  chartData: ChartItem[];
  chartTitle: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
}

export interface EOQResult {
  eoq: number;
  totalCost: number;
  holdingCost: number;
  orderingCost: number;
  points: {
    q: number;
    totalCost: number;
    holdingCost: number;
    orderingCost: number;
  }[];
}

export interface SIPOCData {
  suppliers: string;
  inputs: string;
  process: string;
  outputs: string;
  customers: string;
}

export interface FMEARow {
  id: string;
  processStep: string;
  failureMode: string;
  effect: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
}
