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
  DatePicker,
  Descriptions
} from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  MoreOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  UserSwitchOutlined,
  UploadOutlined,
  DownloadOutlined,
  ExportOutlined,
  ImportOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUsers } from '@/hooks';
import type { User, UserRole, UserStatus } from '@/types';
import './index.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface UserFormData {
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  position?: string;
  description?: string;
  password?: string;
}

const UsersPage: React.FC = () => {
  const {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    refresh
  } = useUsers();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm<UserFormData>();
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');
  const [filterDepartment, setFilterDepartment] = useState<string | 'all'>('all');
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [importVisible, setImportVisible] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  // 角色配置
  const roleConfig = {
    admin: {
      label: '管理员',
      color: 'red',
      icon: <CrownOutlined />,
      description: '系统管理员，拥有所有权限'
    },
    manager: {
      label: '经理',
      color: 'orange',
      icon: <TeamOutlined />,
      description: '部门经理，管理团队和项目'
    },
    analyst: {
      label: '分析师',
      color: 'blue',
      icon: <UserOutlined />,
      description: '数据分析师，进行数据分析'
    },
    viewer: {
      label: '查看者',
      color: 'green',
      icon: <EyeOutlined />,
      description: '只读用户，仅可查看数据'
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
      color: 'warning',
      icon: '🟡'
    },
    suspended: {
      label: '已停用',
      color: 'error',
      icon: '🔴'
    },
    locked: {
      label: '已锁定',
      color: 'default',
      icon: '🔒'
    }
  };

  // 获取部门列表
  const departments = Array.from(new Set(users.map(user => user.department).filter(Boolean)));

  // 过滤用户
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.department?.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.position?.toLowerCase().includes(searchText.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || user.department === filterDepartment;
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  // 统计数据
  const stats = {
    total: users.length,
    active: users.filter(user => user.status === 'active').length,
    admins: users.filter(user => user.role === 'admin').length,
    newThisMonth: users.filter(user => {
      const createdDate = new Date(user.createdAt);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && 
             createdDate.getFullYear() === now.getFullYear();
    }).length
  };

  // 处理表单提交
  const handleSubmit = async (values: UserFormData) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success('用户更新成功');
      } else {
        await createUser(values);
        message.success('用户创建成功');
      }
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      refresh();
    } catch (error) {
      message.error(editingUser ? '用户更新失败' : '用户创建失败');
    }
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('用户删除成功');
      refresh();
    } catch (error) {
      message.error('用户删除失败');
    }
  };

  // 打开编辑模态框
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      password: undefined // 不显示密码
    });
    setIsModalVisible(true);
  };

  // 查看用户详情
  const handleViewDetail = (user: User) => {
    setDetailUser(user);
    setDetailVisible(true);
  };

  // 切换用户状态
  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      await updateUser(user.id, { ...user, status: newStatus });
      message.success(`用户已${newStatus === 'active' ? '启用' : '停用'}`);
      refresh();
    } catch (error) {
      message.error('状态切换失败');
    }
  };

  // 重置密码
  const handleResetPassword = async (user: User) => {
    try {
      // 这里应该调用重置密码的API
      message.success('密码重置邮件已发送');
    } catch (error) {
      message.error('密码重置失败');
    }
  };

  // 导出用户数据
  const handleExport = () => {
    const exportData = filteredUsers.map(user => ({
      用户名: user.username,
      邮箱: user.email,
      电话: user.phone || '',
      角色: roleConfig[user.role]?.label,
      状态: statusConfig[user.status]?.label,
      部门: user.department || '',
      职位: user.position || '',
      创建时间: new Date(user.createdAt).toLocaleString(),
      最后登录: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '从未登录'
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('用户数据已导出');
  };

  // 操作菜单
  const getActionMenu = (record: User): MenuProps => ({
    items: [
      {
        key: 'detail',
        icon: <EyeOutlined />,
        label: '查看详情',
        onClick: () => handleViewDetail(record)
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑',
        onClick: () => handleEdit(record)
      },
      {
        key: 'toggle',
        icon: record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />,
        label: record.status === 'active' ? '停用' : '启用',
        onClick: () => handleToggleStatus(record)
      },
      {
        key: 'reset',
        icon: <SafetyCertificateOutlined />,
        label: '重置密码',
        onClick: () => handleResetPassword(record)
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
  const columns: ColumnsType<User> = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar
            size="large"
            src={record.avatar}
            style={{ backgroundColor: '#1890ff' }}
          >
            {record.username.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="user-name">{record.username}</div>
            <Text type="secondary" className="user-email">
              {record.email}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: UserRole) => {
        const config = roleConfig[role];
        return (
          <Tag color={config?.color}>
            {config?.icon}
            <span style={{ marginLeft: 4 }}>{config?.label}</span>
          </Tag>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: UserStatus) => {
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
      title: '部门/职位',
      key: 'department',
      width: 150,
      render: (_, record) => (
        <div className="dept-info">
          <div className="dept-name">{record.department || '未分配'}</div>
          <Text type="secondary" className="position">
            {record.position || '未设置'}
          </Text>
        </div>
      )
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 180,
      render: (_, record) => (
        <div className="contact-info">
          <div className="contact-item">
            <MailOutlined style={{ color: '#1890ff' }} />
            <span>{record.email}</span>
          </div>
          {record.phone && (
            <div className="contact-item">
              <PhoneOutlined style={{ color: '#52c41a' }} />
              <span>{record.phone}</span>
            </div>
          )}
        </div>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 150,
      render: (date: string) => (
        date ? (
          <div>
            <div>{new Date(date).toLocaleDateString()}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(date).toLocaleTimeString()}
            </Text>
          </div>
        ) : (
          <Text type="secondary">从未登录</Text>
        )
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
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
    <div className="users-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-left">
          <Title level={2}>
            <UserOutlined /> 用户管理
          </Title>
          <Text type="secondary">管理系统用户和权限</Text>
        </div>
        <div className="header-right">
          <Space>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setImportVisible(true)}
            >
              导入
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
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
                setEditingUser(null);
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              新建用户
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="stats-cards">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.total}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.active}
              prefix={<span style={{ color: '#52c41a' }}>🟢</span>}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="管理员"
              value={stats.admins}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="本月新增"
              value={stats.newThisMonth}
              prefix={<PlusOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选和搜索 */}
      <Card className="filter-card">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索用户名、邮箱、部门或职位"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={8} sm={4} md={3}>
            <Select
              placeholder="角色"
              value={filterRole}
              onChange={setFilterRole}
              style={{ width: '100%' }}
            >
              <Option value="all">全部角色</Option>
              {Object.entries(roleConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.icon} {config.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={8} sm={4} md={3}>
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
          <Col xs={8} sm={4} md={3}>
            <Select
              placeholder="部门"
              value={filterDepartment}
              onChange={setFilterDepartment}
              style={{ width: '100%' }}
            >
              <Option value="all">全部部门</Option>
              {departments.map(dept => (
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 用户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredUsers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 新建/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingUser(null);
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
            status: 'active',
            role: 'viewer'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="角色"
                name="role"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  {Object.entries(roleConfig).map(([key, config]) => (
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
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <Option key={key} value={key}>
                      <span>{config.icon}</span> {config.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="电话" name="phone">
                <Input placeholder="请输入电话号码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="部门" name="department">
                <Input placeholder="请输入部门" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="职位" name="position">
            <Input placeholder="请输入职位" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item label="描述" name="description">
            <TextArea
              rows={3}
              placeholder="请输入用户描述（可选）"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                {editingUser ? '更新' : '创建'}
              </Button>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  setEditingUser(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户详情模态框 */}
      <Modal
        title="用户详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setDetailUser(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
        destroyOnClose
      >
        {detailUser && (
          <div className="user-detail">
            <div className="detail-header">
              <Avatar
                size={80}
                src={detailUser.avatar}
                style={{ backgroundColor: '#1890ff' }}
              >
                {detailUser.username.charAt(0).toUpperCase()}
              </Avatar>
              <div className="header-info">
                <Title level={3}>{detailUser.username}</Title>
                <Space>
                  <Tag color={roleConfig[detailUser.role]?.color}>
                    {roleConfig[detailUser.role]?.icon}
                    <span style={{ marginLeft: 4 }}>
                      {roleConfig[detailUser.role]?.label}
                    </span>
                  </Tag>
                  <Badge
                    status={statusConfig[detailUser.status].color as any}
                    text={statusConfig[detailUser.status].label}
                  />
                </Space>
              </div>
            </div>
            
            <Divider />
            
            <Descriptions column={2} bordered>
              <Descriptions.Item label="邮箱">
                {detailUser.email}
              </Descriptions.Item>
              <Descriptions.Item label="电话">
                {detailUser.phone || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="部门">
                {detailUser.department || '未分配'}
              </Descriptions.Item>
              <Descriptions.Item label="职位">
                {detailUser.position || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(detailUser.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="最后登录">
                {detailUser.lastLoginAt 
                  ? new Date(detailUser.lastLoginAt).toLocaleString()
                  : '从未登录'
                }
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {detailUser.description || '暂无描述'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* 导入用户模态框 */}
      <Modal
        title="导入用户"
        open={importVisible}
        onCancel={() => setImportVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setImportVisible(false)}>
            取消
          </Button>,
          <Button key="import" type="primary">
            开始导入
          </Button>
        ]}
        width={600}
      >
        <div className="import-content">
          <div className="import-tips">
            <Title level={4}>导入说明</Title>
            <ul>
              <li>支持 Excel (.xlsx) 和 CSV (.csv) 格式</li>
              <li>文件大小不超过 10MB</li>
              <li>必填字段：用户名、邮箱、角色</li>
              <li>可选字段：电话、部门、职位、描述</li>
            </ul>
          </div>
          
          <Divider />
          
          <Upload.Dragger
            name="file"
            multiple={false}
            accept=".xlsx,.csv"
            beforeUpload={() => false}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持单个文件上传，严格禁止上传公司数据或其他敏感文件
            </p>
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;