export interface City {
  id: string;
  name: string;
  state: string;
  region: "Sul" | "Norte" | "Nordeste" | "Sudeste" | "Centro-Oeste";
  lat: number;
  lon: number;
  historic_temp_avg: number;
  historic_precip_avg: number;
}

export type EnsoScenario = "el_nino_forte" | "el_nino_moderado" | "la_nina" | "neutro";

export type InmetAlert = "none" | "yellow" | "orange" | "red";

export interface FireHotspot {
  lat: number;
  lon: number;
  date: string;
}

export interface WeatherData {
  precipitation72h: number;
  maxTemp: number;
  minTemp: number;
  maxWindSpeed: number;
  maxWindGust: number;
  soilMoisture: number;
  ensoScenario: EnsoScenario;
  hasInmetAlert: InmetAlert;
  hasFirmsHotspots: boolean;
  firmsHotspots: { count: number; points: FireHotspot[] };
  realTimeFetched: boolean;
}

export interface RiskItem {
  score: number;
  level: "Baixo" | "Médio" | "Alto" | "Crítico";
}

export interface CalculatedRisks {
  chuvaExtrema: RiskItem;
  seca: RiskItem;
  ondaCalor: RiskItem;
  frio: RiskItem;
  ventoForte: RiskItem;
  deslizamento: RiskItem;
  overall: "Baixo" | "Médio" | "Alto" | "Crítico";
}

export interface OperationalImpact {
  setor: string;
  descricao: string;
  gravidade: "Baixa" | "Média" | "Alta" | "Crítica";
}

export interface PreventativeAction {
  destinatario: string;
  acao: string;
  prioridade: "Imediata" | "Baixa" | "Média" | "Alta" | "Crítica";
}

export interface RiskReport {
  explicabilidade: string;
  impactos: OperationalImpact[];
  acoes: PreventativeAction[];
  isAiGenerated: boolean;
  source: string | null;
}

export interface RiskApiResponse {
  city: City;
  weather: WeatherData;
  risks: CalculatedRisks;
  report: RiskReport;
}
