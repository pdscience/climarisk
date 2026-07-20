<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { LMap, LTileLayer, LPopup, LPolygon, LMarker } from '@vue-leaflet/vue-leaflet'
import { CITIES, useClimateRisk } from '../composables/useClimateRisk'
import type { City } from '../types'
import * as L from 'leaflet'

const props = withDefaults(defineProps<{
  mapHeight?: string
}>(), {
  mapHeight: 'h-[720px]',
})

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const { selectedCityId, ensoScenario, riskData, allRisks, isLoadingMap, loadAllRisks } = useClimateRisk()
const router = useRouter()

const emit = defineEmits<{
  (e: 'select-region', region: "Sul" | "Norte" | "Nordeste" | "Sudeste" | "Centro-Oeste"): void
}>()

const mapZoom = ref(4)
const mapCenter = ref<[number, number]>([-14.235, -51.925])
const activeLayer = ref("light")
const showLayerSelector = ref(false)

// Custom div icons (pin for cities, flame for fire hotspots)
function cityIcon(color: string, selected: boolean): any {
  const size = selected ? 38 : 30
  return L.divIcon({
    className: 'city-pin',
    html: `<div style="width:${size}px;height:${size}px;">
      <svg viewBox="0 0 24 24" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.5));">
        <path d="M12 2C7.6 2 4 5.6 4 10c0 5.2 6.1 11 7.3 12.2.6.5 1.5.5 2.1 0C14.6 21 20 15.2 20 10c0-4.4-3.6-8-8-8z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
        <circle cx="12" cy="10" r="3" fill="#fff"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  })
}

function fireIcon(): any {
  return L.divIcon({
    className: 'fire-pin',
    html: `<div style="width:26px;height:26px;">
      <svg viewBox="0 0 24 24" width="26" height="26" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.5));">
        <path d="M12 2c0 3-4 4-4 8a4 4 0 0 0 8 0c0-1.5-1-2.5-1.5-3.5C16 8 17 10 17 12a5 5 0 0 1-10 0c0-4 5-6 5-10z" fill="#f97316" stroke="#fff" stroke-width="1"/>
        <path d="M12 9c0 2-2 2.5-2 4.5a2 2 0 0 0 4 0c0-1-.8-1.6-.8-2.3C14 12.5 13 11.5 13 9z" fill="#fbbf24"/>
      </svg>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  })
}

const mapLayers: Record<string, { name: string; url: string; attribution: string }> = {
  dark: {
    name: "Escuro",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
  },
  light: {
    name: "Claro",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    name: "Satélite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
  },
  terrain: {
    name: "Terreno",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
  }
}

const regions = [
  { name: "Norte" as const, polygon: [[2.0, -70.0], [2.0, -46.0], [-13.0, -46.0], [-13.0, -70.0]] as [number, number][] },
  { name: "Nordeste" as const, polygon: [[-2.0, -46.0], [-2.0, -34.0], [-18.0, -34.0], [-18.0, -46.0]] as [number, number][] },
  { name: "Sudeste" as const, polygon: [[-14.0, -54.0], [-14.0, -39.0], [-25.0, -39.0], [-25.0, -54.0]] as [number, number][] },
  { name: "Centro-Oeste" as const, polygon: [[-8.0, -62.0], [-8.0, -46.0], [-24.0, -46.0], [-24.0, -62.0]] as [number, number][] },
  { name: "Sul" as const, polygon: [[-22.0, -58.0], [-22.0, -48.0], [-34.0, -48.0], [-34.0, -58.0]] as [number, number][] }
]

type RegionName = "Sul" | "Norte" | "Nordeste" | "Sudeste" | "Centro-Oeste"

const currentCity = computed(() => CITIES.find(c => c.id === selectedCityId.value) || CITIES[0])

// Real risk per city from the bulk endpoint (paints the whole map)
function cityRisk(cityId: string): string {
  const c = allRisks.value?.cities?.[cityId]
  if (c) return c.overall
  if (riskData.value && cityId === selectedCityId.value) return riskData.value.risks.overall
  return "Baixo"
}

function getRegionRisk(region: RegionName) {
  const citiesInRegion = CITIES.filter(c => c.region === region)
  const levels = ["Crítico", "Alto", "Médio", "Baixo"]
  for (const lvl of levels) {
    if (citiesInRegion.some(c => cityRisk(c.id) === lvl)) return lvl
  }
  return "Baixo"
}

function getRegionColor(region: RegionName) {
  const risk = getRegionRisk(region)
  if (risk === "Crítico") return "#ef4444"
  if (risk === "Alto") return "#f97316"
  if (risk === "Médio") return "#eab308"
  return "#10b981"
}

function getColor(level: string) {
  if (level === "Crítico") return "#ef4444"
  if (level === "Alto") return "#f97316"
  if (level === "Médio") return "#eab308"
  return "#10b981"
}

// Fire hotspots from ALL cities (INPE) for the map
const fireHotspots = computed<Array<{ lat: number; lon: number; date: string }>>(() => {
  const pts: Array<{ lat: number; lon: number; date: string }> = []
  const map = allRisks.value?.firePoints
  if (map) {
    for (const id in map) pts.push(...map[id])
  }
  if (riskData.value?.weather.firmsHotspots?.points) {
    pts.push(...riskData.value.weather.firmsHotspots.points)
  }
  return pts.slice(0, 200)
})

const totalFireCount = computed(() => fireHotspots.value.length)

function getMarkerColor(city: City) {
  if (city.id === selectedCityId.value) return "#fbbf24"
  return getColor(cityRisk(city.id))
}

function getMarkerRadius(city: City) {
  if (city.id === selectedCityId.value) return 11
  const r = cityRisk(city.id)
  if (r === "Crítico") return 9
  if (r === "Alto") return 8
  if (r === "Médio") return 7
  return 6
}

function selectCity(cityId: string) {
  selectedCityId.value = cityId
}

function analyzeCity(cityId: string) {
  selectedCityId.value = cityId
  router.push(`/city/${cityId}`)
}

function selectRegion(region: RegionName) {
  emit('select-region', region)
}

// Load bulk risks on mount and whenever ENSO changes
onMounted(() => {
  loadAllRisks()
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (showLayerSelector.value && !target.closest('.layer-selector-wrap') && !target.closest('.layer-dropdown')) {
      showLayerSelector.value = false
    }
  })
})
watch(ensoScenario, (val) => loadAllRisks(val))
</script>

<template>
  <div :class="['glass-card rounded-2xl', mapHeight === 'h-full' ? 'h-full flex flex-col overflow-hidden' : 'overflow-visible']">
    <div class="p-4 border-b border-slate-800/60 flex justify-between items-start shrink-0" style="border-radius: 1rem 1rem 0 0;">
      <div>
        <h3 class="font-extrabold text-slate-200 text-sm gold-glow">Mapa de Riscos Operacionais</h3>
        <p class="text-xs text-slate-500">Clique nos marcadores ou regiões para detalhes</p>
      </div>
      <div class="flex items-center gap-2 relative layer-selector-wrap">
        <button
          @click="showLayerSelector = !showLayerSelector"
          class="text-xs uppercase font-mono font-semibold px-2 py-1 rounded-md border border-slate-700/40 bg-slate-900/30 text-slate-400 hover:text-gold transition-colors flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          {{ mapLayers[activeLayer].name }}
        </button>
        <teleport to="body">
          <div v-if="showLayerSelector"
            class="fixed glass-card rounded-xl shadow-2xl border border-slate-700/60 overflow-hidden min-w-[140px] layer-dropdown"
            style="top: 180px; right: 24px; z-index: 9999;"
          >
            <button v-for="(layer, key) in mapLayers" :key="key"
              @click="activeLayer = key; showLayerSelector = false"
              :class="[
                'w-full text-left px-3 py-2 text-sm font-semibold transition-colors border-b border-slate-800/40 last:border-0',
                activeLayer === key ? 'text-gold bg-amber-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              ]"
            >
              {{ layer.name }}
            </button>
          </div>
        </teleport>
      </div>
    </div>

    <div :class="[mapHeight === 'h-full' ? 'flex-1' : mapHeight, 'relative']">
      <LMap
        :zoom="mapZoom"
        :center="mapCenter"
        :use-global-leaflet="false"
        :options="{ scrollWheelZoom: true, zoomControl: true }"
        class="h-full w-full"
      >
        <LTileLayer
          :key="activeLayer"
          :url="mapLayers[activeLayer].url"
          :attribution="mapLayers[activeLayer].attribution"
          layer-type="base"
        />

        <!-- Region Polygons -->
        <LPolygon
          v-for="region in regions"
          :key="region.name"
          :lat-lngs="region.polygon"
          :color="getRegionColor(region.name)"
          :fill-color="getRegionColor(region.name)"
          :fill-opacity="currentCity.region === region.name ? 0.3 : 0.12"
          :weight="currentCity.region === region.name ? 3 : 1"
          @click="selectRegion(region.name)"
        >
          <LPopup>
            <div class="text-xs font-bold text-slate-900">
              Região {{ region.name }} — Risco: {{ getRegionRisk(region.name) }}
            </div>
          </LPopup>
        </LPolygon>

        <!-- Fire Hotspots -->
        <LMarker
          v-for="(hotspot, i) in fireHotspots"
          :key="`fire-${i}`"
          :lat-lng="[hotspot.lat, hotspot.lon]"
          :icon="fireIcon()"
        >
          <LPopup>
            <div class="text-xs space-y-1 min-w-[140px]">
              <div class="font-bold text-red-600">🔥 Foco de Calor</div>
              <div class="text-slate-600">Lat: {{ hotspot.lat.toFixed(2) }}</div>
              <div class="text-slate-600">Lon: {{ hotspot.lon.toFixed(2) }}</div>
              <div class="text-slate-500">{{ hotspot.date }}</div>
            </div>
          </LPopup>
        </LMarker>

        <!-- City Markers as Pins (colored by REAL risk) -->
        <LMarker
          v-for="city in CITIES"
          :key="city.id"
          :lat-lng="[city.lat, city.lon]"
          :icon="cityIcon(getMarkerColor(city), city.id === selectedCityId)"
          @click="selectCity(city.id)"
        >
          <LPopup>
            <div class="text-xs space-y-1 min-w-[170px]">
              <div class="font-bold text-slate-900">{{ city.name }} ({{ city.state }})</div>
              <div class="text-slate-500">Região: {{ city.region }}</div>
              <div class="flex items-center gap-1.5 mt-1">
                <span class="w-2.5 h-2.5 rounded-full inline-block" :style="{ background: getColor(cityRisk(city.id)) }"></span>
                <span class="font-bold" :style="{ color: getColor(cityRisk(city.id)) }">Risco: {{ cityRisk(city.id) }}</span>
              </div>
              <div v-if="allRisks?.cities?.[city.id]" class="text-slate-500">
                {{ allRisks.cities[city.id].weather.precipitation72h }}mm · {{ allRisks.cities[city.id].weather.maxTemp }}°C
              </div>
              <div class="text-slate-500">Temp Média: {{ city.historic_temp_avg }}°C</div>
              <button
                @click="analyzeCity(city.id)"
                class="mt-1 w-full text-white text-[10px] font-bold py-1 px-2 rounded-lg transition"
                style="background: linear-gradient(135deg, #fbbf24, #f97316);"
              >
                Analisar esta cidade
              </button>
            </div>
          </LPopup>
        </LMarker>
      </LMap>

      <!-- Legend Overlay -->
      <div class="absolute bottom-3 left-3 z-[1000] rounded-xl p-3 shadow-lg" style="background: rgba(7, 11, 20, 0.9); backdrop-filter: blur(12px); border: 1px solid rgba(51, 65, 85, 0.5);">
        <div class="text-[9px] font-bold text-slate-500 uppercase mb-1.5">Legenda de Risco</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span class="text-slate-400">Baixo</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
            <span class="text-slate-400">Médio</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
            <span class="text-slate-400">Alto</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
            <span class="text-slate-400">Crítico</span>
          </div>
          <div class="flex items-center gap-1.5 col-span-2 mt-1 pt-1 border-t border-slate-800">
            <span class="w-3 h-3 rounded-full bg-red-500 inline-block animate-pulse"></span>
            <span class="text-slate-400">🔥 Foco de Fogo</span>
          </div>
        </div>
        <div class="mt-2 pt-2 border-t border-slate-800 text-[9px] text-white">
          Marcadores = cidades | Polígonos = regiões
        </div>
      </div>

      <!-- Loading overlay -->
      <div
        v-if="isLoadingMap"
        class="absolute inset-0 z-[1000] flex items-center justify-center rounded-2xl"
        style="background: rgba(7, 11, 20, 0.7); backdrop-filter: blur(4px);"
      >
        <div class="flex flex-col items-center gap-2 text-amber-400/80">
          <span class="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></span>
          <span class="text-[10px] font-bold">Calculando riscos reais…</span>
        </div>
      </div>

      <!-- Fire count badge -->
      <div
        v-if="totalFireCount > 0"
        class="absolute bottom-3 right-3 z-[1000] rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg"
        style="background: rgba(239, 68, 68, 0.15); backdrop-filter: blur(12px); border: 1px solid rgba(239, 68, 68, 0.3);"
      >
        <span class="text-lg">🔥</span>
        <span class="text-sm font-bold text-red-400">{{ totalFireCount }} focos ativos</span>
      </div>
    </div>
  </div>
</template>
