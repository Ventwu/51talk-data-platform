import { Router } from 'express';
import { scheduleController } from '../controllers/scheduleController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @route GET /api/schedules
 * @desc 获取定时任务列表
 * @access Private
 */
router.get('/', asyncHandler(scheduleController.getSchedules.bind(scheduleController)));

/**
 * @route GET /api/schedules/:id
 * @desc 获取单个定时任务详情
 * @access Private
 */
router.get('/:id', asyncHandler(scheduleController.getSchedule.bind(scheduleController)));

/**
 * @route POST /api/schedules
 * @desc 创建定时任务
 * @access Private
 */
router.post('/', asyncHandler(scheduleController.createSchedule.bind(scheduleController)));

/**
 * @route PUT /api/schedules/:id
 * @desc 更新定时任务
 * @access Private
 */
router.put('/:id', asyncHandler(scheduleController.updateSchedule.bind(scheduleController)));

/**
 * @route DELETE /api/schedules/:id
 * @desc 删除定时任务
 * @access Private
 */
router.delete('/:id', asyncHandler(scheduleController.deleteSchedule.bind(scheduleController)));

/**
 * @route POST /api/schedules/:id/toggle
 * @desc 启动/停止定时任务
 * @access Private
 */
router.post('/:id/toggle', asyncHandler(scheduleController.toggleSchedule.bind(scheduleController)));

/**
 * @route POST /api/schedules/:id/execute
 * @desc 手动执行定时任务
 * @access Private
 */
router.post('/:id/execute', asyncHandler(scheduleController.executeSchedule.bind(scheduleController)));

/**
 * @route GET /api/schedules/:id/logs
 * @desc 获取定时任务执行日志
 * @access Private
 */
router.get('/:id/logs', asyncHandler(scheduleController.getScheduleLogs.bind(scheduleController)));

/**
 * @route GET /api/schedules/status/all
 * @desc 获取所有任务状态
 * @access Private
 */
router.get('/status/all', asyncHandler(scheduleController.getTasksStatus.bind(scheduleController)));

/**
 * @route POST /api/schedules/test/notification
 * @desc 测试通知配置
 * @access Private
 */
router.post('/test/notification', asyncHandler(scheduleController.testNotification.bind(scheduleController)));

export default router;