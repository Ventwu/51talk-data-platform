-- 51Talk数据中台数据库设计
-- 创建数据库
CREATE DATABASE IF NOT EXISTS `talk51_data_platform` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `talk51_data_platform`;

-- 用户表
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `email` varchar(100) NOT NULL COMMENT '邮箱',
  `password_hash` varchar(255) NOT NULL COMMENT '密码哈希',
  `role` enum('admin','user','viewer') NOT NULL DEFAULT 'user' COMMENT '用户角色',
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active' COMMENT '用户状态',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 数据源表
CREATE TABLE `data_sources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '数据源名称',
  `type` enum('mysql','postgresql','mongodb','redis','api','file') NOT NULL COMMENT '数据源类型',
  `config` json NOT NULL COMMENT '连接配置(JSON格式)',
  `description` text COMMENT '描述',
  `status` enum('active','inactive','error') NOT NULL DEFAULT 'inactive' COMMENT '连接状态',
  `last_test_at` timestamp NULL DEFAULT NULL COMMENT '最后测试时间',
  `created_by` int(11) NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_data_sources_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据源表';

-- 仪表盘表
CREATE TABLE `dashboards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '仪表盘名称',
  `description` text COMMENT '描述',
  `config` json DEFAULT NULL COMMENT '布局配置(JSON格式)',
  `is_public` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否公开',
  `thumbnail` varchar(255) DEFAULT NULL COMMENT '缩略图URL',
  `created_by` int(11) NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_is_public` (`is_public`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_dashboards_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='仪表盘表';

-- 图表表
CREATE TABLE `charts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '图表名称',
  `type` enum('line','bar','pie','area','scatter','table','number','gauge') NOT NULL COMMENT '图表类型',
  `data_source_id` int(11) NOT NULL COMMENT '数据源ID',
  `dashboard_id` int(11) DEFAULT NULL COMMENT '所属仪表盘ID',
  `config` json DEFAULT NULL COMMENT '图表配置(JSON格式)',
  `query` text COMMENT 'SQL查询语句或API配置',
  `position_x` int(11) DEFAULT 0 COMMENT 'X坐标位置',
  `position_y` int(11) DEFAULT 0 COMMENT 'Y坐标位置',
  `width` int(11) DEFAULT 4 COMMENT '宽度(栅格单位)',
  `height` int(11) DEFAULT 3 COMMENT '高度(栅格单位)',
  `created_by` int(11) NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_data_source_id` (`data_source_id`),
  KEY `idx_dashboard_id` (`dashboard_id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_charts_data_source_id` FOREIGN KEY (`data_source_id`) REFERENCES `data_sources` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_charts_dashboard_id` FOREIGN KEY (`dashboard_id`) REFERENCES `dashboards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_charts_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图表表';

-- 仪表盘权限表
CREATE TABLE `dashboard_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dashboard_id` int(11) NOT NULL COMMENT '仪表盘ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `permission` enum('view','edit','admin') NOT NULL DEFAULT 'view' COMMENT '权限类型',
  `granted_by` int(11) NOT NULL COMMENT '授权者ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dashboard_user` (`dashboard_id`,`user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_permission` (`permission`),
  CONSTRAINT `fk_dashboard_permissions_dashboard_id` FOREIGN KEY (`dashboard_id`) REFERENCES `dashboards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dashboard_permissions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dashboard_permissions_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='仪表盘权限表';

-- 数据缓存表
CREATE TABLE `data_cache` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cache_key` varchar(255) NOT NULL COMMENT '缓存键',
  `chart_id` int(11) NOT NULL COMMENT '图表ID',
  `data` longtext NOT NULL COMMENT '缓存数据(JSON格式)',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cache_key` (`cache_key`),
  KEY `idx_chart_id` (`chart_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_data_cache_chart_id` FOREIGN KEY (`chart_id`) REFERENCES `charts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据缓存表';

-- 操作日志表
CREATE TABLE `operation_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL COMMENT '操作用户ID',
  `action` varchar(50) NOT NULL COMMENT '操作类型',
  `resource_type` varchar(50) NOT NULL COMMENT '资源类型',
  `resource_id` int(11) DEFAULT NULL COMMENT '资源ID',
  `details` json DEFAULT NULL COMMENT '操作详情(JSON格式)',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '用户代理',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_resource_type` (`resource_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_operation_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 系统配置表
CREATE TABLE `system_configs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text NOT NULL COMMENT '配置值',
  `description` varchar(255) DEFAULT NULL COMMENT '配置描述',
  `is_public` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否公开配置',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 定时任务表
CREATE TABLE `scheduled_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '任务名称',
  `description` text COMMENT '任务描述',
  `type` enum('data_refresh','notification','report') NOT NULL COMMENT '任务类型',
  `cron_expression` varchar(100) NOT NULL COMMENT 'Cron表达式',
  `config` json NOT NULL COMMENT '任务配置(JSON格式)',
  `status` enum('active','inactive','error') NOT NULL DEFAULT 'inactive' COMMENT '任务状态',
  `last_run_at` timestamp NULL DEFAULT NULL COMMENT '最后执行时间',
  `next_run_at` timestamp NULL DEFAULT NULL COMMENT '下次执行时间',
  `created_by` int(11) NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_next_run_at` (`next_run_at`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_scheduled_tasks_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时任务表';

-- 任务执行日志表
CREATE TABLE `task_execution_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL COMMENT '任务ID',
  `status` enum('running','success','failed','timeout') NOT NULL COMMENT '执行状态',
  `start_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  `end_time` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `duration` int(11) DEFAULT NULL COMMENT '执行时长(毫秒)',
  `result` json DEFAULT NULL COMMENT '执行结果(JSON格式)',
  `error_message` text COMMENT '错误信息',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_status` (`status`),
  KEY `idx_start_time` (`start_time`),
  CONSTRAINT `fk_task_execution_logs_task_id` FOREIGN KEY (`task_id`) REFERENCES `scheduled_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务执行日志表';

-- 通知配置表
CREATE TABLE `notification_configs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '配置名称',
  `type` enum('feishu','wechat','email','webhook') NOT NULL COMMENT '通知类型',
  `config` json NOT NULL COMMENT '通知配置(JSON格式)',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_by` int(11) NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_notification_configs_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知配置表';

-- 创建索引优化查询性能
CREATE INDEX `idx_users_last_login` ON `users` (`last_login_at`);
CREATE INDEX `idx_dashboards_updated_at` ON `dashboards` (`updated_at`);
CREATE INDEX `idx_charts_updated_at` ON `charts` (`updated_at`);
CREATE INDEX `idx_operation_logs_resource` ON `operation_logs` (`resource_type`, `resource_id`);
CREATE INDEX `idx_scheduled_tasks_cron` ON `scheduled_tasks` (`cron_expression`);
CREATE INDEX `idx_task_execution_logs_end_time` ON `task_execution_logs` (`end_time`);
CREATE INDEX `idx_notification_configs_type_active` ON `notification_configs` (`type`, `is_active`);

-- 插入默认管理员用户
INSERT INTO `users` (`username`, `email`, `password_hash`, `role`, `status`) VALUES 
('admin', 'admin@51talk.com', '$2b$10$rQZ9vKzqzqzqzqzqzqzqzOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', 'admin', 'active');

-- 插入默认系统配置
INSERT INTO `system_configs` (`config_key`, `config_value`, `description`, `is_public`) VALUES 
('site_name', '51Talk数据中台', '网站名称', 1),
('site_description', '51Talk运营数据中台系统', '网站描述', 1),
('max_dashboard_count', '50', '每个用户最大仪表盘数量', 0),
('max_chart_count', '200', '每个仪表盘最大图表数量', 0),
('data_cache_ttl', '3600', '数据缓存过期时间(秒)', 0),
('file_upload_max_size', '10485760', '文件上传最大大小(字节)', 0);