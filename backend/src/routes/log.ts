import { Router } from 'express';
import { logController } from '../controllers/logController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * @route GET /api/logs
 * @desc 获取操作日志列表
 * @access Admin
 * @query {
 *   userId?: string,
 *   action?: string,
 *   resource?: string,
 *   startDate?: string,
 *   endDate?: string,
 *   page?: number,
 *   limit?: number
 * }
 */
router.get('/', adminMiddleware, asyncHandler(logController.getOperationLogs.bind(logController)));

/**
 * @route GET /api/logs/stats
 * @desc 获取操作统计信息
 * @access Admin
 * @query {
 *   startDate?: string,
 *   endDate?: string
 * }
 */
router.get('/stats', adminMiddleware, asyncHandler(logController.getOperationStats.bind(logController)));

/**
 * @route GET /api/logs/export
 * @desc 导出操作日志
 * @access Admin
 * @query {
 *   userId?: string,
 *   action?: string,
 *   resource?: string,
 *   startDate?: string,
 *   endDate?: string,
 *   format?: 'csv' | 'json'
 * }
 */
router.get('/export', adminMiddleware, asyncHandler(logController.exportOperationLogs.bind(logController)));

/**
 * @route GET /api/logs/:id
 * @desc 获取单个操作日志详情
 * @access Admin
 */
router.get('/:id', adminMiddleware, asyncHandler(logController.getOperationLog.bind(logController)));

/**
 * @route POST /api/logs
 * @desc 记录操作日志
 * @access Private
 * @body {
 *   action: string,
 *   resourceType: string,
 *   resourceId?: string,
 *   details?: object
 * }
 */
router.post('/', asyncHandler(logController.createOperationLog.bind(logController)));

/**
 * @route DELETE /api/logs
 * @desc 批量删除操作日志
 * @access Admin
 * @body {
 *   ids?: number[],
 *   beforeDate?: string
 * }
 */
router.delete('/', adminMiddleware, asyncHandler(logController.deleteOperationLogs.bind(logController)));

export default router;