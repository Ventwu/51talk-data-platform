import { Router } from 'express';
import { userController } from '../controllers/userController';
import { asyncHandler } from '../middleware/errorHandler';
import { adminMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/users/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get('/me', asyncHandler(userController.getCurrentUser.bind(userController)));

/**
 * @route PUT /api/users/me
 * @desc 更新当前用户信息
 * @access Private
 */
router.put('/me', asyncHandler(userController.updateCurrentUser.bind(userController)));

/**
 * @route PUT /api/users/me/password
 * @desc 修改当前用户密码
 * @access Private
 */
router.put('/me/password', asyncHandler(userController.changePassword.bind(userController)));

/**
 * @route GET /api/users/stats
 * @desc 获取用户统计信息
 * @access Admin
 */
router.get('/stats', adminMiddleware, asyncHandler(userController.getUserStats.bind(userController)));

/**
 * @route GET /api/users
 * @desc 获取用户列表
 * @access Admin
 */
router.get('/', adminMiddleware, asyncHandler(userController.getUsers.bind(userController)));

/**
 * @route GET /api/users/:id
 * @desc 获取单个用户信息
 * @access Admin
 */
router.get('/:id', adminMiddleware, asyncHandler(userController.getUser.bind(userController)));

/**
 * @route POST /api/users
 * @desc 创建用户
 * @access Admin
 */
router.post('/', adminMiddleware, asyncHandler(userController.createUser.bind(userController)));

/**
 * @route PUT /api/users/:id
 * @desc 更新用户信息
 * @access Admin
 */
router.put('/:id', adminMiddleware, asyncHandler(userController.updateUser.bind(userController)));

/**
 * @route DELETE /api/users/:id
 * @desc 删除用户
 * @access Admin
 */
router.delete('/:id', adminMiddleware, asyncHandler(userController.deleteUser.bind(userController)));

/**
 * @route PUT /api/users/:id/reset-password
 * @desc 重置用户密码
 * @access Admin
 */
router.put('/:id/reset-password', adminMiddleware, asyncHandler(userController.resetPassword.bind(userController)));

export default router;