<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard, Trophy, MapPin, Shield, Database, BookOpen,
  Activity, ChevronLeft, ChevronRight, Globe, Calendar, RefreshCw,
  Zap, AlertTriangle, Monitor, Menu, X
} from 'lucide-vue-next'
import { useClimateRisk } from '../composables/useClimateRisk'

const route = useRoute()
const { ensoScenario } = useClimateRisk()
const isSidebarCollapsed = ref(false)
const isMobileMenuOpen = ref(false)

function navigate() {
  isMobileMenuOpen.value = false
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/crisis-room', label: 'Sala de Crise', icon: Monitor },
  { path: '/ranking', label: 'Ranking de Risco', icon: Trophy },
  { path: '/city', label: 'Detalhe da Cidade', icon: MapPin },
  { path: '/prevention', label: 'Prevenção', icon: Shield },
  { label: 'Seção Técnica', divider: true },
  { path: '/sources', label: 'Fontes de Dados', icon: Database },
  { path: '/methodology', label: 'Metodologia', icon: BookOpen },
]
</script>

<template>
  <div class="min-h-screen bg-[#070b14] text-slate-200 antialiased font-sans flex">
    <!-- Desktop Sidebar (hidden on mobile) -->
    <aside
      :class="[
        'hidden lg:flex sticky top-0 h-screen flex-col transition-all duration-300 z-40 border-r border-slate-800/60',
        isSidebarCollapsed ? 'w-[68px]' : 'w-64'
      ]"
      style="background: linear-gradient(180deg, #0c1222 0%, #0a0f1e 100%)"
    >
      <!-- Logo -->
      <div class="p-4 flex items-center gap-3 border-b border-slate-800/60">
        <div class="p-2 rounded-xl shrink-0 relative" style="background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);">
          <Activity class="w-5 h-5 text-slate-900" />
        </div>
        <div v-if="!isSidebarCollapsed" class="overflow-hidden">
          <h1 class="text-sm font-extrabold tracking-tight leading-tight text-gold">ClimaRisk</h1>
        </div>
      </div>

      <!-- Nav Links -->
      <nav class="flex-1 p-2 space-y-1 overflow-y-auto">
        <template v-for="item in navItems" :key="item.label">
          <div v-if="item.divider" class="pt-3 pb-1 px-2">
            <div v-if="!isSidebarCollapsed" class="text-[9px] uppercase font-bold text-slate-600 tracking-wider">
              {{ item.label }}
            </div>
            <div v-else class="border-t border-slate-800 my-2"></div>
          </div>
          <router-link
            v-else
            :to="item.path"
            :class="[
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
              route.path === item.path
                ? 'text-gold font-bold'
                : 'text-white hover:text-white/80'
            ]"
            :style="route.path === item.path ? 'background: rgba(251, 191, 36, 0.1); border-left: 2px solid #fbbf24;' : ''"
          >
            <component
              :is="item.icon"
              :class="[
                'w-4.5 h-4.5 shrink-0 transition-colors',
                route.path === item.path ? 'text-gold' : 'text-white/50 group-hover:text-white/80'
              ]"
            />
            <span v-if="!isSidebarCollapsed">{{ item.label }}</span>
          </router-link>
        </template>
      </nav>

      <!-- Status Bar -->
      <div v-if="!isSidebarCollapsed" class="p-3 border-t border-slate-800/60 space-y-2">
        <div class="flex items-center gap-2 text-[10px] text-slate-500">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>ENSO: <strong class="text-gold-light">{{ ensoScenario.replace('_', ' ') }}</strong></span>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-slate-500">
          <Calendar class="w-3 h-3" />
          <span>Inverno 2026</span>
        </div>
      </div>

      <!-- Collapse Toggle -->
      <button
        @click="isSidebarCollapsed = !isSidebarCollapsed"
        class="hidden lg:flex p-3 border-t border-slate-800/60 text-slate-600 hover:text-gold transition-colors items-center justify-center"
      >
        <ChevronLeft v-if="!isSidebarCollapsed" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
      </button>
    </aside>

    <!-- Mobile Drawer Overlay -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[100] lg:hidden">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="isMobileMenuOpen = false"></div>
          <aside
            class="absolute left-0 top-0 h-full w-64 max-w-[80vw] flex flex-col z-50 border-r border-slate-800/60"
            style="background: linear-gradient(180deg, #0c1222 0%, #0a0f1e 100%)"
          >
            <div class="p-4 flex items-center gap-3 border-b border-slate-800/60">
              <div class="p-2 rounded-xl shrink-0 relative" style="background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);">
                <Activity class="w-5 h-5 text-slate-900" />
              </div>
              <h1 class="text-sm font-extrabold tracking-tight leading-tight text-gold flex-1">ClimaRisk</h1>
              <button @click="isMobileMenuOpen = false" class="text-slate-400 hover:text-gold">
                <X class="w-5 h-5" />
              </button>
            </div>
            <nav class="flex-1 p-2 space-y-1 overflow-y-auto">
              <template v-for="item in navItems" :key="item.label">
                <div v-if="item.divider" class="pt-3 pb-1 px-2">
                  <div class="text-[9px] uppercase font-bold text-slate-600 tracking-wider">{{ item.label }}</div>
                </div>
                <router-link
                  v-else
                  :to="item.path"
                  @click="navigate"
                  :class="[
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                    route.path === item.path ? 'text-gold font-bold' : 'text-white hover:text-white/80'
                  ]"
                  :style="route.path === item.path ? 'background: rgba(251, 191, 36, 0.1); border-left: 2px solid #fbbf24;' : ''"
                >
                  <component :is="item.icon" :class="['w-4.5 h-4.5 shrink-0', route.path === item.path ? 'text-gold' : 'text-white/50 group-hover:text-white/80']" />
                  <span>{{ item.label }}</span>
                </router-link>
              </template>
            </nav>
            <div class="p-3 border-t border-slate-800/60">
              <div class="flex items-center gap-2 text-[10px] text-slate-500">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>ENSO: <strong class="text-gold-light">{{ ensoScenario.replace('_', ' ') }}</strong></span>
              </div>
            </div>
          </aside>
        </div>
      </transition>
    </Teleport>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-h-screen min-w-0">
      <!-- Top Bar (hidden for crisis room) -->
      <header v-if="!route.meta.hideLayout" class="sticky top-0 z-30 border-b border-slate-800/60 px-4 sm:px-6 py-3 flex items-center justify-between" style="background: rgba(7, 11, 20, 0.85); backdrop-filter: blur(16px);">
        <div class="flex items-center gap-3 min-w-0">
          <button
            @click="isMobileMenuOpen = true"
            class="lg:hidden p-2 -ml-2 rounded-lg text-slate-300 hover:text-gold hover:bg-slate-800/40 transition-colors shrink-0"
            aria-label="Abrir menu"
          >
            <Menu class="w-5 h-5" />
          </button>
          <h2 class="text-base sm:text-lg font-bold text-gold-light truncate">{{ route.meta.title }}</h2>
        </div>
        <div class="hidden sm:flex items-center gap-3 text-xs font-mono px-3 py-1.5 rounded-lg glass-card shrink-0">
          <span class="flex items-center gap-1.5 text-slate-400">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            Open-Meteo
          </span>
          <span class="h-3 w-[1px] bg-slate-700"></span>
          <span class="flex items-center gap-1.5 text-slate-400">
            <Zap class="w-3 h-3 text-gold" />
            OpenRouter AI
          </span>
        </div>
      </header>

      <!-- Page Content -->
      <main :class="['flex-1 w-full min-w-0', route.meta.hideLayout ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 py-6']">
        <router-view />
      </main>

      <!-- Footer (hidden for crisis room) -->
      <footer v-if="!route.meta.hideLayout" class="border-t border-slate-800/60 text-xs py-4 px-4 sm:px-6" style="background: #0a0f1e;">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0">
          <p class="font-semibold text-slate-500">Previsão de Risco Climático Regional - Brasil 2026</p>
          <p class="text-[10px] text-slate-600">Heurísticas meteorológicas + IA explicativa</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
