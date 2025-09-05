import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Space,
  Typography,
  Divider,
  Empty,
  Spin,
  message,
} from 'antd';
import {
  PlusOutlined,
  DashboardOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  UserOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DashboardGrid from '@/components/DashboardGrid';
import { useDashboards, useDataSources, useAuth } from '@/hooks';
import type { Dashboard } from '@/types';
import './index.css';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    dashboards,
    loading: dashboardsLoading,
    fetchDashboards,
    refresh: refreshDashboards,
  } = useDashboards();
  const {
    dataSources,
    loading: dataSourcesLoading,
    fetchDataSources,
  } = useDataSources();
  
  const [reordering, setReordering] = useState(false);

  // 页面加载时获取数据
  useEffect(() => {
    fetchDashboards();
    fetchDataSources();
  }, [fetchDashboards, fetchDataSources]);

  // 处理仪表盘重新排序
  const handleDashboardsReorder = async (reorderedDashboards: Dashboard[]) => {
    setReordering(true);
    try {
      // 这里可以调用API保存新的排序
      // await dashboardApi.updateDashboardOrder(reorderedDashboards.map(d => d.id));
      message.success('仪表盘顺序已更新');
    } catch (error) {
      message.error('更新顺序失败');
    } finally {
      setReordering(false);
    }
  };

  // 刷新所有数据
  const handleRefresh = () => {
    refreshDashboards();
    fetchDataSources();
    message.success('数据已刷新');
  };

  // 统计数据
  const stats = {
    totalDashboards: dashboards?.length || 0,
    totalCharts: dashboards?.reduce((sum, dashboard) => sum + (dashboard.chartCount || 0), 0) || 0,
    totalDataSources: dataSources?.length || 0,
    totalViews: dashboards?.reduce((sum, dashboard) => sum + (dashboard.viewCount || 0), 0) || 0,
  };

  return (
    <div className="home-page">
      {/* 页面头部 */}
      <div className="home-header">
        <div className="header-content">
          <div className="header-info">
            <Title level={2} className="page-title">
              欢迎回来，{user?.username || '用户'}！
            </Title>
            <Paragraph className="page-description">
              51Talk 数据中台为您提供强大的数据分析和可视化能力
            </Paragraph>
          </div>
          <div className="header-actions">
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={dashboardsLoading || dataSourcesLoading}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/dashboards/create')}
              >
                创建仪表盘
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => navigate('/settings')}
              >
                设置
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="仪表盘总数"
                value={stats.totalDashboards}
                prefix={<DashboardOutlined className="stat-icon dashboard" />}
                loading={dashboardsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="图表总数"
                value={stats.totalCharts}
                prefix={<BarChartOutlined className="stat-icon chart" />}
                loading={dashboardsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="数据源"
                value={stats.totalDataSources}
                prefix={<DatabaseOutlined className="stat-icon datasource" />}
                loading={dataSourcesLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="总访问量"
                value={stats.totalViews}
                prefix={<UserOutlined className="stat-icon views" />}
                loading={dashboardsLoading}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Divider />

      {/* 仪表盘网格 */}
      <div className="dashboards-section">
        <div className="section-header">
          <Title level={3}>我的仪表盘</Title>
          <Paragraph>
            拖拽卡片可以重新排序，点击右上角三点菜单进行更多操作
          </Paragraph>
        </div>
        
        <Spin spinning={reordering} tip="正在更新排序...">
          <DashboardGrid
            dashboards={dashboards || []}
            loading={dashboardsLoading}
            onDashboardsReorder={handleDashboardsReorder}
          />
        </Spin>
      </div>

      {/* 快速操作 */}
      <div className="quick-actions-section">
        <Title level={4}>快速操作</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              className="action-card"
              onClick={() => navigate('/dashboards/create')}
            >
              <div className="action-content">
                <DashboardOutlined className="action-icon" />
                <div className="action-text">
                  <div className="action-title">创建仪表盘</div>
                  <div className="action-description">新建数据仪表盘</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              className="action-card"
              onClick={() => navigate('/charts/create')}
            >
              <div className="action-content">
                <BarChartOutlined className="action-icon" />
                <div className="action-text">
                  <div className="action-title">创建图表</div>
                  <div className="action-description">新建数据图表</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              className="action-card"
              onClick={() => navigate('/datasources/create')}
            >
              <div className="action-content">
                <DatabaseOutlined className="action-icon" />
                <div className="action-text">
                  <div className="action-title">添加数据源</div>
                  <div className="action-description">连接新数据源</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              className="action-card"
              onClick={() => navigate('/settings')}
            >
              <div className="action-content">
                <SettingOutlined className="action-icon" />
                <div className="action-text">
                  <div className="action-title">系统设置</div>
                  <div className="action-description">配置系统参数</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Home;