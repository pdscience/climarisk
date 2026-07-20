<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Trophy, MapPin, ArrowRight, RefreshCw, CloudRain, Droplets,
  Flame, ThermometerSnowflake, Wind, Mountain, Search, Filter, X,
  ChevronUp, ChevronDown, AlertTriangle, Eye
} from 'lucide-vue-next'
import { useClimateRisk, CITIES } from '../composables/useClimateRisk'

const router = useRouter()
const {
  selectedCityId, ensoScenario, runAssessment, getSeverityStyles,
  allRisks, loadAllRisks, isLoadingMap
} = useClimateRisk()

const searchQuery = ref('')
const selectedRegion = ref<string>('all')
const sortKey = ref<string>('overall')
const sortOrder = ref<'asc' | 'desc'>('desc')

type CityEntry = {
  cityId: string; name: string; state: string; region: string;
  overall: string;
  risks: Record<string, { score: number; level: string }>;
  weather: Record<string, any>;
}

const cityEntries = computed<CityEntry[]>(() => {
  const map = allRisks.value?.cities
  if (!map) return []
  return Object.values(map) as CityEntry[]
})

const filteredCities = computed(() => {
  let items = [...cityEntries.value]
  if (selectedRegion.value !== 'all') {
    items = items.filter(c => c.region === selectedRegion.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q)
    )
  }
  const key = sortKey.value
  const order = sortOrder.value === 'asc' ? 1 : -1
  const levelOrder: Record<string, number> = { "Crítico": 4, "Alto": 3, "Médio": 2, "Baixo": 1 }
  items.sort((a, b) => {
    let va: number = 0, vb: number = 0
    if (key === 'overall' || key === 'region' || key === 'name') {
      const aStr = key === 'overall' ? a.overall : a[key as 'region' | 'name']
      const bStr = key === 'overall' ? b.overall : b[key as 'region' | 'name']
      const aNum = key === 'overall' ? (levelOrder[aStr] || 0) : 0
      const bNum = key === 'overall' ? (levelOrder[bStr] || 0) : 0
      if (aNum !== bNum) return (aNum - bNum) * order
      return aStr.localeCompare(bStr) * order
    }
    const r = a.risks[key]
    const r2 = b.risks[key]
    va = r ? r.score : 0
    vb = r2 ? r2.score : 0
    return (va - vb) * order
  })
  return items
})

const regions = [
  { id: 'all', name: 'Todas as Regiões' },
  { id: 'Sul', name: 'Sul' },
  { id: 'Norte', name: 'Norte' },
  { id: 'Nordeste', name: 'Nordeste' },
  { id: 'Sudeste', name: 'Sudeste' },
  { id: 'Centro-Oeste', name: 'Centro-Oeste' },
]

const columns = [
  { key: 'chuvaExtrema', label: 'Chuva', icon: CloudRain },
  { key: 'seca', label: 'Seca', icon: Droplets },
  { key: 'ondaCalor', label: 'Calor', icon: Flame },
  { key: 'frio', label: 'Frio', icon: ThermometerSnowflake },
  { key: 'ventoForte', label: 'Vento', icon: Wind },
  { key: 'deslizamento', label: 'Deslize', icon: Mountain },
]

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = key === 'name' ? 'asc' : 'desc'
  }
}

function sortIndicator(key: string) {
  if (sortKey.value !== key) return ''
  return sortOrder.value === 'asc' ? '▲' : '▼'
}

function viewCity(cityId: string) {
  selectedCityId.value = cityId
  router.push('/city')
}

function getLevelWeight(level: string) {
  return level === 'Crítico' ? 4 : level === 'Alto' ? 3 : level === 'Médio' ? 2 : 1
}

function getRegionRisk(region: string) {
  const items = cityEntries.value.filter(c => c.region === region)
  const levels = ['Crítico', 'Alto', 'Médio', 'Baixo']
  for (const lvl of levels) {
    if (items.some(c => c.overall === lvl)) return lvl
  }
  return 'Baixo'
}

onMounted(() => {
  if (!allRisks.value) loadAllRisks()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-extrabold text-white flex items-center gap-2">
          <Trophy class="w-6 h-6 text-amber-400" />
          Ranking de Risco Climático
        </h2>
        <p class="text-sm text-white/60 mt-1">
          {{ filteredCities.length }} de {{ cityEntries.length }} municípios monitorados
        </p>
      </div>
      <button @click="loadAllRisks()" :disabled="isLoadingMap"
        class="font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-2 disabled:opacity-50"
        style="background: linear-gradient(135deg, #fbbf24, #f97316); color: #0f172a;">
        <RefreshCw :class="['w-3.5 h-3.5', isLoadingMap ? 'animate-spin' : '']" />
        Atualizar
      </button>
    </div>

    <!-- Filtros -->
    <div class="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar município..."
          class="w-full pl-10 pr-8 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
      <div class="flex gap-1.5 flex-wrap">
        <button v-for="r in regions" :key="r.id" @click="selectedRegion = r.id"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
            selectedRegion === r.id
              ? 'border-amber-500/50 text-white bg-amber-500/10'
              : 'border-slate-700/40 text-white/70 hover:text-white hover:border-slate-600 bg-slate-900/30'
          ]">
          <template v-if="r.id === 'all'">📍 {{ r.name }}</template>
          <template v-else>{{ r.name }}</template>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoadingMap || cityEntries.length === 0" class="flex flex-col items-center justify-center p-16 text-white/50">
      <RefreshCw class="w-10 h-10 animate-spin mb-3 text-amber-500/50" />
      <p class="text-sm font-medium">Carregando ranking...</p>
    </div>

    <!-- Tabela -->
    <div v-else class="glass-card rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="border-b border-slate-700/60" style="background: rgba(15, 23, 42, 0.5);">
            <tr>
              <th class="px-3 py-3 text-[10px] uppercase font-bold text-white/50 w-10">#</th>
              <th @click="toggleSort('name')" class="px-3 py-3 text-[10px] uppercase font-bold text-white/50 cursor-pointer hover:text-white select-none whitespace-nowrap">
                Cidade <span v-if="sortKey === 'name'" class="ml-1">{{ sortIndicator('name') }}</span>
              </th>
              <th @click="toggleSort('region')" class="px-3 py-3 text-[10px] uppercase font-bold text-white/50 cursor-pointer hover:text-white select-none whitespace-nowrap">
                Região <span v-if="sortKey === 'region'" class="ml-1">{{ sortIndicator('region') }}</span>
              </th>
              <th v-for="col in columns" :key="col.key" @click="toggleSort(col.key)"
                class="px-3 py-3 text-[10px] uppercase font-bold text-white/50 cursor-pointer hover:text-white select-none text-center whitespace-nowrap">
                <component :is="col.icon" class="w-3 h-3 inline-block mr-1" />
                {{ col.label }}
                <span v-if="sortKey === col.key" class="ml-1">{{ sortIndicator(col.key) }}</span>
              </th>
              <th @click="toggleSort('overall')" class="px-3 py-3 text-[10px] uppercase font-bold text-white/50 cursor-pointer hover:text-white select-none text-center whitespace-nowrap">
                Risco Geral <span v-if="sortKey === 'overall'" class="ml-1">{{ sortIndicator('overall') }}</span>
              </th>
              <th class="px-3 py-3 text-[10px] uppercase font-bold text-white/50 text-center">Ação</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/40">
            <tr v-for="(item, idx) in filteredCities" :key="item.cityId"
              class="hover:bg-slate-800/20 transition-colors cursor-pointer"
              @click="viewCity(item.cityId)">
              <td class="px-3 py-3">
                <span :class="[
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                  idx === 0 ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                  idx === 1 ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' :
                  idx === 2 ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' :
                  'bg-slate-800/40 text-white/50 border border-slate-700/30'
                ]">{{ idx + 1 }}</span>
              </td>
              <td class="px-3 py-3">
                <div class="font-bold text-sm text-white">{{ item.name }}</div>
                <div class="text-[10px] text-white/50">{{ item.state }}</div>
              </td>
              <td class="px-3 py-3">
                <span :class="[
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                  item.region === 'Sul' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  item.region === 'Norte' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  item.region === 'Nordeste' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  item.region === 'Sudeste' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                ]">{{ item.region }}</span>
              </td>
              <td v-for="col in columns" :key="col.key" class="px-3 py-3 text-center">
                <div class="flex flex-col items-center gap-0.5">
                  <span :class="['text-xs font-bold font-mono', getSeverityStyles(item.risks[col.key]?.level || 'Baixo').text]">
                    {{ item.risks[col.key]?.score ?? 0 }}%
                  </span>
                  <div class="w-12 h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-300"
                      :class="getSeverityStyles(item.risks[col.key]?.level || 'Baixo').text.replace('text-', 'bg-')"
                      :style="{ width: (item.risks[col.key]?.score ?? 0) + '%' }">
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3 text-center">
                <span :class="[
                  'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border',
                  item.overall === 'Crítico' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                  item.overall === 'Alto' ? 'bg-orange-500/15 text-orange-400 border-orange-500/20' :
                  item.overall === 'Médio' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' :
                  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                ]">
                  {{ item.overall }}
                </span>
              </td>
              <td class="px-3 py-3 text-center">
                <button @click.stop="viewCity(item.cityId)"
                  class="text-amber-400 hover:text-amber-300 p-1.5 rounded-lg hover:bg-amber-500/10 transition">
                  <Eye class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Region summary -->
    <div v-if="cityEntries.length > 0" class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div v-for="r in regions.slice(1)" :key="r.id"
        class="glass-card rounded-xl p-3 text-center"
        :style="getRegionRisk(r.id) === 'Crítico' ? 'border-color: rgba(239,68,68,0.3);' : ''">
        <div class="text-xs font-bold text-white/60 uppercase">{{ r.name }}</div>
        <div class="text-lg font-extrabold mt-0.5"
          :class="getSeverityStyles(getRegionRisk(r.id)).text">
          {{ getRegionRisk(r.id) }}
        </div>
        <div class="text-[10px] text-white/40 mt-0.5">
          {{ cityEntries.filter(c => c.region === r.id).length }} cidades
        </div>
      </div>
    </div>
  </div>
</template>
