import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/permission-denied',
      name: 'PermissionDenied',
      component: () => import('../views/PermissionDenied.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/Layout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'DashboardHome',
          redirect: '/dashboard/home'
        },
        {
          path: 'home',
          name: 'Home',
          component: () => import('../views/Home.vue'),
          meta: { 
            requiresAuth: true
          }
        },
        {
          path: 'mission',
          name: 'Mission',
          component: () => import('../views/Mission.vue'),
          meta: { 
            requiresAuth: true
          }
        },
        {
          path: 'mission-logs',
          name: 'MissionLogs',
          component: () => import('../views/MissionLogs.vue'),
          meta: { 
            requiresAuth: true,
            permission: 'task_logs.view'
          }
        },
        {
          path: 'mission-records',
          name: 'MissionRecords',
          component: () => import('../views/MissionRecords.vue'),
          meta: { 
            requiresAuth: true,
            permission: 'task_records.view'
          }
        },
        {
          path: 'multi-task-group',
          name: 'MultiTaskGroup',
          component: () => import('../views/MultiTaskGroup.vue'),
          meta: { 
            requiresAuth: true
          }
        },
        {
          path: 'device-manage',
          name: 'DeviceManage',
          component: () => import('../views/DeviceManage.vue'),
          meta: { 
            requiresAuth: true
          }
        },
        {
          path: 'alarm-log',
          name: 'AlarmLog',
          component: () => import('../views/AlarmLog.vue'),
          meta: { 
            requiresAuth: true,
            permission: 'device_management.log.view'
          }
        },
        {
          path: 'users',
          name: 'UserManage',
          component: () => import('../views/UserManage.vue'),
          meta: { 
            requiresAuth: true
          }
        },
        {
          path: 'roles',
          name: 'RoleManage',
          component: () => import('../views/RoleManage.vue'),
          meta: { 
            requiresAuth: true
          }
        },
        {
          path: 'navigation',
          name: 'NavigationManage',
          component: () => import('../views/NavigationManage.vue'),
          meta: { 
            requiresAuth: true
          }
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 已临时禁用路由守卫（认证/权限检查），允许未登录用户访问任何页面。
  // 注意：这是开发环境的便捷改动，如需恢复请还原此函数为原始实现。
  console.info('[router] 路由守卫已禁用（允许未登录访问）：', to.fullPath)
  next()
})

export default router
