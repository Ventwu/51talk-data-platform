import { Router } from 'express';
import { systemController } from '../controllers/systemController';
import { asyncHandler } from '../middleware/errorHandler';
import { adminMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/system/info
 * @desc 获取系统信息
 * @access Admin
 */
router.get('/info', adminMiddleware, asyncHandler(systemController.getSystemInfo.bind(systemController)));

/**
 * @route GET /api/system/configs/public
 * @desc 获取公开的系统配置
 * @access Public
 */
router.get('/configs/public', asyncHandler(systemController.getPublicConfigs.bind(systemController)));

/**
 * @route GET /api/system/configs/categories
 * @desc 获取配置分类列表
 * @access Admin
 */
router.get('/configs/categories', adminMiddleware, asyncHandler(systemController.getConfigCategories.bind(systemController)));

/**
 * @route GET /api/system/configs
 * @desc 获取系统配置列表
 * @access Admin
 */
router.get('/configs', adminMiddleware, asyncHandler(systemController.getSystemConfigs.bind(systemController)));

/**
 * @route GET /api/system/configs/:key
 * @desc 获取单个系统配置
 * @access Admin
 */
router.get('/configs/:key', adminMiddleware, asyncHandler(systemController.getSystemConfig.bind(systemController)));

/**
 * @route POST /api/system/configs
 * @desc 创建系统配置
 * @access Admin
 */
router.post('/configs', adminMiddleware, asyncHandler(systemController.createSystemConfig.bind(systemController)));

/**
 * @route PUT /api/system/configs/:key
 * @desc 更新系统配置
 * @access Admin
 */
router.put('/configs/:key', adminMiddleware, asyncHandler(systemController.updateSystemConfig.bind(systemController)));

/**
 * @route DELETE /api/system/configs/:key
 * @desc 删除系统配置
 * @access Admin
 */
router.delete('/configs/:key', adminMiddleware, asyncHandler(systemController.deleteSystemConfig.bind(systemController)));

/**
 * @route PUT /api/system/configs/batch
 * @desc 批量更新系统配置
 * @access Admin
 */
router.put('/configs/batch', adminMiddleware, asyncHandler(systemController.batchUpdateConfigs.bind(systemController)));

export default router;