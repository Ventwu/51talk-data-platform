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
  Dropdown
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  SearchOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  SettingOutlined,
  EyeOutlined,
  CopyOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDataSources } from '@/hooks';
import type { DataSource, DataSourceType, DataSourceStatus } from '@/types';
import './index.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface DataSourceFormData {
  name: string;
  type: DataSourceType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  description?: string;
  isActive: boolean;
  config?: Record<string, any>;
}

const DataSourcesPage: React.FC = () => {
  const {
    dataSources,
    loading,
    createDataSource,
    updateDataSource,
    deleteDataSource,
    testDataSource,
    refresh
  } = useDataSources();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(null);
  const [form] = Form.useForm<DataSourceFormData>();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<DataSourceType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<DataSourceStatus | 'all'>('all');
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  // 数据源类型配置
  const dataSourceTypeConfig = {
    mysql: {
      label: 'MySQL',
      icon: '🐬',
      color: '#f56a00',
      defaultPort: 3306
    },
    postgresql: {
      label: 'PostgreSQL',
      icon: '🐘',
      color: '#336791',
      defaultPort: 5432
    },
    mongodb: {
      label: 'MongoDB',
      icon: '🍃',
      color: '#4DB33D',
      defaultPort: 27017
    },
    redis: {
      label: 'Redis',
      icon: '🔴',
      color: '#DC382D',
      defaultPort: 6379
    },
    elasticsearch: {
      label: 'Elasticsearch',
      icon: '🔍',
      color: '#005571',
      defaultPort: 9200
    },
    clickhouse: {
      label: 'ClickHouse',
      icon: '⚡',
      color: '#FFCC02',
      defaultPort: 8123
    }
  };

  // 状态配置
  const statusConfig = {
    connected: {
      label: '已连接',
      color: 'success',
      icon: <CheckCircleOutlined />
    },
    disconnected: {
      label: '未连接',
      color: 'error',
      icon: <CloseCircleOutlined />
    },
    connecting: {
      label: '连接中',
      color: 'processing',
      icon: <SyncOutlined spin />
    },
    error: {
      label: '连接错误',
      color: 'warning',
      icon: <ExclamationCircleOutlined />
    }
  };

  // 过滤数据源
  const filteredDataSources = dataSources.filter(ds => {
    const matchesSearch = ds.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         ds.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = filterType === 'all' || ds.type === filterType;
    const matchesStatus = filterStatus === 'all' || ds.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // 统计数据
  const stats = {
    total: dataSources.length,
    connected: dataSources.filter(ds => ds.status === 'connected').length,
    disconnected: dataSources.filter(ds => ds.status === 'disconnected').length,
    error: dataSources.filter(ds => ds.status === 'error').length
  };

  // 处理表单提交
  const handleSubmit = async (values: DataSourceFormData) => {
    try {
      if (editingDataSource) {
        await updateDataSource(editingDataSource.id, values);
        message.success('数据源更新成功');
      } else {
        await createDataSource(values);
        message.success('数据源创建成功');
      }
      setIsModalVisible(false);
      setEditingDataSource(null);
      form.resetFields();
      refresh();
    } catch (error) {
      message.error(editingDataSource ? '数据源更新失败' : '数据源创建失败');
    }
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    try {
      await deleteDataSource(id);
      message.success('数据源删除成功');
      refresh();
    } catch (error) {
      message.error('数据源删除失败');
    }
  };

  // 测试连接
  const handleTestConnection = async (dataSource: DataSource) => {
    setTestingConnection(dataSource.id.toString());
    try {
      const testData = {
        type: dataSource.type,
        config: dataSource.config
      };
      const result = await testDataSource(dataSource.id, testData);
      if (result.success) {
        message.success('连接测试成功');
      } else {
        message.error(`连接测试失败: ${result.message}`);
      }
    } catch (error) {
      message.error('连接测试失败');
    } finally {
      setTestingConnection(null);
    }
  };

  // 打开编辑模态框
  const handleEdit = (dataSource: DataSource) => {
    setEditingDataSource(dataSource);
    form.setFieldsValue({
      ...dataSource,
      password: '' // 不显示密码
    });
    setIsModalVisible(true);
  };

  // 复制连接信息
  const handleCopyConnection = (dataSource: DataSource) => {
    const connectionString = `${dataSource.type}://${dataSource.username}@${dataSource.host}:${dataSource.port}/${dataSource.database}`;
    navigator.clipboard.writeText(connectionString);
    message.success('连接信息已复制到剪贴板');
  };

  // 数据源类型变化时更新默认端口
  const handleTypeChange = (type: DataSourceType) => {
    const config = dataSourceTypeConfig[type];
    if (config) {
      form.setFieldsValue({ port: config.defaultPort });
    }
  };

  // 操作菜单
  const getActionMenu = (record: DataSource): MenuProps => ({
    items: [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: '查看详情'
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑',
        onClick: () => handleEdit(record)
      },
      {
        key: 'test',
        icon: <SyncOutlined />,
        label: '测试连接',
        onClick: () => handleTestConnection(record)
      },
      {
        key: 'copy',
        icon: <CopyOutlined />,
        label: '复制连接信息',
        onClick: () => handleCopyConnection(record)
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
  const columns: ColumnsType<DataSource> = [
    {
      title: '数据源名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <Space>
          <Avatar
            size="small"
            style={{ backgroundColor: dataSourceTypeConfig[record.type]?.color }}
          >
            {dataSourceTypeConfig[record.type]?.icon}
          </Avatar>
          <div>
            <div className="datasource-name">{text}</div>
            <Text type="secondary" className="datasource-desc">
              {record.description || '暂无描述'}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: DataSourceType) => (
        <Tag color={dataSourceTypeConfig[type]?.color}>
          {dataSourceTypeConfig[type]?.label}
        </Tag>
      )
    },
    {
      title: '连接信息',
      key: 'connection',
      width: 250,
      render: (_, record) => (
        <div className="connection-info">
          <div>主机: {record.host}:{record.port}</div>
          <div>数据库: {record.database}</div>
          <div>用户: {record.username}</div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: DataSourceStatus) => {
        const config = statusConfig[status];
        return (
          <Badge
            status={config.color as any}
            text={
              <Space size={4}>
                {config.icon}
                {config.label}
              </Space>
            }
          />
        );
      }
    },
    {
      title: '启用状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Switch checked={isActive} disabled size="small" />
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
          <Tooltip title="测试连接">
            <Button
              type="text"
              size="small"
              icon={<SyncOutlined />}
              loading={testingConnection === record.id}
              onClick={() => handleTestConnection(record)}
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
    <div className="datasources-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-left">
          <Title level={2}>
            <DatabaseOutlined /> 数据源管理
          </Title>
          <Text type="secondary">管理和配置数据源连接</Text>
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
                setEditingDataSource(null);
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              新建数据源
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="stats-cards">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总数据源"
              value={stats.total}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已连接"
              value={stats.connected}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="未连接"
              value={stats.disconnected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="连接错误"
              value={stats.error}
              prefix={<ExclamationCircleOutlined />}
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
              placeholder="搜索数据源名称或描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="数据源类型"
              value={filterType}
              onChange={setFilterType}
              style={{ width: '100%' }}
            >
              <Option value="all">全部类型</Option>
              {Object.entries(dataSourceTypeConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.icon} {config.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="连接状态"
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.icon} {config.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 数据源表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredDataSources}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredDataSources.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新建/编辑数据源模态框 */}
      <Modal
        title={editingDataSource ? '编辑数据源' : '新建数据源'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingDataSource(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isActive: true,
            port: 3306
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="数据源名称"
                name="name"
                rules={[{ required: true, message: '请输入数据源名称' }]}
              >
                <Input placeholder="请输入数据源名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="数据源类型"
                name="type"
                rules={[{ required: true, message: '请选择数据源类型' }]}
              >
                <Select
                  placeholder="请选择数据源类型"
                  onChange={handleTypeChange}
                >
                  {Object.entries(dataSourceTypeConfig).map(([key, config]) => (
                    <Option key={key} value={key}>
                      {config.icon} {config.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label="主机地址"
                name="host"
                rules={[{ required: true, message: '请输入主机地址' }]}
              >
                <Input placeholder="请输入主机地址" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="端口"
                name="port"
                rules={[{ required: true, message: '请输入端口号' }]}
              >
                <Input type="number" placeholder="端口号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="数据库名"
                name="database"
                rules={[{ required: true, message: '请输入数据库名' }]}
              >
                <Input placeholder="请输入数据库名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: !editingDataSource, message: '请输入密码' }
            ]}
          >
            <Input.Password
              placeholder={editingDataSource ? '留空则不修改密码' : '请输入密码'}
            />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <TextArea
              rows={3}
              placeholder="请输入数据源描述（可选）"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item label="启用状态" name="isActive" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                {editingDataSource ? '更新' : '创建'}
              </Button>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  setEditingDataSource(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataSourcesPage;