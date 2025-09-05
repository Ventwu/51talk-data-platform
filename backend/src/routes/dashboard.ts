import express, { Response } from 'express';
import { executeQuery } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// 获取仪表盘列表
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { page = 1, limit = 10, search = '' } = req.query;
  
  const offset = (Number(page) - 1) * Number(limit);
  
  let whereClause = 'WHERE (created_by = ? OR is_public = 1)';
  let params: any[] = [userId];
  
  if (search) {
    whereClause += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  // 获取仪表盘列表
  const dashboards = await executeQuery(
    `SELECT d.*, u.username as creator_name 
     FROM dashboards d 
     LEFT JOIN users u ON d.created_by = u.id 
     ${whereClause} 
     ORDER BY d.updated_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );
  
  // 获取总数
  const totalResult = await executeQuery(
    `SELECT COUNT(*) as total FROM dashboards d ${whereClause}`,
    params
  );
  
  const total = totalResult[0].total;
  
  res.json({
    success: true,
    data: {
      dashboards,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// 获取仪表盘详情
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  const dashboards = await executeQuery(
    `SELECT d.*, u.username as creator_name 
     FROM dashboards d 
     LEFT JOIN users u ON d.created_by = u.id 
     WHERE d.id = ? AND (d.created_by = ? OR d.is_public = 1)`,
    [id, userId]
  );
  
  if (dashboards.length === 0) {
    throw new AppError('仪表盘不存在或无权限访问', 404);
  }
  
  const dashboard = dashboards[0];
  
  // 解析配置JSON
  if (dashboard.config) {
    try {
      dashboard.config = JSON.parse(dashboard.config);
    } catch (error) {
      dashboard.config = {};
    }
  }
  
  res.json({
    success: true,
    data: dashboard
  });
}));

// 创建仪表盘
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, config, is_public = false } = req.body;
  const userId = req.user?.id;
  
  if (!name) {
    throw new AppError('仪表盘名称不能为空', 400);
  }
  
  // 验证配置格式
  let configStr = '{}';
  if (config) {
    try {
      configStr = typeof config === 'string' ? config : JSON.stringify(config);
      JSON.parse(configStr); // 验证JSON格式
    } catch (error) {
      throw new AppError('配置格式错误', 400);
    }
  }
  
  const result = await executeQuery(
    `INSERT INTO dashboards (name, description, config, is_public, created_by, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))`,
    [name, description, configStr, is_public, userId]
  );
  
  res.status(201).json({
    success: true,
    message: '仪表盘创建成功',
    data: {
      id: result.insertId,
      name,
      description,
      config: JSON.parse(configStr),
      is_public
    }
  });
}));

// 更新仪表盘
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, config, is_public } = req.body;
  const userId = req.user?.id;
  
  // 检查权限
  const dashboards = await executeQuery(
    'SELECT created_by FROM dashboards WHERE id = ?',
    [id]
  );
  
  if (dashboards.length === 0) {
    throw new AppError('仪表盘不存在', 404);
  }
  
  if (dashboards[0].created_by !== userId) {
    throw new AppError('无权限修改此仪表盘', 403);
  }
  
  // 验证配置格式
  let configStr;
  if (config !== undefined) {
    try {
      configStr = typeof config === 'string' ? config : JSON.stringify(config);
      JSON.parse(configStr); // 验证JSON格式
    } catch (error) {
      throw new AppError('配置格式错误', 400);
    }
  }
  
  // 构建更新字段
  const updateFields = [];
  const updateValues = [];
  
  if (name !== undefined) {
    updateFields.push('name = ?');
    updateValues.push(name);
  }
  
  if (description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(description);
  }
  
  if (configStr !== undefined) {
    updateFields.push('config = ?');
    updateValues.push(configStr);
  }
  
  if (is_public !== undefined) {
    updateFields.push('is_public = ?');
    updateValues.push(is_public);
  }
  
  updateFields.push('updated_at = datetime("now")');
  updateValues.push(id);
  
  await executeQuery(
    `UPDATE dashboards SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );
  
  res.json({
    success: true,
    message: '仪表盘更新成功'
  });
}));

// 删除仪表盘
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  // 检查权限
  const dashboards = await executeQuery(
    'SELECT created_by FROM dashboards WHERE id = ?',
    [id]
  );
  
  if (dashboards.length === 0) {
    throw new AppError('仪表盘不存在', 404);
  }
  
  if (dashboards[0].created_by !== userId) {
    throw new AppError('无权限删除此仪表盘', 403);
  }
  
  await executeQuery('DELETE FROM dashboards WHERE id = ?', [id]);
  
  res.json({
    success: true,
    message: '仪表盘删除成功'
  });
}));

// 复制仪表盘
router.post('/:id/copy', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user?.id;
  
  // 获取原仪表盘
  const dashboards = await executeQuery(
    'SELECT * FROM dashboards WHERE id = ? AND (created_by = ? OR is_public = 1)',
    [id, userId]
  );
  
  if (dashboards.length === 0) {
    throw new AppError('仪表盘不存在或无权限访问', 404);
  }
  
  const originalDashboard = dashboards[0];
  const newName = name || `${originalDashboard.name} - 副本`;
  
  const result = await executeQuery(
    `INSERT INTO dashboards (name, description, config, is_public, created_by, created_at, updated_at) 
     VALUES (?, ?, ?, 0, ?, datetime("now"), datetime("now"))`,
    [newName, originalDashboard.description, originalDashboard.config, userId]
  );
  
  res.status(201).json({
    success: true,
    message: '仪表盘复制成功',
    data: {
      id: result.insertId,
      name: newName
    }
  });
}));

export default router;