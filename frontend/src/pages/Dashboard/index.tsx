// 仪表盘页面组件
import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Table,
  Tag,
  Button,
  Space,
  Select,
  DatePicker,
  Spin,
  Empty,
  Alert,
  Typography,
  Divider,
  Tooltip,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  DashboardOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Line, Column, Pie, Area } from '@ant-design/plots';
import dayjs from 'dayjs';
import { useDashboards, useDataSources, useCharts, useUsers } from '@/hooks';
import { useAppStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import type { Dashboard, Chart, DataSource } from '@/types';
import './index.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// 统计卡片数据类型
interface StatCardData {
  title: string;
  value: number;
  prefix?: React.ReactNode;
  suffix?: string;
  precision?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

// 仪表盘页面组件
const DashboardPage: React.FC = () => {
  const [selectedDashboard, setSelectedDashboard] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [refreshing, setRefreshing] = useState(false);

  const { dashboards, loading: dashboardsLoading, fetchDashboards } = useDashboards();
  const { dataSources, loading: dataSourcesLoading, fetchDataSources } = useDataSources();
  const { charts, loading: chartsLoading, fetchCharts } = useCharts();
  const { users, loading: usersLoading, fetchUsers } = useUsers();
  const { addNotification } = useAppStore();
  const navigate = useNavigate();

  // 获取数据
  useEffect(() => {
    fetchDashboards();
    fetchDataSources();
    fetchCharts();
    fetchUsers();
  }, []);

  // 设置默认选中的仪表盘
  useEffect(() => {
    if (dashboards.length > 0 && !selectedDashboard) {
      setSelectedDashboard(dashboards[0].id);
    }
  }, [dashboards, selectedDashboard]);

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboards(),
        fetchDataSources(),
        fetchCharts(),
        fetchUsers(),
      ]);
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: '刷新成功',
        message: '数据已更新',
        timestamp: Date.now(),
      });
    } catch (error) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: '刷新失败',
        message: '数据更新失败，请稍后重试',
        timestamp: Date.now(),
      });
    } finally {
      setRefreshing(false);
    }
  };

  // 统计卡片数据
  const statCards: StatCardData[] = [
    {
      title: '总用户数',
      value: users.length,
      prefix: <UserOutlined />,
      trend: {
        value: 12.5,
        isPositive: true,
      },
      loading: usersLoading,
    },
    {
      title: '数据源',
      value: dataSources.length,
      prefix: <DatabaseOutlined />,
      trend: {
        value: 3.2,
        isPositive: true,
      },
      loading: dataSourcesLoading,
    },
    {
      title: '图表数量',
      value: charts.length,
      prefix: <BarChartOutlined />,
      trend: {
        value: 8.1,
        isPositive: false,
      },
      loading: chartsLoading,
    },
    {
      title: '仪表盘',
      value: dashboards.length,
      prefix: <DashboardOutlined />,
      trend: {
        value: 5.7,
        isPositive: true,
      },
      loading: dashboardsLoading,
    },
  ];

  // 模拟图表数据
  const generateChartData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push({
        date: dayjs().subtract(i, 'day').format('MM-DD'),
        value: Math.floor(Math.random() * 1000) + 500,
        category: '访问量',
      });
    }
    return days;
  };

  const lineChartData = generateChartData();
  
  const columnChartData = [
    { type: '数据源', value: dataSources.filter(ds => ds.status === 'connected').length, category: '已连接' },
    { type: '数据源', value: dataSources.filter(ds => ds.status === 'disconnected').length, category: '未连接' },
    { type: '图表', value: charts.filter(c => c.status === 'published').length, category: '已发布' },
    { type: '图表', value: charts.filter(c => c.status === 'draft').length, category: '草稿' },
  ];

  const pieChartData = [
    { type: '管理员', value: users.filter(u => u.role === 'admin').length },
    { type: '分析师', value: users.filter(u => u.role === 'analyst').length },
    { type: '查看者', value: users.filter(u => u.role === 'viewer').length },
  ];

  // 最近活动数据
  const recentActivities = [
    {
      id: '1',
      user: '张三',
      action: '创建了图表',
      target: '销售趋势分析',
      time: '2分钟前',
      type: 'create',
    },
    {
      id: '2',
      user: '李四',
      action: '更新了仪表盘',
      target: '运营数据概览',
      time: '5分钟前',
      type: 'update',
    },
    {
      id: '3',
      user: '王五',
      action: '连接了数据源',
      target: 'MySQL 生产库',
      time: '10分钟前',
      type: 'connect',
    },
    {
      id: '4',
      user: '赵六',
      action: '查看了报表',
      target: '用户行为分析',
      time: '15分钟前',
      type: 'view',
    },
  ];

  const activityColumns = [
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      render: (record: any) => (
        <span>
          {record.action}
          <Text type="secondary" style={{ marginLeft: 4 }}>
            {record.target}
          </Text>
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 80,
      align: 'right' as const,
    },
  ];

  // 图表配置
  const lineConfig = {
    data: lineChartData,
    xField: 'date',
    yField: 'value',
    smooth: true,
    color: '#1890ff',
    point: {
      size: 4,
      shape: 'circle',
    },
    tooltip: {
      formatter: (datum: any) => {
        return { name: '访问量', value: datum.value };
      },
    },
  };

  const columnConfig = {
    data: columnChartData,
    xField: 'type',
    yField: 'value',
    seriesField: 'category',
    color: ['#1890ff', '#52c41a', '#faad14', '#f5222d'],
    label: {
      position: 'middle' as const,
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
  };

  const pieConfig = {
    data: pieChartData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    color: ['#1890ff', '#52c41a', '#faad14'],
    label: {
      type: 'outer' as const,
      content: '{name}: {percentage}',
    },
    interactions: [
      {
        type: 'pie-legend-active',
      },
      {
        type: 'element-active',
      },
    ],
  };

  const loading = dashboardsLoading || dataSourcesLoading || chartsLoading || usersLoading;

  return (
    <div className="dashboard-page">
      {/* 页面头部 */}
      <div className="dashboard-header">
        <div className="header-left">
          <Title level={2} style={{ margin: 0 }}>
            数据概览
          </Title>
          <Text type="secondary">
            实时监控业务数据，洞察关键指标趋势
          </Text>
        </div>
        
        <div className="header-right">
          <Space>
            <Select
              placeholder="选择仪表盘"
              style={{ width: 200 }}
              value={selectedDashboard}
              onChange={setSelectedDashboard}
              loading={dashboardsLoading}
            >
              {dashboards.map(dashboard => (
                <Option key={dashboard.id} value={dashboard.id}>
                  {dashboard.name}
                </Option>
              ))}
            </Select>
            
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates)}
              format="YYYY-MM-DD"
            />
            
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={refreshing}
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
          </Space>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="stat-cards">
          {statCards.map((card, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card className="stat-card">
                <Statistic
                  title={card.title}
                  value={card.value}
                  prefix={card.prefix}
                  suffix={card.suffix}
                  precision={card.precision}
                  loading={card.loading}
                  valueStyle={{
                    color: card.trend?.isPositive ? '#3f8600' : '#cf1322',
                  }}
                />
                {card.trend && (
                  <div className="stat-trend">
                    {card.trend.isPositive ? (
                      <ArrowUpOutlined style={{ color: '#3f8600' }} />
                    ) : (
                      <ArrowDownOutlined style={{ color: '#cf1322' }} />
                    )}
                    <span
                      style={{
                        color: card.trend.isPositive ? '#3f8600' : '#cf1322',
                        marginLeft: 4,
                      }}
                    >
                      {card.trend.value}%
                    </span>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      较上周
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]} className="chart-section">
          {/* 访问趋势 */}
          <Col xs={24} lg={16}>
            <Card
              title="访问趋势"
              extra={
                <Space>
                  <Button size="small" icon={<DownloadOutlined />}>
                    导出
                  </Button>
                </Space>
              }
            >
              <Line {...lineConfig} height={300} />
            </Card>
          </Col>

          {/* 用户角色分布 */}
          <Col xs={24} lg={8}>
            <Card title="用户角色分布">
              <Pie {...pieConfig} height={300} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* 资源状态 */}
          <Col xs={24} lg={12}>
            <Card title="资源状态">
              <Column {...columnConfig} height={300} />
            </Card>
          </Col>

          {/* 最近活动 */}
          <Col xs={24} lg={12}>
            <Card
              title="最近活动"
              extra={
                <Button size="small" type="link">
                  查看全部
                </Button>
              }
            >
              <Table
                dataSource={recentActivities}
                columns={activityColumns}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Card>
          </Col>
        </Row>

        {/* 快速操作 */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="快速操作">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    hoverable
                    className="quick-action-card"
                    onClick={() => navigate('/data-sources/create')}
                  >
                    <div className="quick-action-content">
                      <DatabaseOutlined className="quick-action-icon" />
                      <div>
                        <div className="quick-action-title">添加数据源</div>
                        <div className="quick-action-desc">连接新的数据库或API</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Card
                    hoverable
                    className="quick-action-card"
                    onClick={() => navigate('/charts/create')}
                  >
                    <div className="quick-action-content">
                      <BarChartOutlined className="quick-action-icon" />
                      <div>
                        <div className="quick-action-title">创建图表</div>
                        <div className="quick-action-desc">制作数据可视化图表</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Card
                    hoverable
                    className="quick-action-card"
                    onClick={() => navigate('/dashboards/create')}
                  >
                    <div className="quick-action-content">
                      <DashboardOutlined className="quick-action-icon" />
                      <div>
                        <div className="quick-action-title">新建仪表盘</div>
                        <div className="quick-action-desc">组合图表创建仪表盘</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Card
                    hoverable
                    className="quick-action-card"
                    onClick={() => navigate('/users/create')}
                  >
                    <div className="quick-action-content">
                      <UserOutlined className="quick-action-icon" />
                      <div>
                        <div className="quick-action-title">邀请用户</div>
                        <div className="quick-action-desc">添加团队成员</div>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default DashboardPage;