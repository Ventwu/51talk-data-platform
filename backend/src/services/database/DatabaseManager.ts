import { DatabaseAdapter, DatabaseConfig } from './DatabaseAdapter';
import { DatabaseAdapterFactory } from './DatabaseAdapter';

/**
 * 数据库连接管理器
 * 负责管理多个数据库连接，提供连接池和连接复用功能
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private connections: Map<string, DatabaseAdapter> = new Map();
  private configs: Map<string, DatabaseConfig> = new Map();

  private constructor() {}

  /**
   * 获取数据库管理器单例
   */
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 添加数据库配置
   */
  addConfig(name: string, config: DatabaseConfig): void {
    this.configs.set(name, config);
    console.log(`📝 数据库配置已添加: ${name} (${config.type})`);
  }

  /**
   * 获取数据库连接
   */
  async getConnection(name: string): Promise<DatabaseAdapter> {
    // 如果连接已存在且已连接，直接返回
    if (this.connections.has(name)) {
      const adapter = this.connections.get(name)!;
      if (adapter.isConnectionActive()) {
        return adapter;
      }
      // 如果连接已断开，重新连接
      try {
        await adapter.connect();
        return adapter;
      } catch (error) {
        console.error(`重新连接数据库失败: ${name}`, error);
        this.connections.delete(name);
      }
    }

    // 创建新连接
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`数据库配置不存在: ${name}`);
    }

    try {
      const adapter = await DatabaseAdapterFactory.create(config);
      await adapter.connect();
      this.connections.set(name, adapter);
      console.log(`🔗 数据库连接已建立: ${name}`);
      return adapter;
    } catch (error) {
      console.error(`创建数据库连接失败: ${name}`, error);
      throw error;
    }
  }

  /**
   * 测试数据库连接
   */
  async testConnection(name: string): Promise<boolean> {
    try {
      const adapter = await this.getConnection(name);
      return await adapter.testConnection();
    } catch (error) {
      console.error(`测试数据库连接失败: ${name}`, error);
      return false;
    }
  }

  /**
   * 获取所有数据库连接状态
   */
  async getAllConnectionStatus(): Promise<Array<{ name: string; status: boolean; info?: any }>> {
    const results = [];
    
    for (const [name] of this.configs) {
      try {
        const isConnected = await this.testConnection(name);
        let info = null;
        
        if (isConnected) {
          const adapter = this.connections.get(name);
          if (adapter) {
            info = await adapter.getConnectionInfo();
          }
        }
        
        results.push({
          name,
          status: isConnected,
          info
        });
      } catch (error) {
        results.push({
          name,
          status: false,
          info: { error: error instanceof Error ? error.message : '未知错误' }
        });
      }
    }
    
    return results;
  }

  /**
   * 关闭指定数据库连接
   */
  async closeConnection(name: string): Promise<void> {
    const adapter = this.connections.get(name);
    if (adapter) {
      try {
        await adapter.disconnect();
        this.connections.delete(name);
        console.log(`🔌 数据库连接已关闭: ${name}`);
      } catch (error) {
        console.error(`关闭数据库连接失败: ${name}`, error);
        throw error;
      }
    }
  }

  /**
   * 关闭所有数据库连接
   */
  async closeAllConnections(): Promise<void> {
    const closePromises = [];
    
    for (const [name] of this.connections) {
      closePromises.push(this.closeConnection(name));
    }
    
    await Promise.all(closePromises);
    console.log('🔌 所有数据库连接已关闭');
  }

  /**
   * 移除数据库配置
   */
  async removeConfig(name: string): Promise<void> {
    // 先关闭连接
    if (this.connections.has(name)) {
      await this.closeConnection(name);
    }
    
    // 移除配置
    this.configs.delete(name);
    console.log(`🗑️ 数据库配置已移除: ${name}`);
  }

  /**
   * 获取所有配置的数据库名称
   */
  getConfigNames(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * 获取数据库配置
   */
  getConfig(name: string): DatabaseConfig | undefined {
    return this.configs.get(name);
  }

  /**
   * 检查数据库配置是否存在
   */
  hasConfig(name: string): boolean {
    return this.configs.has(name);
  }

  /**
   * 获取连接统计信息
   */
  getConnectionStats(): {
    totalConfigs: number;
    activeConnections: number;
    configNames: string[];
    connectionNames: string[];
  } {
    return {
      totalConfigs: this.configs.size,
      activeConnections: this.connections.size,
      configNames: Array.from(this.configs.keys()),
      connectionNames: Array.from(this.connections.keys())
    };
  }
}

// 导出单例实例
export const databaseManager = DatabaseManager.getInstance();