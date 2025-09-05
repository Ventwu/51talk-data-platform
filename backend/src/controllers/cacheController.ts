import { Request, Response } from 'express';
import { executeQuery } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logOperation } from '../middleware/logging';

/**
 * 数据缓存控制器
 */
export class CacheController {
  /**
   * 获取缓存列表
   */
  async getCaches(req: Request, res: Response): Promise<void> {
    try {
      const { 
        key, 
        status, 
        page = 1, 
        limit = 20 
      } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);
      const whereConditions: string[] = [];
      const params: any[] = [];
      
      if (key) {
        whereConditions.push('cache_key LIKE ?');
        params.push(`%${key}%`);
      }
      
      if (status) {
        if (status === 'expired') {
          whereConditions.push('expires_at < datetime("now")');
        } else if (status === 'valid') {
          whereConditions.push('(expires_at IS NULL OR expires_at > datetime("now"))');
        }
      }
      
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM data_cache 
        ${whereClause}
      `;
      
      const dataQuery = `
        SELECT 
          id,
          cache_key,
          CASE 
            WHEN LENGTH(cache_value) > 100 
            THEN CONCAT(LEFT(cache_value, 100), '...')
            ELSE cache_value
          END as cache_value_preview,
          LENGTH(cache_value) as cache_size,
          expires_at,
          created_at,
          updated_at,
          CASE 
            WHEN expires_at IS NULL THEN 'permanent'
            WHEN expires_at > datetime("now") THEN 'valid'
            ELSE 'expired'
          END as status
        FROM data_cache
        ${whereClause}
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [countResult, caches] = await Promise.all([
        executeQuery(countQuery, params),
        executeQuery(dataQuery, [...params, Number(limit), offset]),
      ]);
      
      const total = countResult[0]?.total || 0;
      
      res.json({
        success: true,
        data: {
          caches,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('获取缓存列表失败:', error);
      throw new AppError('获取缓存列表失败', 500);
    }
  }
  
  /**
   * 获取单个缓存详情
   */
  async getCache(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const caches = await executeQuery(
        `SELECT 
          id,
          cache_key,
          cache_value,
          expires_at,
          created_at,
          updated_at,
          CASE 
            WHEN expires_at IS NULL THEN 'permanent'
            WHEN expires_at > datetime("now") THEN 'valid'
            ELSE 'expired'
          END as status
        FROM data_cache 
        WHERE id = ?`,
        [id]
      );
      
      if (!caches || caches.length === 0) {
        throw new AppError('缓存不存在', 404);
      }
      
      const cache = caches[0];
      
      // 尝试解析JSON格式的缓存值
      try {
        cache.cache_value = JSON.parse(cache.cache_value);
      } catch {
        // 如果不是JSON格式，保持原样
      }
      
      res.json({
        success: true,
        data: cache,
      });
    } catch (error) {
      console.error('获取缓存详情失败:', error);
      throw new AppError('获取缓存详情失败', 500);
    }
  }
  
  /**
   * 根据key获取缓存
   */
  async getCacheByKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      
      const caches = await executeQuery(
        `SELECT 
          id,
          cache_key,
          cache_value,
          expires_at,
          created_at,
          updated_at,
          CASE 
            WHEN expires_at IS NULL THEN 'permanent'
            WHEN expires_at > datetime("now") THEN 'valid'
            ELSE 'expired'
          END as status
        FROM data_cache 
        WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > datetime("now"))`,
        [key]
      );
      
      if (!caches || caches.length === 0) {
        throw new AppError('缓存不存在或已过期', 404);
      }
      
      const cache = caches[0];
      
      // 尝试解析JSON格式的缓存值
      try {
        cache.cache_value = JSON.parse(cache.cache_value);
      } catch {
        // 如果不是JSON格式，保持原样
      }
      
      res.json({
        success: true,
        data: cache,
      });
    } catch (error) {
      console.error('获取缓存失败:', error);
      throw new AppError('获取缓存失败', 500);
    }
  }
  
  /**
   * 创建或更新缓存
   */
  async setCache(req: Request, res: Response): Promise<void> {
    try {
      const { key, value, expiresIn } = req.body;
      const userId = (req as any).user?.id;
      
      if (!key || value === undefined) {
        throw new AppError('缓存键和值不能为空', 400);
      }
      
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
      
      let result;
      if (existing && existing.length > 0) {
        // 更新现有缓存
        result = await executeQuery(
          'UPDATE data_cache SET cache_value = ?, expires_at = ?, updated_at = datetime("now") WHERE cache_key = ?',
          [cacheValue, expiresAt, key]
        );
        
        await logOperation(
          userId,
          '更新缓存',
          '数据缓存',
          key,
          { key, expiresIn },
          req.ip,
          req.get('User-Agent')
        );
      } else {
        // 创建新缓存
        result = await executeQuery(
          'INSERT INTO data_cache (cache_key, cache_value, expires_at) VALUES (?, ?, ?)',
          [key, cacheValue, expiresAt]
        );
        
        await logOperation(
          userId,
          '创建缓存',
          '数据缓存',
          key,
          { key, expiresIn },
          req.ip,
          req.get('User-Agent')
        );
      }
      
      // 获取最新的缓存信息
      const newCache = await executeQuery(
        `SELECT 
          id,
          cache_key,
          cache_value,
          expires_at,
          created_at,
          updated_at
        FROM data_cache 
        WHERE cache_key = ?`,
        [key]
      );
      
      res.json({
        success: true,
        data: newCache[0],
        message: existing && existing.length > 0 ? '缓存更新成功' : '缓存创建成功',
      });
    } catch (error) {
      console.error('设置缓存失败:', error);
      throw new AppError('设置缓存失败', 500);
    }
  }
  
  /**
   * 删除缓存
   */
  async deleteCache(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      // 获取缓存信息用于日志记录
      const cache = await executeQuery(
        'SELECT cache_key FROM data_cache WHERE id = ?',
        [id]
      );
      
      if (!cache || cache.length === 0) {
        throw new AppError('缓存不存在', 404);
      }
      
      await executeQuery('DELETE FROM data_cache WHERE id = ?', [id]);
      
      await logOperation(
        userId,
        '删除缓存',
        '数据缓存',
        cache[0].cache_key,
        { id },
        req.ip,
        req.get('User-Agent')
      );
      
      res.json({
        success: true,
        message: '缓存删除成功',
      });
    } catch (error) {
      console.error('删除缓存失败:', error);
      throw new AppError('删除缓存失败', 500);
    }
  }
  
  /**
   * 根据key删除缓存
   */
  async deleteCacheByKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const userId = (req as any).user?.id;
      
      const result = await executeQuery(
        'DELETE FROM data_cache WHERE cache_key = ?',
        [key]
      );
      
      if (result.affectedRows === 0) {
        throw new AppError('缓存不存在', 404);
      }
      
      await logOperation(
        userId,
        '删除缓存',
        '数据缓存',
        key,
        { key },
        req.ip,
        req.get('User-Agent')
      );
      
      res.json({
        success: true,
        message: '缓存删除成功',
      });
    } catch (error) {
      console.error('清空缓存失败:', error);
      throw new AppError('清空缓存失败', 500);
    }
  }
  
  /**
   * 批量删除缓存
   */
  async deleteCaches(req: Request, res: Response): Promise<void> {
    try {
      const { ids, keys, pattern, expired } = req.body;
      const userId = (req as any).user?.id;
      
      let deletedCount = 0;
      
      if (ids && Array.isArray(ids) && ids.length > 0) {
        // 删除指定ID的缓存
        const placeholders = ids.map(() => '?').join(',');
        const result = await executeQuery(
          `DELETE FROM data_cache WHERE id IN (${placeholders})`,
          ids
        );
        deletedCount = result.affectedRows;
        
        await logOperation(
          userId,
          '批量删除缓存',
          '数据缓存',
          undefined,
          { ids },
          req.ip,
          req.get('User-Agent')
        );
      } else if (keys && Array.isArray(keys) && keys.length > 0) {
        // 删除指定key的缓存
        const placeholders = keys.map(() => '?').join(',');
        const result = await executeQuery(
          `DELETE FROM data_cache WHERE cache_key IN (${placeholders})`,
          keys
        );
        deletedCount = result.affectedRows;
        
        await logOperation(
          userId,
          '批量删除缓存',
          '数据缓存',
          undefined,
          { keys },
          req.ip,
          req.get('User-Agent')
        );
      } else if (pattern) {
        // 删除匹配模式的缓存
        const result = await executeQuery(
          'DELETE FROM data_cache WHERE cache_key LIKE ?',
          [`%${pattern}%`]
        );
        deletedCount = result.affectedRows;
        
        await logOperation(
          userId,
          '批量删除缓存',
          '数据缓存',
          undefined,
          { pattern },
          req.ip,
          req.get('User-Agent')
        );
      } else if (expired) {
        // 删除过期缓存
        const result = await executeQuery(
          'DELETE FROM data_cache WHERE expires_at < datetime("now")'
        );
        deletedCount = result.affectedRows;
        
        await logOperation(
          userId,
          '清理过期缓存',
          '数据缓存',
          undefined,
          { expired: true },
          req.ip,
          req.get('User-Agent')
        );
      } else {
        throw new AppError('请提供要删除的缓存条件', 400);
      }
      
      res.json({
        success: true,
        message: `成功删除 ${deletedCount} 条缓存`,
        data: { deletedCount },
      });
    } catch (error) {
      console.error('批量删除缓存失败:', error);
      throw new AppError('批量删除缓存失败', 500);
    }
  }
  
  /**
   * 获取缓存统计信息
   */
  async getCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const [totalStats, sizeStats, expirationStats] = await Promise.all([
        // 总体统计
        executeQuery(
          `SELECT 
            COUNT(*) as total_count,
            COUNT(CASE WHEN expires_at IS NULL OR expires_at > datetime("now") THEN 1 END) as valid_count,
            COUNT(CASE WHEN expires_at < datetime("now") THEN 1 END) as expired_count,
            SUM(LENGTH(cache_value)) as total_size
          FROM data_cache`
        ),
        // 大小分布统计
        executeQuery(
          `SELECT 
            CASE 
              WHEN LENGTH(cache_value) < 1024 THEN 'small'
              WHEN LENGTH(cache_value) < 10240 THEN 'medium'
              WHEN LENGTH(cache_value) < 102400 THEN 'large'
              ELSE 'xlarge'
            END as size_category,
            COUNT(*) as count
          FROM data_cache
          GROUP BY size_category`
        ),
        // 过期时间分布
        executeQuery(
          `SELECT 
            CASE 
              WHEN expires_at IS NULL THEN 'permanent'
              WHEN expires_at > DATE_ADD(NOW(), INTERVAL 1 DAY) THEN 'long_term'
              WHEN expires_at > DATE_ADD(NOW(), INTERVAL 1 HOUR) THEN 'medium_term'
              WHEN expires_at > NOW() THEN 'short_term'
              ELSE 'expired'
            END as expiration_category,
            COUNT(*) as count
          FROM data_cache
          GROUP BY expiration_category`
        ),
      ]);
      
      res.json({
        success: true,
        data: {
          total: totalStats[0],
          sizeDistribution: sizeStats,
          expirationDistribution: expirationStats,
        },
      });
    } catch (error) {
      console.error('获取缓存统计信息失败:', error);
      throw new AppError('获取缓存统计信息失败', 500);
    }
  }
  
  /**
   * 清理过期缓存
   */
  async cleanExpiredCaches(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      const result = await executeQuery(
        'DELETE FROM data_cache WHERE expires_at < NOW()'
      );
      
      await logOperation(
        userId,
        '清理过期缓存',
        '数据缓存',
        undefined,
        { deletedCount: result.affectedRows },
        req.ip,
        req.get('User-Agent')
      );
      
      res.json({
        success: true,
        message: `成功清理 ${result.affectedRows} 条过期缓存`,
        data: { deletedCount: result.affectedRows },
      });
    } catch (error) {
      console.error('清理过期缓存失败:', error);
      throw new AppError('清理过期缓存失败', 500);
    }
  }
}

// 导出控制器实例
export const cacheController = new CacheController();