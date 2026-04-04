import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth.js'

const routes = [
  // Public
  { path: '/login',    component: () => import('../pages/LoginPage.vue') },
  { path: '/register', component: () => import('../pages/RegisterPage.vue') },
  { path: '/explore',  redirect: '/feed' },
  { path: '/pets/:id', component: () => import('../pages/PetDetailPage.vue') },

  // Auth required (owner+)
  {
    path: '/',
    component: () => import('../layouts/SidebarLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '',       redirect: '/feed' },
      { path: 'feed',   component: () => import('../pages/FeedPage.vue') },
      { path: 'posts/:id', component: () => import('../pages/PostDetailPage.vue') },
      { path: 'profile',      component: () => import('../pages/ProfilePage.vue') },
      { path: 'profile/:id', component: () => import('../pages/ProfilePage.vue') },
      { path: 'my-pets',component: () => import('../pages/MyPetsPage.vue') },
      { path: 'my-pets/:id/health', component: () => import('../pages/HealthPage.vue') },
      { path: 'post/create',        component: () => import('../pages/CreatePostPage.vue') },
      { path: 'story/create',       component: () => import('../pages/CreateStoryPage.vue') },
      { path: 'adopt/browse',       component: () => import('../pages/AdoptBrowsePage.vue') },
      { path: 'adopt/:id',          component: () => import('../pages/AdoptDetailPage.vue') },
      { path: 'my-applications',    component: () => import('../pages/MyApplicationsPage.vue') },
      { path: 'events',             component: () => import('../pages/EventsPage.vue') },
      { path: 'events/:id',         component: () => import('../pages/EventDetailPage.vue') },
    ]
  },

  // Staff
  {
    path: '/shelter',
    component: () => import('../layouts/SidebarLayout.vue'),
    meta: { requiresAuth: true, roles: ['shelter_staff', 'admin'] },
    children: [
      { path: 'listings',    component: () => import('../pages/ShelterListingsPage.vue') },
      { path: 'applications',component: () => import('../pages/ShelterApplicationsPage.vue') },
    ]
  },

  // Admin
  {
    path: '/admin',
    component: () => import('../layouts/SidebarLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      { path: 'dashboard', component: () => import('../pages/AdminDashboardPage.vue') },
      { path: 'users',     component: () => import('../pages/AdminUsersPage.vue') },
    ]
  },

  { path: '/:pathMatch(.*)*', redirect: '/feed' },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return next('/login')
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) return next('/feed')
  next()
})

export default router
