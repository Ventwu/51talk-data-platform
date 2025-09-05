import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Divider,
  Typography,
  Row,
  Col,
  Alert,
  message,
  Modal,
  Table,
  Tag,
  Tooltip,
  Progress,
  Statistic,
  List,
  Avatar,
  Badge,
  Upload,
  InputNumber,
  TimePicker,
  DatePicker,
  Slider,
  Radio,
  Checkbox,
  Collapse,
  Tree
} from 'antd';
import {
  SettingOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  NotificationOutlined,
  UserOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  CloudOutlined,
  MailOutlined,
  PhoneOutlined,
  BellOutlined,
  LockOutlined,
  KeyOutlined,
  SafetyCertificateOutlined as ShieldOutlined,
  MonitorOutlined,
  FileTextOutlined,
  UploadOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useSystemInfo } from '@/hooks';
import './index.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { TreeNode } = Tree;

interface SystemConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  timezone: string;
  language: string;
  theme: string;
  enableRegistration: boolean;
  enableEmailVerification: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays: number;
  };
}

interface SecurityConfig {
  enableTwoFactor: boolean;
  enableIpWhitelist: boolean;
  ipWhitelist: string[];
  enableLoginAttemptLimit: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  enableAuditLog: boolean;
  auditLogRetention: number;
  enableEncryption: boolean;
  encryptionAlgorithm: string;
}

interface NotificationConfig {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
  };
  smsSettings: {
    provider: string;
    apiKey: string;
    apiSecret: string;
    signName: string;
  };
  notificationTypes: {
    userRegistration: boolean;
    passwordReset: boolean;
    loginAlert: boolean;
    systemAlert: boolean;
    dataAlert: boolean;
    reportGenerated: boolean;
  };
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  enableSsl: boolean;
  backupEnabled: boolean;
  backupSchedule: string;
  backupRetention: number;
}

const SettingsPage: React.FC = () => {
  const { systemInfo, loading, refresh } = useSystemInfo();
  const [activeTab, setActiveTab] = useState('general');
  const [systemForm] = Form.useForm<SystemConfig>();
  const [securityForm] = Form.useForm<SecurityConfig>();
  const [notificationForm] = Form.useForm<NotificationConfig>();
  const [databaseForm] = Form.useForm<DatabaseConfig>();
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [auditLogVisible, setAuditLogVisible] = useState(false);

  useEffect(() => {
    refresh();
    loadConfigurations();
  }, []);

  // 加载配置
  const loadConfigurations = async () => {
    try {
      // 这里应该从API加载实际配置
      const mockSystemConfig: SystemConfig = {
        siteName: '51Talk数据中台',
        siteDescription: '企业级数据分析和可视化平台',
        siteUrl: 'https://data.51talk.com',
        adminEmail: 'admin@51talk.com',
        timezone: 'Asia/Shanghai',
        language: 'zh-CN',
        theme: 'light',
        enableRegistration: false,
        enableEmailVerification: true,
        maxFileSize: 10,
        allowedFileTypes: ['xlsx', 'csv', 'json', 'pdf'],
        sessionTimeout: 30,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          expirationDays: 90
        }
      };

      const mockSecurityConfig: SecurityConfig = {
        enableTwoFactor: true,
        enableIpWhitelist: false,
        ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
        enableLoginAttemptLimit: true,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        enableAuditLog: true,
        auditLogRetention: 365,
        enableEncryption: true,
        encryptionAlgorithm: 'AES-256'
      };

      const mockNotificationConfig: NotificationConfig = {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        emailSettings: {
          smtpHost: 'smtp.51talk.com',
          smtpPort: 587,
          smtpUser: 'noreply@51talk.com',
          smtpPassword: '',
          smtpSecure: true,
          fromEmail: 'noreply@51talk.com',
          fromName: '51Talk数据中台'
        },
        smsSettings: {
          provider: 'aliyun',
          apiKey: '',
          apiSecret: '',
          signName: '51Talk'
        },
        notificationTypes: {
          userRegistration: true,
          passwordReset: true,
          loginAlert: true,
          systemAlert: true,
          dataAlert: true,
          reportGenerated: false
        }
      };

      const mockDatabaseConfig: DatabaseConfig = {
        host: 'localhost',
        port: 5432,
        database: 'data_platform',
        username: 'postgres',
        password: '',
        maxConnections: 100,
        connectionTimeout: 30,
        queryTimeout: 60,
        enableSsl: true,
        backupEnabled: true,
        backupSchedule: '0 2 * * *',
        backupRetention: 30
      };

      systemForm.setFieldsValue(mockSystemConfig);
      securityForm.setFieldsValue(mockSecurityConfig);
      notificationForm.setFieldsValue(mockNotificationConfig);
      databaseForm.setFieldsValue(mockDatabaseConfig);
    } catch (error) {
      message.error('配置加载失败');
    }
  };

  // 保存系统配置
  const handleSaveSystemConfig = async (values: SystemConfig) => {
    setSaving(true);
    try {
      // 这里应该调用API保存配置
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('系统配置保存成功');
    } catch (error) {
      message.error('系统配置保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存安全配置
  const handleSaveSecurityConfig = async (values: SecurityConfig) => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('安全配置保存成功');
    } catch (error) {
      message.error('安全配置保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存通知配置
  const handleSaveNotificationConfig = async (values: NotificationConfig) => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('通知配置保存成功');
    } catch (error) {
      message.error('通知配置保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存数据库配置
  const handleSaveDatabaseConfig = async (values: DatabaseConfig) => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('数据库配置保存成功');
    } catch (error) {
      message.error('数据库配置保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 测试数据库连接
  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('数据库连接测试成功');
    } catch (error) {
      message.error('数据库连接测试失败');
    } finally {
      setTestingConnection(false);
    }
  };

  // 测试邮件发送
  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('测试邮件发送成功');
    } catch (error) {
      message.error('测试邮件发送失败');
    } finally {
      setTestingEmail(false);
    }
  };

  // 测试短信发送
  const handleTestSms = async () => {
    setTestingSms(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('测试短信发送成功');
    } catch (error) {
      message.error('测试短信发送失败');
    } finally {
      setTestingSms(false);
    }
  };

  // 系统信息统计
  const systemStats = {
    uptime: '15天 8小时 32分钟',
    cpuUsage: 45,
    memoryUsage: 68,
    diskUsage: 32,
    networkIn: '1.2 GB',
    networkOut: '856 MB',
    activeUsers: 23,
    totalRequests: 15420
  };

  // 审计日志数据
  const auditLogs = [
    {
      id: '1',
      timestamp: '2024-01-15 14:30:25',
      user: 'admin',
      action: '用户登录',
      resource: '系统',
      ip: '192.168.1.100',
      status: 'success'
    },
    {
      id: '2',
      timestamp: '2024-01-15 14:25:10',
      user: 'john.doe',
      action: '修改用户信息',
      resource: '用户管理',
      ip: '192.168.1.101',
      status: 'success'
    },
    {
      id: '3',
      timestamp: '2024-01-15 14:20:45',
      user: 'unknown',
      action: '登录失败',
      resource: '系统',
      ip: '203.0.113.1',
      status: 'failed'
    }
  ];

  const auditLogColumns: ColumnsType<any> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      width: 120
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      width: 120
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      )
    }
  ];

  return (
    <div className="settings-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-left">
          <Title level={2}>
            <SettingOutlined /> 系统设置
          </Title>
          <Text type="secondary">管理系统配置和安全设置</Text>
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
          </Space>
        </div>
      </div>

      {/* 系统状态概览 */}
      <Row gutter={16} className="stats-cards">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="系统运行时间"
              value={systemStats.uptime}
              prefix={<MonitorOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="CPU使用率"
              value={systemStats.cpuUsage}
              suffix="%"
              prefix={<span style={{ color: systemStats.cpuUsage > 80 ? '#ff4d4f' : '#52c41a' }}>⚡</span>}
              valueStyle={{ color: systemStats.cpuUsage > 80 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="内存使用率"
              value={systemStats.memoryUsage}
              suffix="%"
              prefix={<span style={{ color: systemStats.memoryUsage > 80 ? '#ff4d4f' : '#52c41a' }}>💾</span>}
              valueStyle={{ color: systemStats.memoryUsage > 80 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="在线用户"
              value={systemStats.activeUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 配置选项卡 */}
      <Card className="settings-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
        >
          {/* 常规设置 */}
          <TabPane
            tab={
              <span>
                <GlobalOutlined />
                常规设置
              </span>
            }
            key="general"
          >
            <Form
              form={systemForm}
              layout="vertical"
              onFinish={handleSaveSystemConfig}
              className="settings-form"
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="站点名称"
                    name="siteName"
                    rules={[{ required: true, message: '请输入站点名称' }]}
                  >
                    <Input placeholder="请输入站点名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="站点URL"
                    name="siteUrl"
                    rules={[{ required: true, message: '请输入站点URL' }]}
                  >
                    <Input placeholder="https://example.com" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="站点描述"
                name="siteDescription"
              >
                <TextArea
                  rows={3}
                  placeholder="请输入站点描述"
                  maxLength={200}
                  showCount
                />
              </Form.Item>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="管理员邮箱"
                    name="adminEmail"
                    rules={[
                      { required: true, message: '请输入管理员邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input placeholder="admin@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="时区"
                    name="timezone"
                    rules={[{ required: true, message: '请选择时区' }]}
                  >
                    <Select placeholder="请选择时区">
                      <Option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</Option>
                      <Option value="America/New_York">America/New_York (UTC-5)</Option>
                      <Option value="Europe/London">Europe/London (UTC+0)</Option>
                      <Option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="默认语言"
                    name="language"
                    rules={[{ required: true, message: '请选择默认语言' }]}
                  >
                    <Select placeholder="请选择默认语言">
                      <Option value="zh-CN">简体中文</Option>
                      <Option value="en-US">English</Option>
                      <Option value="ja-JP">日本語</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="默认主题"
                    name="theme"
                    rules={[{ required: true, message: '请选择默认主题' }]}
                  >
                    <Select placeholder="请选择默认主题">
                      <Option value="light">浅色主题</Option>
                      <Option value="dark">深色主题</Option>
                      <Option value="auto">跟随系统</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider>用户设置</Divider>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="允许用户注册"
                    name="enableRegistration"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="启用邮箱验证"
                    name="enableEmailVerification"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="最大文件大小 (MB)"
                    name="maxFileSize"
                    rules={[{ required: true, message: '请输入最大文件大小' }]}
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      style={{ width: '100%' }}
                      placeholder="10"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="会话超时 (分钟)"
                    name="sessionTimeout"
                    rules={[{ required: true, message: '请输入会话超时时间' }]}
                  >
                    <InputNumber
                      min={5}
                      max={1440}
                      style={{ width: '100%' }}
                      placeholder="30"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="允许的文件类型"
                name="allowedFileTypes"
              >
                <Select
                  mode="tags"
                  placeholder="请输入允许的文件扩展名"
                  style={{ width: '100%' }}
                >
                  <Option value="xlsx">xlsx</Option>
                  <Option value="csv">csv</Option>
                  <Option value="json">json</Option>
                  <Option value="pdf">pdf</Option>
                  <Option value="png">png</Option>
                  <Option value="jpg">jpg</Option>
                </Select>
              </Form.Item>

              <Divider>密码策略</Divider>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="最小长度"
                    name={['passwordPolicy', 'minLength']}
                    rules={[{ required: true, message: '请输入密码最小长度' }]}
                  >
                    <InputNumber
                      min={6}
                      max={32}
                      style={{ width: '100%' }}
                      placeholder="8"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="密码过期天数"
                    name={['passwordPolicy', 'expirationDays']}
                    rules={[{ required: true, message: '请输入密码过期天数' }]}
                  >
                    <InputNumber
                      min={30}
                      max={365}
                      style={{ width: '100%' }}
                      placeholder="90"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item
                    label="需要大写字母"
                    name={['passwordPolicy', 'requireUppercase']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="需要小写字母"
                    name={['passwordPolicy', 'requireLowercase']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="需要数字"
                    name={['passwordPolicy', 'requireNumbers']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="需要特殊字符"
                    name={['passwordPolicy', 'requireSpecialChars']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  icon={<SaveOutlined />}
                >
                  保存配置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* 安全设置 */}
          <TabPane
            tab={
              <span>
                <SecurityScanOutlined />
                安全设置
              </span>
            }
            key="security"
          >
            <Form
              form={securityForm}
              layout="vertical"
              onFinish={handleSaveSecurityConfig}
              className="settings-form"
            >
              <Alert
                message="安全提醒"
                description="修改安全设置可能会影响系统访问，请谨慎操作。"
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Divider>身份验证</Divider>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="启用双因子认证"
                    name="enableTwoFactor"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="启用登录尝试限制"
                    name="enableLoginAttemptLimit"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="最大登录尝试次数"
                    name="maxLoginAttempts"
                    rules={[{ required: true, message: '请输入最大登录尝试次数' }]}
                  >
                    <InputNumber
                      min={3}
                      max={10}
                      style={{ width: '100%' }}
                      placeholder="5"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="锁定时长 (分钟)"
                    name="lockoutDuration"
                    rules={[{ required: true, message: '请输入锁定时长' }]}
                  >
                    <InputNumber
                      min={5}
                      max={60}
                      style={{ width: '100%' }}
                      placeholder="15"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>IP访问控制</Divider>

              <Form.Item
                label="启用IP白名单"
                name="enableIpWhitelist"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="IP白名单"
                name="ipWhitelist"
                help="每行一个IP地址或CIDR网段，例如：192.168.1.0/24"
              >
                <Select
                  mode="tags"
                  placeholder="请输入IP地址或网段"
                  style={{ width: '100%' }}
                >
                  <Option value="192.168.1.0/24">192.168.1.0/24</Option>
                  <Option value="10.0.0.0/8">10.0.0.0/8</Option>
                  <Option value="172.16.0.0/12">172.16.0.0/12</Option>
                </Select>
              </Form.Item>

              <Divider>审计和日志</Divider>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="启用审计日志"
                    name="enableAuditLog"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="日志保留天数"
                    name="auditLogRetention"
                    rules={[{ required: true, message: '请输入日志保留天数' }]}
                  >
                    <InputNumber
                      min={30}
                      max={3650}
                      style={{ width: '100%' }}
                      placeholder="365"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button
                    type="default"
                    icon={<EyeOutlined />}
                    onClick={() => setAuditLogVisible(true)}
                  >
                    查看审计日志
                  </Button>
                </Space>
              </Form.Item>

              <Divider>数据加密</Divider>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="启用数据加密"
                    name="enableEncryption"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="加密算法"
                    name="encryptionAlgorithm"
                    rules={[{ required: true, message: '请选择加密算法' }]}
                  >
                    <Select placeholder="请选择加密算法">
                      <Option value="AES-256">AES-256</Option>
                      <Option value="AES-192">AES-192</Option>
                      <Option value="AES-128">AES-128</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  icon={<SaveOutlined />}
                >
                  保存配置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* 通知设置 */}
          <TabPane
            tab={
              <span>
                <NotificationOutlined />
                通知设置
              </span>
            }
            key="notification"
          >
            <Form
              form={notificationForm}
              layout="vertical"
              onFinish={handleSaveNotificationConfig}
              className="settings-form"
            >
              <Divider>通知渠道</Divider>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="邮件通知"
                    name="emailEnabled"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="短信通知"
                    name="smsEnabled"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="推送通知"
                    name="pushEnabled"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>邮件配置</Divider>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="SMTP服务器"
                    name={['emailSettings', 'smtpHost']}
                    rules={[{ required: true, message: '请输入SMTP服务器地址' }]}
                  >
                    <Input placeholder="smtp.example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="SMTP端口"
                    name={['emailSettings', 'smtpPort']}
                    rules={[{ required: true, message: '请输入SMTP端口' }]}
                  >
                    <InputNumber
                      min={1}
                      max={65535}
                      style={{ width: '100%' }}
                      placeholder="587"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="SMTP用户名"
                    name={['emailSettings', 'smtpUser']}
                    rules={[{ required: true, message: '请输入SMTP用户名' }]}
                  >
                    <Input placeholder="username@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="SMTP密码"
                    name={['emailSettings', 'smtpPassword']}
                    rules={[{ required: true, message: '请输入SMTP密码' }]}
                  >
                    <Input.Password
                      placeholder="请输入SMTP密码"
                      visibilityToggle={{
                        visible: showPassword,
                        onVisibleChange: setShowPassword
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="发件人邮箱"
                    name={['emailSettings', 'fromEmail']}
                    rules={[
                      { required: true, message: '请输入发件人邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input placeholder="noreply@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="发件人名称"
                    name={['emailSettings', 'fromName']}
                    rules={[{ required: true, message: '请输入发件人名称' }]}
                  >
                    <Input placeholder="系统通知" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="启用SSL/TLS"
                    name={['emailSettings', 'smtpSecure']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item>
                    <Button
                      type="default"
                      icon={<MailOutlined />}
                      onClick={handleTestEmail}
                      loading={testingEmail}
                    >
                      测试邮件发送
                    </Button>
                  </Form.Item>
                </Col>
              </Row>

              <Divider>短信配置</Divider>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="短信服务商"
                    name={['smsSettings', 'provider']}
                    rules={[{ required: true, message: '请选择短信服务商' }]}
                  >
                    <Select placeholder="请选择短信服务商">
                      <Option value="aliyun">阿里云</Option>
                      <Option value="tencent">腾讯云</Option>
                      <Option value="huawei">华为云</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="签名名称"
                    name={['smsSettings', 'signName']}
                    rules={[{ required: true, message: '请输入签名名称' }]}
                  >
                    <Input placeholder="请输入短信签名" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="API Key"
                    name={['smsSettings', 'apiKey']}
                    rules={[{ required: true, message: '请输入API Key' }]}
                  >
                    <Input placeholder="请输入API Key" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="API Secret"
                    name={['smsSettings', 'apiSecret']}
                    rules={[{ required: true, message: '请输入API Secret' }]}
                  >
                    <Input.Password placeholder="请输入API Secret" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="default"
                  icon={<PhoneOutlined />}
                  onClick={handleTestSms}
                  loading={testingSms}
                >
                  测试短信发送
                </Button>
              </Form.Item>

              <Divider>通知类型</Divider>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="用户注册"
                    name={['notificationTypes', 'userRegistration']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="密码重置"
                    name={['notificationTypes', 'passwordReset']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="登录警报"
                    name={['notificationTypes', 'loginAlert']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="系统警报"
                    name={['notificationTypes', 'systemAlert']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="数据警报"
                    name={['notificationTypes', 'dataAlert']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="报告生成"
                    name={['notificationTypes', 'reportGenerated']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  icon={<SaveOutlined />}
                >
                  保存配置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* 数据库设置 */}
          <TabPane
            tab={
              <span>
                <DatabaseOutlined />
                数据库设置
              </span>
            }
            key="database"
          >
            <Form
              form={databaseForm}
              layout="vertical"
              onFinish={handleSaveDatabaseConfig}
              className="settings-form"
            >
              <Alert
                message="数据库配置"
                description="修改数据库配置需要重启服务才能生效，请谨慎操作。"
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Divider>连接配置</Divider>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="数据库主机"
                    name="host"
                    rules={[{ required: true, message: '请输入数据库主机地址' }]}
                  >
                    <Input placeholder="localhost" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="端口"
                    name="port"
                    rules={[{ required: true, message: '请输入数据库端口' }]}
                  >
                    <InputNumber
                      min={1}
                      max={65535}
                      style={{ width: '100%' }}
                      placeholder="5432"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="数据库名"
                    name="database"
                    rules={[{ required: true, message: '请输入数据库名' }]}
                  >
                    <Input placeholder="data_platform" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="用户名"
                    name="username"
                    rules={[{ required: true, message: '请输入数据库用户名' }]}
                  >
                    <Input placeholder="postgres" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: '请输入数据库密码' }]}
              >
                <Input.Password placeholder="请输入数据库密码" />
              </Form.Item>

              <Divider>连接池配置</Divider>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="最大连接数"
                    name="maxConnections"
                    rules={[{ required: true, message: '请输入最大连接数' }]}
                  >
                    <InputNumber
                      min={10}
                      max={1000}
                      style={{ width: '100%' }}
                      placeholder="100"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="连接超时 (秒)"
                    name="connectionTimeout"
                    rules={[{ required: true, message: '请输入连接超时时间' }]}
                  >
                    <InputNumber
                      min={5}
                      max={300}
                      style={{ width: '100%' }}
                      placeholder="30"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="查询超时 (秒)"
                    name="queryTimeout"
                    rules={[{ required: true, message: '请输入查询超时时间' }]}
                  >
                    <InputNumber
                      min={10}
                      max={3600}
                      style={{ width: '100%' }}
                      placeholder="60"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="启用SSL连接"
                name="enableSsl"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="default"
                    icon={<DatabaseOutlined />}
                    onClick={handleTestConnection}
                    loading={testingConnection}
                  >
                    测试连接
                  </Button>
                </Space>
              </Form.Item>

              <Divider>备份配置</Divider>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="启用自动备份"
                    name="backupEnabled"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="备份保留天数"
                    name="backupRetention"
                    rules={[{ required: true, message: '请输入备份保留天数' }]}
                  >
                    <InputNumber
                      min={7}
                      max={365}
                      style={{ width: '100%' }}
                      placeholder="30"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="备份计划 (Cron表达式)"
                name="backupSchedule"
                help="例如：0 2 * * * 表示每天凌晨2点执行备份"
                rules={[{ required: true, message: '请输入备份计划' }]}
              >
                <Input placeholder="0 2 * * *" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="default"
                    icon={<CloudOutlined />}
                    onClick={() => setBackupModalVisible(true)}
                  >
                    管理备份
                  </Button>
                </Space>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  icon={<SaveOutlined />}
                >
                  保存配置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>

      {/* 审计日志模态框 */}
      <Modal
        title="审计日志"
        open={auditLogVisible}
        onCancel={() => setAuditLogVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAuditLogVisible(false)}>
            关闭
          </Button>
        ]}
        width={1000}
        destroyOnClose
      >
        <Table
          columns={auditLogColumns}
          dataSource={auditLogs}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 800 }}
        />
      </Modal>

      {/* 备份管理模态框 */}
      <Modal
        title="备份管理"
        open={backupModalVisible}
        onCancel={() => setBackupModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBackupModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
        destroyOnClose
      >
        <div className="backup-management">
          <div className="backup-actions">
            <Space>
              <Button type="primary" icon={<CloudOutlined />}>
                立即备份
              </Button>
              <Button icon={<UploadOutlined />}>
                上传备份
              </Button>
              <Button icon={<ReloadOutlined />}>
                刷新列表
              </Button>
            </Space>
          </div>
          
          <Divider />
          
          <List
            itemLayout="horizontal"
            dataSource={[
              {
                id: '1',
                name: 'backup_2024-01-15_02-00-00.sql',
                size: '125.6 MB',
                date: '2024-01-15 02:00:00',
                status: 'completed'
              },
              {
                id: '2',
                name: 'backup_2024-01-14_02-00-00.sql',
                size: '123.2 MB',
                date: '2024-01-14 02:00:00',
                status: 'completed'
              },
              {
                id: '3',
                name: 'backup_2024-01-13_02-00-00.sql',
                size: '121.8 MB',
                date: '2024-01-13 02:00:00',
                status: 'completed'
              }
            ]}
            renderItem={(item: any) => (
              <List.Item
                actions={[
                  <Button
                    key="download"
                    type="link"
                    icon={<DownloadOutlined />}
                    size="small"
                  >
                    下载
                  </Button>,
                  <Button
                    key="restore"
                    type="link"
                    icon={<ReloadOutlined />}
                    size="small"
                  >
                    恢复
                  </Button>,
                  <Button
                    key="delete"
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  >
                    删除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={<DatabaseOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                  }
                  title={item.name}
                  description={
                    <Space>
                      <Text type="secondary">大小: {item.size}</Text>
                      <Text type="secondary">时间: {item.date}</Text>
                      <Badge
                        status={item.status === 'completed' ? 'success' : 'processing'}
                        text={item.status === 'completed' ? '已完成' : '进行中'}
                      />
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;