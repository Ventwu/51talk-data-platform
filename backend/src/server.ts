import app from './app';
import { initDatabase, closeDatabase } from './config/database';
import { initializeDatabaseConfigs } from './config/databases';
import { initSequelize, closeSequelize } from './config/sequelize';
import { databaseManager } from './services/database/DatabaseManager';
import { schedulerService } from './services/scheduler/SchedulerService';
import { AppError } from './middleware/errorHandler';

const PORT = process.env.PORT || 3001;

/**
 * 启动服务器
 */
async function startServer() {
  try {
    // 初始化主数据库连接
    console.log('🔧 Initializing main database connection...');
    await initDatabase();
    console.log('✅ Main database connection initialized');
    
    // 初始化Sequelize连接
    console.log('🔧 Initializing Sequelize connection...');
    await initSequelize();
    console.log('✅ Sequelize connection initialized');
    
    // 初始化数据库配置
    console.log('🔧 Initializing database configurations...');
    await initializeDatabaseConfigs();
    console.log('✅ Database configurations initialized');
    
    // 初始化定时任务服务
    console.log('⏰ Initializing scheduler service...');
    await schedulerService.initialize();
    console.log('✅ Scheduler service initialized');

    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });

    // 优雅关闭处理
    const gracefulShutdown = (signal: string) => {
      console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
          // 停止所有定时任务
          schedulerService.stopAllTasks();
          console.log('⏰ All scheduled tasks stopped');
          
          // 关闭所有数据库连接
          await databaseManager.closeAllConnections();
          console.log('🗄️ All database connections closed');
          
          // 关闭Sequelize连接
          await closeSequelize();
          console.log('🗄️ Sequelize connection closed');
          
          // 关闭主数据库连接
          await closeDatabase();
          console.log('🗄️ Main database connection closed');
          
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // 强制退出超时
      setTimeout(() => {
        console.error('⏰ Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 10000);
    };

    // 监听退出信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 监听未捕获的异常
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    if (error instanceof AppError) {
      console.error(`Status: ${error.statusCode}, Message: ${error.message}`);
    }
    
    process.exit(1);
  }
}

// 启动服务器
startServer();

// 导出app用于测试
export default app;