-- 51Talk数据中台功能完善 - 数据库扩展脚本
-- 此脚本包含仪表盘设计器、权限管理、查询管理、实时功能等新增表结构

USE `talk51_data_platform`;

-- ================================
-- 仪表盘设计器相关表
-- ================================

-- 仪表盘布局表（扩展现有仪表盘表的布局功能）
CREATE TABLE `dashboard_layouts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dashboard_id` int(11) NOT NULL COMMENT '仪表盘ID',
  `layout_data` json NOT NULL COMMENT '布局数据(react-grid-layout格式)',
  `breakpoint` varchar(20) NOT NULL DEFAULT 'lg' COMMENT '断点标识(lg,md,sm,xs,xxs)',
  `cols` int(11) NOT NULL DEFAULT 12 COMMENT '列数',
  `row_height` int(11) NOT NULL DEFAULT 30 COMMENT '行高(像素)',
  `margin` json DEFAULT NULL COMMENT '边距配置[x,y]',
  `container_padding` json DEFAULT NULL COMMENT '容器内边距[x,y]',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dashboard_breakpoint` (`dashboard_id`, `breakpoint`),
  KEY `idx_dashboard_id` (`dashboard_id`),
  CONSTRAINT `fk_dashboard_layouts_dashboard_id` FOREIGN KEY (`dashboard_id`) REFERENCES `dashboards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='仪表盘布局表';

-- 组件模板表
CREATE TABLE `component_templates` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT '模板名称',
  `category` varchar(50) NOT NULL COMMENT '模板分类(chart,text,image,container)',
  `type` varchar(50) NOT NULL COMMENT '具体类型',
  `config` json NOT NULL COMMENT '模板配置',
  `preview_image` varchar(255) DEFAULT NULL COMMENT '预览图URL',
  `description` text COMMENT '模板描述',
  `is_system` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否系统模板',
  `is_public` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否公开',
  `usage_count` int(11) NOT NULL DEFAULT 0 COMMENT '使用次数',
  `created_by` int(11) NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_type` (`type`),
  KEY `idx_public` (`is_public`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_component_templates_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组件模板表';

-- ================================
-- 图表增强功能相关表
-- ================================

-- 图表主题表
CREATE TABLE `chart_themes` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT '主题名称',
  `config` json NOT NULL COMMENT '主题配置(颜色、字体、样式等)',
  `preview_image` varchar(255) DEFAULT NULL COMMENT '预览图URL',
  `is_system` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否系统主题',
  `is_public` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否公开',
  `usage_count` int(11) NOT NULL DEFAULT 0 COMMENT '使用次数',
  `created_by` int(11) NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_public` (`is_public`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_chart_themes_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图表主题表';

-- 图表交互配置表
CREATE TABLE `chart_interactions` (
  `id` varchar(36) NOT NULL,
  `chart_id` int(11) NOT NULL COMMENT '图表ID',
  `interaction_type` enum('drill_down','cross_filter','tooltip','click_action') NOT NULL COMMENT '交互类型',
  `config` json NOT NULL COMMENT '交互配置',
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chart_id` (`chart_id`),
  KEY `idx_interaction_type` (`interaction_type`),
  CONSTRAINT `fk_chart_interactions_chart_id` FOREIGN KEY (`chart_id`) REFERENCES `charts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图表交互配置表';

-- ================================
-- 查询管理相关表
-- ================================

-- 查询历史表
CREATE TABLE `query_history` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `data_source_id` int(11) NOT NULL COMMENT '数据源ID',
  `query_text` text NOT NULL COMMENT '查询语句',
  `query_hash` varchar(64) NOT NULL COMMENT '查询哈希(用于去重)',
  `execution_time` int(11) DEFAULT NULL COMMENT '执行时间(毫秒)',
  `result_rows` int(11) DEFAULT NULL COMMENT '结果行数',
  `status` enum('success','error','timeout') NOT NULL COMMENT '执行状态',
  `error_message` text COMMENT '错误信息',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_data_source_id` (`data_source_id`),
  KEY `idx_query_hash` (`query_hash`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_query_history_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_query_history_data_source_id` FOREIGN KEY (`data_source_id`) REFERENCES `data_sources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='查询历史表';

-- 收藏查询表
CREATE TABLE `saved_queries` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `name` varchar(200) NOT NULL COMMENT '查询名称',
  `description` text COMMENT '查询描述',
  `query_text` text NOT NULL COMMENT '查询语句',
  `data_source_id` int(11) NOT NULL COMMENT '数据源ID',
  `category` varchar(50) DEFAULT NULL COMMENT '分类',
  `tags` json DEFAULT NULL COMMENT '标签',
  `is_public` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否公开',
  `is_favorite` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否收藏',
  `usage_count` int(11) NOT NULL DEFAULT 0 COMMENT '使用次数',
  `last_used_at` timestamp NULL DEFAULT NULL COMMENT '最后使用时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_data_source_id` (`data_source_id`),
  KEY `idx_category` (`category`),
  KEY `idx_public` (`is_public`),
  KEY `idx_favorite` (`user_id`, `is_favorite`),
  CONSTRAINT `fk_saved_queries_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_saved_queries_data_source_id` FOREIGN KEY (`data_source_id`) REFERENCES `data_sources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏查询表';

-- ================================
-- 权限管理相关表
-- ================================

-- 角色表
CREATE TABLE `roles` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT '角色名称',
  `display_name` varchar(100) NOT NULL COMMENT '显示名称',
  `description` text COMMENT '角色描述',
  `is_system` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否系统角色',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_system` (`is_system`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 权限表
CREATE TABLE `permissions` (
  `id` varchar(36) NOT NULL,
  `resource` varchar(100) NOT NULL COMMENT '资源类型(dashboard,chart,data_source,user)',
  `action` varchar(50) NOT NULL COMMENT '操作类型(create,read,update,delete,execute)',
  `conditions` json DEFAULT NULL COMMENT '权限条件',
  `description` text COMMENT '权限描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_resource_action` (`resource`, `action`),
  KEY `idx_resource` (`resource`),
  KEY `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 角色权限关联表
CREATE TABLE `role_permissions` (
  `role_id` varchar(36) NOT NULL,
  `permission_id` varchar(36) NOT NULL,
  `granted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`, `permission_id`),
  KEY `idx_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permissions_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- 用户角色关联表
CREATE TABLE `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `assigned_by` int(11) NOT NULL COMMENT '分配者ID',
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  PRIMARY KEY (`user_id`, `role_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_assigned_by` (`assigned_by`),
  CONSTRAINT `fk_user_roles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- 资源权限表（用于细粒度权限控制）
CREATE TABLE `resource_permissions` (
  `id` varchar(36) NOT NULL,
  `resource_type` varchar(50) NOT NULL COMMENT '资源类型',
  `resource_id` varchar(50) NOT NULL COMMENT '资源ID',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID',
  `role_id` varchar(36) DEFAULT NULL COMMENT '角色ID',
  `permission` varchar(50) NOT NULL COMMENT '权限类型(read,write,admin)',
  `granted_by` int(11) NOT NULL COMMENT '授权者ID',
  `granted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  PRIMARY KEY (`id`),
  KEY `idx_resource` (`resource_type`, `resource_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission` (`permission`),
  CONSTRAINT `fk_resource_permissions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_resource_permissions_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_resource_permissions_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源权限表';

-- ================================
-- 实时数据相关表
-- ================================

-- 实时订阅表
CREATE TABLE `realtime_subscriptions` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `chart_id` int(11) NOT NULL COMMENT '图表ID',
  `subscription_type` enum('chart_data','chart_config','dashboard_layout') NOT NULL COMMENT '订阅类型',
  `refresh_interval` int(11) NOT NULL DEFAULT 30 COMMENT '刷新间隔(秒)',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
  `last_update_at` timestamp NULL DEFAULT NULL COMMENT '最后更新时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_chart_id` (`chart_id`),
  KEY `idx_subscription_type` (`subscription_type`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `fk_realtime_subscriptions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_realtime_subscriptions_chart_id` FOREIGN KEY (`chart_id`) REFERENCES `charts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实时订阅表';

-- 告警规则表
CREATE TABLE `alert_rules` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT '告警规则名称',
  `chart_id` int(11) NOT NULL COMMENT '关联图表ID',
  `condition_config` json NOT NULL COMMENT '告警条件配置',
  `notification_config` json NOT NULL COMMENT '通知配置',
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `last_triggered_at` timestamp NULL DEFAULT NULL COMMENT '最后触发时间',
  `trigger_count` int(11) NOT NULL DEFAULT 0 COMMENT '触发次数',
  `created_by` int(11) NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chart_id` (`chart_id`),
  KEY `idx_enabled` (`is_enabled`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_alert_rules_chart_id` FOREIGN KEY (`chart_id`) REFERENCES `charts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_alert_rules_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警规则表';

-- 告警历史表
CREATE TABLE `alert_history` (
  `id` varchar(36) NOT NULL,
  `alert_rule_id` varchar(36) NOT NULL COMMENT '告警规则ID',
  `trigger_value` decimal(15,4) DEFAULT NULL COMMENT '触发值',
  `threshold_value` decimal(15,4) DEFAULT NULL COMMENT '阈值',
  `message` text COMMENT '告警消息',
  `status` enum('triggered','resolved','acknowledged') NOT NULL COMMENT '告警状态',
  `acknowledged_by` int(11) DEFAULT NULL COMMENT '确认者ID',
  `acknowledged_at` timestamp NULL DEFAULT NULL COMMENT '确认时间',
  `resolved_at` timestamp NULL DEFAULT NULL COMMENT '解决时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_alert_rule_id` (`alert_rule_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_alert_history_alert_rule_id` FOREIGN KEY (`alert_rule_id`) REFERENCES `alert_rules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_alert_history_acknowledged_by` FOREIGN KEY (`acknowledged_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警历史表';

-- ================================
-- 系统监控相关表
-- ================================

-- 系统监控指标表
CREATE TABLE `system_metrics` (
  `id` varchar(36) NOT NULL,
  `metric_name` varchar(100) NOT NULL COMMENT '指标名称',
  `metric_value` decimal(15,4) NOT NULL COMMENT '指标值',
  `metric_unit` varchar(20) DEFAULT NULL COMMENT '指标单位',
  `tags` json DEFAULT NULL COMMENT '标签',
  `collected_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '采集时间',
  PRIMARY KEY (`id`),
  KEY `idx_metric_name` (`metric_name`),
  KEY `idx_collected_at` (`collected_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统监控指标表';

-- ================================
-- 创建索引优化查询性能
-- ================================

-- 为现有表添加新索引
ALTER TABLE `charts` ADD INDEX `idx_type_status` (`type`, `created_at`);
ALTER TABLE `dashboards` ADD INDEX `idx_public_updated` (`is_public`, `updated_at`);
ALTER TABLE `data_sources` ADD INDEX `idx_type_status` (`type`, `status`);
ALTER TABLE `users` ADD INDEX `idx_role_status` (`role`, `status`);

-- ================================
-- 插入基础数据
-- ================================

-- 插入系统角色
INSERT INTO `roles` (`id`, `name`, `display_name`, `description`, `is_system`, `is_active`) VALUES
('role_super_admin', 'super_admin', '超级管理员', '拥有所有权限的超级管理员', 1, 1),
('role_admin', 'admin', '管理员', '系统管理员，拥有大部分权限', 1, 1),
('role_analyst', 'analyst', '数据分析师', '数据分析师，可以创建和编辑图表仪表盘', 1, 1),
('role_viewer', 'viewer', '查看者', '只能查看已授权的仪表盘和图表', 1, 1);

-- 插入基础权限
INSERT INTO `permissions` (`id`, `resource`, `action`, `description`) VALUES
('perm_dashboard_create', 'dashboard', 'create', '创建仪表盘'),
('perm_dashboard_read', 'dashboard', 'read', '查看仪表盘'),
('perm_dashboard_update', 'dashboard', 'update', '编辑仪表盘'),
('perm_dashboard_delete', 'dashboard', 'delete', '删除仪表盘'),
('perm_chart_create', 'chart', 'create', '创建图表'),
('perm_chart_read', 'chart', 'read', '查看图表'),
('perm_chart_update', 'chart', 'update', '编辑图表'),
('perm_chart_delete', 'chart', 'delete', '删除图表'),
('perm_datasource_create', 'data_source', 'create', '创建数据源'),
('perm_datasource_read', 'data_source', 'read', '查看数据源'),
('perm_datasource_update', 'data_source', 'update', '编辑数据源'),
('perm_datasource_delete', 'data_source', 'delete', '删除数据源'),
('perm_user_create', 'user', 'create', '创建用户'),
('perm_user_read', 'user', 'read', '查看用户'),
('perm_user_update', 'user', 'update', '编辑用户'),
('perm_user_delete', 'user', 'delete', '删除用户'),
('perm_query_execute', 'query', 'execute', '执行查询'),
('perm_query_save', 'query', 'save', '保存查询'),
('perm_system_monitor', 'system', 'monitor', '系统监控');

-- 为超级管理员分配所有权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 'role_super_admin', `id` FROM `permissions`;

-- 为管理员分配权限（除了用户管理）
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 'role_admin', `id` FROM `permissions` WHERE `resource` != 'user';

-- 为数据分析师分配权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
('role_analyst', 'perm_dashboard_create'),
('role_analyst', 'perm_dashboard_read'),
('role_analyst', 'perm_dashboard_update'),
('role_analyst', 'perm_chart_create'),
('role_analyst', 'perm_chart_read'),
('role_analyst', 'perm_chart_update'),
('role_analyst', 'perm_datasource_read'),
('role_analyst', 'perm_query_execute'),
('role_analyst', 'perm_query_save');

-- 为查看者分配权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
('role_viewer', 'perm_dashboard_read'),
('role_viewer', 'perm_chart_read'),
('role_viewer', 'perm_datasource_read');

-- 插入默认图表主题
INSERT INTO `chart_themes` (`id`, `name`, `config`, `is_system`, `is_public`, `created_by`) VALUES
('theme_default', '默认主题', '{"colors":["#1890ff","#52c41a","#faad14","#f5222d","#722ed1","#fa8c16","#13c2c2","#eb2f96"],"backgroundColor":"#ffffff","textColor":"#000000","gridColor":"#f0f0f0"}', 1, 1, 1),
('theme_dark', '深色主题', '{"colors":["#177ddc","#49aa19","#d89614","#a61d24","#531dab","#d4380d","#08979c","#c41d7f"],"backgroundColor":"#141414","textColor":"#ffffff","gridColor":"#303030"}', 1, 1, 1),
('theme_business', '商务主题', '{"colors":["#2f54eb","#389e0d","#fa8c16","#cf1322","#722ed1","#fa541c","#13c2c2","#eb2f96"],"backgroundColor":"#fafafa","textColor":"#262626","gridColor":"#e8e8e8"}', 1, 1, 1);

-- 插入默认组件模板
INSERT INTO `component_templates` (`id`, `name`, `category`, `type`, `config`, `description`, `is_system`, `is_public`, `created_by`) VALUES
('template_line_chart', '折线图', 'chart', 'line', '{"defaultSize":{"w":6,"h":4},"minSize":{"w":3,"h":3},"maxSize":{"w":12,"h":8}}', '基础折线图模板', 1, 1, 1),
('template_bar_chart', '柱状图', 'chart', 'bar', '{"defaultSize":{"w":6,"h":4},"minSize":{"w":3,"h":3},"maxSize":{"w":12,"h":8}}', '基础柱状图模板', 1, 1, 1),
('template_pie_chart', '饼图', 'chart', 'pie', '{"defaultSize":{"w":4,"h":4},"minSize":{"w":3,"h":3},"maxSize":{"w":8,"h":8}}', '基础饼图模板', 1, 1, 1),
('template_number_card', '数值卡片', 'chart', 'number', '{"defaultSize":{"w":3,"h":2},"minSize":{"w":2,"h":1},"maxSize":{"w":6,"h":4}}', '数值显示卡片', 1, 1, 1),
('template_text_widget', '文本组件', 'text', 'text', '{"defaultSize":{"w":6,"h":2},"minSize":{"w":2,"h":1},"maxSize":{"w":12,"h":6}}', '文本显示组件', 1, 1, 1);

-- 为现有用户分配默认角色（假设ID为1的用户是管理员）
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_by`) VALUES
(1, 'role_super_admin', 1);

COMMIT;