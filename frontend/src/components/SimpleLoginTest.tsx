import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

interface LoginData {
  email: string;
  password: string;
}

const SimpleLoginTest: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: LoginData) => {
    console.log('=== 表单提交测试 ===');
    console.log('提交的数据:', values);
    console.log('邮箱:', values.email);
    console.log('密码:', values.password);
    
    setLoading(true);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('登录测试成功！');
      console.log('登录测试完成');
    } catch (error) {
      console.error('登录测试失败:', error);
      message.error('登录测试失败');
    } finally {
      setLoading(false);
    }
  };

  const handleValuesChange = (changedValues: any, allValues: any) => {
    console.log('表单值变化:', changedValues);
    console.log('所有值:', allValues);
  };

  return (
    <div style={{ 
      padding: '50px', 
      background: '#f0f2f5', 
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Card 
        title="简单登录测试" 
        style={{ width: 400 }}
        extra={
          <Button 
            type="link" 
            onClick={() => {
              console.log('当前表单值:', form.getFieldsValue());
              message.info('请查看控制台输出');
            }}
          >
            检查表单值
          </Button>
        }
      >
        <Form
          form={form}
          name="simple-login-test"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
          autoComplete="off"
          layout="vertical"
          initialValues={{
            email: 'test@example.com',
            password: 'test123'
          }}
        >
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效邮箱' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 3, message: '密码至少3位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              测试登录
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: 20, padding: 10, background: '#f8f8f8', borderRadius: 4 }}>
          <h4>测试说明:</h4>
          <ul>
            <li>输入框应该显示默认值</li>
            <li>修改输入框时控制台会输出变化</li>
            <li>点击"检查表单值"查看当前值</li>
            <li>提交表单时控制台会输出详细信息</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default SimpleLoginTest;