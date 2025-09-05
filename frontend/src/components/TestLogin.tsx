import React, { useState } from 'react';
import { Form, Input, Button, Card, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

interface LoginFormData {
  email: string;
  password: string;
}

const TestLogin: React.FC = () => {
  const [form] = Form.useForm<LoginFormData>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleSubmit = async (values: LoginFormData) => {
    console.log('表单提交数据:', values);
    setLoading(true);
    setResult('');

    try {
      // 检查表单值
      const formValues = form.getFieldsValue();
      console.log('表单当前值:', formValues);
      
      // 模拟API调用
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values)
      });
      
      const data = await response.json();
      console.log('API响应:', data);
      
      if (response.ok) {
        setResult(`登录成功: ${JSON.stringify(data)}`);
      } else {
        setResult(`登录失败: ${data.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('登录错误:', error);
      setResult(`网络错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleValuesChange = (changedValues: Partial<LoginFormData>, allValues: LoginFormData) => {
    console.log('表单值变化:', { changedValues, allValues });
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: '20px' }}>
      <Card title="测试登录表单">
        <Form
          form={form}
          name="test-login"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
          autoComplete="off"
          initialValues={{
            email: 'admin@51talk.com',
            password: 'admin123'
          }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效邮箱' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入邮箱"
              onChange={(e) => console.log('邮箱输入:', e.target.value)}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              onChange={(e) => console.log('密码输入:', e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </Form.Item>
        </Form>

        {result && (
          <Alert
            message="测试结果"
            description={result}
            type={result.includes('成功') ? 'success' : 'error'}
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
          <p>当前表单值: {JSON.stringify(form.getFieldsValue())}</p>
          <p>打开浏览器控制台查看详细日志</p>
        </div>
      </Card>
    </div>
  );
};

export default TestLogin;