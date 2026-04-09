import { createRouter, createWebHistory } from '@ionic/vue-router'
import { useAuthStore } from '@shared/stores/auth.js'

const routes = [
  { path: '/',         redirect: '/tabs/feed' },
  { path: '/login',    component: () => import('../pages/LoginPage.vue') },
  { path: '/register', component: () => import('../pages/RegisterPage.vue') },
  {
    path:      '/tabs/',
    component: () => import('../pages/TabsPage.vue'),
    meta:      { requiresAuth: true },
    children: [
      { path: 'feed',    component: () => import('../pages/FeedPage.vue')        },
      { path: 'explore', component: () => import('../pages/ExplorePage.vue')     },
      { path: 'create',  component: () => import('../pages/CreatePostPage.vue')  },
      { path: 'adopt',   component: () => import('../pages/AdoptBrowsePage.vue') },
      { path: 'events',  component: () => import('../pages/EventsPage.vue')      },
      { path: 'profile', component: () => import('../pages/ProfilePage.vue')     },
    ]
  },
  { path: '/posts/:id',            component: () => import('../pages/PostDetailPage.vue'), meta: { requiresAuth: true } },
  { path: '/adopt/:id',            component: () => import('../pages/AdoptDetailPage.vue'), meta: { requiresAuth: true } },
  { path: '/events/:id',           component: () => import('../pages/EventDetailPage.vue') },
  { path: '/profile/:id',          component: () => import('../pages/ProfilePage.vue'),    meta: { requiresAuth: true } },
  { path: '/shelter/listings',     component: () => import('../pages/ShelterListingsPage.vue'), meta: { requiresAuth: true, roles: ['shelter_staff', 'admin'] } },
  { path: '/shelter/applications', component: () => import('../pages/ShelterApplicationsPage.vue'), meta: { requiresAuth: true, roles: ['shelter_staff', 'admin'] } },
  { path: '/my-pets/:id/health',   component: () => import('../pages/HealthPage.vue'),      meta: { requiresAuth: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()
  if (!auth.token) await auth.init()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return next('/login')
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) return next('/tabs/feed')
  next()
})

export default router
