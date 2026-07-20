import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../pages/DashboardView.vue'),
      meta: { title: 'Dashboard', icon: 'LayoutDashboard' }
    },
    {
      path: '/ranking',
      name: 'ranking',
      component: () => import('../pages/RankingView.vue'),
      meta: { title: 'Ranking de Risco', icon: 'Trophy' }
    },
    {
      path: '/city/:id?',
      name: 'city',
      component: () => import('../pages/CityDetailView.vue'),
      meta: { title: 'Detalhe da Cidade', icon: 'MapPin' }
    },
    {
      path: '/prevention',
      name: 'prevention',
      component: () => import('../pages/PreventionView.vue'),
      meta: { title: 'Prevenção', icon: 'Shield' }
    },
    {
      path: '/sources',
      name: 'sources',
      component: () => import('../pages/DataSourcesView.vue'),
      meta: { title: 'Fontes de Dados', icon: 'Database' }
    },
    {
      path: '/methodology',
      name: 'methodology',
      component: () => import('../pages/MethodologyView.vue'),
      meta: { title: 'Metodologia', icon: 'BookOpen' }
    },
    {
      path: '/crisis-room',
      name: 'crisis-room',
      component: () => import('../pages/CrisisRoomView.vue'),
      meta: { title: 'Sala de Crise', hideLayout: true }
    }
  ]
})

export default router
