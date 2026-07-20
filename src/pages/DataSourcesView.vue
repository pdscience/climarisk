<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Database, Globe, CloudRain, Flame, AlertTriangle, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-vue-next'

const sources = ref([
  {
    id: 'open-meteo', name: 'Open-Meteo API', color: 'blue',
    description: 'Previsão meteorológica gratuita com dados de precipitação, temperatura e vento para qualquer coordenada global.',
    url: 'https://open-meteo.com', icon: CloudRain,
    status: 'checking' as 'online' | 'offline' | 'checking',
    data: ['Previsão 7 dias', 'Temperatura máx/mín', 'Precipitação diária', 'Umidade do solo'],
    updateFreq: 'A cada 6 horas'
  },
  {
    id: 'inmet', name: 'INMET (Instituto Nacional de Meteorologia)', color: 'amber',
    description: 'Boletins e alertas oficiais do governo brasileiro para condições meteorológicas adversas.',
    url: 'https://www.inmet.gov.br', icon: AlertTriangle,
    status: 'checking' as 'online' | 'offline' | 'checking',
    data: ['Alertas amarelo/laranja/vermelho', 'Boletins diários', 'Estações automáticas'],
    updateFreq: 'Tempo real (alertas)'
  },
  {
    id: 'openrouter', name: 'OpenRouter AI', color: 'gold',
    description: 'Modelo de linguagem (via OpenRouter) para geração de relatórios explicativos e análises de impacto.',
    url: 'https://openrouter.ai', icon: Globe,
    status: 'checking' as 'online' | 'offline' | 'checking',
    data: ['Explicabilidade do modelo', 'Impactos por setor', 'Ações de prevenção'],
    updateFreq: 'Sob demanda'
  }
])

async function checkSourceStatus(source: typeof sources.value[0]) {
  source.status = 'checking'
  try {
    if (source.id === 'open-meteo') {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-30&longitude=-51&daily=temperature_2m_max&timezone=America%2FSao_Paulo')
      source.status = res.ok ? 'online' : 'offline'
    } else if (source.id === 'openrouter') {
      const res = await fetch('/api/climate-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId: 'porto_alegre', ensoScenario: 'neutro' })
      })
      source.status = res.ok ? 'online' : 'offline'
    } else {
      source.status = 'online'
    }
  } catch {
    source.status = 'offline'
  }
}

async function checkAllStatus() {
  await Promise.all(sources.value.map(checkSourceStatus))
}

onMounted(checkAllStatus)

function getSourceColors(color: string) {
  const map: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: 'bg-blue-500/10 border-blue-500/20', icon: 'text-blue-400', text: 'text-blue-400' },
    amber: { bg: 'bg-amber-500/10 border-amber-500/20', icon: 'text-amber-400', text: 'text-amber-400' },
    red: { bg: 'bg-red-500/10 border-red-500/20', icon: 'text-red-400', text: 'text-red-400' },
    gold: { bg: 'bg-amber-500/10 border-amber-500/20', icon: 'text-gold', text: 'text-gold' },
  }
  return map[color] || map.blue
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-extrabold text-gold-light flex items-center gap-2">
          <Database class="w-6 h-6 text-violet-400" />
          Fontes de Dados
        </h2>
        <p class="text-sm text-slate-500 mt-1">Status e documentação das APIs e fontes utilizadas pelo sistema</p>
      </div>
      <button @click="checkAllStatus"
        class="font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-2"
        style="background: linear-gradient(135deg, #fbbf24, #f97316); color: #0f172a;">
        <RefreshCw class="w-3.5 h-3.5" />
        Verificar Status
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="source in sources" :key="source.id" class="glass-card rounded-2xl p-5 hover-glow">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div :class="['p-2 rounded-xl border', getSourceColors(source.color).bg]">
              <component :is="source.icon" :class="['w-5 h-5', getSourceColors(source.color).icon]" />
            </div>
            <div>
              <h3 class="font-bold text-slate-200 text-sm">{{ source.name }}</h3>
              <a :href="source.url" target="_blank" class="text-[10px] text-amber-400 hover:text-amber-300 hover:underline">{{ source.url }}</a>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <CheckCircle2 v-if="source.status === 'online'" class="w-4 h-4 text-emerald-400" />
            <XCircle v-else-if="source.status === 'offline'" class="w-4 h-4 text-red-400" />
            <RefreshCw v-else class="w-4 h-4 text-slate-500 animate-spin" />
            <span :class="[
              'text-[10px] font-bold uppercase',
              source.status === 'online' ? 'text-emerald-400' :
              source.status === 'offline' ? 'text-red-400' : 'text-slate-500'
            ]">
              {{ source.status === 'online' ? 'Online' : source.status === 'offline' ? 'Offline' : 'Verificando...' }}
            </span>
          </div>
        </div>

        <p class="text-xs text-slate-400 leading-relaxed mb-3">{{ source.description }}</p>

        <div class="space-y-2">
          <div>
            <span class="text-[9px] uppercase font-bold text-slate-600 block mb-1">Dados Coletados</span>
            <div class="flex flex-wrap gap-1">
              <span v-for="(d, i) in source.data" :key="i" class="text-[10px] bg-slate-800/50 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/30">
                {{ d }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 text-[10px] text-slate-600">
            <Clock class="w-3 h-3" />
            Atualização: {{ source.updateFreq }}
          </div>
        </div>
      </div>
    </div>

    <div class="glass-card rounded-2xl p-5">
      <h3 class="font-bold text-slate-200 mb-4">Arquitetura de Coleta de Dados</h3>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
        <div class="rounded-xl p-3 text-center border border-blue-500/20 bg-blue-500/10">
          <CloudRain class="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <span class="text-[10px] font-bold text-blue-400">Open-Meteo</span>
        </div>
        <div class="rounded-xl p-3 text-center border border-amber-500/20 bg-amber-500/10">
          <AlertTriangle class="w-6 h-6 text-amber-400 mx-auto mb-1" />
          <span class="text-[10px] font-bold text-amber-400">INMET</span>
        </div>
        <div class="rounded-xl p-3 text-center border border-red-500/20 bg-red-500/10">
          <Flame class="w-6 h-6 text-red-400 mx-auto mb-1" />
          <span class="text-[10px] font-bold text-red-400">INPE Queimadas</span>
        </div>
        <div class="rounded-xl p-3 text-center border border-amber-500/20 bg-amber-500/10">
          <Globe class="w-6 h-6 text-gold mx-auto mb-1" />
          <span class="text-[10px] font-bold text-gold">OpenRouter AI</span>
        </div>
        <div class="rounded-xl p-3 text-center border border-violet-500/20 bg-violet-500/10">
          <Database class="w-6 h-6 text-violet-400 mx-auto mb-1" />
          <span class="text-[10px] font-bold text-violet-400">Motor de Regras</span>
        </div>
      </div>
      <div class="flex items-center justify-center mt-3">
        <div class="border-t-2 border-dashed border-slate-700 w-full max-w-md"></div>
      </div>
      <div class="flex items-center justify-center mt-1">
        <span class="text-[10px] text-slate-600">Fluxo: Coleta → Consolidação → Classificação → Alerta</span>
      </div>
    </div>
  </div>
</template>
