import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import TestLogin from '../components/TestLogin';
import SimpleLoginTest from '../components/SimpleLoginTest';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import DataSources from '../pages/DataSources';
import Charts from '../pages/Charts';
import Users from '../pages/Users';
import Settings from '../pages/Settings';
import DashboardDesigner from '../components/DashboardDesigner';
import { useAuthStore } from '../store';

// 路由守卫组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// 公共路由组件（已登录用户重定向到首页）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// 路由配置
export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/test-login',
    element: <TestLogin />,
  },
  {
    path: '/simple-test',
    element: <SimpleLoginTest />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'analytics',
        element: <Dashboard />,
      },
      {
        path: 'data-sources',
        element: <DataSources />,
      },
      {
        path: 'charts',
        element: <Charts />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'dashboards/create',
        element: <DashboardDesigner />,
      },
      {
        path: 'dashboards/:id/edit',
        element: <DashboardDesigner />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;