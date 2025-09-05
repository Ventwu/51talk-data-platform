import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// 导入路由
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import dataSourceRoutes from './routes/dataSource';
import chartRoutes from './routes/chart';
import scheduleRoutes from './routes/schedule';
import notificationRoutes from './routes/notification';
import userRoutes from './routes/user';
import systemRoutes from './routes/system';
import logRoutes from './routes/log';
import cacheRoutes from './routes/cache';

// 导入中间件
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// 导入数据库配置
import { initializeDatabaseConfigs } from './config/databases';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// 请求日志
app.use(morgan('combined'));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路径欢迎页面
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用51Talk数据中台API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      dataSource: '/api/data-source',
      chart: '/api/chart',
      schedules: '/api/schedules',
      notifications: '/api/notifications',
      users: '/api/users',
      system: '/api/system',
      logs: '/api/logs',
      cache: '/api/cache'
    },
    documentation: 'https://github.com/51talk/data-platform/blob/main/docs/API.md'
  });
});

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/data-source', authMiddleware, dataSourceRoutes);
app.use('/api/chart', authMiddleware, chartRoutes);
app.use('/api/schedules', authMiddleware, scheduleRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/cache', cacheRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// 错误处理中间件
app.use(errorHandler);

export default app;