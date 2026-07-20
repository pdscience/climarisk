<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  MapPin, RefreshCw, CloudRain, Droplets, Flame,
  ThermometerSnowflake, Wind, Mountain, Activity, AlertTriangle
} from 'lucide-vue-next'
import { useClimateRisk, CITIES } from '../composables/useClimateRisk'
import BrasilMap from '../components/BrasilMap.vue'

const router = useRouter()
const { allRisks, loadAllRisks, isLoadingMap, ensoScenario, selectedCityId, getSeverityStyles } = useClimateRisk()

type CityEntry = {
  cityId: string; name: string; state: string; region: string;
  overall: string;
  risks: Record<string, { score: number; level: string }>;
  weather: Record<string, any>;
}

const cityEntries = computed<CityEntry[]>(() => {
  const map = allRisks.value?.cities
  if (!map) return []
  const arr = Object.values(map) as CityEntry[]
  const order = { "Crítico": 4, "Alto": 3, "Médio": 2, "Baixo": 1 }
  arr.sort((a, b) => (order[b.overall] || 0) - (order[a.overall] || 0))
  return arr
})

const topCities = computed(() => cityEntries.value)

const pageSize = 7
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(topCities.value.length / pageSize)))
const pagedCities = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return topCities.value.slice(start, start + pageSize)
})

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) currentPage.value = p
}

const currentCity = computed(() =>
  topCities.value.find(c => c.cityId === selectedCityId.value) ||
  topCities.value[0] || null
)
const updatedAt = computed(() => allRisks.value?.updatedAt || '')

function selectCity(cityId: string) {
  selectedCityId.value = cityId
  const idx = topCities.value.findIndex(c => c.cityId === cityId)
  if (idx >= 0) currentPage.value = Math.floor(idx / pageSize) + 1
}

function goToCity(cityId: string) {
  router.push(`/city/${cityId}`)
}

let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (!allRisks.value) loadAllRisks()
  refreshTimer = setInterval(() => loadAllRisks(), 60000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

const riskIcons: Record<string, any> = {
  chuvaExtrema: CloudRain,
  seca: Droplets,
  ondaCalor: Flame,
  frio: ThermometerSnowflake,
  ventoForte: Wind,
  deslizamento: Mountain,
}

const riskColors: Record<string, string> = {
  Crítico: 'text-red-400',
  Alto: 'text-orange-400',
  Médio: 'text-yellow-400',
  Baixo: 'text-emerald-400',
}

const riskBgColors: Record<string, string> = {
  Crítico: 'bg-red-500/20 border-red-500/30',
  Alto: 'bg-orange-500/20 border-orange-500/30',
  Médio: 'bg-yellow-500/20 border-yellow-500/30',
  Baixo: 'bg-emerald-500/20 border-emerald-500/30',
}

const overallCounts = computed(() => {
  const counts: Record<string, number> = { Crítico: 0, Alto: 0, Médio: 0, Baixo: 0 }
  for (const c of cityEntries.value) {
    counts[c.overall] = (counts[c.overall] || 0) + 1
  }
  return counts
})
</script>

<template>
  <div class="h-full w-full bg-[#070b14] text-white lg:overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-6 py-3 shrink-0 border-b border-slate-800/60" style="background: rgba(7, 11, 20, 0.95);">
        <div class="flex items-center gap-3 min-w-0 flex-wrap">
          <Activity class="w-6 h-6 text-amber-400 shrink-0" />
          <h1 class="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">SALA DE CRISE</h1>
          <span class="flex items-center gap-2 text-xs sm:text-sm font-semibold shrink-0">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ENSO: <strong class="text-amber-400 uppercase">{{ ensoScenario.replace('_', ' ') }}</strong>
          </span>
        </div>
        <div class="flex items-center gap-3 sm:gap-4 shrink-0">
          <span class="text-xs sm:text-sm text-white/50 font-mono">
            {{ updatedAt ? new Date(updatedAt).toLocaleTimeString('pt-BR') : '--' }}
          </span>
          <button @click="loadAllRisks()" :disabled="isLoadingMap"
            class="font-bold px-3 sm:px-4 py-2 rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-50"
            style="background: linear-gradient(135deg, #fbbf24, #f97316); color: #0f172a;">
            <RefreshCw :class="['w-4 h-4', isLoadingMap ? 'animate-spin' : '']" />
            Atualizar
          </button>
        </div>
      </div>

    <!-- Main -->
    <div class="flex-1 flex flex-col lg:flex-row min-h-0">
      <!-- Map -->
      <div class="h-[320px] lg:h-auto lg:flex-1 min-h-0 relative flex flex-col shrink-0 lg:shrink">
        <div v-if="isLoadingMap" class="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
          <div class="flex flex-col items-center gap-2 text-amber-400">
            <RefreshCw class="w-8 h-8 animate-spin" />
            <span class="text-sm font-bold">Carregando mapa...</span>
          </div>
        </div>
        <div class="h-[320px] lg:h-full lg:flex-1 overflow-hidden rounded-none border-0">
          <BrasilMap mapHeight="h-full" />
        </div>
      </div>

      <!-- Right Panel -->
      <div class="w-full lg:w-[420px] shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-800/60 lg:overflow-y-auto" style="background: rgba(12, 18, 34, 0.95);">
        <!-- Summary -->
        <div class="p-4 border-b border-slate-800/60">
          <h2 class="text-sm uppercase font-bold text-white/50 tracking-wider mb-3">Resumo Nacional</h2>
          <div class="grid grid-cols-4 gap-2">
            <div class="text-center rounded-xl p-2 bg-red-500/10 border border-red-500/20">
              <div class="text-2xl font-extrabold text-red-400">{{ overallCounts.Crítico }}</div>
              <div class="text-[10px] text-white/60 uppercase">Crítico</div>
            </div>
            <div class="text-center rounded-xl p-2 bg-orange-500/10 border border-orange-500/20">
              <div class="text-2xl font-extrabold text-orange-400">{{ overallCounts.Alto }}</div>
              <div class="text-[10px] text-white/60 uppercase">Alto</div>
            </div>
            <div class="text-center rounded-xl p-2 bg-yellow-500/10 border border-yellow-500/20">
              <div class="text-2xl font-extrabold text-yellow-400">{{ overallCounts.Médio }}</div>
              <div class="text-[10px] text-white/60 uppercase">Médio</div>
            </div>
            <div class="text-center rounded-xl p-2 bg-emerald-500/10 border border-emerald-500/20">
              <div class="text-2xl font-extrabold text-emerald-400">{{ overallCounts.Baixo }}</div>
              <div class="text-[10px] text-white/60 uppercase">Baixo</div>
            </div>
          </div>
        </div>

        <!-- City List + Current Card -->
        <div class="flex-1 p-4 flex flex-col min-h-0 gap-3">
          <!-- List Card (scrolls internally, paginated 7/page) -->
          <div class="glass-card rounded-2xl p-3 flex flex-col min-h-0 flex-1">
            <div class="flex items-center justify-between mb-2 px-1 shrink-0">
              <h2 class="text-sm uppercase font-bold text-white/50 tracking-wider">Municípios ({{ topCities.length }})</h2>
              <div class="flex items-center gap-1.5">
                <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1"
                  class="w-6 h-6 rounded-lg flex items-center justify-center text-white/70 border border-slate-700/50 transition disabled:opacity-30 hover:bg-slate-800/40">
                  ‹
                </button>
                <span class="text-xs font-bold text-white/70 px-1">{{ currentPage }} / {{ totalPages }}</span>
                <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages"
                  class="w-6 h-6 rounded-lg flex items-center justify-center text-white/70 border border-slate-700/50 transition disabled:opacity-30 hover:bg-slate-800/40">
                  ›
                </button>
              </div>
            </div>

            <!-- City List (paginated, 7 per page) -->
            <div class="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1">
              <button v-for="c in pagedCities" :key="c.cityId"
                @click="selectCity(c.cityId)"
                :class="[
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all border',
                  c.cityId === selectedCityId
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-transparent bg-slate-900/30 hover:bg-slate-800/30'
                ]">
                <div class="flex items-center gap-2 min-w-0">
                  <span :class="['w-2 h-2 rounded-full shrink-0', c.overall === 'Crítico' ? 'bg-red-400' : c.overall === 'Alto' ? 'bg-orange-400' : c.overall === 'Médio' ? 'bg-yellow-400' : 'bg-emerald-400']"></span>
                  <div class="min-w-0">
                    <div class="text-sm font-bold text-white truncate">{{ c.name }}</div>
                    <div class="text-[10px] text-white/50">{{ c.state }} · {{ c.region }}</div>
                  </div>
                </div>
                <span :class="['text-xs font-bold uppercase shrink-0', riskColors[c.overall]]">{{ c.overall }}</span>
              </button>
            </div>
          </div>

          <!-- Current City Card -->
          <div v-if="currentCity" class="shrink-0">
            <div class="rounded-2xl p-5 flex flex-col"
              :class="riskBgColors[currentCity.overall]"
              style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); border-width: 1px;">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <div class="flex items-center gap-2">
                    <MapPin class="w-5 h-5 text-amber-400" />
                    <h3 class="text-2xl font-extrabold text-white">{{ currentCity.name }}</h3>
                    <span class="text-lg text-white/50">({{ currentCity.state }})</span>
                  </div>
                  <p class="text-sm text-white/60 mt-0.5">{{ currentCity.region }}</p>
                </div>
                <div class="text-right">
                  <div :class="['text-lg font-extrabold uppercase', riskColors[currentCity.overall]]">
                    {{ currentCity.overall }}
                  </div>
                  <div class="text-[10px] text-white/50">RISCO GERAL</div>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3 mb-4">
                <div v-for="(r, rKey) in currentCity.risks" :key="rKey as string"
                  class="rounded-xl p-3 text-center bg-slate-900/50 border border-slate-800/40">
                  <component :is="riskIcons[rKey as string] || AlertTriangle" class="w-4 h-4 mx-auto mb-1" :class="riskColors[r.level]" />
                  <div class="text-xs font-bold mb-0.5">{{ r.score }}%</div>
                  <div :class="['text-[9px] font-bold uppercase', riskColors[r.level] || 'text-white/50']">{{ r.level }}</div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="rounded-lg bg-slate-900/40 p-3 border border-slate-800/40 text-center">
                  <CloudRain class="w-4 h-4 mx-auto mb-1 text-blue-400" />
                  <div class="text-white font-mono font-bold">{{ currentCity.weather?.precipitation72h ?? 0 }}mm</div>
                  <div class="text-[10px] text-white/50">Chuva 72h</div>
                </div>
                <div class="rounded-lg bg-slate-900/40 p-3 border border-slate-800/40 text-center">
                  <Wind class="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                  <div class="text-white font-mono font-bold">{{ currentCity.weather?.maxWindGust ?? 0 }} km/h</div>
                  <div class="text-[10px] text-white/50">Rajada Máx</div>
                </div>
              </div>

              <button @click="goToCity(currentCity.cityId)"
                class="mt-4 w-full py-3 rounded-xl font-bold text-sm transition hover:opacity-90"
                style="background: linear-gradient(135deg, #fbbf24, #f97316); color: #0f172a;">
                Analisar {{ currentCity.name }}
              </button>
            </div>
          </div>

          <div v-else-if="isLoadingMap" class="shrink-0 flex items-center justify-center text-white/50 py-8">
            <RefreshCw class="w-8 h-8 animate-spin" />
          </div>
          <div v-else class="shrink-0 flex items-center justify-center text-white/50 text-sm py-8">
            Nenhum dado disponível
          </div>
        </div>
      </div>
    </div>
  </div>
</template>