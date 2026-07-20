<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Shield, CloudRain, Droplets, Flame, ThermometerSnowflake, Wind, Mountain, Users, AlertTriangle, BellRing } from 'lucide-vue-next'
import { useClimateRisk } from '../composables/useClimateRisk'

const { riskData, currentCity, runAssessment } = useClimateRisk()

onMounted(() => { if (!riskData.value) runAssessment(true) })

const riskCategories = computed(() => {
  if (!riskData.value) return []
  const r = riskData.value.risks
  return [
    {
      name: 'Chuva Extrema & Alagamento', icon: CloudRain, color: 'blue',
      level: r.chuvaExtrema.level, score: r.chuvaExtrema.score,
      conditions: ['Chuva acumulada acima de 100mm em 72h', 'Solo saturado (>80%) reduz infiltração', 'Alerta INMET amarelo/laranja/vermelho ativo', 'El Niño potencializa frentes frias no Sul'],
      affectedAreas: ['Várzeas de rios', 'Encostas íngremes', 'Áreas urbanas sem drenagem', 'Bairros de baixo']
    },
    {
      name: 'Seca & Déficit Hídrico', icon: Droplets, color: 'orange',
      level: r.seca.level, score: r.seca.score,
      conditions: ['Precipitação abaixo da média histórica', 'Umidade do solo < 30%', 'Temperatura máxima > 33°C', 'Focos de calor (INPE Queimadas) detectados'],
      affectedAreas: ['Reservatórios hidrelétricos', 'Lavouras irrigadas', 'Florestas estacionais', 'Comunidades rurais']
    },
    {
      name: 'Onda de Calor', icon: Flame, color: 'red',
      level: r.ondaCalor.level, score: r.ondaCalor.score,
      conditions: ['Temperatura máxima > 32°C', 'El Niño favorece anomalias térmicas', 'Alerta INMET laranja/vermelho', 'Baixa umidade relativa do ar'],
      affectedAreas: ['População de rua', 'Trabalhadores ao ar livre', 'Idosos e crianças', 'Animais de estimação']
    },
    {
      name: 'Frio Extremo & Geada', icon: ThermometerSnowflake, color: 'sky',
      level: r.frio.level, score: r.frio.score,
      conditions: ['Temperatura mínima < 10°C (região Sul)', 'La Niña intensifica frentes frias', 'Vazantes de rios e vales', 'Noites de céu limpo e vento fraco'],
      affectedAreas: ['Hortaliças sensíveis', 'Pessoas em situação de rua', 'Animais de criação', 'Infraestrutura de água']
    },
    {
      name: 'Ventos Fortes & Rajadas', icon: Wind, color: 'sky',
      level: r.ventoForte.level, score: r.ventoForte.score,
      conditions: ['Rajadas acima de 50 km/h nas próximas horas', 'Ciclones extratropicais no Sul do Brasil', 'Sistemas convectivos severos no Sudeste', 'Frente fria intensa associada a ventania'],
      affectedAreas: ['Áreas urbanas com arborização densa', 'Regiões costeiras e portuárias', 'Infraestrutura elétrica e de telecomunicações', 'Edificações temporárias e tapumes']
    },
    {
      name: 'Deslizamento de Encostas', icon: Mountain, color: 'amber',
      level: r.deslizamento.level, score: r.deslizamento.score,
      conditions: ['Chuva acumulada acima de 80mm em 72h', 'Solo saturado (>70%) reduz coesão do terreno', 'Região de serra ou encosta urbanizada (Sudeste/Sul)', 'Alerta INMET laranja/vermelho para tempestade'],
      affectedAreas: ['Encostas e morros ocupados', 'Vias em serras e taludes', 'Comunidades de baixa renda em áreas íngremes', 'Infraestrutura de drenagem pluvial']
    }
  ]
})

function getColorClasses(color: string) {
  const map: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: 'text-blue-400' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: 'text-orange-400' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: 'text-red-400' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', icon: 'text-sky-400' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', icon: 'text-cyan-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: 'text-amber-400' }
  }
  return map[color] || map.blue
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-extrabold text-white flex items-center gap-2">
        <Shield class="w-6 h-6 text-emerald-400" />
        Plano de Prevenção Automatizado
      </h2>
      <p class="text-sm text-white mt-1">
        Ações estruturadas por tipo de risco para <strong class="text-white">{{ currentCity.name }} - {{ currentCity.state }}</strong>
      </p>
    </div>

    <div v-if="riskData" class="rounded-2xl p-5 shadow-lg" style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(249, 115, 22, 0.1)); border: 1px solid rgba(251, 191, 36, 0.2);">
      <div class="flex items-center gap-3 mb-3">
        <BellRing class="w-6 h-6 text-white" />
        <h3 class="font-bold text-lg text-white">Status de Alerta Ativo</h3>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div class="rounded-xl p-3 bg-slate-900/40 border border-slate-800/40">
          <span class="text-sm uppercase font-bold text-white block">Chuva</span>
          <span class="text-lg font-extrabold text-blue-400">{{ riskData.risks.chuvaExtrema.level }}</span>
        </div>
        <div class="rounded-xl p-3 bg-slate-900/40 border border-slate-800/40">
          <span class="text-sm uppercase font-bold text-white block">Seca</span>
          <span class="text-lg font-extrabold text-orange-400">{{ riskData.risks.seca.level }}</span>
        </div>
        <div class="rounded-xl p-3 bg-slate-900/40 border border-slate-800/40">
          <span class="text-sm uppercase font-bold text-white block">Calor</span>
          <span class="text-lg font-extrabold text-red-400">{{ riskData.risks.ondaCalor.level }}</span>
        </div>
        <div class="rounded-xl p-3 bg-slate-900/40 border border-slate-800/40">
          <span class="text-sm uppercase font-bold text-white block">Frio</span>
          <span class="text-lg font-extrabold text-sky-400">{{ riskData.risks.frio.level }}</span>
        </div>
        <div class="rounded-xl p-3 bg-slate-900/40 border border-slate-800/40">
          <span class="text-sm uppercase font-bold text-white block">Vento</span>
          <span class="text-lg font-extrabold text-cyan-400">{{ riskData.risks.ventoForte.level }}</span>
        </div>
        <div class="rounded-xl p-3 bg-slate-900/40 border border-slate-800/40">
          <span class="text-sm uppercase font-bold text-white block">Deslize</span>
          <span class="text-lg font-extrabold text-amber-400">{{ riskData.risks.deslizamento.level }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="cat in riskCategories" :key="cat.name"
        :class="['rounded-2xl border p-5 transition-all duration-300 hover-glow', getColorClasses(cat.color).bg, getColorClasses(cat.color).border]">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <component :is="cat.icon" :class="['w-5 h-5', getColorClasses(cat.color).icon]" />
            <h3 :class="['font-bold', getColorClasses(cat.color).text]">{{ cat.name }}</h3>
          </div>
          <span class="text-xs font-mono font-bold bg-slate-900/40 text-white px-2 py-0.5 rounded-full border border-slate-800/40">
            {{ cat.score }}%
          </span>
        </div>
        <div class="mb-4">
          <h4 class="text-sm uppercase font-bold text-white mb-2">Condições de Ativação</h4>
          <ul class="space-y-1">
            <li v-for="(cond, i) in cat.conditions" :key="i" class="text-xs text-white flex items-start gap-1.5">
              <AlertTriangle class="w-3 h-3 text-white shrink-0 mt-0.5" />
              {{ cond }}
            </li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm uppercase font-bold text-white mb-2">Áreas Mais Afetadas</h4>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="(area, i) in cat.affectedAreas" :key="i" class="text-sm font-semibold bg-slate-900/40 text-white px-2 py-0.5 rounded-full border border-slate-800/40">
              {{ area }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="glass-card rounded-2xl p-5">
      <h3 class="font-bold text-white flex items-center gap-2 mb-4">
        <AlertTriangle class="w-5 h-5 text-amber-400" />
        Protocolo de Acionamento Automático
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div v-for="(step, i) in [
          { num: '01', title: 'Detecção', desc: 'Monitoramento contínuo de indicadores ENSO, INMET e INPE Queimadas' },
          { num: '02', title: 'Classificação', desc: 'Motor de regras calcula probabilidade por fenômeno' },
          { num: '03', title: 'Alerta', desc: 'Notificação automática para Defesa Civil e gestores' },
          { num: '04', title: 'Ação', desc: 'Execução de protocolos de mitigação preventivos' }
        ]" :key="i" class="text-center">
          <div class="w-10 h-10 rounded-full font-extrabold text-sm flex items-center justify-center mx-auto mb-2 text-white"
            style="background: linear-gradient(135deg, #fbbf24, #f97316);">
            {{ step.num }}
          </div>
          <h4 class="text-sm font-bold text-white">{{ step.title }}</h4>
          <p class="text-sm text-white mt-1">{{ step.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
