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
          redirect: '/dashboard/users'
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

// 路由守卫（权限校验已禁用，允许未登录访问任何页面）
router.beforeEach((_to, _from, next) => {
  next()
})

export default router
