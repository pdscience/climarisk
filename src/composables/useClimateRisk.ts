import { ref, computed } from 'vue'
import type { City, EnsoScenario, InmetAlert, RiskApiResponse } from '../types'

export const CITIES: City[] = [
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
]

const selectedCityId = ref<string>("porto_alegre")
const ensoScenario = ref<EnsoScenario>("el_nino_forte")
const hasInmetAlert = ref<InmetAlert>("none")
const customSoilMoisture = ref<number | null>(null)
const customPrecipitation = ref<number | null>(null)
const customMaxTemp = ref<number | null>(null)
const customMinTemp = ref<number | null>(null)
const isLoading = ref<boolean>(false)
const riskData = ref<RiskApiResponse | null>(null)
const error = ref<string | null>(null)
const allRisks = ref<{ ensoScenario: string; cities: Record<string, any>; firePoints: Record<string, any[]>; updatedAt: string } | null>(null)
const isLoadingMap = ref<boolean>(false)

const currentCity = computed(() => CITIES.find(c => c.id === selectedCityId.value) || CITIES[0])

// Bulk real-risk calculation for ALL cities (paints the map)
async function loadAllRisks(enso?: EnsoScenario) {
  isLoadingMap.value = true
  error.value = null
  try {
    const scenario = enso || ensoScenario.value
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    const res = await fetch(`/api/all-risks?enso=${scenario}`, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(text ? `Servidor: ${text.slice(0, 100)}` : `Falha ao carregar riscos (${res.status}).`)
    }
    allRisks.value = await res.json()
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn("loadAllRisks timed out")
    } else {
      console.error("loadAllRisks error:", err)
      error.value = err.message || "Falha ao carregar riscos do mapa."
    }
  } finally {
    isLoadingMap.value = false
  }
}

async function runAssessment(forceResetSliders: boolean = false) {
  isLoading.value = true
  error.value = null
  try {
    const payload: any = {
      cityId: selectedCityId.value,
      ensoScenario: ensoScenario.value,
      hasInmetAlert: hasInmetAlert.value,
    }
    if (!forceResetSliders) {
      if (customSoilMoisture.value !== null) payload.customSoilMoisture = customSoilMoisture.value
      if (customPrecipitation.value !== null) payload.customPrecipitation = customPrecipitation.value
      if (customMaxTemp.value !== null) payload.customMaxTemp = customMaxTemp.value
      if (customMinTemp.value !== null) payload.customMinTemp = customMinTemp.value
    } else {
      customSoilMoisture.value = null
      customPrecipitation.value = null
      customMaxTemp.value = null
      customMinTemp.value = null
    }
    const response = await fetch("/api/climate-risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error("Erro de resposta do servidor.")
    const data: RiskApiResponse = await response.json()
    riskData.value = data
    if (forceResetSliders || customSoilMoisture.value === null) customSoilMoisture.value = data.weather.soilMoisture
    if (forceResetSliders || customPrecipitation.value === null) customPrecipitation.value = data.weather.precipitation72h
    if (forceResetSliders || customMaxTemp.value === null) customMaxTemp.value = data.weather.maxTemp
    if (forceResetSliders || customMinTemp.value === null) customMinTemp.value = data.weather.minTemp
  } catch (err: any) {
    error.value = err.message || "Falha ao calcular riscos."
  } finally {
    isLoading.value = false
  }
}

function getSeverityStyles(level: string) {
  switch (level) {
    case "Crítico": return { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", badge: "bg-red-500/20 text-red-400 border border-red-500/30" }
    case "Alto": return { bg: "bg-orange-500/10 border-orange-500/20", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-400 border border-orange-500/30" }
    case "Médio": return { bg: "bg-yellow-500/10 border-yellow-500/20", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" }
    default: return { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" }
  }
}

function getRiskColor(level: string) {
  if (level === "Crítico") return "#dc2626"
  if (level === "Alto") return "#ea580c"
  if (level === "Médio") return "#eab308"
  return "#10b981"
}

function getRiskBarColor(level: string) {
  if (level === "Crítico") return "bg-red-600"
  if (level === "Alto") return "bg-orange-500"
  if (level === "Médio") return "bg-yellow-400"
  return "bg-emerald-500"
}

function getRiskDotColor(level: string) {
  if (level === "Crítico") return "bg-red-600"
  if (level === "Alto") return "bg-orange-500"
  if (level === "Médio") return "bg-yellow-500"
  return "bg-emerald-500"
}

export function useClimateRisk() {
  return {
    CITIES,
    selectedCityId,
    ensoScenario,
    hasInmetAlert,
    customSoilMoisture,
    customPrecipitation,
    customMaxTemp,
    customMinTemp,
    isLoading,
    riskData,
    error,
    allRisks,
    isLoadingMap,
    currentCity,
    runAssessment,
    loadAllRisks,
    getSeverityStyles,
    getRiskColor,
    getRiskBarColor,
    getRiskDotColor
  }
}
