import express from 'express';
import { dataSourceController } from '../controllers/dataSourceController';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * 数据源管理路由
 * 提供数据源的CRUD操作和数据查询功能
 */

// 获取所有数据源列表
router.get('/', asyncHandler(dataSourceController.getDataSources.bind(dataSourceController)));

// 获取所有数据源状态
router.get('/status', asyncHandler(dataSourceController.getDataSourcesStatus.bind(dataSourceController)));

// 获取单个数据源详情
router.get('/:id', asyncHandler(dataSourceController.getDataSource.bind(dataSourceController)));

// 添加新数据源
router.post('/', asyncHandler(dataSourceController.addDataSource.bind(dataSourceController)));

// 更新数据源配置
router.put('/:id', asyncHandler(dataSourceController.updateDataSource.bind(dataSourceController)));

// 删除数据源
router.delete('/:id', asyncHandler(dataSourceController.deleteDataSource.bind(dataSourceController)));

// 测试数据源连接
router.post('/:id/test', asyncHandler(dataSourceController.testDataSource.bind(dataSourceController)));

// 获取数据源表列表
router.get('/:id/tables', asyncHandler(dataSourceController.getDataSourceTables.bind(dataSourceController)));

// 获取表结构信息
router.get('/:id/tables/:tableName', asyncHandler(dataSourceController.getTableInfo.bind(dataSourceController)));

// 预览表数据
router.get('/:id/tables/:tableName/preview', asyncHandler(dataSourceController.previewTableData.bind(dataSourceController)));

// 执行SQL查询
router.post('/:id/query', asyncHandler(dataSourceController.executeQuery.bind(dataSourceController)));

export default router;