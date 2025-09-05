import { executeQuery } from '../config/database';

/**
 * 缓存服务类
 * 提供便捷的缓存操作方法
 */
export class CacheService {
  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值，如果不存在或已过期返回null
   */
  async get(key: string): Promise<any> {
    try {
      const result = await executeQuery(
        `SELECT cache_value 
         FROM data_cache 
         WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > datetime("now"))`,
        [key]
      );
      
      if (!result || result.length === 0) {
        return null;
      }
      
      const cacheValue = result[0].cache_value;
      
      // 尝试解析JSON
      try {
        return JSON.parse(cacheValue);
      } catch {
        return cacheValue;
      }
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  }
  
  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param expiresIn 过期时间（秒），不传则永不过期
   * @returns 是否设置成功
   */
  async set(key: string, value: any, expiresIn?: number): Promise<boolean> {
    try {
      // 计算过期时间
      let expiresAt = null;
      if (expiresIn && expiresIn > 0) {
        expiresAt = new Date(Date.now() + expiresIn * 1000);
      }
      
      // 序列化值
      const cacheValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      // 检查是否已存在
      const existing = await executeQuery(
        'SELECT id FROM data_cache WHERE cache_key = ?',
        [key]
      );
      
      if (existing && existing.length > 0) {
        // 更新现有缓存
        await executeQuery(
          'UPDATE data_cache SET cache_value = ?, expires_at = ?, updated_at = datetime("now") WHERE cache_key = ?',
          [cacheValue, expiresAt, key]
        );
      } else {
        // 创建新缓存
        await executeQuery(
          'INSERT INTO data_cache (cache_key, cache_value, expires_at) VALUES (?, ?, ?)',
          [key, cacheValue, expiresAt]
        );
      }
      
      return true;
    } catch (error) {
      console.error('设置缓存失败:', error);
      return false;
    }
  }
  
  /**
   * 删除缓存
   * @param key 缓存键
   * @returns 是否删除成功
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await executeQuery(
        'DELETE FROM data_cache WHERE cache_key = ?',
        [key]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除缓存失败:', error);
      return false;
    }
  }
  
  /**
   * 检查缓存是否存在且未过期
   * @param key 缓存键
   * @returns 是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await executeQuery(
        `SELECT 1 
         FROM data_cache 
         WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > datetime("now"))`,
        [key]
      );
      
      return result && result.length > 0;
    } catch (error) {
      console.error('检查缓存存在性失败:', error);
      return false;
    }
  }
  
  /**
   * 获取缓存的剩余过期时间
   * @param key 缓存键
   * @returns 剩余秒数，-1表示永不过期，null表示不存在或已过期
   */
  async ttl(key: string): Promise<number | null> {
    try {
      const result = await executeQuery(
        `SELECT expires_at 
         FROM data_cache 
         WHERE cache_key = ?`,
        [key]
      );
      
      if (!result || result.length === 0) {
        return null;
      }
      
      const expiresAt = result[0].expires_at;
      
      if (!expiresAt) {
        return -1; // 永不过期
      }
      
      const now = new Date();
      const expireTime = new Date(expiresAt);
      
      if (expireTime <= now) {
        return null; // 已过期
      }
      
      return Math.floor((expireTime.getTime() - now.getTime()) / 1000);
    } catch (error) {
      console.error('获取缓存TTL失败:', error);
      return null;
    }
  }
  
  /**
   * 批量获取缓存
   * @param keys 缓存键数组
   * @returns 键值对对象
   */
  async mget(keys: string[]): Promise<Record<string, any>> {
    if (!keys || keys.length === 0) {
      return {};
    }
    
    try {
      const placeholders = keys.map(() => '?').join(',');
      const result = await executeQuery(
        `SELECT cache_key, cache_value 
         FROM data_cache 
         WHERE cache_key IN (${placeholders}) AND (expires_at IS NULL OR expires_at > datetime("now"))`,
        keys
      );
      
      const cacheMap: Record<string, any> = {};
      
      for (const row of result) {
        const key = row.cache_key;
        const value = row.cache_value;
        
        try {
          cacheMap[key] = JSON.parse(value);
        } catch {
          cacheMap[key] = value;
        }
      }
      
      return cacheMap;
    } catch (error) {
      console.error('批量获取缓存失败:', error);
      return {};
    }
  }
  
  /**
   * 批量设置缓存
   * @param data 键值对对象
   * @param expiresIn 过期时间（秒）
   * @returns 设置成功的键数量
   */
  async mset(data: Record<string, any>, expiresIn?: number): Promise<number> {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return 0;
    }
    
    let successCount = 0;
    
    for (const key of keys) {
      const success = await this.set(key, data[key], expiresIn);
      if (success) {
        successCount++;
      }
    }
    
    return successCount;
  }
  
  /**
   * 批量删除缓存
   * @param keys 缓存键数组
   * @returns 删除成功的键数量
   */
  async mdel(keys: string[]): Promise<number> {
    if (!keys || keys.length === 0) {
      return 0;
    }
    
    try {
      const placeholders = keys.map(() => '?').join(',');
      const result = await executeQuery(
        `DELETE FROM data_cache WHERE cache_key IN (${placeholders})`,
        keys
      );
      
      return result.affectedRows;
    } catch (error) {
      console.error('批量删除缓存失败:', error);
      return 0;
    }
  }
  
  /**
   * 根据模式删除缓存
   * @param pattern 匹配模式
   * @returns 删除的数量
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const result = await executeQuery(
        'DELETE FROM data_cache WHERE cache_key LIKE ?',
        [`%${pattern}%`]
      );
      
      return result.affectedRows;
    } catch (error) {
      console.error('按模式删除缓存失败:', error);
      return 0;
    }
  }
  
  /**
   * 清理过期缓存
   * @returns 清理的数量
   */
  async cleanExpired(): Promise<number> {
    try {
      const result = await executeQuery(
        'DELETE FROM data_cache WHERE expires_at < datetime("now")'
      );
      
      return result.affectedRows;
    } catch (error) {
      console.error('清理过期缓存失败:', error);
      return 0;
    }
  }
  
  /**
   * 获取或设置缓存（如果不存在则通过回调函数获取值并设置）
   * @param key 缓存键
   * @param callback 获取值的回调函数
   * @param expiresIn 过期时间（秒）
   * @returns 缓存值
   */
  async getOrSet<T>(key: string, callback: () => Promise<T>, expiresIn?: number): Promise<T> {
    // 先尝试获取缓存
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // 缓存不存在，通过回调获取值
    const value = await callback();
    
    // 设置缓存
    await this.set(key, value, expiresIn);
    
    return value;
  }
  
  /**
   * 刷新缓存的过期时间
   * @param key 缓存键
   * @param expiresIn 新的过期时间（秒）
   * @returns 是否刷新成功
   */
  async refresh(key: string, expiresIn: number): Promise<boolean> {
    try {
      const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null;
      
      const result = await executeQuery(
        'UPDATE data_cache SET expires_at = ?, updated_at = datetime("now") WHERE cache_key = ?',
        [expiresAt, key]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('刷新缓存过期时间失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const cacheService = new CacheService();