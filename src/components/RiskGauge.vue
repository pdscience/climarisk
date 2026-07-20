<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number
  level: string
  label: string
  icon?: any
}>()

const barColor = computed(() => {
  if (props.level === "Crítico") return "bg-red-500"
  if (props.level === "Alto") return "bg-orange-500"
  if (props.level === "Médio") return "bg-yellow-400"
  return "bg-emerald-500"
})

const dotColor = computed(() => {
  if (props.level === "Crítico") return "bg-red-500"
  if (props.level === "Alto") return "bg-orange-500"
  if (props.level === "Médio") return "bg-yellow-400"
  return "bg-emerald-500"
})

const textColor = computed(() => {
  if (props.level === "Crítico") return "text-red-400"
  if (props.level === "Alto") return "text-orange-400"
  if (props.level === "Médio") return "text-yellow-400"
  return "text-emerald-400"
})

const glowStyle = computed(() => {
  if (props.level === "Crítico") return 'box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);'
  if (props.level === "Alto") return 'box-shadow: 0 0 8px rgba(249, 115, 22, 0.4);'
  if (props.level === "Médio") return 'box-shadow: 0 0 8px rgba(250, 204, 21, 0.3);'
  return ''
})
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex justify-between items-center text-xs">
      <span class="font-bold text-slate-300 flex items-center gap-1.5">
        <slot name="icon" />
        {{ label }}
      </span>
      <span class="font-mono text-[11px] bg-slate-900/50 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/40 flex items-center gap-1">
        {{ score }}%
        <strong :class="['w-1.5 h-1.5 rounded-full inline-block', dotColor]" :style="glowStyle"></strong>
      </span>
    </div>
    <div class="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden">
      <div
        :class="['h-full rounded-full transition-all duration-700 ease-out', barColor]"
        :style="{ width: `${score}%`, ...glowStyle ? { boxShadow: `0 0 8px ${level === 'Crítico' ? 'rgba(239,68,68,0.5)' : level === 'Alto' ? 'rgba(249,115,22,0.5)' : level === 'Médio' ? 'rgba(250,204,21,0.4)' : 'rgba(16,185,129,0.3)'}` } : {} }"
      />
    </div>
    <div :class="['text-[10px] font-bold uppercase tracking-wider', textColor]">
      Risco: {{ level }}
    </div>
  </div>
</template>
