<script setup lang="ts">
import { BookOpen, Cpu, Layers, Target, AlertTriangle, BarChart3, Shield, Lightbulb } from 'lucide-vue-next'
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-extrabold text-gold-light flex items-center gap-2">
        <BookOpen class="w-6 h-6 text-violet-400" />
        Metodologia do Sistema
      </h2>
      <p class="text-sm text-slate-500 mt-1">Como o ClimaRisk calcula probabilidades e gera alertas</p>
    </div>

    <!-- 5 Layers -->
    <div class="glass-card rounded-2xl p-5">
      <h3 class="font-bold text-slate-200 flex items-center gap-2 mb-4">
        <Layers class="w-5 h-5 text-gold" />
        As 5 Camadas da Arquitetura
      </h3>
      <div class="space-y-4">
        <div v-for="(layer, i) in [
          { num: '1', title: 'Coleta de Dados', desc: 'Previsão meteorológica (Open-Meteo), alertas oficiais (INMET), indicadores oceânicos (ENSO) e focos de calor (INPE Queimadas). Dados em tempo real ou quasi-real-time.', color: 'border-blue-500/20 bg-blue-500/5' },
          { num: '2', title: 'Motor de Regras', desc: 'Heurísticas climatológicas por fenômeno. Cada variável (temperatura, chuva, solo, ENSO) contribui com pesos calibrados para a probabilidade de cada risco.', color: 'border-amber-500/20 bg-amber-500/5' },
          { num: '3', title: 'Modelo Preditivo', desc: 'Classificação de risco por região (Sul, Norte, Nordeste) baseada na combinação das probabilidades. Cada classe de risco gera um score de 0 a 100%.', color: 'border-emerald-500/20 bg-emerald-500/5' },
          { num: '4', title: 'Camada de Prevenção', desc: 'Ações automáticas sugeridas por tipo de risco e destinatário (Defesa Civil, produtores, população). Protocolos baseados em boas práticas de gestão de riscos.', color: 'border-violet-500/20 bg-violet-500/5' },
          { num: '5', title: 'Painel e Alertas', desc: 'Dashboard interativo com mapa, ranking de cidades, detalhes por município e notificações via WhatsApp/Telegram/SMS/Email.', color: 'border-rose-500/20 bg-rose-500/5' }
        ]" :key="i" :class="['rounded-xl border p-4 flex items-start gap-4', layer.color]">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-slate-900 font-extrabold text-sm"
            style="background: linear-gradient(135deg, #fbbf24, #f97316);">
            {{ layer.num }}
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-200">{{ layer.title }}</h4>
            <p class="text-xs text-slate-400 leading-relaxed mt-1">{{ layer.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Rules Engine Detail -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="glass-card rounded-2xl p-5">
        <h3 class="font-bold text-slate-200 flex items-center gap-2 mb-4">
          <Cpu class="w-5 h-5 text-emerald-400" />
          Motor de Regras - Fórmulas
        </h3>
        <div class="space-y-4 text-xs text-slate-400 leading-relaxed">
          <div class="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <span class="font-bold text-blue-400 block mb-1">Chuva Extrema</span>
            <code class="text-[10px] font-mono text-slate-500">prob = (precipitação/100) × 50 + umidadeSolo × 0.4</code>
            <p class="mt-1 text-slate-500">+ ENSO regional + alerta INMET</p>
          </div>
          <div class="p-3 rounded-xl border border-orange-500/20 bg-orange-500/5">
            <span class="font-bold text-orange-400 block mb-1">Seca</span>
            <code class="text-[10px] font-mono text-slate-500">prob = ((tempMax-15)/25) × 45 + ((100-umidadeSolo) × 0.45)</code>
            <p class="mt-1 text-slate-500">+ ENSO regional + focos INPE Queimadas</p>
          </div>
          <div class="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
            <span class="font-bold text-red-400 block mb-1">Onda de Calor</span>
            <code class="text-[10px] font-mono text-slate-500">prob = (tempMax-30) × 8 (se tempMax > 32°C)</code>
            <p class="mt-1 text-slate-500">+ El Niño (+15) + alerta INMET</p>
          </div>
          <div class="p-3 rounded-xl border border-sky-500/20 bg-sky-500/5">
            <span class="font-bold text-sky-400 block mb-1">Frio Extremo</span>
            <code class="text-[10px] font-mono text-slate-500">prob = (15-tempMin) × 7 (região Sul)</code>
            <p class="mt-1 text-slate-500">+ La Niña (+15) / máx 20% fora do Sul</p>
          </div>
        </div>
      </div>

      <div class="glass-card rounded-2xl p-5">
        <h3 class="font-bold text-slate-200 flex items-center gap-2 mb-4">
          <BarChart3 class="w-5 h-5 text-amber-400" />
          Classificação de Severidade
        </h3>
        <div class="space-y-3">
          <div v-for="(level, i) in [
            { range: '0% - 24%', label: 'Baixo', color: 'bg-emerald-500', textColor: 'text-emerald-400', desc: 'Condições normais, monitoramento de rotina.' },
            { range: '25% - 49%', label: 'Médio', color: 'bg-yellow-400', textColor: 'text-yellow-400', desc: 'Desvios da média, atenção preventiva.' },
            { range: '50% - 74%', label: 'Alto', color: 'bg-orange-500', textColor: 'text-orange-400', desc: 'Condições adversas, acionar protocolos.' },
            { range: '75% - 100%', label: 'Crítico', color: 'bg-red-500', textColor: 'text-red-400', desc: 'Emergência, evacuação e mitigação imediata.' }
          ]" :key="i" class="flex items-center gap-3 p-3 rounded-xl border border-slate-800/40 bg-slate-900/20">
            <span :class="['w-3 h-3 rounded-full shrink-0', level.color]"></span>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span :class="['font-bold text-sm', level.textColor]">{{ level.label }}</span>
                <span class="text-[10px] font-mono text-slate-600">{{ level.range }}</span>
              </div>
              <p class="text-[11px] text-slate-500">{{ level.desc }}</p>
            </div>
          </div>
        </div>

        <div class="mt-4 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <span class="text-[10px] uppercase font-bold text-amber-400 block mb-1">Regra do Risco Geral</span>
          <p class="text-xs text-slate-400">
            O <strong class="text-slate-300">risco geral</strong> do município é determinado pelo <strong class="text-slate-300">maior score</strong> entre os 4 fenômenos.
            Se qualquer probabilidade ultrapassar 80%, o risco geral é <strong class="text-red-400">Crítico</strong>.
          </p>
        </div>
      </div>
    </div>

    <!-- ENSO Explanation -->
    <div class="glass-card rounded-2xl p-5">
      <h3 class="font-bold text-slate-200 flex items-center gap-2 mb-4">
        <Target class="w-5 h-5 text-violet-400" />
        O Fenômeno ENSO e seu Impacto no Brasil
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
          <h4 class="font-bold text-amber-400 text-sm mb-2">El Niño</h4>
          <ul class="space-y-1 text-xs text-slate-400">
            <li class="flex items-start gap-1"><span class="text-amber-500">•</span> <strong class="text-slate-300">Sul:</strong> Chuvas acima da média, risco de alagamento</li>
            <li class="flex items-start gap-1"><span class="text-amber-500">•</span> <strong class="text-slate-300">Norte/Nordeste:</strong> Seca e calor mais intenso</li>
            <li class="flex items-start gap-1"><span class="text-amber-500">•</span> <strong class="text-slate-300">Nacional:</strong> Temperaturas acima da média</li>
          </ul>
        </div>
        <div class="rounded-xl p-4 border border-blue-500/20 bg-blue-500/5">
          <h4 class="font-bold text-blue-400 text-sm mb-2">La Niña</h4>
          <ul class="space-y-1 text-xs text-slate-400">
            <li class="flex items-start gap-1"><span class="text-blue-500">•</span> <strong class="text-slate-300">Sul:</strong> Seca relativa, menor volume de chuvas</li>
            <li class="flex items-start gap-1"><span class="text-blue-500">•</span> <strong class="text-slate-300">Norte/Nordeste:</strong> Chuvas normais a acima</li>
            <li class="flex items-start gap-1"><span class="text-blue-500">•</span> <strong class="text-slate-300">Sul:</strong> Frio mais intenso com frentes frias</li>
          </ul>
        </div>
        <div class="rounded-xl p-4 border border-slate-700/30 bg-slate-900/20">
          <h4 class="font-bold text-slate-400 text-sm mb-2">Neutro</h4>
          <ul class="space-y-1 text-xs text-slate-400">
            <li class="flex items-start gap-1"><span class="text-slate-600">•</span> Padrão climatológico normal para a estação</li>
            <li class="flex items-start gap-1"><span class="text-slate-600">•</span> Sem anomalias significativas no Pacífico</li>
            <li class="flex items-start gap-1"><span class="text-slate-600">•</span> Riscos baseados em condições locais</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Why not a crystal ball -->
    <div class="rounded-2xl p-5 border border-violet-500/20" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(168, 85, 247, 0.05));">
      <div class="flex items-start gap-3">
        <Lightbulb class="w-6 h-6 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <h3 class="font-bold text-violet-300 text-sm mb-1">Por que "Probabilidade" e não "Previsão Exata"?</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            O sistema não é um oráculo — ele estima <strong class="text-slate-300">probabilidade e severidade</strong> baseado em indicadores climáticos.
            Isso já é suficiente para prevenção: se a probabilidade de alagamento é alta, ações preventivas podem salvar vidas.
            O modelo combina dados em tempo real com heurísticas climatológicas validadas para gerar alertas acionáveis.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
