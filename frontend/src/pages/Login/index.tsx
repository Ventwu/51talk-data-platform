// 登录页面组件
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  Alert,
  Checkbox,
  theme,
  Switch,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  SunOutlined,
  MoonOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { useAppStore } from '@/store';
import type { UserLoginRequest } from '@/types';
import './index.css';

const { Title, Text, Link } = Typography;

// 登录表单数据类型
interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

// 登录页面组件
const LoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginFormData>();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error } = useAuth();
  const { theme: currentTheme, language, setTheme, setLanguage } = useAppStore();
  const [loginError, setLoginError] = useState<string>('');

  const {
    token: { colorBgContainer, colorPrimary },
  } = theme.useToken();

  // 获取重定向路径
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // 处理登录
  const handleLogin = async (values: LoginFormData) => {
    try {
      setLoginError('');
      
      // 调试信息：打印表单数据
      console.log('Login form values:', values);
      console.log('Email:', values.email);
      console.log('Password:', values.password);
      
      // 调用login函数，传递email和password参数
      await login(values.email, values.password);
      
    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError(err.message || '登录失败，请检查用户名和密码');
    }
  };

  // 处理主题切换
  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  // 处理语言切换
  const handleLanguageChange = () => {
    setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  // 清除错误信息
  useEffect(() => {
    if (error) {
      setLoginError(error);
    }
  }, [error]);

  // 表单验证规则
  const validationRules = {
    email: [
      { required: true, message: '请输入邮箱地址' },
      { type: 'email' as const, message: '请输入有效的邮箱地址' },
    ],
    password: [
      { required: true, message: '请输入密码' },
      { min: 6, message: '密码长度至少6位' },
    ],
  };

  return (
    <div className="login-page" data-theme={currentTheme}>
      {/* 背景装饰 */}
      <div className="login-background">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
      </div>

      {/* 顶部工具栏 */}
      <div className="login-toolbar">
        <Space>
          {/* 主题切换 */}
          <Switch
            checked={currentTheme === 'dark'}
            onChange={handleThemeChange}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            size="small"
          />
          
          {/* 语言切换 */}
          <Button
            type="text"
            icon={<GlobalOutlined />}
            onClick={handleLanguageChange}
            size="small"
          >
            {language === 'zh-CN' ? 'EN' : '中文'}
          </Button>
        </Space>
      </div>

      {/* 登录容器 */}
      <div className="login-container">
        {/* 左侧信息区域 */}
        <div className="login-info">
          <div className="info-content">
            <img
              src="/logo.svg"
              alt="51Talk"
              className="info-logo"
            />
            <Title level={1} className="info-title">
              51Talk 数据中台
            </Title>
            <Text className="info-subtitle">
              智能数据分析 · 可视化报表 · 业务洞察
            </Text>
            
            <div className="info-features">
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div className="feature-text">
                  <div className="feature-title">实时数据分析</div>
                  <div className="feature-desc">多维度数据分析，实时监控业务指标</div>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">📈</div>
                <div className="feature-text">
                  <div className="feature-title">可视化报表</div>
                  <div className="feature-desc">丰富的图表类型，直观展示数据趋势</div>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <div className="feature-text">
                  <div className="feature-title">业务洞察</div>
                  <div className="feature-desc">深度挖掘数据价值，助力业务决策</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧登录表单 */}
        <div className="login-form-container">
          <Card
            className="login-card"
            style={{ background: colorBgContainer }}
          >
            <div className="login-header">
              <Title level={2} className="login-title">
                欢迎登录
              </Title>
              <Text type="secondary" className="login-subtitle">
                请输入您的账号信息
              </Text>
            </div>

            {/* 错误提示 */}
            {loginError && (
              <Alert
                message={loginError}
                type="error"
                showIcon
                closable
                onClose={() => setLoginError('')}
                className="login-error"
              />
            )}

            {/* 登录表单 */}
            <Form
              form={form}
              name="login"
              onFinish={handleLogin}
              onValuesChange={(changedValues, allValues) => {
                console.log('Form values changed:', changedValues, allValues);
              }}
              autoComplete="off"
              size="large"
              className="login-form"
              initialValues={{
                remember: true,
                email: 'admin@51talk.com',
                password: 'admin123',
              }}
            >
              <Form.Item
                name="email"
                rules={validationRules.email}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入邮箱地址"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={validationRules.password}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item>
                <div className="login-options">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>记住我</Checkbox>
                  </Form.Item>
                  <Link className="forgot-password">
                    忘记密码？
                  </Link>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="login-button"
                  style={{ backgroundColor: colorPrimary }}
                >
                  {loading ? '登录中...' : '登录'}
                </Button>
              </Form.Item>
            </Form>

            <Divider plain>
              <Text type="secondary">其他登录方式</Text>
            </Divider>

            {/* 其他登录方式 */}
            <div className="login-alternatives">
              <Button
                type="default"
                block
                className="sso-button"
                disabled
              >
                SSO 单点登录
              </Button>
            </div>

            {/* 注册链接 */}
            <div className="login-footer">
              <Text type="secondary">
                还没有账号？
                <Link onClick={() => navigate('/register')}>
                  立即注册
                </Link>
              </Text>
            </div>
          </Card>
        </div>
      </div>

      {/* 页脚 */}
      <div className="login-page-footer">
        <Text type="secondary" className="footer-text">
          © 2024 51Talk. All rights reserved.
        </Text>
      </div>
    </div>
  );
};

export default LoginPage;