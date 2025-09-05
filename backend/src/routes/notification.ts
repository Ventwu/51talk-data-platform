import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @route GET /api/notifications
 * @desc 获取通知配置列表
 * @access Private
 */
router.get('/', asyncHandler(notificationController.getNotificationConfigs.bind(notificationController)));

/**
 * @route GET /api/notifications/types
 * @desc 获取支持的通知类型
 * @access Private
 */
router.get('/types', asyncHandler(notificationController.getSupportedTypes.bind(notificationController)));

/**
 * @route GET /api/notifications/:id
 * @desc 获取单个通知配置
 * @access Private
 */
router.get('/:id', asyncHandler(notificationController.getNotificationConfig.bind(notificationController)));

/**
 * @route POST /api/notifications
 * @desc 创建通知配置
 * @access Private
 */
router.post('/', asyncHandler(notificationController.createNotificationConfig.bind(notificationController)));

/**
 * @route PUT /api/notifications/:id
 * @desc 更新通知配置
 * @access Private
 */
router.put('/:id', asyncHandler(notificationController.updateNotificationConfig.bind(notificationController)));

/**
 * @route DELETE /api/notifications/:id
 * @desc 删除通知配置
 * @access Private
 */
router.delete('/:id', asyncHandler(notificationController.deleteNotificationConfig.bind(notificationController)));

/**
 * @route POST /api/notifications/:id/test
 * @desc 测试通知配置
 * @access Private
 */
router.post('/:id/test', asyncHandler(notificationController.testNotificationConfig.bind(notificationController)));

export default router;