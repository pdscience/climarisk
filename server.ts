import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Shared cities registry
const CITIES = [
  // SUL
  { id: "porto_alegre", name: "Porto Alegre", state: "RS", region: "Sul", lat: -30.0346, lon: -51.2177, historic_temp_avg: 19.5, historic_precip_avg: 110 },
  { id: "florianopolis", name: "Florianópolis", state: "SC", region: "Sul", lat: -27.5954, lon: -48.5480, historic_temp_avg: 20.4, historic_precip_avg: 120 },
  { id: "curitiba", name: "Curitiba", state: "PR", region: "Sul", lat: -25.4284, lon: -49.2733, historic_temp_avg: 16.8, historic_precip_avg: 115 },
  // NORTE
  { id: "manaus", name: "Manaus", state: "AM", region: "Norte", lat: -3.1190, lon: -60.0217, historic_temp_avg: 26.8, historic_precip_avg: 180 },
  { id: "belem", name: "Belém", state: "PA", region: "Norte", lat: -1.4558, lon: -48.4902, historic_temp_avg: 26.5, historic_precip_avg: 220 },
  { id: "rio_branco", name: "Rio Branco", state: "AC", region: "Norte", lat: -9.9749, lon: -67.8076, historic_temp_avg: 25.1, historic_precip_avg: 140 },
  { id: "boa_vista", name: "Boa Vista", state: "RR", region: "Norte", lat: 2.8195, lon: -60.6714, historic_temp_avg: 27.4, historic_precip_avg: 130 },
  { id: "macapa", name: "Macapá", state: "AP", region: "Norte", lat: 0.0349, lon: -51.0694, historic_temp_avg: 26.0, historic_precip_avg: 200 },
  { id: "palmas", name: "Palmas", state: "TO", region: "Norte", lat: -10.1689, lon: -48.3317, historic_temp_avg: 27.2, historic_precip_avg: 120 },
  { id: "porto_velho", name: "Porto Velho", state: "RO", region: "Norte", lat: -8.7612, lon: -63.9004, historic_temp_avg: 26.5, historic_precip_avg: 150 },
  // NORDESTE
  { id: "salvador", name: "Salvador", state: "BA", region: "Nordeste", lat: -12.9714, lon: -38.5124, historic_temp_avg: 26.2, historic_precip_avg: 180 },
  { id: "fortaleza", name: "Fortaleza", state: "CE", region: "Nordeste", lat: -3.7319, lon: -38.5267, historic_temp_avg: 26.6, historic_precip_avg: 110 },
  { id: "recife", name: "Recife", state: "PE", region: "Nordeste", lat: -8.0543, lon: -34.8813, historic_temp_avg: 25.8, historic_precip_avg: 160 },
  { id: "petrolina", name: "Petrolina", state: "PE", region: "Nordeste", lat: -9.3883, lon: -40.5026, historic_temp_avg: 26.2, historic_precip_avg: 45 },
  { id: "sao_luis", name: "São Luís", state: "MA", region: "Nordeste", lat: -2.5297, lon: -44.2825, historic_temp_avg: 26.5, historic_precip_avg: 200 },
  { id: "teresina", name: "Teresina", state: "PI", region: "Nordeste", lat: -5.0892, lon: -42.8019, historic_temp_avg: 27.0, historic_precip_avg: 90 },
  { id: "natal", name: "Natal", state: "RN", region: "Nordeste", lat: -5.7945, lon: -35.2110, historic_temp_avg: 26.3, historic_precip_avg: 130 },
  { id: "joao_pessoa", name: "João Pessoa", state: "PB", region: "Nordeste", lat: -7.1195, lon: -34.8450, historic_temp_avg: 25.8, historic_precip_avg: 140 },
  { id: "maceio", name: "Maceió", state: "AL", region: "Nordeste", lat: -9.6658, lon: -35.7353, historic_temp_avg: 25.5, historic_precip_avg: 150 },
  { id: "aracaju", name: "Aracaju", state: "SE", region: "Nordeste", lat: -10.9091, lon: -37.0677, historic_temp_avg: 25.8, historic_precip_avg: 130 },
  // SUDESTE
  { id: "sao_paulo", name: "São Paulo", state: "SP", region: "Sudeste", lat: -23.5505, lon: -46.6333, historic_temp_avg: 19.5, historic_precip_avg: 130 },
  { id: "rio_de_janeiro", name: "Rio de Janeiro", state: "RJ", region: "Sudeste", lat: -22.9068, lon: -43.1729, historic_temp_avg: 23.5, historic_precip_avg: 110 },
  { id: "belo_horizonte", name: "Belo Horizonte", state: "MG", region: "Sudeste", lat: -19.9167, lon: -43.9345, historic_temp_avg: 21.0, historic_precip_avg: 120 },
  { id: "vitoria", name: "Vitória", state: "ES", region: "Sudeste", lat: -20.3155, lon: -40.3128, historic_temp_avg: 24.5, historic_precip_avg: 100 },
  // CENTRO-OESTE
  { id: "brasilia", name: "Brasília", state: "DF", region: "Centro-Oeste", lat: -15.7975, lon: -47.8919, historic_temp_avg: 21.5, historic_precip_avg: 120 },
  { id: "goiania", name: "Goiânia", state: "GO", region: "Centro-Oeste", lat: -16.6869, lon: -49.2648, historic_temp_avg: 22.5, historic_precip_avg: 130 },
  { id: "cuiaba", name: "Cuiabá", state: "MT", region: "Centro-Oeste", lat: -15.6014, lon: -56.0979, historic_temp_avg: 26.5, historic_precip_avg: 110 },
  { id: "campo_grande", name: "Campo Grande", state: "MS", region: "Centro-Oeste", lat: -20.4697, lon: -54.6201, historic_temp_avg: 23.0, historic_precip_avg: 120 }
];

// Lazy-loaded AI client (OpenAI-compatible). Supports OpenRouter and NVIDIA NIM
// via the AI_PROVIDER env var. Both expose an OpenAI-compatible /v1 chat API.
function getAIClient(): OpenAI | null {
  const provider = (process.env.AI_PROVIDER || "openrouter").toLowerCase();

  if (provider === "nvidia") {
    const apiKey = process.env.NVIDIA_API_KEY;
    const model = process.env.NVIDIA_MODEL;
    if (!apiKey || apiKey.trim() === "") return null;
    return new OpenAI({
      apiKey: apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "MY_OPENROUTER_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new OpenAI({
    apiKey: apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://climax.local",
      "X-Title": "ClimaRisk",
    },
  });
}

function getAIModel(): string | null {
  const provider = (process.env.AI_PROVIDER || "openrouter").toLowerCase();
  if (provider === "nvidia") {
    const model = process.env.NVIDIA_MODEL;
    return model && model.trim() !== "" ? model : null;
  }
  const model = process.env.OPENROUTER_MODEL;
  return model && model.trim() !== "" ? model : null;
}

// Fetch real INMET CAP alerts via WIS2 broker metadata (best-effort; live
// CAP alerts are distributed over MQTT, so this gracefully degrades to "none"
// when no REST pull is available for the given state).
async function fetchInmetAlert(state: string): Promise<string> {
  try {
    const url = "http://wis2bra.inmet.gov.br/oapi/collections/discovery-metadata/items/urn:wmo:md:br-inmet:alerts?f=json";
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return "none";
    const data = await res.json();
    const features: any[] = data?.features || [];
    const stateUpper = state.toUpperCase();
    const relevant = features.filter((f: any) => {
      const props = f?.properties || {};
      const area = JSON.stringify(props).toUpperCase();
      return area.includes(stateUpper);
    });
    if (relevant.length === 0) return "none";
    const severities = relevant.flatMap((f: any) => {
      const props = f?.properties || {};
      const infos = props.info || [];
      const fromInfo = infos.map((i: any) => i.severity).filter(Boolean);
      if (fromInfo.length) return fromInfo;
      if (props.severity) return [props.severity];
      return [];
    });
    const has = (s: string) => severities.some((x: string) => x.toLowerCase().includes(s));
    if (has("vermelho") || has("red") || has("perigo")) return "red";
    if (has("laranja") || has("orange") || has("risco")) return "orange";
    if (has("amarelo") || has("yellow")) return "yellow";
    return "none";
  } catch (err) {
    // INMET live CAP is MQTT-only; degrade silently to "none"
    return "none";
  }
}

// UF -> full state name (as used by INPE Queimadas CSV)
const UF_TO_NAME: Record<string, string> = {
  AC: "ACRE", AL: "ALAGOAS", AP: "AMAPÁ", AM: "AMAZONAS", BA: "BAHIA", CE: "CEARÁ",
  DF: "DISTRITO FEDERAL", ES: "ESPÍRITO SANTO", GO: "GOIÁS", MA: "MARANHÃO", MT: "MATO GROSSO",
  MS: "MATO GROSSO DO SUL", MG: "MINAS GERAIS", PA: "PARÁ", PB: "PARAÍBA", PR: "PARANÁ",
  PE: "PERNAMBUCO", PI: "PIAUÍ", RJ: "RIO DE JANEIRO", RN: "RIO GRANDE DO NORTE", RS: "RIO GRANDE DO SUL",
  RO: "RONDÔNIA", RR: "RORAIMA", SC: "SANTA CATARINA", SP: "SÃO PAULO", SE: "SERGIPE",
  TO: "TOCANTINS",
};

// Fetch real fire hotspots from INPE Queimadas daily CSV (per-state)
async function fetchInpeFires(state: string): Promise<{ count: number; points: Array<{ lat: number; lon: number; date: string }> }> {
  try {
    const stateName = UF_TO_NAME[state.toUpperCase()] || state.toUpperCase();
    // Find the most recent available daily CSV (up to 2 days back, fast timeout)
    const now = new Date();
    let csv = "";
    let usedDate = "";
    for (let i = 0; i < 2; i++) {
      const d = new Date(now.getTime() - i * 86400000);
      const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      const url = `https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/diario/Brasil/focos_diario_br_${ymd}.csv`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        csv = await res.text();
        usedDate = ymd;
        break;
      }
    }
    if (!csv) return { count: 0, points: [] };
    const lines = csv.trim().split("\n").filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return { count: 0, points: [] };
    const header = lines[0].split(",");
    const idx = {
      lat: header.indexOf("lat"),
      lon: header.indexOf("lon"),
      estado: header.indexOf("estado"),
      data: header.indexOf("data_hora_gmt"),
    };
    const points = lines
      .slice(1)
      .map((line) => line.split(","))
      .filter((cols) => (idx.estado >= 0 ? (cols[idx.estado]?.trim().toUpperCase() === stateName) : false))
      .map((cols) => ({
        lat: parseFloat(cols[idx.lat]),
        lon: parseFloat(cols[idx.lon]),
        date: idx.data >= 0 ? cols[idx.data]?.trim() || usedDate : usedDate,
      }))
      .filter((pt: any) => !isNaN(pt.lat) && !isNaN(pt.lon))
      .slice(0, 25);
    return { count: points.length, points };
  } catch (err) {
    console.warn(`INPE Queimadas fetch failed for ${state}.`, err);
    return { count: 0, points: [] };
  }
}

// REST APIs
app.get("/api/cities", (req, res) => {
  res.json({ cities: CITIES });
});

// ---- Rules engine: evaluate the 4 risks for a city given its real weather ----
type WeatherInput = {
  precipitation72h: number;
  maxTemp: number;
  minTemp: number;
  soilMoisture: number;
  windSpeed: number;
  windGust: number;
  hasInmetAlert: "none" | "yellow" | "orange" | "red";
  hasFireHotspots: boolean;
};

function evaluateRisks(
  city: { id: string; name: string; state: string; region: string; historic_temp_avg: number },
  ensoScenario: string,
  w: WeatherInput
) {
  const { precipitation72h: finalPrecipitation, maxTemp: finalMaxTemp, minTemp: finalMinTemp, soilMoisture: finalSoilMoisture, windSpeed: finalWindSpeed, windGust: finalWindGust, hasInmetAlert: hasInmetAlertFinal, hasFireHotspots: hasFireHotspotsFinal } = w;

  // --- CHUVA EXTREMA ---
  let probChuvaExtrema = Math.min(100, Math.max(5, Math.round((finalPrecipitation / 100) * 50 + finalSoilMoisture * 0.4)));
  if (city.region === "Sul") {
    if (ensoScenario === "el_nino_forte") probChuvaExtrema += 25;
    else if (ensoScenario === "el_nino_moderado") probChuvaExtrema += 15;
  } else if (city.region === "Norte" || city.region === "Nordeste") {
    if (ensoScenario === "la_nina") probChuvaExtrema += 15;
    else if (ensoScenario === "el_nino_forte") probChuvaExtrema -= 15;
  } else if (city.region === "Sudeste") {
    if (ensoScenario === "el_nino_forte") probChuvaExtrema += 10;
    else if (ensoScenario === "la_nina") probChuvaExtrema += 5;
  } else if (city.region === "Centro-Oeste") {
    if (ensoScenario === "el_nino_forte") probChuvaExtrema += 8;
  }
  if (hasInmetAlertFinal === "yellow") probChuvaExtrema += 10;
  else if (hasInmetAlertFinal === "orange") probChuvaExtrema += 20;
  else if (hasInmetAlertFinal === "red") probChuvaExtrema += 35;
  probChuvaExtrema = Math.min(100, Math.max(0, probChuvaExtrema));

  let riskChuvaExtrema = "Baixo";
  if (probChuvaExtrema >= 75) riskChuvaExtrema = "Crítico";
  else if (probChuvaExtrema >= 50) riskChuvaExtrema = "Alto";
  else if (probChuvaExtrema >= 25) riskChuvaExtrema = "Médio";

  // --- SECA ---
  let probSeca = Math.min(100, Math.max(5, Math.round(((finalMaxTemp - 15) / 25) * 45 + ((100 - finalSoilMoisture) * 0.45))));
  if (city.region === "Norte" || city.region === "Nordeste") {
    if (ensoScenario === "el_nino_forte") probSeca += 30;
    else if (ensoScenario === "el_nino_moderado") probSeca += 15;
    else if (ensoScenario === "la_nina") probSeca -= 15;
  } else if (city.region === "Sul") {
    if (ensoScenario === "la_nina") probSeca += 20;
    else if (ensoScenario === "el_nino_forte") probSeca -= 15;
  } else if (city.region === "Sudeste") {
    if (ensoScenario === "el_nino_forte") probSeca += 10;
    else if (ensoScenario === "la_nina") probSeca += 5;
  } else if (city.region === "Centro-Oeste") {
    if (ensoScenario === "el_nino_forte") probSeca += 15;
    else if (ensoScenario === "la_nina") probSeca += 5;
  }
  if (hasFireHotspotsFinal) probSeca += 20;
  probSeca = Math.min(100, Math.max(0, probSeca));

  let riskSeca = "Baixo";
  if (probSeca >= 75) riskSeca = "Crítico";
  else if (probSeca >= 50) riskSeca = "Alto";
  else if (probSeca >= 25) riskSeca = "Médio";

  // --- ONDA DE CALOR ---
  let probOndaCalor = 5;
  if (finalMaxTemp > 32) {
    probOndaCalor = Math.min(100, Math.round((finalMaxTemp - 30) * 8 + (ensoScenario.startsWith("el_nino") ? 15 : 0)));
  }
  if (hasInmetAlertFinal === "orange") probOndaCalor += 15;
  else if (hasInmetAlertFinal === "red") probOndaCalor += 30;
  probOndaCalor = Math.min(100, Math.max(0, probOndaCalor));

  let riskOndaCalor = "Baixo";
  if (probOndaCalor >= 75) riskOndaCalor = "Crítico";
  else if (probOndaCalor >= 50) riskOndaCalor = "Alto";
  else if (probOndaCalor >= 25) riskOndaCalor = "Médio";

  // --- FRIO EXTREMO ---
  let probFrio = 5;
  if (city.region === "Sul") {
    probFrio = Math.min(100, Math.max(5, Math.round((15 - finalMinTemp) * 7 + (ensoScenario === "la_nina" ? 15 : 0))));
  } else if (city.region === "Centro-Oeste") {
    probFrio = Math.min(60, Math.max(0, Math.round((18 - finalMinTemp) * 3 + (ensoScenario === "la_nina" ? 10 : 0))));
  } else if (city.region === "Sudeste") {
    probFrio = Math.min(40, Math.max(0, Math.round((18 - finalMinTemp) * 2 + (ensoScenario === "la_nina" ? 5 : 0))));
  } else {
    probFrio = Math.min(20, Math.max(0, Math.round((20 - finalMinTemp) * 2)));
  }
  probFrio = Math.min(100, Math.max(0, probFrio));

  let riskFrio = "Baixo";
  if (probFrio >= 75) riskFrio = "Crítico";
  else if (probFrio >= 50) riskFrio = "Alto";
  else if (probFrio >= 25) riskFrio = "Médio";

  // --- VENTO FORTE ---
  let probVento = 5;
  const effectiveWind = Math.max(finalWindSpeed || 0, finalWindGust || 0);
  if (effectiveWind > 20) {
    probVento = Math.min(100, Math.max(5, Math.round((effectiveWind / 80) * 65 + 5)));
  }
  if (city.region === "Sul") {
    probVento += 10;
    if (ensoScenario === "el_nino_forte") probVento += 20;
    else if (ensoScenario === "el_nino_moderado") probVento += 10;
  } else if (city.region === "Nordeste" || city.region === "Norte") {
    if (ensoScenario === "la_nina") probVento += 10;
  } else if (city.region === "Sudeste") {
    probVento += 5;
  }
  if (hasInmetAlertFinal === "orange") probVento += 10;
  else if (hasInmetAlertFinal === "red") probVento += 25;
  probVento = Math.min(100, Math.max(0, probVento));

  let riskVento = "Baixo";
  if (probVento >= 75) riskVento = "Crítico";
  else if (probVento >= 50) riskVento = "Alto";
  else if (probVento >= 25) riskVento = "Médio";

  // --- DESLIZAMENTO ---
  let probDeslizamento = Math.min(100, Math.max(5, Math.round((finalPrecipitation / 120) * 35 + finalSoilMoisture * 0.35)));
  if (city.region === "Sudeste") {
    probDeslizamento += 20;
    if (ensoScenario === "el_nino_forte") probDeslizamento += 15;
    else if (ensoScenario === "el_nino_moderado") probDeslizamento += 8;
  } else if (city.region === "Sul") {
    probDeslizamento += 15;
    if (ensoScenario === "el_nino_forte") probDeslizamento += 12;
    else if (ensoScenario === "el_nino_moderado") probDeslizamento += 5;
  } else if (city.region === "Nordeste") {
    probDeslizamento += 10;
    if (ensoScenario === "la_nina") probDeslizamento += 8;
  }
  if (hasInmetAlertFinal === "yellow") probDeslizamento += 10;
  else if (hasInmetAlertFinal === "orange") probDeslizamento += 20;
  else if (hasInmetAlertFinal === "red") probDeslizamento += 35;
  probDeslizamento = Math.min(100, Math.max(0, probDeslizamento));

  let riskDeslizamento = "Baixo";
  if (probDeslizamento >= 75) riskDeslizamento = "Crítico";
  else if (probDeslizamento >= 50) riskDeslizamento = "Alto";
  else if (probDeslizamento >= 25) riskDeslizamento = "Médio";

  const maxProb = Math.max(probChuvaExtrema, probSeca, probOndaCalor, probFrio, probVento, probDeslizamento);
  let finalRiskLevel = "Baixo";
  if (maxProb >= 80) finalRiskLevel = "Crítico";
  else if (maxProb >= 55) finalRiskLevel = "Alto";
  else if (maxProb >= 30) finalRiskLevel = "Médio";

  return {
    chuvaExtrema: { score: probChuvaExtrema, level: riskChuvaExtrema },
    seca: { score: probSeca, level: riskSeca },
    ondaCalor: { score: probOndaCalor, level: riskOndaCalor },
    frio: { score: probFrio, level: riskFrio },
    ventoForte: { score: probVento, level: riskVento },
    deslizamento: { score: probDeslizamento, level: riskDeslizamento },
    overall: finalRiskLevel,
  };
}

// Fetch real current weather for a city from Open-Meteo
async function fetchOpenMeteo(lat: number, lon: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max&timezone=America%2FSao_Paulo`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.daily) return null;
    const precipitation72h = (data.daily.precipitation_sum || []).slice(0, 3).reduce((a: number, b: number) => a + (b || 0), 0);
    const maxTemp = Math.max(...(data.daily.temperature_2m_max || [0]).slice(0, 3));
    const minTemp = Math.min(...(data.daily.temperature_2m_min || [0]).slice(0, 3));
    const maxWindSpeed = Math.max(...(data.daily.wind_speed_10m_max || [0]).slice(0, 3));
    const maxWindGust = Math.max(...(data.daily.wind_gusts_10m_max || [0]).slice(0, 3));
    return { precipitation72h, maxTemp, minTemp, maxWindSpeed, maxWindGust, realTimeFetched: true };
  } catch {
    return null;
  }
}

// Simple in-memory cache for Gemini reports (avoids exhausting the free-tier quota)
const geminiCache = new Map<string, { ts: number; data: any }>();
const GEMINI_TTL = 1000 * 60 * 60; // 1 hour

// Bulk endpoint: calculate real risk for ALL monitored cities (used to paint the map)
app.get("/api/all-risks", async (req, res) => {
  // Overall timeout for the bulk request
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(200).json({ ensoScenario, cities: results || {}, firePoints: firePointsByCity || {}, updatedAt: new Date().toISOString(), partial: true });
    }
  }, 25000);
  try {
    const ensoScenario = (req.query.enso as string) || "neutro";
    const results: Record<string, any> = {};
    const firePointsByCity: Record<string, Array<{ lat: number; lon: number; date: string }>> = {};

    await Promise.all(
      CITIES.map(async (city) => {
        try {
          const om = await fetchOpenMeteo(city.lat, city.lon);
          const realTimeFetched = !!om;
          const forecastPrecipitation = om ? om.precipitation72h : 0;
          const forecastMaxTemp = om ? om.maxTemp : city.historic_temp_avg + 2;
          const forecastMinTemp = om ? om.minTemp : city.historic_temp_avg - 4;

          let defaultSoilMoisture = 40;
          if (city.region === "Sul") defaultSoilMoisture = 70;
          if (city.region === "Norte") defaultSoilMoisture = 55;
          if (city.region === "Nordeste") defaultSoilMoisture = 30;
          if (city.region === "Sudeste") defaultSoilMoisture = 50;
          if (city.region === "Centro-Oeste") defaultSoilMoisture = 45;
          if (forecastPrecipitation > 50) defaultSoilMoisture = Math.min(100, defaultSoilMoisture + 25);
          else if (forecastPrecipitation === 0 && forecastMaxTemp > 33) defaultSoilMoisture = Math.max(5, defaultSoilMoisture - 15);

          const inpeFiresReal = await fetchInpeFires(city.state);
          const fireCount = inpeFiresReal.count;
          const hasFireHotspotsFinal = fireCount > 0;

          const riskCalc = evaluateRisks(city, ensoScenario, {
            precipitation72h: Math.round(forecastPrecipitation),
            maxTemp: Math.round(forecastMaxTemp * 10) / 10,
            minTemp: Math.round(forecastMinTemp * 10) / 10,
            soilMoisture: defaultSoilMoisture,
            windSpeed: om?.maxWindSpeed ?? 15,
            windGust: om?.maxWindGust ?? 25,
            hasInmetAlert: "none",
            hasFireHotspots: hasFireHotspotsFinal,
          });

          results[city.id] = {
            cityId: city.id,
            name: city.name,
            state: city.state,
            region: city.region,
            overall: riskCalc.overall,
            risks: {
              chuvaExtrema: riskCalc.chuvaExtrema,
              seca: riskCalc.seca,
              ondaCalor: riskCalc.ondaCalor,
              frio: riskCalc.frio,
              ventoForte: riskCalc.ventoForte,
              deslizamento: riskCalc.deslizamento,
            },
            weather: {
              precipitation72h: Math.round(forecastPrecipitation),
              maxTemp: Math.round(forecastMaxTemp * 10) / 10,
              minTemp: Math.round(forecastMinTemp * 10) / 10,
              maxWindSpeed: Math.round(om?.maxWindSpeed ?? 15),
              maxWindGust: Math.round(om?.maxWindGust ?? 25),
              soilMoisture: defaultSoilMoisture,
              realTimeFetched,
            },
            fireHotspots: { count: fireCount, points: inpeFiresReal.points },
          };
          firePointsByCity[city.id] = inpeFiresReal.points;
        } catch (err) {
          console.warn(`Falha ao calcular ${city.id}:`, err);
          results[city.id] = { cityId: city.id, name: city.name, state: city.state, region: city.region, overall: "Baixo", risks: { chuvaExtrema: { score: 0, level: "Baixo" }, seca: { score: 0, level: "Baixo" }, ondaCalor: { score: 0, level: "Baixo" }, frio: { score: 0, level: "Baixo" }, ventoForte: { score: 0, level: "Baixo" }, deslizamento: { score: 0, level: "Baixo" } }, weather: { precipitation72h: 0, maxTemp: city.historic_temp_avg, minTemp: city.historic_temp_avg - 4, maxWindSpeed: 15, maxWindGust: 25, soilMoisture: 40, realTimeFetched: false }, fireHotspots: { count: 0, points: [] } };
        }
      })
    );

    clearTimeout(timer);
    res.json({ ensoScenario, cities: results, firePoints: firePointsByCity, updatedAt: new Date().toISOString() });
  } catch (err) {
    clearTimeout(timer);
    console.error("Bulk risk calculation failed.", err);
    res.status(500).json({ error: "Falha ao calcular riscos em lote." });
  }
});

// Calculate climate risks based on technical rules
app.post("/api/climate-risk", async (req, res) => {
  try {
    const {
      cityId,
      ensoScenario = "neutro", // el_nino_forte, el_nino_moderado, la_nina, neutro
      customSoilMoisture,
      customPrecipitation,
      customMaxTemp,
      customMinTemp,
      hasInmetAlert, // optional manual override: none, yellow, orange, red
    } = req.body;

    const city = CITIES.find(c => c.id === cityId) || CITIES[0];

    // 0. Fetch REAL auxiliary data (INMET alerts + INPE Queimadas)
    let inmetAlertReal = hasInmetAlert || "none";
    let inpeFiresReal: { count: number; points: Array<{ lat: number; lon: number; date: string }> } = { count: 0, points: [] };

    if (!hasInmetAlert) {
      inmetAlertReal = await fetchInmetAlert(city.state);
    }
    inpeFiresReal = await fetchInpeFires(city.state);
    const firePoints = inpeFiresReal.points;
    const fireCount = inpeFiresReal.count;
    const hasInmetAlertFinal = inmetAlertReal;
    const hasFireHotspotsFinal = fireCount > 0;

    // 1. Fetch current weather from Open-Meteo
    const om = await fetchOpenMeteo(city.lat, city.lon);
    const realTimeFetched = !!om;
    const forecastPrecipitation = om ? om.precipitation72h : 0;
    const forecastMaxTemp = om ? om.maxTemp : city.historic_temp_avg + 2;
    const forecastMinTemp = om ? om.minTemp : city.historic_temp_avg - 4;
    const forecastMaxWindSpeed = om ? om.maxWindSpeed : 15;
    const forecastMaxWindGust = om ? om.maxWindGust : 25;

    // Override with user adjustments if provided
    const finalPrecipitation = typeof customPrecipitation === "number" ? customPrecipitation : Math.round(forecastPrecipitation);
    const finalMaxTemp = typeof customMaxTemp === "number" ? customMaxTemp : Math.round(forecastMaxTemp * 10) / 10;
    const finalMinTemp = typeof customMinTemp === "number" ? customMinTemp : Math.round(forecastMinTemp * 10) / 10;
    const finalMaxWindSpeed = Math.round(forecastMaxWindSpeed);
    const finalMaxWindGust = Math.round(forecastMaxWindGust);

    // Default soil moisture depends on historic precipitation and region
    let defaultSoilMoisture = 40;
    if (city.region === "Sul") defaultSoilMoisture = 70;
    if (city.region === "Norte") defaultSoilMoisture = 55;
    if (city.region === "Nordeste") defaultSoilMoisture = 30;
    if (city.region === "Sudeste") defaultSoilMoisture = 50;
    if (city.region === "Centro-Oeste") defaultSoilMoisture = 45;

    // If precipitation sum is high, soil moisture saturates
    if (finalPrecipitation > 50) {
      defaultSoilMoisture = Math.min(100, defaultSoilMoisture + 25);
    } else if (finalPrecipitation === 0 && finalMaxTemp > 33) {
      defaultSoilMoisture = Math.max(5, defaultSoilMoisture - 15);
    }
    const finalSoilMoisture = typeof customSoilMoisture === "number" ? customSoilMoisture : defaultSoilMoisture;

    // 2. Rules Engine Calculation
    const riskCalc = evaluateRisks(city, ensoScenario, {
      precipitation72h: finalPrecipitation,
      maxTemp: finalMaxTemp,
      minTemp: finalMinTemp,
      soilMoisture: finalSoilMoisture,
      windSpeed: finalMaxWindSpeed,
      windGust: finalMaxWindGust,
      hasInmetAlert: hasInmetAlertFinal,
      hasFireHotspots: hasFireHotspotsFinal,
    });
    const probChuvaExtrema = riskCalc.chuvaExtrema.score;
    const riskChuvaExtrema = riskCalc.chuvaExtrema.level;
    const probSeca = riskCalc.seca.score;
    const riskSeca = riskCalc.seca.level;
    const probOndaCalor = riskCalc.ondaCalor.score;
    const riskOndaCalor = riskCalc.ondaCalor.level;
    const probFrio = riskCalc.frio.score;
    const riskFrio = riskCalc.frio.level;
    const probVento = riskCalc.ventoForte.score;
    const riskVento = riskCalc.ventoForte.level;
    const probDeslizamento = riskCalc.deslizamento.score;
    const riskDeslizamento = riskCalc.deslizamento.level;
    const finalRiskLevel = riskCalc.overall;

    // Build complete inputs object for the reporter
    const inputTelemetry = {
      city: `${city.name} - ${city.state}`,
      region: city.region,
      enso: ensoScenario,
      temp_max: finalMaxTemp,
      temp_min: finalMinTemp,
      precip_72h: finalPrecipitation,
      soil_moisture: finalSoilMoisture,
      wind_speed_max: finalMaxWindSpeed,
      wind_gust_max: finalMaxWindGust,
      inmet_alert: hasInmetAlertFinal,
      fire_hotspots: hasFireHotspotsFinal,
      fire_hotspot_count: fireCount,
      inpe_fire_count: inpeFiresReal.count,
      calculated_risks: {
        chuva_extrema: { prob: probChuvaExtrema, level: riskChuvaExtrema },
        seca: { prob: probSeca, level: riskSeca },
        onda_calor: { prob: probOndaCalor, level: riskOndaCalor },
        frio_extremo: { prob: probFrio, level: riskFrio },
        vento_forte: { prob: probVento, level: riskVento },
        deslizamento: { prob: probDeslizamento, level: riskDeslizamento },
        overall_level: finalRiskLevel
      }
    };

    // 3. Obtain expert explainability, operational impact and prevention report
    let aiExplanation = "";
    let aiImpacts: Array<{ setor: string; descricao: string; gravidade: string }> = [];
    let aiActions: Array<{ destinatario: string; acao: string; prioridade: string }> = [];
    let aiSource: string | null = null;
    let isAiGenerated = false;

    const ai = getAIClient();
    console.log("[DEBUG] AI_PROVIDER=" + process.env.AI_PROVIDER + " | ai client?" + !!ai + " | model=" + getAIModel());

    if (ai) {
      const cacheKey = `${city.id}-${ensoScenario}-${finalRiskLevel}-${probChuvaExtrema}-${probSeca}-${probOndaCalor}-${probFrio}-${probVento}-${probDeslizamento}-${fireCount}`;
      const cached = geminiCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < GEMINI_TTL) {
        aiExplanation = cached.data.explicabilidade;
        aiImpacts = cached.data.impactos;
        if (Array.isArray(cached.data.acoes) && cached.data.acoes.length > 0 &&
            cached.data.acoes.every((a: any) => typeof a.destinatario === 'string' && a.destinatario.trim() !== '' && typeof a.acao === 'string' && a.acao.trim() !== '')) {
          aiActions = cached.data.acoes;
        }
        isAiGenerated = true;
        aiSource = cached.data.source || (process.env.AI_PROVIDER || "openrouter").toLowerCase();
      } else {
      try {
        const prompt = `Analise a seguinte situação climatológica regional para gerar um relatório explicativo técnico e plano de prevenção estruturado.
Dados Atuais:
- Município: ${city.name} (${city.state}), Região ${city.region}
- Fenômeno ENSO ativo: ${ensoScenario.toUpperCase().replace(/_/g, " ")}
- Previsão de Chuva (próximas 72h): ${finalPrecipitation} mm
- Saturação/Umidade do Solo: ${finalSoilMoisture}%
- Temperatura Máxima Prevista: ${finalMaxTemp}°C
- Temperatura Mínima Prevista: ${finalMinTemp}°C
- Vento Máximo Previsto: ${finalMaxWindSpeed} km/h (Rajadas: ${finalMaxWindGust} km/h)
- Alerta Oficial INMET ativo: ${hasInmetAlertFinal.toUpperCase()}
- Focos de Calor (INPE Queimadas) detectados: ${hasFireHotspotsFinal ? `Sim (${fireCount} focos)` : "Não"}

Pontuações calculadas pelas heurísticas técnicas do sistema:
- Chuva Extrema e Alagamento: Probabilidade de ${probChuvaExtrema}% (Risco: ${riskChuvaExtrema})
- Seca e Déficit Hídrico: Probabilidade de ${probSeca}% (Risco: ${riskSeca})
- Onda de Calor: Probabilidade de ${probOndaCalor}% (Risco: ${riskOndaCalor})
- Frio Extremo e Geada: Probabilidade de ${probFrio}% (Risco: ${riskFrio})
- Ventos Fortes e Rajadas: Probabilidade de ${probVento}% (Risco: ${riskVento})
- Deslizamento de Encostas: Probabilidade de ${probDeslizamento}% (Risco: ${riskDeslizamento})
- Nível de Risco Geral do Município: ${finalRiskLevel.toUpperCase()}

Gere o relatório estruturado em português, detalhando a correlação dos fenômenos (ex. como o El Niño/La Niña atua nesta região e como isso maximiza o perigo atual). Identifique impactos específicos e ações mitigadoras altamente práticas para gestores municipais, Defesa Civil, produtores agrícolas locais e para a população.`;

        const provider = (process.env.AI_PROVIDER || "openrouter").toLowerCase();
        const responseFormat =
          provider === "nvidia"
            ? { type: "json_object" as const }
            : {
                type: "json_schema" as const,
                json_schema: {
                  name: "relatorio_risco",
                  strict: true,
                  schema: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      explicabilidade: { type: "string" },
                      impactos: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            setor: { type: "string" },
                            descricao: { type: "string" },
                            gravidade: { type: "string" }
                          },
                          required: ["setor", "descricao", "gravidade"]
                        }
                      },
                      acoes: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            destinatario: { type: "string" },
                            acao: { type: "string" },
                            prioridade: { type: "string" }
                          },
                          required: ["destinatario", "acao", "prioridade"]
                        }
                      }
                    },
                    required: ["explicabilidade", "impactos", "acoes"]
                  }
                }
              };

        const systemPrompt =
          provider === "nvidia"
            ? `Você é um meteorologista e especialista sênior em Defesa Civil e Gestão de Riscos Ambientais no Brasil. Forneça análises de risco de altíssimo rigor técnico, objetivas e orientadas para ação. Sempre escreva em português brasileiro padrão.

RESPONDA OBRIGATORIAMENTE EM JSON VÁLIDO COM EXATAMENTE ESTA ESTRUTURA:
{
  "explicabilidade": "string em português com a explicação técnica detalhada",
  "impactos": [
    {"setor": "string (ex: Agricultura, Infraestrutura, Saúde, Energia)", "descricao": "string", "gravidade": "string (Baixa/Média/Alta/Crítica)"}
  ],
  "acoes": [
    {"destinatario": "string (ex: Defesa Civil Municipal, Produtores Agrícolas, População)", "acao": "string", "prioridade": "string (Imediata/Alta/Média/Baixa)"}
  ]
}
NÃO inclua campos extras. NÃO use markdown. Apenas JSON puro.`
            : "Você é um meteorologista e especialista sênior em Defesa Civil e Gestão de Riscos Ambientais no Brasil. Forneça análises de risco de altíssimo rigor técnico, objetivas e orientadas para ação. Sempre escreva em português brasileiro padrão. Responda obrigatoriamente em JSON.";

        const completion = await ai.chat.completions.create({
          model: getAIModel() || "google/gemini-2.0-flash-exp",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          response_format: responseFormat
        });

        const textResponse = completion.choices?.[0]?.message?.content;
        if (textResponse) {
          const parsed = JSON.parse(textResponse.trim());
          aiExplanation = parsed.explicabilidade;
          aiImpacts = parsed.impactos;
          // Validate actions: must be non-empty with destinatario and acao filled
          if (Array.isArray(parsed.acoes) && parsed.acoes.length > 0 &&
              parsed.acoes.every((a: any) => typeof a.destinatario === 'string' && a.destinatario.trim() !== '' && typeof a.acao === 'string' && a.acao.trim() !== '')) {
            aiActions = parsed.acoes;
          }
          isAiGenerated = true;
          aiSource = provider;
          geminiCache.set(cacheKey, { ts: Date.now(), data: { ...parsed, source: provider } });
        }
      } catch (err: any) {
        // 429 / rate limit = quota exhausted; the rule-based fallback below still works
        if (err?.status !== 429) console.warn("AI report generation failed (provider=" + provider + "), fallback to template rules:", err?.message || err);
      }
      }
    }

    // Fallback rule-based text generation for explainability/impacts if Gemini is missing or failed
    if (!isAiGenerated) {
      // Explainability Fallback
      if (finalRiskLevel === "Baixo") {
        aiExplanation = `O município de ${city.name} (${city.state}) apresenta condições de estabilidade atmosférica dentro dos padrões históricos para este período. O fenômeno ENSO (${ensoScenario.replace(/_/g, " ")}) não está gerando perturbações severas nas variáveis de precipitação (${finalPrecipitation}mm) ou temperatura (${finalMaxTemp}°C), e a umidade do solo encontra-se equilibrada em ${finalSoilMoisture}%.`;
      } else if (riskChuvaExtrema === "Alto" || riskChuvaExtrema === "Crítico") {
        aiExplanation = `Risco severo de eventos hidrológicos extremos em ${city.name} (${city.state}). A combinação do acumulado pluviométrico elevado previsto (${finalPrecipitation}mm em 72h) com a alta taxa de saturação do solo (${finalSoilMoisture}%) reduz drasticamente a capacidade de infiltração local, favorecendo escoamento superficial acelerado. O cenário é agravado pela influência do padrão regional ${city.region === "Sul" && ensoScenario.startsWith("el_nino") ? "de El Niño que potencializa frentes frias estacionárias no Sul" : "climatológico vigente"}. O alerta oficial do INMET (${hasInmetAlertFinal}) reforça o monitoramento ativo.`;
      } else if (riskSeca === "Alto" || riskSeca === "Crítico") {
        aiExplanation = `Risco crítico de severo déficit hídrico e seca em ${city.name} (${city.state}). A escassez prolongada de chuvas aliada à evapotranspiração acelerada pelas temperaturas elevadas (${finalMaxTemp}°C) exauriu a umidade do solo para apenas ${finalSoilMoisture}%. Este cenário é um reflexo direto da dinâmica do ${ensoScenario.startsWith("el_nino") ? "El Niño, que inibe a formação de sistemas convectivos e frentes úmidas no Norte/Nordeste brasileiro" : "padrão de anomalia térmica oceânica atual"}. A presença de focos de calor (${hasFireHotspotsFinal ? `Sim (${fireCount} focos)` : "Não"}) indica alta propensão a incêndios florestais espontâneos ou propagação rápida.`;
      } else if (riskVento === "Alto" || riskVento === "Crítico") {
        aiExplanation = `Risco elevado de ventos fortes e rajadas intensas em ${city.name} (${city.state}). A combinação do gradiente de pressão atmosférica com a atuação de sistemas meteorológicos regionais resultou em ventos sustentados de até ${finalMaxWindSpeed} km/h e rajadas que podem atingir ${finalMaxWindGust} km/h. No Sul do Brasil, a presença de ${ensoScenario.startsWith("el_nino") ? "El Niño potencializa a formação de ciclones extratropicais" : "cavados e frentes frias"} que elevam significativamente o risco de ventania, quedas de árvores e destelhamentos. O alerta oficial do INMET (${hasInmetAlertFinal}) reforça a necessidade de precaução imediata.`;
      } else if (riskDeslizamento === "Alto" || riskDeslizamento === "Crítico") {
        aiExplanation = `Risco crítico de deslizamentos de encostas e movimentação de massa em ${city.name} (${city.state}). A saturação do solo (${finalSoilMoisture}%) combinada com o acumulado de precipitação de ${finalPrecipitation}mm nas últimas 72h reduz drasticamente a coesão do terreno, especialmente em áreas de relevo acidentado típicas da região ${city.region}. O cenário é agravado pelo ${ensoScenario.startsWith("el_nino") ? "El Niño que intensifica as chuvas no Sudeste e Sul" : "padrão climático atual"}, elevando o risco de escorregamentos em encostas urbanizadas. O alerta INMET (${hasInmetAlertFinal}) confirma a iminência do evento.`;
      } else {
        aiExplanation = `Instabilidade térmica e climática observada em ${city.name} (${city.state}). Alerta para temperaturas anômalas (Máxima de ${finalMaxTemp}°C / Mínima de ${finalMinTemp}°C), que deslocam o equilíbrio ecológico e a umidade superficial do solo (${finalSoilMoisture}%). O cenário de ENSO (${ensoScenario.replace(/_/g, " ")}) induz flutuações regionais que exigem vigilância preventiva dos órgãos de Defesa Civil e produtores.`;
      }

      // Impacts Fallback
      aiImpacts = [
        {
          setor: "Agricultura",
          descricao: riskSeca === "Alto" || riskSeca === "Crítico" 
            ? "Perda severa de produtividade por estresse hídrico. Solo com baixíssima umidade inviabiliza novos plantios." 
            : riskChuvaExtrema === "Alto" || riskChuvaExtrema === "Crítico" 
            ? "Alagamento de lavouras, erosão acentuada do solo e atraso nas colheitas devido ao excesso de umidade."
            : riskDeslizamento === "Alto" || riskDeslizamento === "Crítico"
            ? "Perda de lavouras em encostas por deslizamento, soterramento de plantações e danos a sistemas de irrigação e terraços agrícolas."
            : riskVento === "Alto" || riskVento === "Crítico"
            ? "Queda de plantações inteiras por ventania, perda de frutíferas e danos a estufas e estruturas de irrigação."
            : "Condições agrícolas normais, porém com necessidade de manejo cuidadoso e irrigação monitorada.",
          gravidade: riskSeca === "Crítico" || riskChuvaExtrema === "Crítico" || riskVento === "Crítico" || riskDeslizamento === "Crítico" ? "Crítica" : (riskSeca === "Alto" || riskChuvaExtrema === "Alto" || riskVento === "Alto" || riskDeslizamento === "Alto" ? "Alta" : "Média")
        },
        {
          setor: "Infraestrutura Urbana",
          descricao: riskVento === "Alto" || riskVento === "Crítico"
            ? "Destelhamento de edificações, queda de galhos e árvores sobre vias e rede elétrica, interrupção no fornecimento de energia."
            : riskDeslizamento === "Alto" || riskDeslizamento === "Crítico"
            ? "Deslizamentos de terra em encostas urbanizadas, interdição de vias, danos a moradias e risco iminente de soterramento."
            : riskChuvaExtrema === "Alto" || riskChuvaExtrema === "Crítico"
            ? "Alagamentos em vias públicas, transbordamento de canais e riscos de deslizamento em encostas urbanizadas."
            : "Infraestrutura urbana operando dentro da normalidade.",
          gravidade: riskVento === "Crítico" || riskDeslizamento === "Crítico" || riskChuvaExtrema === "Crítico" ? "Crítica" : (riskVento === "Alto" || riskDeslizamento === "Alto" || riskChuvaExtrema === "Alto" ? "Alta" : "Média")
        },
        {
          descricao: riskSeca === "Alto" || riskSeca === "Crítico"
            ? "Queda no nível de reservatórios hidrelétricos locais, necessitando acionamento de termoelétricas e elevação de custos."
            : riskOndaCalor === "Alto" || riskOndaCalor === "Crítico"
            ? "Pico de demanda por refrigeração elétrica sobrecarregando linhas de transmissão e transformadores locais."
            : "Geração e distribuição dentro dos níveis normais de operação.",
          gravidade: riskSeca === "Crítico" || riskOndaCalor === "Crítico" ? "Crítica" : "Média"
        },
        {
          setor: "Transporte",
          descricao: riskChuvaExtrema === "Alto" || riskChuvaExtrema === "Crítico"
            ? "Bloqueio de rodovias por deslizamentos de terra, interrupção de vias urbanas por alagamentos e alto risco de acidentes."
            : "Fluxo viário normal, sem previsões de interrupções de grande escala.",
          gravidade: riskChuvaExtrema === "Alto" || riskChuvaExtrema === "Crítico" ? "Alta" : "Baixa"
        },
        {
          setor: "Saúde Pública",
          descricao: riskOndaCalor === "Alto" || riskOndaCalor === "Crítico"
            ? "Aumento de surtos de desidratação, insolação e problemas cardiorrespiratórios severos causados pelo calor extremo."
            : riskFrio === "Alto" || riskFrio === "Crítico"
            ? "Aumento abrupto de infecções respiratórias agudas e hipotermia na população de rua desabrigada."
            : "Vigilância epidemiológica padrão, sem alertas extraordinários.",
          gravidade: finalRiskLevel === "Crítico" ? "Crítica" : (finalRiskLevel === "Alto" ? "Alta" : "Média")
        },
        {
          setor: "Habitação",
          descricao: riskDeslizamento === "Alto" || riskDeslizamento === "Crítico"
            ? "Risco iminente de desabamento de moradias em encostas, necessidade de evacuação preventiva de comunidades vulneráveis e interdição de áreas de risco."
            : riskChuvaExtrema === "Alto" || riskChuvaExtrema === "Crítico"
            ? "Alagamentos residenciais, perda de móveis e eletrodomésticos, necessidade de abrigos temporários para famílias desalojadas."
            : "Condições habitacionais estáveis, sem necessidade de intervenção emergencial.",
          gravidade: riskDeslizamento === "Crítico" || riskChuvaExtrema === "Crítico" ? "Crítica" : (riskDeslizamento === "Alto" || riskChuvaExtrema === "Alto" ? "Alta" : "Média")
        }
      ];
    }

    // Actions Fallback (runs whenever AI actions are missing/invalid, even if AI explanation was kept)
    if (!aiActions || aiActions.length === 0) {
      aiActions = [];
      if (riskChuvaExtrema === "Alto" || riskChuvaExtrema === "Crítico") {
        aiActions.push(
          { destinatario: "Defesa Civil", acao: "Acionar alertas via sirene/SMS e evacuar preventivamente áreas de encostas e várzeas de rios sob risco iminente.", prioridade: "Crítica" },
          { destinatario: "Gestores Públicos", acao: "Mobilizar equipes de limpeza urbana urgentes para desobstrução de canais de drenagem, bueiros e redes pluviais.", prioridade: "Alta" },
          { destinatario: "População Geral", acao: "Evitar trafegar por vias alagadas, manter documentos e remédios essenciais em bolsas impermeáveis de fácil acesso.", prioridade: "Alta" }
        );
      }
      if (riskSeca === "Alto" || riskSeca === "Crítico" || hasFireHotspotsFinal) {
        aiActions.push(
          { destinatario: "Defesa Civil / Brigadas", acao: "Intensificar rondas preventivas em áreas florestais vulneráveis e manter equipes prontas para combate a incêndios.", prioridade: "Crítica" },
          { destinatario: "Produtores Agrícolas", acao: "Suspender imediatamente qualquer prática de queimada controlada e adotar irrigação localizada inteligente de fim de tarde.", prioridade: "Alta" },
          { destinatario: "Gestores Públicos", acao: "Emitir decreto de racionamento preventivo de água e otimizar distribuição de caminhões-pipa em comunidades isoladas.", prioridade: "Alta" }
        );
      }
      if (riskOndaCalor === "Alto" || riskOndaCalor === "Crítico") {
        aiActions.push(
          { destinatario: "População Geral", acao: "Aumentar ingestão de líquidos, evitar exposição direta ao sol entre 10h e 16h e umidificar ambientes internos.", prioridade: "Alta" },
          { destinatario: "Gestores Públicos", acao: "Instalar pontos públicos de hidratação e resfriamento em praças de grande circulação e reforçar equipes de prontuário de saúde.", prioridade: "Alta" }
        );
      }
      if (riskFrio === "Alto" || riskFrio === "Crítico") {
        aiActions.push(
          { destinatario: "Defesa Civil / Assistência Social", acao: "Montar abrigos de emergência aquecidos e realizar busca ativa noturna de pessoas em situação de rua.", prioridade: "Crítica" },
          { destinatario: "Produtores Agrícolas", acao: "Implementar técnicas anti-geada (cobertura com lonas plásticas, irrigação por aspersão pré-aurora) em hortaliças delicadas.", prioridade: "Alta" }
        );
      }
      if (riskVento === "Alto" || riskVento === "Crítico") {
        aiActions.push(
          { destinatario: "Defesa Civil", acao: "Emitir alerta de ventania, interditar preventivamente parques e praças, e mobilizar equipes para remoção de galhos e objetos soltos em vias públicas.", prioridade: "Crítica" },
          { destinatario: "Concessionárias de Energia", acao: "Posicionar equipes de prontidão para restabelecimento de rede elétrica e poda emergencial de árvores com risco de queda sobre cabos.", prioridade: "Alta" },
          { destinatario: "População Geral", acao: "Fixar objetos externos (vasos, toldos, móveis de quintal), evitar estacionar veículos sob árvores e manter distância de estruturas metálicas e tapumes.", prioridade: "Alta" }
        );
      }
      if (riskDeslizamento === "Alto" || riskDeslizamento === "Crítico") {
        aiActions.push(
          { destinatario: "Defesa Civil", acao: "Emitir alerta de evacuação imediata de comunidades em encostas e áreas de risco geológico, acionar sirenes e pontos de apoio.", prioridade: "Crítica" },
          { destinatario: "Gestores Públicos", acao: "Mobilizar equipes de geologia e engenharia para vistoria emergencial de taludes e encostas urbanas, interditar vias com risco iminente de desabamento.", prioridade: "Alta" },
          { destinatario: "População em Áreas de Risco", acao: "Abandonar imediatamente moradias em encostas e taludes, dirigir-se aos pontos de abrigo designados pela Defesa Civil e levar documentos e medicamentos essenciais.", prioridade: "Crítica" }
        );
      }
      if (aiActions.length === 0) {
        aiActions.push(
          { destinatario: "População Geral", acao: "Manter-se informado pelos boletins climáticos oficiais da região e planejar atividades externas normais.", prioridade: "Baixa" },
          { destinatario: "Defesa Civil", acao: "Manter monitoramento de rotina e atualização diária das tabelas de limiares hidrológicos locais.", prioridade: "Baixa" }
        );
      }
    }

    res.json({
      city,
      weather: {
        precipitation72h: finalPrecipitation,
        maxTemp: finalMaxTemp,
        minTemp: finalMinTemp,
        maxWindSpeed: finalMaxWindSpeed,
        maxWindGust: finalMaxWindGust,
        soilMoisture: finalSoilMoisture,
        ensoScenario,
        hasInmetAlert: hasInmetAlertFinal,
        hasFirmsHotspots: hasFireHotspotsFinal,
        firmsHotspots: { count: fireCount, points: firePoints },
        realTimeFetched
      },
      risks: {
        chuvaExtrema: { score: probChuvaExtrema, level: riskChuvaExtrema },
        seca: { score: probSeca, level: riskSeca },
        ondaCalor: { score: probOndaCalor, level: riskOndaCalor },
        frio: { score: probFrio, level: riskFrio },
        ventoForte: { score: probVento, level: riskVento },
        deslizamento: { score: probDeslizamento, level: riskDeslizamento },
        overall: finalRiskLevel
      },
      report: {
        explicabilidade: aiExplanation,
        impactos: aiImpacts,
        acoes: aiActions,
        isAiGenerated,
        source: aiSource
      }
    });

  } catch (error: any) {
    console.error("Critical error in risk engine API:", error);
    res.status(500).json({ error: "Erro interno no processamento do motor de riscos climáticos.", details: error.message });
  }
});

// Simulation of warning notifications (WhatsApp, Telegram, SMS, Email)
app.post("/api/notify", (req, res) => {
  const { channel, recipient, alertTitle, alertMessage, severity } = req.body;
  
  if (!channel || !recipient || !alertMessage) {
    return res.status(400).json({ error: "Parâmetros 'channel', 'recipient' e 'alertMessage' são obrigatórios." });
  }

  const timestamp = new Date().toISOString();
  const notificationId = `NOT-${Math.floor(100000 + Math.random() * 900000)}`;

  // Simulates integration logs
  console.log(`[ALERT DISPATCH] ${timestamp} | ID: ${notificationId} | Canal: ${channel} | Destinatário: ${recipient} | Severidade: ${severity}`);
  console.log(`[CONTENT] Title: ${alertTitle} | Message: ${alertMessage}`);

  res.json({
    success: true,
    notificationId,
    timestamp,
    channel,
    recipient,
    status: "ENVIADO",
    gateway_log: `Alerta climático encaminhado com sucesso via gateway oficial do canal ${channel}.`
  });
});

// Serve Vite dev server or production assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");
    console.log(`[PROD] cwd=${process.cwd()} | dist exists=${require("fs").existsSync(distPath)} | index.html exists=${require("fs").existsSync(indexPath)}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (require("fs").existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send("<h1>ClimaRisk</h1><p>Build ainda não disponível. Verifique o log de build no Render.</p>");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
