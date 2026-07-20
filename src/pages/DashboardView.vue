<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle, CloudRain, Droplets, Flame, ThermometerSnowflake, Wind, Mountain,
  ShieldAlert, RefreshCw, MapPin, TrendingUp, Globe, Info,
  Activity, ArrowRight, AlertCircle, BellRing, Search, Filter,
  ChevronDown, X, Building2, Zap, Truck, HeartPulse, FileText
} from 'lucide-vue-next'
import { useClimateRisk, CITIES } from '../composables/useClimateRisk'
import RiskGauge from '../components/RiskGauge.vue'
import BrasilMap from '../components/BrasilMap.vue'
import { generateRiskPdf } from '../utils/pdfExport'

const router = useRouter()
const {
  selectedCityId, ensoScenario, isLoading, riskData, error, currentCity,
  runAssessment, loadAllRisks, getSeverityStyles, getRiskColor
} = useClimateRisk()

const searchQuery = ref('')
const selectedRegion = ref<string>('all')
const showCityDropdown = ref(false)
const searchContainer = ref<HTMLElement | null>(null)
const dropdownPos = ref<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })

function updateDropdownPos() {
  const el = searchContainer.value
  if (!el) return
  const r = el.getBoundingClientRect()
  dropdownPos.value = { top: r.bottom + 4, left: r.left, width: r.width }
}

function handleClickOutside(e: MouseEvent) {
  if (searchContainer.value && !searchContainer.value.contains(e.target as Node)) {
    showCityDropdown.value = false
  }
}

function openDropdown() {
  updateDropdownPos()
  showCityDropdown.value = true
}

function reposition() {
  if (showCityDropdown.value) updateDropdownPos()
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('resize', reposition)
  window.addEventListener('scroll', reposition, true)
  loadAllRisks()
  if (!riskData.value) runAssessment(true)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('resize', reposition)
  window.removeEventListener('scroll', reposition, true)
})

const regions = [
  { id: 'all', name: 'Todas as Regiões', icon: '🌎', monitored: true },
  { id: 'Sul', name: 'Sul', icon: '🌊', monitored: true, states: 'RS, SC, PR', mainRisks: 'Alagamento, Cheias, Frio', cities: CITIES.filter(c => c.region === 'Sul') },
  { id: 'Norte', name: 'Norte', icon: '🌿', monitored: true, states: 'AM, PA, AC, RR, AP, TO, RO', mainRisks: 'Seca, Calor, Déficit Hídrico', cities: CITIES.filter(c => c.region === 'Norte') },
  { id: 'Nordeste', name: 'Nordeste', icon: '☀️', monitored: true, states: 'BA, CE, PE, MA, PI, RN, PB, AL, SE', mainRisks: 'Estresse Hídrico, Calor', cities: CITIES.filter(c => c.region === 'Nordeste') },
  { id: 'Sudeste', name: 'Sudeste', icon: '🏙️', monitored: true, states: 'SP, RJ, MG, ES', mainRisks: 'Deslizamentos, Calor Urbano', cities: CITIES.filter(c => c.region === 'Sudeste') },
  { id: 'Centro-Oeste', name: 'Centro-Oeste', icon: '🌾', monitored: true, states: 'GO, MT, MS, DF', mainRisks: 'Seca, Queimadas', cities: CITIES.filter(c => c.region === 'Centro-Oeste') },
]

const filteredCities = computed(() => {
  let cities = CITIES
  if (selectedRegion.value !== 'all') {
    cities = cities.filter(c => c.region === selectedRegion.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    cities = cities.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q)
    )
  }
  return cities
})

function selectRegion(regionId: string) {
  selectedRegion.value = regionId
  if (regionId !== 'all') {
    const firstCity = CITIES.find(c => c.region === regionId)
    if (firstCity) {
      selectedCityId.value = firstCity.id
      runAssessment(true)
    }
  }
}

function selectCity(cityId: string) {
  selectedCityId.value = cityId
  showCityDropdown.value = false
  searchQuery.value = ''
  runAssessment(true)
}

function clearSearch() {
  searchQuery.value = ''
  showCityDropdown.value = false
}

function selectRegionFromMap(region: "Sul" | "Norte" | "Nordeste" | "Sudeste" | "Centro-Oeste") {
  selectedRegion.value = region
  const firstCity = CITIES.find(c => c.region === region)
  if (firstCity) {
    selectedCityId.value = firstCity.id
    runAssessment(true)
  }
}

const regionStats = computed(() => {
  return regions.filter(r => r.monitored && r.cities).map(r => {
    const regionCities = r.cities!
    const avgTemp = Math.round(regionCities.reduce((a, c) => a + c.historic_temp_avg, 0) / regionCities.length * 10) / 10
    const avgPrecip = Math.round(regionCities.reduce((a, c) => a + c.historic_precip_avg, 0) / regionCities.length)
    return { ...r, cityCount: regionCities.length, avgTemp, avgPrecip }
  })
})
</script>

<template>
  <div class="space-y-6">
    <!-- Error Banner -->
    <div v-if="error" class="glass-card border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
      <AlertCircle class="w-5 h-5 text-white shrink-0 mt-0.5" />
      <div>
        <h3 class="font-semibold text-white">Falha na Conexão</h3>
        <p class="text-sm text-white/80 mt-1">{{ error }}</p>
        <button @click="runAssessment(true)" class="mt-2 text-xs font-semibold text-white underline hover:text-white">Tentar novamente</button>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="glass-card rounded-2xl p-4">
      <div class="flex flex-col md:flex-row gap-4">
          <div ref="searchContainer" class="flex-1 relative z-[100]">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search class="w-4 h-4 text-white" />
            </div>
          <input
            v-model="searchQuery"
            @focus="openDropdown"
            type="text"
            placeholder="Buscar município ou estado..."
            class="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all"
          />
          <button v-if="searchQuery" @click="clearSearch" class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <X class="w-4 h-4 text-white hover:text-white transition-colors" />
          </button>
        </div>

        <Teleport to="body">
          <div v-if="showCityDropdown && filteredCities.length > 0"
            class="fixed glass-card rounded-xl shadow-2xl z-[9999] max-h-64 overflow-y-auto border border-slate-700/60"
            :style="{ top: dropdownPos.top + 'px', left: dropdownPos.left + 'px', width: dropdownPos.width + 'px' }"
          >
            <div v-for="city in filteredCities" :key="city.id" @mousedown.prevent="selectCity(city.id)"
              class="flex items-center justify-between px-4 py-2.5 hover:bg-amber-500/10 cursor-pointer border-b border-slate-800/50 last:border-0 transition-colors">
              <div class="flex items-center gap-3">
                <MapPin class="w-4 h-4 text-white" />
                <div>
                  <span class="text-sm font-semibold text-white">{{ city.name }}</span>
                  <span class="text-xs text-white ml-1">({{ city.state }})</span>
                </div>
              </div>
              <span class="text-sm font-bold text-white bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/40">
                {{ city.region }}
              </span>
            </div>
          </div>
        </Teleport>

        <div class="flex gap-2 flex-wrap">
          <button v-for="region in regions" :key="region.id" @click="selectRegion(region.id)"
            :class="[
              'px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 border',
              selectedRegion === region.id
                ? 'border-amber-500/60 text-white'
                : 'border-slate-700/40 text-white hover:text-white hover:border-slate-600'
            ]"
            :style="selectedRegion === region.id ? 'background: rgba(251, 191, 36, 0.1); box-shadow: 0 0 12px rgba(251, 191, 36, 0.1);' : 'background: rgba(15, 23, 42, 0.4);'"
          >
            <span>{{ region.icon }}</span>
            <span class="hidden sm:inline">{{ region.name }}</span>
            <span class="sm:hidden">{{ region.id === 'all' ? 'Todas' : region.name.slice(0, 3) }}</span>
          </button>
        </div>
      </div>

      <div v-if="selectedRegion !== 'all' || searchQuery" class="mt-3 flex items-center gap-2 text-xs text-white">
        <Filter class="w-3 h-3" />
        <span>Filtros ativos:</span>
        <span v-if="selectedRegion !== 'all'" class="bg-amber-500/10 text-white px-2 py-0.5 rounded-full font-semibold border border-amber-500/20">
          {{ regions.find(r => r.id === selectedRegion)?.name }}
          <button @click="selectedRegion = 'all'" class="ml-1 hover:text-white">×</button>
        </span>
        <span v-if="searchQuery" class="bg-slate-800/50 text-white px-2 py-0.5 rounded-full font-semibold border border-slate-700/40">
          "{{ searchQuery }}"
          <button @click="searchQuery = ''" class="ml-1 hover:text-white">×</button>
        </span>
        <span class="text-white">· {{ filteredCities.length }} município(s)</span>
      </div>
    </div>

    <!-- Seletor de Cidade + Telemetria em Tempo Real -->
    <div class="glass-card rounded-2xl p-5">
      <div class="flex flex-col lg:flex-row lg:items-center gap-4">
        <div class="flex items-center gap-3 shrink-0">
          <div class="p-2 rounded-xl" style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25);">
            <MapPin class="w-5 h-5 text-white" />
          </div>
          <div>
            <p class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow"></span>
              Telemetria em Tempo Real
            </p>
            <h3 class="font-bold text-white text-lg leading-tight">{{ currentCity.name }} ({{ currentCity.state }})</h3>
            <p class="text-sm text-white">Fonte: Open-Meteo · INPE Queimadas</p>
          </div>
        </div>

        <div class="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="rounded-xl p-3 bg-slate-900/40 border border-slate-800/60 text-center">
            <CloudRain class="w-4 h-4 text-white mx-auto mb-1" />
            <span class="text-xs text-white block uppercase">Chuva 72h</span>
            <strong class="text-base font-mono" :class="riskData ? 'text-white' : 'text-white'">
              {{ riskData ? riskData.weather.precipitation72h + 'mm' : '--' }}
            </strong>
          </div>
          <div class="rounded-xl p-3 bg-slate-900/40 border border-slate-800/60 text-center">
            <ThermometerSnowflake class="w-4 h-4 text-white mx-auto mb-1" />
            <span class="text-xs text-white block uppercase">Temp Máx</span>
            <strong class="text-base font-mono" :class="riskData ? 'text-white' : 'text-white'">
              {{ riskData ? riskData.weather.maxTemp + '°C' : '--' }}
            </strong>
          </div>
          <div class="rounded-xl p-3 bg-slate-900/40 border border-slate-800/60 text-center">
            <ThermometerSnowflake class="w-4 h-4 text-white mx-auto mb-1" />
            <span class="text-xs text-white block uppercase">Temp Mín</span>
            <strong class="text-base font-mono" :class="riskData ? 'text-white' : 'text-white'">
              {{ riskData ? riskData.weather.minTemp + '°C' : '--' }}
            </strong>
          </div>
          <div class="rounded-xl p-3 bg-slate-900/40 border border-slate-800/60 text-center">
            <Droplets class="w-4 h-4 text-white mx-auto mb-1" />
            <span class="text-xs text-white block uppercase">Umidade Solo</span>
            <strong class="text-base font-mono" :class="riskData ? 'text-white' : 'text-white'">
              {{ riskData ? riskData.weather.soilMoisture + '%' : '--' }}
            </strong>
          </div>
        </div>

        <button @click="runAssessment(true)" :disabled="isLoading"
          class="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 transition-all duration-200 hover:scale-105 disabled:opacity-50"
          style="background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); box-shadow: 0 0 14px rgba(251, 191, 36, 0.25);">
          <RefreshCw :class="['w-3.5 h-3.5', isLoading ? 'animate-spin' : '']" />
          {{ isLoading ? 'Atualizando...' : 'Atualizar dados' }}
        </button>
        <button v-if="riskData" @click="generateRiskPdf(riskData)" title="Exportar relatório PDF"
          class="shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-105 border border-slate-700/50"
          style="background: rgba(15, 23, 42, 0.6);">
          <FileText class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">PDF</span>
        </button>
      </div>
      <p v-if="riskData && !riskData.weather.realTimeFetched" class="mt-2 text-sm text-white/80">
        ⚠ Dados de previsão indisponíveis no momento — usando baseline climatológico histórico da cidade.
      </p>
    </div>

    <!-- Region Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="region in regionStats" :key="region.id" @click="selectRegion(region.id)"
        class="glass-card rounded-2xl p-4 cursor-pointer transition-all duration-300 hover-glow group"
        :class="selectedRegion === region.id ? 'border-glow-gold' : ''"
        :style="selectedRegion === region.id ? 'border-color: rgba(251, 191, 36, 0.4); background: rgba(251, 191, 36, 0.05);' : ''"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-2xl group-hover:animate-float transition-transform">{{ region.icon }}</span>
            <div>
              <h3 class="font-bold text-white text-sm">{{ region.name }}</h3>
              <p class="text-sm text-white">{{ region.states }}</p>
            </div>
          </div>
          <span class="text-xs font-bold bg-emerald-500/10 text-white px-2 py-0.5 rounded-full border border-emerald-500/20">
            {{ region.cityCount }} cidades
          </span>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2 text-xs text-white">
            <AlertTriangle class="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span class="font-medium">{{ region.mainRisks }}</span>
          </div>
          <div class="flex items-center gap-4 text-sm text-white">
            <span class="flex items-center gap-1">
              <ThermometerSnowflake class="w-3 h-3 text-white" />
              Média: {{ region.avgTemp }}°C
            </span>
            <span class="flex items-center gap-1">
              <CloudRain class="w-3 h-3 text-white" />
              Chuva: {{ region.avgPrecip }}mm
            </span>
          </div>
        </div>

        <div v-if="selectedRegion === region.id" class="mt-3 pt-3 border-t border-amber-500/20">
          <p class="text-sm font-bold text-white uppercase mb-2">Municípios monitorados</p>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="city in region.cities" :key="city.id" @click.stop="selectCity(city.id)"
              :class="[
                'text-sm font-semibold px-2 py-1 rounded-lg transition-all duration-200',
                selectedCityId === city.id
                  ? 'bg-amber-500/20 text-white border border-amber-500/30'
                  : 'bg-slate-800/50 text-white border border-slate-700/40 hover:bg-amber-500/10 hover:text-white hover:border-amber-500/20'
              ]"
            >
              {{ city.name }} ({{ city.state }})
            </button>
          </div>
        </div>
      </div>

      <!-- Total monitored cities card -->
      <div class="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center hover-glow animate-shimmer">
        <div class="p-2 rounded-xl mb-3" style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%); border: 1px solid rgba(251, 191, 36, 0.2);">
          <MapPin class="w-6 h-6 text-white" />
        </div>
        <div class="text-3xl font-extrabold text-white gold-glow">{{ CITIES.length }}</div>
        <div class="text-xs font-semibold text-white mt-1">Municípios monitorados</div>
        <div class="text-sm text-white mt-0.5">5 regiões · 27 estados + DF</div>
      </div>
    </div>

    <!-- Main Grid: Map (full width, taller) -->
    <div class="grid grid-cols-1 gap-6">
      <div class="lg:col-span-1" style="min-height: 500px;">
        <BrasilMap @select-region="selectRegionFromMap" />
      </div>
    </div>

    <!-- Métricas de Risco (full width below map) -->
    <div class="glass-card rounded-2xl p-5">
      <div class="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
        <div class="flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-white" />
          <h2 class="text-lg font-bold text-white">Métricas de Risco</h2>
        </div>
        <span v-if="riskData" :class="[
          'text-sm font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
          riskData.risks.overall === 'Crítico' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          riskData.risks.overall === 'Alto' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
          riskData.risks.overall === 'Médio' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        ]">
          GERAL: {{ riskData.risks.overall }}
        </span>
      </div>

      <template v-if="riskData">
        <div class="space-y-5">
          <RiskGauge :score="riskData.risks.chuvaExtrema.score" :level="riskData.risks.chuvaExtrema.level" label="Chuva Extrema & Cheias">
            <template #icon><CloudRain class="w-4 h-4 text-white" /></template>
          </RiskGauge>
          <RiskGauge :score="riskData.risks.seca.score" :level="riskData.risks.seca.level" label="Seca & Déficit Hídrico">
            <template #icon><Droplets class="w-4 h-4 text-white" /></template>
          </RiskGauge>
          <RiskGauge :score="riskData.risks.ondaCalor.score" :level="riskData.risks.ondaCalor.level" label="Onda de Calor">
            <template #icon><Flame class="w-4 h-4 text-white" /></template>
          </RiskGauge>
          <RiskGauge :score="riskData.risks.frio.score" :level="riskData.risks.frio.level" label="Frio Extremo & Geadas">
            <template #icon><ThermometerSnowflake class="w-4 h-4 text-white" /></template>
          </RiskGauge>
          <RiskGauge :score="riskData.risks.ventoForte.score" :level="riskData.risks.ventoForte.level" label="Ventos Fortes & Rajadas">
            <template #icon><Wind class="w-4 h-4 text-white" /></template>
          </RiskGauge>
          <RiskGauge :score="riskData.risks.deslizamento.score" :level="riskData.risks.deslizamento.level" label="Deslizamento de Encostas">
            <template #icon><Mountain class="w-4 h-4 text-white" /></template>
          </RiskGauge>
        </div>

        <div class="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-5 pt-4 border-t border-slate-800/60">
          <div class="text-center p-2 rounded-lg bg-slate-900/30">
            <span class="text-xs text-white block uppercase">Precipitação</span>
            <strong class="text-sm font-mono text-white">{{ riskData.weather.precipitation72h }}mm</strong>
          </div>
          <div class="text-center p-2 rounded-lg bg-slate-900/30">
            <span class="text-xs text-white block uppercase">Solo</span>
            <strong class="text-sm font-mono text-white">{{ riskData.weather.soilMoisture }}%</strong>
          </div>
          <div class="text-center p-2 rounded-lg bg-slate-900/30">
            <span class="text-xs text-white block uppercase">Temp Máx</span>
            <strong class="text-sm font-mono text-white">{{ riskData.weather.maxTemp }}°C</strong>
          </div>
          <div class="text-center p-2 rounded-lg bg-slate-900/30">
            <span class="text-xs text-white block uppercase">Temp Mín</span>
            <strong class="text-sm font-mono text-white">{{ riskData.weather.minTemp }}°C</strong>
          </div>
          <div class="text-center p-2 rounded-lg bg-slate-900/30">
            <span class="text-xs text-white block uppercase">Rajada Máx</span>
            <strong class="text-sm font-mono text-white">{{ riskData.weather.maxWindGust }}km/h</strong>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col items-center justify-center p-12 text-white">
          <RefreshCw class="w-8 h-8 animate-spin mb-2 text-amber-500/50" />
          <p class="text-sm font-medium">Carregando telemetria...</p>
        </div>
      </template>
    </div>

    <!-- Prevenção Proativa -->
    <div v-if="riskData && riskData.risks.overall === 'Crítico'" class="glass-card rounded-2xl p-5 border-l-4 border-red-500" style="background: rgba(239, 68, 68, 0.06);">
      <div class="flex items-start gap-4">
        <BellRing class="w-6 h-6 text-white shrink-0 mt-0.5 animate-pulse" />
        <div>
          <h3 class="font-bold text-white flex items-center gap-2">
            ⚠ Alerta de Prevenção Antecipada
            <span class="text-xs font-bold bg-red-500/20 text-white px-2 py-0.5 rounded-full border border-red-500/30">ATENÇÃO MÁXIMA</span>
          </h3>
          <p class="text-sm text-white/80 mt-1">
            O nível de risco em <strong class="text-white">{{ currentCity.name }}</strong> está <strong>CRÍTICO</strong>.
            Recomenda-se acionamento imediato dos protocolos de Defesa Civil, evacuação preventiva de áreas de risco,
            e monitoramento contínuo das condições meteorológicas nas próximas 72h.
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span class="text-sm font-bold bg-amber-500/10 text-white px-2 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
              <ShieldAlert class="w-3 h-3" /> Acionar Defesa Civil
            </span>
            <span class="text-sm font-bold bg-blue-500/10 text-white px-2 py-1 rounded-lg border border-blue-500/20 flex items-center gap-1">
              <CloudRain class="w-3 h-3" /> Monitorar 72h
            </span>
            <span class="text-sm font-bold bg-orange-500/10 text-white px-2 py-1 rounded-lg border border-orange-500/20 flex items-center gap-1">
              <MapPin class="w-3 h-3" /> Evacuar áreas de risco
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="riskData && riskData.risks.overall === 'Alto'" class="glass-card rounded-2xl p-5 border-l-4 border-orange-500" style="background: rgba(249, 115, 22, 0.06);">
      <div class="flex items-start gap-4">
        <ShieldAlert class="w-6 h-6 text-white shrink-0 mt-0.5" />
        <div>
          <h3 class="font-bold text-white flex items-center gap-2">
            ⚠ Preparação Preventiva
            <span class="text-xs font-bold bg-orange-500/20 text-white px-2 py-0.5 rounded-full border border-orange-500/30">ALERTA</span>
          </h3>
          <p class="text-sm text-white/80 mt-1">
            Risco <strong>ALTO</strong> em <strong>{{ currentCity.name }}</strong>. Medidas preventivas recomendadas:
            revisar planos de contingência, mobilizar equipes de prontidão e comunicar população.
          </p>
          <button @click="router.push('/prevention')" class="mt-2 text-xs font-bold text-white hover:text-white flex items-center gap-1 transition-colors">
            Ver plano de prevenção completo <ArrowRight class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Report Preview -->
    <div v-if="riskData" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="glass-card rounded-2xl p-5 hover-glow">
        <div class="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
          <Activity class="w-5 h-5 text-white" />
          <h3 class="font-bold text-white">Explicabilidade do Modelo</h3>
          <span v-if="riskData.report.isAiGenerated" class="ml-auto text-xs font-bold text-white bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {{ riskData.report.source === 'nvidia' ? 'NVIDIA AI' : 'OpenRouter AI' }}
          </span>
          <span v-else class="ml-auto text-xs font-bold text-white bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/40">
            Regras Técnicas
          </span>
        </div>
        <p class="text-sm leading-relaxed text-white whitespace-pre-line">{{ riskData.report.explicabilidade }}</p>
        <button @click="router.push('/city')" class="mt-4 text-xs font-bold text-white hover:text-white flex items-center gap-1 transition-colors">
          Ver análise completa <ArrowRight class="w-3 h-3" />
        </button>
      </div>

      <div class="glass-card rounded-2xl p-5 hover-glow">
        <div class="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg shrink-0" style="background: rgba(251, 191, 36, 0.12);">
              <ShieldAlert class="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 class="font-bold text-white">Ações Prioritárias</h3>
              <p class="text-sm text-white/70 leading-tight">{{ currentCity.name }} ({{ currentCity.state }}) · {{ riskData.risks.overall }}</p>
            </div>
          </div>
          <span :class="[
            'text-sm font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
            riskData.risks.overall === 'Crítico' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            riskData.risks.overall === 'Alto' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
            riskData.risks.overall === 'Médio' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          ]">
            {{ riskData.risks.overall }}
          </span>
        </div>
        <div class="space-y-3">
          <div v-for="(act, idx) in riskData.report.acoes.slice(0, 3)" :key="idx"
            class="flex items-start gap-3 p-4 rounded-xl bg-slate-900/30 border border-slate-800/40">
            <div :class="[
              'p-1.5 rounded-lg shrink-0 mt-1',
              act.prioridade === 'Crítica' ? 'bg-red-500/15' :
              act.prioridade === 'Alta' ? 'bg-orange-500/15' :
              'bg-amber-500/15'
            ]">
              <BellRing :class="[
                'w-4 h-4',
                act.prioridade === 'Crítica' ? 'text-red-400' :
                act.prioridade === 'Alta' ? 'text-orange-400' :
                'text-amber-400'
              ]" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-bold text-white">{{ act.destinatario }}</span>
                <span :class="[
                  'text-xs font-bold px-2 py-0.5 rounded-full border',
                  act.prioridade === 'Crítica' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  act.prioridade === 'Alta' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  act.prioridade === 'Imediata' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                ]">{{ act.prioridade }}</span>
              </div>
              <p class="text-sm text-white mt-1 leading-relaxed">{{ act.acao }}</p>
            </div>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-800/40">
          <p class="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Legenda de Prioridade</p>
          <div class="grid grid-cols-3 gap-2">
            <div class="flex items-center gap-1.5 text-xs text-white bg-slate-900/40 px-2 py-1.5 rounded-lg border border-red-500/15">
              <span class="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
              <span><strong class="text-red-400">Imediata</strong> — risco de vida</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-white bg-slate-900/40 px-2 py-1.5 rounded-lg border border-orange-500/15">
              <span class="w-2 h-2 rounded-full bg-orange-400 shrink-0"></span>
              <span><strong class="text-orange-400">Alta</strong> — urgência elevada</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-white bg-slate-900/40 px-2 py-1.5 rounded-lg border border-yellow-500/15">
              <span class="w-2 h-2 rounded-full bg-yellow-400 shrink-0"></span>
              <span><strong class="text-yellow-400">Média</strong> — monitoramento</span>
            </div>
          </div>
        </div>
        <button @click="router.push('/prevention')" class="mt-4 text-xs font-semibold text-white hover:text-white/80 flex items-center gap-1 transition-colors">
          Ver todas as ações <ArrowRight class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>
