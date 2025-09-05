import React, { useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { DashboardComponent, DataSource, QueryResult } from '../types';

interface EnhancedChartComponentProps {
  component: DashboardComponent;
  readOnly?: boolean;
  dataSource?: DataSource;
  queryResult?: QueryResult;
}

// 图表类型映射
const CHART_TYPE_MAP = {
  line: 'line',
  bar: 'bar',
  pie: 'pie',
  scatter: 'scatter',
  area: 'line',
  gauge: 'gauge',
  funnel: 'funnel',
  radar: 'radar',
  heatmap: 'heatmap'
};

// 默认图表配置
const getDefaultChartOption = (chartType: string, data: any[] = []) => {
  const baseOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: []
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    animation: true,
    animationDuration: 1000
  };

  switch (chartType) {
    case 'line':
    case 'area':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: data.map(item => item.name || item.x || item.category)
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          name: '数据',
          type: 'line',
          areaStyle: chartType === 'area' ? {} : undefined,
          data: data.map(item => item.value || item.y || 0)
        }]
      };

    case 'bar':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: data.map(item => item.name || item.x || item.category)
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          name: '数据',
          type: 'bar',
          data: data.map(item => item.value || item.y || 0)
        }]
      };

    case 'pie':
      return {
        ...baseOption,
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        series: [{
          name: '数据',
          type: 'pie',
          radius: '50%',
          data: data.map(item => ({
            name: item.name || item.category,
            value: item.value || item.y || 0
          }))
        }]
      };

    case 'scatter':
      return {
        ...baseOption,
        xAxis: {
          type: 'value'
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          name: '数据',
          type: 'scatter',
          data: data.map(item => [item.x || 0, item.y || item.value || 0])
        }]
      };

    case 'gauge':
      const gaugeValue = data.length > 0 ? (data[0].value || data[0].y || 0) : 0;
      return {
        series: [{
          name: '仪表盘',
          type: 'gauge',
          detail: {
            formatter: '{value}%'
          },
          data: [{
            value: gaugeValue,
            name: '指标'
          }]
        }]
      };

    default:
      return baseOption;
  }
};

// 数据转换函数
const transformQueryResultToChartData = (queryResult: QueryResult, chartType: string) => {
  if (!queryResult || !queryResult.data || !Array.isArray(queryResult.data)) {
    return [];
  }

  const { data, columns } = queryResult;
  
  // 如果没有列信息，尝试从第一行数据推断
  const cols = columns || (data.length > 0 ? Object.keys(data[0]).map(key => ({ name: key, type: 'string' })) : []);
  
  if (cols.length === 0) return [];

  // 根据图表类型转换数据
  switch (chartType) {
    case 'pie':
      // 饼图需要 name 和 value
      return data.map(row => ({
        name: row[cols[0]?.name] || 'Unknown',
        value: Number(row[cols[1]?.name]) || 0
      }));

    case 'scatter':
      // 散点图需要 x 和 y
      return data.map(row => ({
        x: Number(row[cols[0]?.name]) || 0,
        y: Number(row[cols[1]?.name]) || 0
      }));

    case 'gauge':
      // 仪表盘只需要一个值
      return [{
        value: Number(data[0]?.[cols[1]?.name || cols[0]?.name]) || 0
      }];

    default:
      // 线图、柱图等需要 category 和 value
      return data.map(row => ({
        name: row[cols[0]?.name] || 'Unknown',
        category: row[cols[0]?.name] || 'Unknown',
        value: Number(row[cols[1]?.name]) || 0
      }));
  }
};

export const EnhancedChartComponent: React.FC<EnhancedChartComponentProps> = ({
  component,
  readOnly = false,
  dataSource,
  queryResult
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const { config, style } = component;
  const chartType = config.chartType || 'line';

  // 转换数据
  const chartData = useMemo(() => {
    if (queryResult) {
      return transformQueryResultToChartData(queryResult, chartType);
    }
    // 如果没有查询结果，使用配置中的示例数据
    return config.sampleData || [];
  }, [queryResult, chartType, config.sampleData]);

  // 生成图表配置
  const chartOption = useMemo(() => {
    const defaultOption = getDefaultChartOption(chartType, chartData);
    
    // 合并用户自定义配置
    const customOption = config.chartOptions || {};
    
    return {
      ...defaultOption,
      ...customOption,
      // 确保数据部分使用最新的数据
      series: defaultOption.series?.map((series, index) => ({
        ...series,
        ...customOption.series?.[index],
        data: defaultOption.series[index].data
      }))
    };
  }, [chartType, chartData, config.chartOptions]);

  // 处理图表事件
  const onChartReady = (chartInstance: any) => {
    // 图表准备就绪时的回调
    console.log('Chart ready:', chartInstance);
  };

  const onChartClick = (params: any) => {
    if (!readOnly) {
      console.log('Chart clicked:', params);
      // 可以在这里处理图表点击事件
    }
  };

  // 如果没有数据且没有配置数据源，显示占位符
  if (!queryResult && (!config.dataSource || !config.dataSource.id)) {
    return (
      <div 
        className="chart-component"
        style={{
          padding: '16px',
          ...style
        }}
      >
        <div className="chart-header">
          <h4 className="chart-title">{component.title || '图表标题'}</h4>
          {component.description && (
            <p className="chart-description">{component.description}</p>
          )}
        </div>
        <div className="chart-content">
          <div className="chart-placeholder">
            <div className="placeholder-icon">📊</div>
            <div className="placeholder-text">
              {chartType} 图表
            </div>
            <div className="placeholder-subtitle">
              {config.dataSource?.id ? `数据源: ${config.dataSource.id}` : '请配置数据源'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果正在加载数据
  if (queryResult && queryResult.loading) {
    return (
      <div 
        className="chart-component"
        style={{
          padding: '16px',
          ...style
        }}
      >
        <div className="chart-header">
          <h4 className="chart-title">{component.title || '图表标题'}</h4>
        </div>
        <div className="chart-content">
          <div className="chart-placeholder">
            <div className="placeholder-icon">⏳</div>
            <div className="placeholder-text">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  // 如果数据加载出错
  if (queryResult && queryResult.error) {
    return (
      <div 
        className="chart-component"
        style={{
          padding: '16px',
          ...style
        }}
      >
        <div className="chart-header">
          <h4 className="chart-title">{component.title || '图表标题'}</h4>
        </div>
        <div className="chart-content">
          <div className="chart-placeholder">
            <div className="placeholder-icon">❌</div>
            <div className="placeholder-text">数据加载失败</div>
            <div className="placeholder-subtitle">{queryResult.error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="chart-component enhanced-chart"
      style={{
        padding: '16px',
        ...style
      }}
    >
      <div className="chart-header">
        <h4 className="chart-title">{component.title || '图表标题'}</h4>
        {component.description && (
          <p className="chart-description">{component.description}</p>
        )}
        {dataSource && (
          <div className="chart-data-info">
            <span className="data-source-name">数据源: {dataSource.name}</span>
            {queryResult && (
              <span className="data-count">({queryResult.data?.length || 0} 条记录)</span>
            )}
          </div>
        )}
      </div>
      <div className="chart-content">
        <ReactECharts
          ref={chartRef}
          option={chartOption}
          style={{ height: '100%', width: '100%' }}
          onChartReady={onChartReady}
          onEvents={{
            click: onChartClick
          }}
          opts={{
            renderer: 'canvas',
            useDirtyRect: false
          }}
        />
      </div>
    </div>
  );
};

export default EnhancedChartComponent;