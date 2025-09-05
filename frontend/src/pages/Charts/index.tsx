import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  Tooltip,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic,
  Typography,
  Divider,
  Badge,
  Avatar,
  Dropdown,
  Upload,
  Progress
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  ReloadOutlined,
  SearchOutlined,
  MoreOutlined,
  EyeOutlined,
  CopyOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  LineChartOutlined,
  PieChartOutlined,
  AreaChartOutlined,
  DotChartOutlined as ScatterChartOutlined,
  FunnelPlotOutlined,
  RadarChartOutlined,
  HeatMapOutlined,
  DotChartOutlined,
  UploadOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCharts, useDataSources, useDashboards } from '@/hooks';
import type { Chart, ChartType, ChartStatus, DataSource } from '@/types';
import './index.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ChartFormData {
  name: string;
  type: ChartType;
  dashboard_id: string;
  data_source_id: string;
  query: string;
  config: Record<string, any>;
  description?: string;
  isPublic: boolean;
}

const ChartsPage: React.FC = () => {
  const {
    charts,
    loading,
    createChart,
    updateChart,
    deleteChart,
    refresh
  } = useCharts();
  
  const { dataSources } = useDataSources();
  const { dashboards } = useDashboards();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingChart, setEditingChart] = useState<Chart | null>(null);
  const [form] = Form.useForm<ChartFormData>();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<ChartType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ChartStatus | 'all'>('all');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewChart, setPreviewChart] = useState<Chart | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  // 图表类型配置
  const chartTypeConfig = {
    line: {
      label: '折线图',
      icon: <LineChartOutlined />,
      color: '#1890ff',
      description: '显示数据随时间的变化趋势'
    },
    bar: {
      label: '柱状图',
      icon: <BarChartOutlined />,
      color: '#52c41a',
      description: '比较不同类别的数据大小'
    },
    pie: {
      label: '饼图',
      icon: <PieChartOutlined />,
      color: '#faad14',
      description: '显示各部分占整体的比例'
    },
    area: {
      label: '面积图',
      icon: <AreaChartOutlined />,
      color: '#722ed1',
      description: '强调数量随时间的变化'
    },
    scatter: {
      label: '散点图',
      icon: <ScatterChartOutlined />,
      color: '#eb2f96',
      description: '显示两个变量之间的关系'
    },
    funnel: {
      label: '漏斗图',
      icon: <FunnelPlotOutlined />,
      color: '#fa541c',
      description: '显示流程中各阶段的转化率'
    },
    radar: {
      label: '雷达图',
      icon: <RadarChartOutlined />,
      color: '#13c2c2',
      description: '多维度数据对比分析'
    },
    heatmap: {
      label: '热力图',
      icon: <HeatMapOutlined />,
      color: '#f5222d',
      description: '显示数据的分布密度'
    },
    gauge: {
      label: '仪表盘',
      icon: <DotChartOutlined />,
      color: '#2f54eb',
      description: '显示单一指标的当前状态'
    }
  };

  // 状态配置
  const statusConfig = {
    active: {
      label: '正常',
      color: 'success',
      icon: '🟢'
    },
    inactive: {
      label: '未激活',
      color: 'default',
      icon: '⚪'
    },
    error: {
      label: '错误',
      color: 'error',
      icon: '🔴'
    },
    loading: {
      label: '加载中',
      color: 'processing',
      icon: '🔄'
    }
  };

  // 过滤图表
  const filteredCharts = charts.filter(chart => {
    const matchesSearch = chart.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         chart.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = filterType === 'all' || chart.type === filterType;
    const matchesStatus = filterStatus === 'all' || chart.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // 统计数据
  const stats = {
    total: charts.length,
    active: charts.filter(chart => chart.status === 'active').length,
    public: charts.filter(chart => chart.isPublic).length,
    private: charts.filter(chart => !chart.isPublic).length
  };

  // 处理表单提交
  const handleSubmit = async (values: ChartFormData) => {
    try {
      if (editingChart) {
        await updateChart(editingChart.id, values);
        message.success('图表更新成功');
      } else {
        await createChart(values);
        message.success('图表创建成功');
      }
      setIsModalVisible(false);
      setEditingChart(null);
      form.resetFields();
      refresh();
    } catch (error) {
      message.error(editingChart ? '图表更新失败' : '图表创建失败');
    }
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    try {
      await deleteChart(id);
      message.success('图表删除成功');
      refresh();
    } catch (error) {
      message.error('图表删除失败');
    }
  };

  // 打开编辑模态框
  const handleEdit = (chart: Chart) => {
    setEditingChart(chart);
    form.setFieldsValue({
      ...chart,
      dataSourceId: chart.dataSource?.id
    });
    setIsModalVisible(true);
  };

  // 预览图表
  const handlePreview = (chart: Chart) => {
    setPreviewChart(chart);
    setPreviewVisible(true);
  };

  // 复制图表
  const handleCopy = async (chart: Chart) => {
    try {
      const newChart = {
        ...chart,
        name: `${chart.name} (副本)`,
        id: undefined
      };
      await createChart(newChart);
      message.success('图表复制成功');
      refresh();
    } catch (error) {
      message.error('图表复制失败');
    }
  };

  // 分享图表
  const handleShare = (chart: Chart) => {
    const shareUrl = `${window.location.origin}/charts/${chart.id}`;
    navigator.clipboard.writeText(shareUrl);
    message.success('分享链接已复制到剪贴板');
  };

  // 导出图表
  const handleExport = (chart: Chart) => {
    const dataStr = JSON.stringify(chart, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chart.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('图表配置已导出');
  };

  // 操作菜单
  const getActionMenu = (record: Chart): MenuProps => ({
    items: [
      {
        key: 'preview',
        icon: <EyeOutlined />,
        label: '预览',
        onClick: () => handlePreview(record)
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑',
        onClick: () => handleEdit(record)
      },
      {
        key: 'copy',
        icon: <CopyOutlined />,
        label: '复制',
        onClick: () => handleCopy(record)
      },
      {
        key: 'share',
        icon: <ShareAltOutlined />,
        label: '分享',
        onClick: () => handleShare(record)
      },
      {
        key: 'export',
        icon: <DownloadOutlined />,
        label: '导出',
        onClick: () => handleExport(record)
      },
      {
        type: 'divider'
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true
      }
    ]
  });

  // 表格列定义
  const columns: ColumnsType<Chart> = [
    {
      title: '图表名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <Space>
          <Avatar
            size="small"
            style={{ backgroundColor: chartTypeConfig[record.type]?.color }}
          >
            {chartTypeConfig[record.type]?.icon}
          </Avatar>
          <div>
            <div className="chart-name">{text}</div>
            <Text type="secondary" className="chart-desc">
              {record.description || '暂无描述'}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '图表类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: ChartType) => (
        <Tag color={chartTypeConfig[type]?.color}>
          {chartTypeConfig[type]?.icon}
          <span style={{ marginLeft: 4 }}>{chartTypeConfig[type]?.label}</span>
        </Tag>
      )
    },
    {
      title: '数据源',
      key: 'dataSource',
      width: 150,
      render: (_, record) => (
        <div className="datasource-info">
          {record.dataSource ? (
            <>
              <div className="datasource-name">{record.dataSource.name}</div>
              <Text type="secondary" className="datasource-type">
                {record.dataSource.type}
              </Text>
            </>
          ) : (
            <Text type="secondary">未关联数据源</Text>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ChartStatus) => {
        const config = statusConfig[status];
        return (
          <Badge
            status={config.color as any}
            text={
              <Space size={4}>
                <span>{config.icon}</span>
                {config.label}
              </Space>
            }
          />
        );
      }
    },
    {
      title: '可见性',
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 100,
      render: (isPublic: boolean) => (
        <Tag color={isPublic ? 'green' : 'orange'}>
          {isPublic ? '公开' : '私有'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Dropdown menu={getActionMenu(record)} trigger={['click']}>
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  return (
    <div className="charts-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-left">
          <Title level={2}>
            <BarChartOutlined /> 图表管理
          </Title>
          <Text type="secondary">创建和管理数据可视化图表</Text>
        </div>
        <div className="header-right">
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={refresh}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingChart(null);
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              新建图表
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="stats-cards">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总图表数"
              value={stats.total}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="正常运行"
              value={stats.active}
              prefix={<span style={{ color: '#52c41a' }}>🟢</span>}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="公开图表"
              value={stats.public}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="私有图表"
              value={stats.private}
              prefix={<span style={{ color: '#faad14' }}>🔒</span>}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选和搜索 */}
      <Card className="filter-card">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索图表名称或描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="图表类型"
              value={filterType}
              onChange={setFilterType}
              style={{ width: '100%' }}
            >
              <Option value="all">全部类型</Option>
              {Object.entries(chartTypeConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.icon} {config.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="状态"
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  <span>{config.icon}</span> {config.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 图表表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredCharts}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredCharts.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新建/编辑图表模态框 */}
      <Modal
        title={editingChart ? '编辑图表' : '新建图表'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingChart(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isPublic: false,
            type: 'line'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="图表名称"
                name="name"
                rules={[{ required: true, message: '请输入图表名称' }]}
              >
                <Input placeholder="请输入图表名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="图表类型"
                name="type"
                rules={[{ required: true, message: '请选择图表类型' }]}
              >
                <Select placeholder="请选择图表类型">
                  {Object.entries(chartTypeConfig).map(([key, config]) => (
                    <Option key={key} value={key}>
                      <Space>
                        {config.icon}
                        <div>
                          <div>{config.label}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {config.description}
                          </Text>
                        </div>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="所属仪表盘"
            name="dashboard_id"
            rules={[{ required: true, message: '请选择仪表盘' }]}
          >
            <Select placeholder="请选择仪表盘">
              {dashboards.map(dashboard => (
                <Option key={dashboard.id} value={dashboard.id}>
                  <Space>
                    <span>{dashboard.name}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dashboard.description}
                    </Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="数据源"
            name="data_source_id"
            rules={[{ required: true, message: '请选择数据源' }]}
          >
            <Select placeholder="请选择数据源">
              {dataSources.map(ds => (
                <Option key={ds.id} value={ds.id}>
                  <Space>
                    <span>{ds.name}</span>
                    <Tag size="small">{ds.type}</Tag>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="查询语句"
            name="query"
            rules={[{ required: true, message: '请输入查询语句' }]}
          >
            <TextArea
              rows={6}
              placeholder="请输入SQL查询语句或其他查询语法"
              style={{ fontFamily: 'Monaco, Consolas, monospace' }}
            />
          </Form.Item>

          <Form.Item label="图表描述" name="description">
            <TextArea
              rows={3}
              placeholder="请输入图表描述（可选）"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="可见性" name="isPublic" valuePropName="checked">
                <Switch
                  checkedChildren="公开"
                  unCheckedChildren="私有"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                {editingChart ? '更新' : '创建'}
              </Button>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  setEditingChart(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 图表预览模态框 */}
      <Modal
        title={`预览图表: ${previewChart?.name}`}
        open={previewVisible}
        onCancel={() => {
          setPreviewVisible(false);
          setPreviewChart(null);
        }}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>
        ]}
        width={900}
        destroyOnClose
      >
        {previewChart && (
          <div className="chart-preview">
            <div className="preview-info">
              <Row gutter={16}>
                <Col span={8}>
                  <div className="info-item">
                    <Text type="secondary">图表类型:</Text>
                    <Tag color={chartTypeConfig[previewChart.type]?.color}>
                      {chartTypeConfig[previewChart.type]?.icon}
                      <span style={{ marginLeft: 4 }}>
                        {chartTypeConfig[previewChart.type]?.label}
                      </span>
                    </Tag>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="info-item">
                    <Text type="secondary">数据源:</Text>
                    <span>{previewChart.dataSource?.name || '未关联'}</span>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="info-item">
                    <Text type="secondary">可见性:</Text>
                    <Tag color={previewChart.isPublic ? 'green' : 'orange'}>
                      {previewChart.isPublic ? '公开' : '私有'}
                    </Tag>
                  </div>
                </Col>
              </Row>
            </div>
            
            <Divider />
            
            <div className="preview-content">
              <div className="chart-placeholder">
                <div className="placeholder-icon">
                  {chartTypeConfig[previewChart.type]?.icon}
                </div>
                <div className="placeholder-text">
                  <Title level={4}>{previewChart.name}</Title>
                  <Text type="secondary">
                    {previewChart.description || '暂无描述'}
                  </Text>
                </div>
                <div className="placeholder-note">
                  <Text type="secondary">
                    图表预览功能正在开发中，敬请期待
                  </Text>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChartsPage;