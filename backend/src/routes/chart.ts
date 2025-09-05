import express, { Request, Response } from 'express';
import { chartController } from '../controllers/chartController';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * 图表管理路由
 * 提供图表的CRUD操作和数据查询功能
 */

// 获取图表列表
router.get('/', asyncHandler(chartController.getCharts.bind(chartController)));

// 获取单个图表详情
router.get('/:id', asyncHandler(chartController.getChart.bind(chartController)));

// 创建图表
router.post('/', asyncHandler(chartController.createChart.bind(chartController)));

// 更新图表
router.put('/:id', asyncHandler(chartController.updateChart.bind(chartController)));

// 删除图表
router.delete('/:id', asyncHandler(chartController.deleteChart.bind(chartController)));

// 获取图表数据
router.get('/:id/data', asyncHandler(chartController.getChartData.bind(chartController)));

// 预览图表查询结果
router.post('/preview', asyncHandler(chartController.previewChartQuery.bind(chartController)));

// 获取支持的图表类型列表
router.get('/types/list', asyncHandler(async (req: Request, res: Response) => {
  const chartTypes = [
    {
      type: 'line',
      name: '折线图',
      description: '用于显示数据随时间变化的趋势',
      icon: 'line-chart'
    },
    {
      type: 'bar',
      name: '柱状图',
      description: '用于比较不同类别的数据',
      icon: 'bar-chart'
    },
    {
      type: 'pie',
      name: '饼图',
      description: '用于显示数据的占比关系',
      icon: 'pie-chart'
    },
    {
      type: 'scatter',
      name: '散点图',
      description: '用于显示两个变量之间的关系',
      icon: 'scatter-chart'
    },
    {
      type: 'area',
      name: '面积图',
      description: '用于显示数据的累积变化',
      icon: 'area-chart'
    },
    {
      type: 'gauge',
      name: '仪表盘',
      description: '用于显示单一指标的当前值',
      icon: 'gauge'
    },
    {
      type: 'table',
      name: '表格',
      description: '用于显示详细的数据列表',
      icon: 'table'
    },
    {
      type: 'card',
      name: '指标卡',
      description: '用于显示关键指标数值',
      icon: 'card'
    }
  ];
  
  res.json({
    success: true,
    data: chartTypes
  });
}));

export default router;