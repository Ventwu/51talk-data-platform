-- 51Talk数据中台初始化数据脚本
USE `talk51_data_platform`;

-- 插入示例数据源
INSERT INTO `data_sources` (`name`, `type`, `config`, `description`, `status`, `created_by`) VALUES 
('51Talk用户数据库', 'mysql', '{"host":"localhost","port":3306,"database":"talk51_users","username":"readonly_user","password":"encrypted_password"}', '51Talk用户相关数据', 'active', 1),
('课程数据库', 'mysql', '{"host":"localhost","port":3306,"database":"talk51_courses","username":"readonly_user","password":"encrypted_password"}', '课程和教学相关数据', 'active', 1),
('订单数据库', 'mysql', '{"host":"localhost","port":3306,"database":"talk51_orders","username":"readonly_user","password":"encrypted_password"}', '订单和支付相关数据', 'active', 1),
('Redis缓存', 'redis', '{"host":"localhost","port":6379,"database":0,"password":""}', 'Redis缓存数据源', 'active', 1),
('外部API', 'api', '{"baseUrl":"https://api.51talk.com","apiKey":"encrypted_api_key","timeout":30000}', '51Talk外部API接口', 'active', 1);

-- 插入示例仪表盘
INSERT INTO `dashboards` (`name`, `description`, `config`, `is_public`, `created_by`) VALUES 
('运营总览', '51Talk运营数据总览仪表盘，包含用户、课程、订单等核心指标', '{"layout":"grid","columns":12,"rows":8,"theme":"light"}', 1, 1),
('用户分析', '用户注册、活跃度、留存等用户行为分析', '{"layout":"grid","columns":12,"rows":6,"theme":"light"}', 1, 1),
('课程分析', '课程销售、完课率、评价等课程相关分析', '{"layout":"grid","columns":12,"rows":6,"theme":"light"}', 1, 1),
('财务分析', '收入、成本、利润等财务数据分析', '{"layout":"grid","columns":12,"rows":6,"theme":"dark"}', 0, 1),
('实时监控', '系统实时监控数据，包含服务状态、性能指标等', '{"layout":"grid","columns":12,"rows":10,"theme":"dark","autoRefresh":true,"refreshInterval":30}', 1, 1);

-- 插入示例图表
INSERT INTO `charts` (`name`, `type`, `data_source_id`, `dashboard_id`, `config`, `query`, `position_x`, `position_y`, `width`, `height`, `created_by`) VALUES 
-- 运营总览仪表盘图表
('总用户数', 'number', 1, 1, '{"title":"总用户数","unit":"人","color":"#1890ff","icon":"user"}', 'SELECT COUNT(*) as value FROM users WHERE status = "active"', 0, 0, 3, 2, 1),
('今日新增用户', 'number', 1, 1, '{"title":"今日新增用户","unit":"人","color":"#52c41a","icon":"user-add"}', 'SELECT COUNT(*) as value FROM users WHERE DATE(created_at) = CURDATE()', 3, 0, 3, 2, 1),
('总课程数', 'number', 2, 1, '{"title":"总课程数","unit":"门","color":"#fa8c16","icon":"book"}', 'SELECT COUNT(*) as value FROM courses WHERE status = "published"', 6, 0, 3, 2, 1),
('今日订单数', 'number', 3, 1, '{"title":"今日订单数","unit":"单","color":"#eb2f96","icon":"shopping-cart"}', 'SELECT COUNT(*) as value FROM orders WHERE DATE(created_at) = CURDATE()', 9, 0, 3, 2, 1),

('用户注册趋势', 'line', 1, 1, '{"title":"用户注册趋势","xAxis":"日期","yAxis":"注册数量","smooth":true}', 'SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date', 0, 2, 6, 3, 1),
('订单金额趋势', 'area', 3, 1, '{"title":"订单金额趋势","xAxis":"日期","yAxis":"金额(元)","smooth":true,"fill":true}', 'SELECT DATE(created_at) as date, SUM(amount) as amount FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date', 6, 2, 6, 3, 1),

('课程分类分布', 'pie', 2, 1, '{"title":"课程分类分布","showLegend":true,"showLabel":true}', 'SELECT category as name, COUNT(*) as value FROM courses WHERE status = "published" GROUP BY category', 0, 5, 4, 3, 1),
('用户地区分布', 'bar', 1, 1, '{"title":"用户地区分布","xAxis":"地区","yAxis":"用户数量"}', 'SELECT region as name, COUNT(*) as value FROM users WHERE status = "active" GROUP BY region ORDER BY value DESC LIMIT 10', 4, 5, 4, 3, 1),
('订单状态分布', 'pie', 3, 1, '{"title":"订单状态分布","showLegend":true,"showLabel":true}', 'SELECT status as name, COUNT(*) as value FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY status', 8, 5, 4, 3, 1),

-- 用户分析仪表盘图表
('用户活跃度', 'line', 1, 2, '{"title":"用户活跃度","xAxis":"日期","yAxis":"活跃用户数","smooth":true}', 'SELECT DATE(login_time) as date, COUNT(DISTINCT user_id) as count FROM user_activities WHERE login_time >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(login_time) ORDER BY date', 0, 0, 6, 3, 1),
('用户留存率', 'bar', 1, 2, '{"title":"用户留存率","xAxis":"注册时间","yAxis":"留存率(%)"}', 'SELECT DATE(created_at) as date, (COUNT(DISTINCT CASE WHEN last_login_at >= DATE_ADD(created_at, INTERVAL 7 DAY) THEN id END) / COUNT(*) * 100) as retention_rate FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date', 6, 0, 6, 3, 1),
('用户年龄分布', 'bar', 1, 2, '{"title":"用户年龄分布","xAxis":"年龄段","yAxis":"用户数量"}', 'SELECT CASE WHEN age < 18 THEN "<18" WHEN age < 25 THEN "18-24" WHEN age < 35 THEN "25-34" WHEN age < 45 THEN "35-44" ELSE "45+" END as age_group, COUNT(*) as count FROM users WHERE status = "active" GROUP BY age_group ORDER BY age_group', 0, 3, 6, 3, 1),
('用户设备分布', 'pie', 1, 2, '{"title":"用户设备分布","showLegend":true,"showLabel":true}', 'SELECT device_type as name, COUNT(*) as value FROM user_sessions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY device_type', 6, 3, 6, 3, 1),

-- 课程分析仪表盘图表
('课程销售排行', 'bar', 2, 3, '{"title":"课程销售排行","xAxis":"课程名称","yAxis":"销售数量"}', 'SELECT c.name, COUNT(o.id) as sales FROM courses c LEFT JOIN orders o ON c.id = o.course_id WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY c.id, c.name ORDER BY sales DESC LIMIT 10', 0, 0, 6, 3, 1),
('课程完课率', 'gauge', 2, 3, '{"title":"平均完课率","min":0,"max":100,"unit":"%","color":"#52c41a"}', 'SELECT AVG(completion_rate) as value FROM course_progress WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)', 6, 0, 3, 3, 1),
('课程评分分布', 'bar', 2, 3, '{"title":"课程评分分布","xAxis":"评分","yAxis":"课程数量"}', 'SELECT FLOOR(rating) as score, COUNT(*) as count FROM course_ratings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY FLOOR(rating) ORDER BY score', 9, 0, 3, 3, 1),
('热门课程类别', 'pie', 2, 3, '{"title":"热门课程类别","showLegend":true,"showLabel":true}', 'SELECT category as name, COUNT(*) as value FROM courses WHERE status = "published" AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) GROUP BY category', 0, 3, 6, 3, 1),
('课程学习时长分布', 'area', 2, 3, '{"title":"课程学习时长分布","xAxis":"时长(分钟)","yAxis":"学习次数","smooth":true}', 'SELECT FLOOR(duration/60) as duration_minutes, COUNT(*) as count FROM learning_sessions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY FLOOR(duration/60) ORDER BY duration_minutes', 6, 3, 6, 3, 1),

-- 实时监控仪表盘图表
('系统CPU使用率', 'gauge', 5, 5, '{"title":"CPU使用率","min":0,"max":100,"unit":"%","color":"#fa541c"}', 'SELECT cpu_usage as value FROM system_metrics ORDER BY created_at DESC LIMIT 1', 0, 0, 3, 3, 1),
('系统内存使用率', 'gauge', 5, 5, '{"title":"内存使用率","min":0,"max":100,"unit":"%","color":"#1890ff"}', 'SELECT memory_usage as value FROM system_metrics ORDER BY created_at DESC LIMIT 1', 3, 0, 3, 3, 1),
('在线用户数', 'number', 4, 5, '{"title":"在线用户数","unit":"人","color":"#52c41a","icon":"user"}', 'SELECT COUNT(*) as value FROM online_users WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)', 6, 0, 3, 3, 1),
('API响应时间', 'line', 5, 5, '{"title":"API平均响应时间","xAxis":"时间","yAxis":"响应时间(ms)","smooth":true}', 'SELECT DATE_FORMAT(created_at, "%H:%i") as time, AVG(response_time) as avg_time FROM api_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) GROUP BY DATE_FORMAT(created_at, "%H:%i") ORDER BY time', 9, 0, 3, 3, 1),

('服务状态监控', 'table', 5, 5, '{"title":"服务状态监控","columns":[{"title":"服务名称","dataIndex":"service_name"},{"title":"状态","dataIndex":"status"},{"title":"响应时间","dataIndex":"response_time"},{"title":"最后检查","dataIndex":"last_check"}]}', 'SELECT service_name, status, response_time, last_check FROM service_health ORDER BY last_check DESC', 0, 3, 12, 4, 1),

('错误日志统计', 'bar', 5, 5, '{"title":"错误日志统计","xAxis":"错误类型","yAxis":"错误次数"}', 'SELECT error_type as name, COUNT(*) as value FROM error_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY error_type ORDER BY value DESC LIMIT 10', 0, 7, 6, 3, 1),
('数据库连接池状态', 'gauge', 5, 5, '{"title":"数据库连接池使用率","min":0,"max":100,"unit":"%","color":"#722ed1"}', 'SELECT (active_connections / max_connections * 100) as value FROM db_pool_status ORDER BY created_at DESC LIMIT 1', 6, 7, 3, 3, 1),
('缓存命中率', 'gauge', 4, 5, '{"title":"缓存命中率","min":0,"max":100,"unit":"%","color":"#13c2c2"}', 'SELECT (cache_hits / (cache_hits + cache_misses) * 100) as value FROM cache_stats ORDER BY created_at DESC LIMIT 1', 9, 7, 3, 3, 1);

-- 插入仪表盘权限示例
INSERT INTO `dashboard_permissions` (`dashboard_id`, `user_id`, `permission`, `granted_by`) VALUES 
(1, 1, 'admin', 1),
(2, 1, 'admin', 1),
(3, 1, 'admin', 1),
(4, 1, 'admin', 1),
(5, 1, 'admin', 1);

-- 插入操作日志示例
INSERT INTO `operation_logs` (`user_id`, `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `user_agent`) VALUES 
(1, 'create', 'dashboard', 1, '{"name":"运营总览","description":"创建运营总览仪表盘"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(1, 'create', 'chart', 1, '{"name":"总用户数","type":"number","dashboard_id":1}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(1, 'create', 'data_source', 1, '{"name":"51Talk用户数据库","type":"mysql"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- 更新系统配置
UPDATE `system_configs` SET `config_value` = '已初始化' WHERE `config_key` = 'site_description';

-- 创建视图用于常用查询
CREATE VIEW `dashboard_summary` AS
SELECT 
    d.id,
    d.name,
    d.description,
    d.is_public,
    u.username as creator_name,
    COUNT(c.id) as chart_count,
    d.created_at,
    d.updated_at
FROM dashboards d
LEFT JOIN users u ON d.created_by = u.id
LEFT JOIN charts c ON d.id = c.dashboard_id
GROUP BY d.id, d.name, d.description, d.is_public, u.username, d.created_at, d.updated_at;

CREATE VIEW `chart_summary` AS
SELECT 
    c.id,
    c.name,
    c.type,
    d.name as dashboard_name,
    ds.name as data_source_name,
    ds.type as data_source_type,
    u.username as creator_name,
    c.created_at,
    c.updated_at
FROM charts c
LEFT JOIN dashboards d ON c.dashboard_id = d.id
LEFT JOIN data_sources ds ON c.data_source_id = ds.id
LEFT JOIN users u ON c.created_by = u.id;

-- 创建存储过程用于数据清理
DELIMITER //
CREATE PROCEDURE CleanExpiredCache()
BEGIN
    DELETE FROM data_cache WHERE expires_at < NOW();
    SELECT ROW_COUNT() as deleted_rows;
END //

CREATE PROCEDURE GetDashboardStats(IN dashboard_id INT)
BEGIN
    SELECT 
        COUNT(c.id) as total_charts,
        COUNT(CASE WHEN c.type = 'line' THEN 1 END) as line_charts,
        COUNT(CASE WHEN c.type = 'bar' THEN 1 END) as bar_charts,
        COUNT(CASE WHEN c.type = 'pie' THEN 1 END) as pie_charts,
        COUNT(CASE WHEN c.type = 'number' THEN 1 END) as number_charts,
        COUNT(DISTINCT c.data_source_id) as data_sources_used
    FROM charts c
    WHERE c.dashboard_id = dashboard_id;
END //
DELIMITER ;

-- 创建触发器用于自动更新
DELIMITER //
CREATE TRIGGER update_dashboard_modified_time
    AFTER UPDATE ON charts
    FOR EACH ROW
BEGIN
    IF NEW.dashboard_id IS NOT NULL THEN
        UPDATE dashboards SET updated_at = NOW() WHERE id = NEW.dashboard_id;
    END IF;
END //

CREATE TRIGGER log_dashboard_operations
    AFTER INSERT ON dashboards
    FOR EACH ROW
BEGIN
    INSERT INTO operation_logs (user_id, action, resource_type, resource_id, details, ip_address)
    VALUES (NEW.created_by, 'create', 'dashboard', NEW.id, JSON_OBJECT('name', NEW.name), '127.0.0.1');
END //
DELIMITER ;

-- 插入完成标记
INSERT INTO `system_configs` (`config_key`, `config_value`, `description`, `is_public`) VALUES 
('database_initialized', 'true', '数据库初始化完成标记', 0),
('init_timestamp', NOW(), '数据库初始化时间', 0);

SELECT '数据库初始化完成！' as message;