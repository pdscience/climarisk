<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MapPin, RefreshCw, Settings2, AlertTriangle, CloudRain, Droplets,
  Flame, ThermometerSnowflake, Wind, Mountain, Globe, Info, ShieldAlert, FileText,
  Activity, Users, TrendingUp, CheckCircle2, FileDown
} from 'lucide-vue-next'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useClimateRisk, CITIES } from '../composables/useClimateRisk'
import RiskGauge from '../components/RiskGauge.vue'
import { generateRiskPdf } from '../utils/pdfExport'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const route = useRoute()
const router = useRouter()
const {
  selectedCityId, ensoScenario, hasInmetAlert,
  customSoilMoisture, customPrecipitation, customMaxTemp, customMinTemp,
  isLoading, riskData, error, currentCity,
  runAssessment, getSeverityStyles
} = useClimateRisk()

const activeTab = ref<"explainability" | "impacts" | "actions">("explainability")

onMounted(() => {
  if (route.params.id) selectedCityId.value = route.params.id as string
  if (!riskData.value) runAssessment(true)
})

watch(() => route.params.id, (newId) => {
  if (newId) selectedCityId.value = newId as string
})

const historicalData = computed(() => {
  const today = new Date(2026, 6, 18)
  const data: Array<{ name: string; Temperatura: number; Precipitação: number }> = []
  const baseSeed = selectedCityId.value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const seededRandom = (seed: number) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x) }

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today); date.setDate(today.getDate() - i)
    const dateString = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    const daySeed = baseSeed + i
    let baseTemp = currentCity.value.historic_temp_avg
    if (ensoScenario.value.startsWith("el_nino")) baseTemp += 1.5
    else if (ensoScenario.value === "la_nina") baseTemp -= 1.0
    let temp = baseTemp + (seededRandom(daySeed) * 6 - 3)
    const actualPrecip = customPrecipitation.value ?? (riskData.value?.weather?.precipitation72h ?? 0)
    const actualMax = customMaxTemp.value ?? (riskData.value?.weather?.maxTemp ?? (currentCity.value.historic_temp_avg + 3))
    const actualMin = customMinTemp.value ?? (riskData.value?.weather?.minTemp ?? (currentCity.value.historic_temp_avg - 3))
    if (i < 5 && riskData.value) { const w = (5 - i) / 5; temp = temp * (1 - w) + ((actualMax + actualMin) / 2) * w }
    let rainProb = currentCity.value.region === "Sul" ? (ensoScenario.value.startsWith("el_nino") ? 0.45 : 0.25) : (ensoScenario.value.startsWith("el_nino") ? 0.1 : 0.3)
    let precip = 0
    if (seededRandom(daySeed + 100) < rainProb) { precip = Math.round(seededRandom(daySeed + 200) * (currentCity.value.region === "Sul" && ensoScenario.value.startsWith("el_nino") ? 50 : 25) * 10) / 10 }
    if (i === 1) precip = Math.round(actualPrecip * 0.4 * 10) / 10
    else if (i === 0) precip = Math.round(actualPrecip * 0.6 * 10) / 10
    data.push({ name: dateString, Temperatura: Math.round(temp * 10) / 10, Precipitação: precip })
  }
  return data
})

const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, textStyle: { fontSize: 13, color: '#ffffff' } },
  legend: { data: ['Temp. (°C)', 'Chuva (mm)'], top: 0, textStyle: { fontSize: 13, color: '#ffffff' } },
  grid: { left: 45, right: 45, top: 35, bottom: 25 },
  xAxis: { type: 'category', data: historicalData.value.map(d => d.name), axisLabel: { fontSize: 12, color: '#ffffff' }, axisLine: { lineStyle: { color: '#334155' } } },
  yAxis: [
    { type: 'value', name: '°C', nameTextStyle: { fontSize: 12, color: '#ffffff' }, axisLabel: { fontSize: 12, color: '#ffffff' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    { type: 'value', name: 'mm', nameTextStyle: { fontSize: 12, color: '#ffffff' }, axisLabel: { fontSize: 12, color: '#ffffff' }, splitLine: { show: false } }
  ],
  series: [
    { name: 'Temp. (°C)', type: 'line', yAxisIndex: 0, data: historicalData.value.map(d => d.Temperatura), smooth: true, lineStyle: { width: 2 }, itemStyle: { color: '#ef4444' }, symbol: 'none' },
    { name: 'Chuva (mm)', type: 'line', yAxisIndex: 1, data: historicalData.value.map(d => d.Precipitação), smooth: true, lineStyle: { width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'none' }
  ]
}))

function getSeverityBadgeClass(gravidade: string) {
  if (gravidade === "Crítica") return "bg-red-500/15 text-red-400 border-red-500/20"
  if (gravidade === "Alta") return "bg-orange-500/15 text-orange-400 border-orange-500/20"
  if (gravidade === "Média") return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
  return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
}

function getPriorityBadgeClass(prioridade: string) {
  if (prioridade === "Crítica") return "text-red-400 bg-red-500/10 border-red-500/20"
  if (prioridade === "Alta") return "text-orange-400 bg-orange-500/10 border-orange-500/20"
  if (prioridade === "Média") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
  return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
}
</script>

<template>
  <div class="space-y-6">
    <!-- City Selector Bar -->
    <div class="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl" style="background: linear-gradient(135deg, #fbbf24, #f97316);">
          <MapPin class="w-5 h-5 text-slate-900" />
        </div>
        <div>
          <h2 class="text-lg font-extrabold text-white">{{ currentCity.name }} - {{ currentCity.state }}</h2>
          <p class="text-xs text-white">Região {{ currentCity.region }} | Coords: {{ currentCity.lat }}, {{ currentCity.lon }}</p>
        </div>
      </div>
      <div class="sm:ml-auto flex items-center gap-3">
        <select v-model="selectedCityId"
          class="bg-slate-900/50 border border-slate-700/50 text-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40">
          <optgroup v-for="region in ['Sul', 'Norte', 'Nordeste', 'Sudeste', 'Centro-Oeste']" :key="region" :label="region">
            <option v-for="c in CITIES.filter(c => c.region === region)" :key="c.id" :value="c.id">
              {{ c.name }} ({{ c.state }})
            </option>
          </optgroup>
        </select>
        <button @click="runAssessment(true)" :disabled="isLoading"
          class="font-bold py-2 px-3 rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50"
          style="background: linear-gradient(135deg, #fbbf24, #f97316); color: #0f172a;">
          <RefreshCw :class="['w-3.5 h-3.5', isLoading ? 'animate-spin' : '']" />
          Atualizar
        </button>
        <button v-if="riskData" @click="generateRiskPdf(riskData)" title="Exportar relatório PDF"
          class="font-bold py-2 px-3 rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-700/50 text-white hover:bg-slate-800/30">
          <FileDown class="w-3.5 h-3.5" />
          PDF
        </button>
      </div>
    </div>

    <!-- Risk Overview + Chart -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="glass-card rounded-2xl p-5">
        <div class="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
          <h3 class="font-bold text-white flex items-center gap-2">
            <AlertTriangle class="w-5 h-5 text-orange-400" /> Métricas de Risco
          </h3>
          <span v-if="riskData" :class="[
            'text-sm font-bold px-2 py-0.5 rounded-full uppercase border',
            riskData.risks.overall === 'Crítico' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
            riskData.risks.overall === 'Alto' ? 'bg-orange-500/15 text-orange-400 border-orange-500/20' :
            riskData.risks.overall === 'Médio' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' :
            'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
          ]">
            {{ riskData.risks.overall }}
          </span>
        </div>
        <template v-if="riskData">
          <div class="space-y-4">
            <RiskGauge :score="riskData.risks.chuvaExtrema.score" :level="riskData.risks.chuvaExtrema.level" label="Chuva Extrema">
              <template #icon><CloudRain class="w-4 h-4 text-blue-400" /></template>
            </RiskGauge>
            <RiskGauge :score="riskData.risks.seca.score" :level="riskData.risks.seca.level" label="Seca">
              <template #icon><Droplets class="w-4 h-4 text-orange-400" /></template>
            </RiskGauge>
            <RiskGauge :score="riskData.risks.ondaCalor.score" :level="riskData.risks.ondaCalor.level" label="Onda de Calor">
              <template #icon><Flame class="w-4 h-4 text-red-400" /></template>
            </RiskGauge>
            <RiskGauge :score="riskData.risks.frio.score" :level="riskData.risks.frio.level" label="Frio Extremo">
              <template #icon><ThermometerSnowflake class="w-4 h-4 text-sky-400" /></template>
            </RiskGauge>
            <RiskGauge :score="riskData.risks.ventoForte.score" :level="riskData.risks.ventoForte.level" label="Ventos Fortes">
              <template #icon><Wind class="w-4 h-4 text-cyan-400" /></template>
            </RiskGauge>
            <RiskGauge :score="riskData.risks.deslizamento.score" :level="riskData.risks.deslizamento.level" label="Deslizamento">
              <template #icon><Mountain class="w-4 h-4 text-amber-400" /></template>
            </RiskGauge>
          </div>
        </template>
        <div v-else class="flex items-center justify-center p-12 text-white">
          <RefreshCw class="w-8 h-8 animate-spin text-white/50" />
        </div>
      </div>

      <div class="glass-card rounded-2xl p-5">
        <div class="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
          <TrendingUp class="w-5 h-5 text-emerald-400" />
          <h3 class="font-bold text-white">Evolução Histórica (30 dias)</h3>
        </div>
        <div class="h-[280px]">
          <v-chart :option="chartOption" autoresize />
        </div>
      </div>
    </div>

    <!-- Report Tabs -->
    <div class="glass-card rounded-2xl p-5">
      <div class="flex flex-wrap gap-2 border-b border-slate-800/60 pb-3 mb-4">
        <button v-for="tab in [
          { id: 'explainability', label: 'Explicabilidade', icon: FileText },
          { id: 'impacts', label: 'Impactos', icon: Activity },
          { id: 'actions', label: 'Ações de Prevenção', icon: ShieldAlert }
        ]" :key="tab.id" @click="activeTab = tab.id as any"
          :class="[
            'flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 border',
            activeTab === tab.id
              ? 'border-amber-500/40 text-amber-300'
              : 'border-transparent text-white hover:text-white hover:bg-slate-800/30'
          ]"
          :style="activeTab === tab.id ? 'background: rgba(251, 191, 36, 0.1);' : ''"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>

      <template v-if="riskData">
        <div v-if="activeTab === 'explainability'" class="space-y-4">
          <p class="text-sm leading-relaxed text-white whitespace-pre-line p-4 rounded-xl bg-slate-900/30 border border-slate-800/40">
            {{ riskData.report.explicabilidade }}
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div class="p-2.5 rounded-lg border border-slate-800/40 text-center bg-slate-900/30">
              <span class="text-xs text-white block uppercase">Precipitação</span>
              <strong class="text-base font-mono text-blue-400">{{ riskData.weather.precipitation72h }}mm</strong>
            </div>
            <div class="p-2.5 rounded-lg border border-slate-800/40 text-center bg-slate-900/30">
              <span class="text-xs text-white block uppercase">Solo</span>
              <strong class="text-base font-mono text-amber-400">{{ riskData.weather.soilMoisture }}%</strong>
            </div>
            <div class="p-2.5 rounded-lg border border-slate-800/40 text-center bg-slate-900/30">
              <span class="text-xs text-white block uppercase">Temp Máx</span>
              <strong class="text-base font-mono text-red-400">{{ riskData.weather.maxTemp }}°C</strong>
            </div>
            <div class="p-2.5 rounded-lg border border-slate-800/40 text-center bg-slate-900/30">
              <span class="text-xs text-white block uppercase">Rajada</span>
              <strong class="text-base font-mono text-cyan-400">{{ riskData.weather.maxWindGust }}km/h</strong>
            </div>
            <div class="p-2.5 rounded-lg border border-slate-800/40 text-center bg-slate-900/30">
              <span class="text-xs text-white block uppercase">ENSO</span>
              <strong class="text-base font-mono text-gold uppercase">{{ riskData.weather.ensoScenario.replace('_', ' ') }}</strong>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'impacts'" class="overflow-x-auto rounded-xl border border-slate-800/40">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-800/60" style="background: rgba(15, 23, 42, 0.5);">
              <tr>
                <th class="p-3 text-sm uppercase font-bold text-white">Setor</th>
                <th class="p-3 text-sm uppercase font-bold text-white">Impacto</th>
                <th class="p-3 text-sm uppercase font-bold text-white text-center">Gravidade</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/40">
              <tr v-for="(imp, idx) in riskData.report.impactos" :key="idx" class="hover:bg-slate-800/20">
                <td class="p-3 font-bold text-white">{{ imp.setor }}</td>
                <td class="p-3 text-white">{{ imp.descricao }}</td>
                <td class="p-3 text-center">
                  <span :class="['px-2 py-0.5 rounded-full text-sm font-bold border', getSeverityBadgeClass(imp.gravidade)]">
                    {{ imp.gravidade }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="activeTab === 'actions'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(act, idx) in riskData.report.acoes" :key="idx" class="p-4 rounded-xl border border-slate-800/40 bg-slate-900/20">
            <div class="flex justify-between items-center mb-2">
              <span class="font-bold text-white text-sm flex items-center gap-1">
                <Users class="w-3.5 h-3.5 text-slate-500" /> {{ act.destinatario }}
              </span>
              <span :class="['px-2 py-0.5 rounded-full text-xs font-mono font-bold border', getPriorityBadgeClass(act.prioridade)]">
                {{ act.prioridade }}
              </span>
            </div>
            <p class="text-xs text-white leading-normal">{{ act.acao }}</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
