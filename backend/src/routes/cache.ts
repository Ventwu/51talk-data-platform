import { Router } from 'express';
import { cacheController } from '../controllers/cacheController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * @route GET /api/cache
 * @desc 获取缓存列表
 * @access Admin
 * @query {
 *   key?: string,
 *   status?: 'expired' | 'valid',
 *   page?: number,
 *   limit?: number
 * }
 */
router.get('/', adminMiddleware, asyncHandler(cacheController.getCaches.bind(cacheController)));

/**
 * @route GET /api/cache/stats
 * @desc 获取缓存统计信息
 * @access Admin
 */
router.get('/stats', adminMiddleware, asyncHandler(cacheController.getCacheStats.bind(cacheController)));

/**
 * @route POST /api/cache/clean
 * @desc 清理过期缓存
 * @access Admin
 */
router.post('/clean', adminMiddleware, asyncHandler(cacheController.cleanExpiredCaches.bind(cacheController)));

/**
 * @route GET /api/cache/key/:key
 * @desc 根据key获取缓存
 * @access Private
 */
router.get('/key/:key', asyncHandler(cacheController.getCacheByKey.bind(cacheController)));

/**
 * @route DELETE /api/cache/key/:key
 * @desc 根据key删除缓存
 * @access Admin
 */
router.delete('/key/:key', adminMiddleware, asyncHandler(cacheController.deleteCacheByKey.bind(cacheController)));

/**
 * @route GET /api/cache/:id
 * @desc 获取单个缓存详情
 * @access Admin
 */
router.get('/:id', adminMiddleware, asyncHandler(cacheController.getCache.bind(cacheController)));

/**
 * @route POST /api/cache
 * @desc 创建或更新缓存
 * @access Private
 * @body {
 *   key: string,
 *   value: any,
 *   expiresIn?: number // 过期时间（秒）
 * }
 */
router.post('/', asyncHandler(cacheController.setCache.bind(cacheController)));

/**
 * @route DELETE /api/cache/:id
 * @desc 删除单个缓存
 * @access Admin
 */
router.delete('/:id', adminMiddleware, asyncHandler(cacheController.deleteCache.bind(cacheController)));

/**
 * @route DELETE /api/cache
 * @desc 批量删除缓存
 * @access Admin
 * @body {
 *   ids?: number[],
 *   keys?: string[],
 *   pattern?: string,
 *   expired?: boolean
 * }
 */
router.delete('/', adminMiddleware, asyncHandler(cacheController.deleteCaches.bind(cacheController)));

export default router;