import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  Dropdown,
  Button,
  Modal,
  message,
  Row,
  Col,
  Empty,
  Spin,
} from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { Dashboard } from '@/types';
import { useDashboards } from '@/hooks';
import './index.css';

interface DashboardCardProps {
  dashboard: Dashboard;
  onEdit: (dashboard: Dashboard) => void;
  onCopy: (dashboard: Dashboard) => void;
  onDelete: (dashboard: Dashboard) => void;
  onView: (dashboard: Dashboard) => void;
}

// 可拖拽的仪表盘卡片组件
const DashboardCard: React.FC<DashboardCardProps> = ({
  dashboard,
  onEdit,
  onCopy,
  onDelete,
  onView,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dashboard.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 三点菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      onClick: () => onView(dashboard),
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: () => onEdit(dashboard),
    },
    {
      key: 'copy',
      label: '复制',
      icon: <CopyOutlined />,
      onClick: () => onCopy(dashboard),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete(dashboard),
    },
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`dashboard-card-wrapper ${isDragging ? 'dragging' : ''}`}
      {...attributes}
    >
      <Card
        hoverable
        className="dashboard-card"
        cover={
          <div className="dashboard-preview">
            <div className="dashboard-preview-content">
              {/* 模拟仪表盘预览 */}
              <div className="preview-chart"></div>
              <div className="preview-chart"></div>
              <div className="preview-chart"></div>
              <div className="preview-chart"></div>
            </div>
          </div>
        }
        actions={[
          <Button
            key="view"
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onView(dashboard)}
          >
            查看
          </Button>,
          <Button
            key="edit"
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(dashboard)}
          >
            编辑
          </Button>,
        ]}
      >
        <div className="dashboard-card-header">
          <div className="dashboard-info" {...listeners}>
            <Card.Meta
              title={dashboard.name}
              description={dashboard.description || '暂无描述'}
            />
          </div>
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="dashboard-menu-btn"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>
        <div className="dashboard-stats">
          <span className="stat-item">
            图表: {dashboard.chartCount || 0}
          </span>
          <span className="stat-item">
            访问: {dashboard.viewCount || 0}
          </span>
        </div>
      </Card>
    </div>
  );
};

interface DashboardGridProps {
  dashboards: Dashboard[];
  loading?: boolean;
  onDashboardsReorder: (dashboards: Dashboard[]) => void;
}

// 仪表盘网格组件
const DashboardGrid: React.FC<DashboardGridProps> = ({
  dashboards,
  loading = false,
  onDashboardsReorder,
}) => {
  const [items, setItems] = useState<Dashboard[]>(dashboards);
  const { deleteDashboard, updateDashboardById } = useDashboards();
  const navigate = useNavigate();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 更新items当dashboards变化时
  React.useEffect(() => {
    setItems(dashboards);
  }, [dashboards]);

  // 拖拽结束处理
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onDashboardsReorder(newItems);
    }
  }, [items, onDashboardsReorder]);

  // 查看仪表盘
  const handleView = useCallback((dashboard: Dashboard) => {
    navigate(`/dashboards/${dashboard.id}`);
  }, [navigate]);

  // 编辑仪表盘
  const handleEdit = useCallback((dashboard: Dashboard) => {
    navigate(`/dashboards/${dashboard.id}/edit`);
  }, [navigate]);

  // 复制仪表盘
  const handleCopy = useCallback(async (dashboard: Dashboard) => {
    try {
      // 这里应该调用复制API
      const newDashboard = {
        ...dashboard,
        name: `${dashboard.name} (副本)`,
        id: undefined, // 让后端生成新ID
      };
      
      // 调用创建API
      // await createDashboard(newDashboard);
      
      message.success('仪表盘复制成功');
    } catch (error) {
      message.error('复制失败，请稍后重试');
    }
  }, []);

  // 删除仪表盘
  const handleDelete = useCallback((dashboard: Dashboard) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除仪表盘 "${dashboard.name}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteDashboard(dashboard.id);
          message.success('仪表盘删除成功');
        } catch (error) {
          message.error('删除失败，请稍后重试');
        }
      },
    });
  }, [deleteDashboard]);

  if (loading) {
    return (
      <div className="dashboard-grid-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="dashboard-grid-empty">
        <Empty
          description="暂无仪表盘"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate('/dashboards/create')}>
            创建第一个仪表盘
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
          <Row gutter={[16, 16]}>
            {items.map((dashboard) => (
              <Col xs={24} sm={12} md={8} lg={6} key={dashboard.id}>
                <DashboardCard
                  dashboard={dashboard}
                  onView={handleView}
                  onEdit={handleEdit}
                  onCopy={handleCopy}
                  onDelete={handleDelete}
                />
              </Col>
            ))}
          </Row>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default DashboardGrid;
export type { DashboardGridProps };