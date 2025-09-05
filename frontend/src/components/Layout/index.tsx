// 主布局组件
import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Breadcrumb,
  theme,
  Space,
  Tooltip,
  Switch,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  SunOutlined,
  MoonOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { useAppStore } from '@/store';
import type { MenuProps } from 'antd';
import './index.css';

const { Header, Sider, Content } = Layout;

// 菜单项类型
type MenuItem = Required<MenuProps>['items'][number];

// 创建菜单项的辅助函数
function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group'
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

// 侧边栏菜单配置
const menuItems: MenuItem[] = [
  getItem('首页', '/', <HomeOutlined />),
  getItem('数据分析', '/analytics', <DashboardOutlined />),
  getItem('数据源管理', '/data-sources', <DatabaseOutlined />),
  getItem('图表管理', '/charts', <BarChartOutlined />),
  getItem('用户管理', '/users', <UserOutlined />),
  getItem('系统设置', '/settings', <SettingOutlined />),
];

// 面包屑映射
const breadcrumbNameMap: Record<string, string> = {
  '/': '首页',
  '/analytics': '数据分析',
  '/data-sources': '数据源管理',
  '/data-sources/create': '创建数据源',
  '/data-sources/edit': '编辑数据源',
  '/charts': '图表管理',
  '/charts/create': '创建图表',
  '/charts/edit': '编辑图表',
  '/users': '用户管理',
  '/users/create': '创建用户',
  '/users/edit': '编辑用户',
  '/settings': '系统设置',
  '/settings/profile': '个人资料',
  '/settings/preferences': '偏好设置',
  '/settings/security': '安全设置',
};

// 主布局组件
const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    theme: currentTheme,
    language,
    sidebarCollapsed,
    notifications,
    setTheme,
    setLanguage,
    toggleSidebar,
    removeNotification,
  } = useAppStore();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 获取当前选中的菜单项
  const selectedKeys = [location.pathname];
  const openKeys = [location.pathname.split('/').slice(0, -1).join('/')];

  // 生成面包屑
  const generateBreadcrumbs = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const breadcrumbItems = pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const name = breadcrumbNameMap[url] || pathSnippets[index];
      
      return {
        title: name,
        path: url,
      };
    });

    return [
      { title: '首页', path: '/' },
      ...breadcrumbItems,
    ];
  };

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 处理用户菜单点击
  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        navigate('/settings/profile');
        break;
      case 'preferences':
        navigate('/settings/preferences');
        break;
      case 'security':
        navigate('/settings/security');
        break;
      case 'logout':
        logout();
        break;
    }
  };

  // 处理通知点击
  const handleNotificationClick = ({ key }: { key: string }) => {
    removeNotification(key);
  };

  // 切换主题
  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  // 切换语言
  const handleLanguageChange = ({ key }: { key: string }) => {
    setLanguage(key as any);
  };

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'preferences',
      icon: <SettingOutlined />,
      label: '偏好设置',
    },
    {
      key: 'security',
      icon: <SettingOutlined />,
      label: '安全设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  // 通知下拉菜单
  const notificationMenuItems: MenuProps['items'] = notifications.length > 0 ? [
    ...notifications.slice(0, 5).map(notification => ({
      key: notification.id,
      label: (
        <div className="notification-item">
          <div className="notification-title">{notification.title}</div>
          <div className="notification-message">{notification.message}</div>
          <div className="notification-time">
            {new Date(notification.timestamp).toLocaleString()}
          </div>
        </div>
      ),
    })),
    {
      type: 'divider',
    },
    {
      key: 'view-all',
      label: '查看全部通知',
    },
  ] : [
    {
      key: 'no-notifications',
      label: '暂无通知',
      disabled: true,
    },
  ];

  // 语言下拉菜单
  const languageMenuItems: MenuProps['items'] = [
    {
      key: 'zh-CN',
      label: '简体中文',
    },
    {
      key: 'en-US',
      label: 'English',
    },
  ];

  return (
    <Layout className="main-layout">
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        className="layout-sider"
        theme={currentTheme === 'dark' ? 'dark' : 'light'}
      >
        {/* Logo */}
        <div className="logo">
          <img
            src="/logo.svg"
            alt="51Talk 数据中台"
            className="logo-image"
          />
          {!sidebarCollapsed && (
            <span className="logo-text">51Talk 数据中台</span>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          theme={currentTheme === 'dark' ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={handleMenuClick}
          className="layout-menu"
        />
      </Sider>

      <Layout className="layout-content">
        {/* 头部 */}
        <Header
          className="layout-header"
          style={{ background: colorBgContainer }}
        >
          <div className="header-left">
            {/* 折叠按钮 */}
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              className="trigger"
            />

            {/* 面包屑 */}
            <Breadcrumb className="breadcrumb">
              {generateBreadcrumbs().map((item, index) => (
                <Breadcrumb.Item
                  key={item.path}
                  onClick={() => index < generateBreadcrumbs().length - 1 && navigate(item.path)}
                  className={index < generateBreadcrumbs().length - 1 ? 'breadcrumb-link' : ''}
                >
                  {item.title}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </div>

          <div className="header-right">
            <Space size="middle">
              {/* 主题切换 */}
              <Tooltip title={currentTheme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}>
                <Switch
                  checked={currentTheme === 'dark'}
                  onChange={handleThemeChange}
                  checkedChildren={<MoonOutlined />}
                  unCheckedChildren={<SunOutlined />}
                />
              </Tooltip>

              {/* 语言切换 */}
              <Dropdown
                menu={{
                  items: languageMenuItems,
                  onClick: handleLanguageChange,
                  selectedKeys: [language],
                }}
                placement="bottomRight"
              >
                <Button type="text" icon={<GlobalOutlined />} />
              </Dropdown>

              {/* 通知 */}
              <Dropdown
                menu={{
                  items: notificationMenuItems,
                  onClick: handleNotificationClick,
                }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button type="text" className="notification-button">
                  <Badge count={notifications.length} size="small">
                    <BellOutlined />
                  </Badge>
                </Button>
              </Dropdown>

              {/* 用户信息 */}
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: handleUserMenuClick,
                }}
                placement="bottomRight"
              >
                <div className="user-info">
                  <Avatar
                    size="small"
                    src={user?.avatar}
                    icon={<UserOutlined />}
                  />
                  <span className="user-name">{user?.name || user?.email}</span>
                </div>
              </Dropdown>
            </Space>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content className="layout-main-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;