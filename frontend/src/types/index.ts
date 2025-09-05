// 用户相关类型
export type UserRole = 'admin' | 'user' | 'manager' | 'viewer';

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserRegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserLoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

// 数据源相关类型
export type DataSourceType = 'mysql' | 'postgresql' | 'mongodb' | 'api';

export type DataSourceStatus = 'active' | 'inactive';

export interface DataSource {
  id: number;
  name: string;
  type: DataSourceType;
  config: Record<string, any>;
  description?: string;
  status: DataSourceStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface DataSourceCreateRequest {
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'api';
  config: Record<string, any>;
  description?: string;
}

export interface DataSourceTestRequest {
  type: 'mysql' | 'postgresql' | 'mongodb' | 'api';
  config: Record<string, any>;
}

// 仪表盘相关类型
export interface Dashboard {
  id: number;
  name: string;
  description?: string;
  layout: DashboardLayout;
  is_public: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  charts?: Chart[];
  chartCount?: number;
  viewCount?: number;
}

export interface DashboardLayout {
  components: DashboardComponent[];
  grid: {
    cols: number;
    rows: number;
  };
}

export interface DashboardComponent {
  id: string;
  type: 'chart' | 'text' | 'image';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  props: Record<string, any>;
}

export interface DashboardCreateRequest {
  name: string;
  description?: string;
  layout: DashboardLayout;
  is_public?: boolean;
}

// 图表相关类型
export interface Chart {
  id: number;
  dashboard_id: number;
  name: string;
  type: ChartType;
  data_source_id: number;
  query: string;
  config: ChartConfig;
  position: ChartPosition;
  created_at: string;
  updated_at: string;
}

export type ChartType = 
  | 'line'
  | 'bar'
  | 'pie'
  | 'scatter'
  | 'area'
  | 'column'
  | 'gauge'
  | 'funnel'
  | 'radar'
  | 'heatmap'
  | 'treemap'
  | 'sankey'
  | 'graph'
  | 'candlestick'
  | 'boxplot';

export type ChartStatus = 'active' | 'inactive' | 'draft';

export interface ChartConfig {
  title?: {
    text: string;
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  legend?: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  xAxis?: {
    name: string;
    type: 'category' | 'value' | 'time';
    show: boolean;
  };
  yAxis?: {
    name: string;
    type: 'category' | 'value' | 'log';
    show: boolean;
  };
  series?: {
    name: string;
    color?: string;
    stack?: string;
  }[];
  tooltip?: {
    show: boolean;
    trigger: 'item' | 'axis';
  };
  dataZoom?: {
    show: boolean;
    type: 'slider' | 'inside';
  };
  grid?: {
    left: string | number;
    right: string | number;
    top: string | number;
    bottom: string | number;
  };
  animation?: {
    enabled: boolean;
    duration: number;
  };
}

export interface ChartPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChartCreateRequest {
  dashboard_id: number;
  name: string;
  type: ChartType;
  data_source_id: number;
  query: string;
  config: ChartConfig;
  position: ChartPosition;
}

// 图表数据类型
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: (number | null)[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  code: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  message: string;
  code: number;
}

// 查询参数类型
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardQuery extends PaginationQuery {
  search?: string;
  created_by?: number;
  is_public?: boolean;
}

export interface ChartQuery extends PaginationQuery {
  dashboard_id?: number;
  type?: ChartType;
  data_source_id?: number;
}

export interface DataSourceQuery extends PaginationQuery {
  search?: string;
  type?: string;
  status?: 'active' | 'inactive';
}

// 权限相关类型
export interface Permission {
  id: number;
  dashboard_id: number;
  user_id: number;
  permission: 'read' | 'write' | 'admin';
  created_at: string;
}

export interface PermissionCreateRequest {
  dashboard_id: number;
  user_id: number;
  permission: 'read' | 'write' | 'admin';
}

// 操作日志类型
export interface OperationLog {
  id: number;
  user_id: number;
  action: string;
  resource_type: 'dashboard' | 'chart' | 'data_source' | 'user';
  resource_id: number;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// 系统配置类型
export interface SystemConfig {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

// 表单相关类型
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'email' | 'number' | 'select' | 'textarea' | 'switch' | 'date' | 'datetime';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[];
  rules?: any[];
  disabled?: boolean;
  defaultValue?: any;
}

// 菜单类型
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  permission?: string;
}

// 主题类型
export interface Theme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  mode: 'light' | 'dark';
}

// 应用状态类型
export interface AppState {
  user: User | null;
  token: string | null;
  theme: Theme;
  loading: boolean;
  collapsed: boolean;
}

// 错误类型
export interface AppError {
  code: number;
  message: string;
  details?: any;
}

// 文件上传类型
export interface UploadFile {
  uid: string;
  name: string;
  status: 'uploading' | 'done' | 'error' | 'removed';
  url?: string;
  response?: any;
  error?: any;
}

// 导出/导入类型
export interface ExportOptions {
  format: 'json' | 'csv' | 'excel' | 'pdf';
  includeData?: boolean;
  dateRange?: [string, string];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

// WebSocket消息类型
export interface WebSocketMessage {
  type: 'data_update' | 'user_online' | 'system_notification';
  payload: any;
  timestamp: string;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  timestamp: string;
}

// 搜索类型
export interface SearchResult {
  type: 'dashboard' | 'chart' | 'data_source';
  id: number;
  title: string;
  description?: string;
  url: string;
  highlight?: string[];
}

// 统计类型
export interface Statistics {
  totalDashboards: number;
  totalCharts: number;
  totalDataSources: number;
  totalUsers: number;
  activeUsers: number;
  popularDashboards: Dashboard[];
  recentActivities: OperationLog[];
}

// 数据刷新类型
export interface RefreshConfig {
  enabled: boolean;
  interval: number; // 秒
  lastRefresh?: string;
}

// 过滤器类型
export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between';
  value: any;
  label?: string;
}

// 排序类型
export interface Sort {
  field: string;
  order: 'asc' | 'desc';
  label?: string;
}

// 数据表格类型
export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

// 数据导出类型
export interface ExportConfig {
  filename: string;
  format: 'csv' | 'excel' | 'json';
  columns?: string[];
  filters?: Filter[];
}

// 缓存类型
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // 秒
  key: string;
}

// 数据库连接配置类型
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  timeout?: number;
}

// API配置类型
export interface ApiConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  timeout?: number;
}

// 数据转换类型
export interface DataTransform {
  type: 'map' | 'filter' | 'reduce' | 'sort' | 'group';
  config: Record<string, any>;
}

// 图表样式类型
export interface ChartStyle {
  width: number;
  height: number;
  backgroundColor?: string;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
  borderRadius?: number;
  boxShadow?: string;
}

// 响应式断点类型
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

// 设备类型
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// 语言类型
export type Language = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

// 时区类型
export type Timezone = string; // 如 'Asia/Shanghai', 'America/New_York'

// 日期格式类型
export type DateFormat = 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY年MM月DD日';

// 数字格式类型
export type NumberFormat = 'default' | 'currency' | 'percent' | 'scientific';

// 颜色主题类型
export interface ColorTheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
}

// 动画配置类型
export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
}

// 键盘快捷键类型
export interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: string;
  description: string;
}

// 帮助文档类型
export interface HelpDoc {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
}

// 版本信息类型
export interface VersionInfo {
  version: string;
  buildTime: string;
  gitCommit: string;
  environment: 'development' | 'staging' | 'production';
}

// 性能监控类型
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  apiResponseTime: number;
  errorRate: number;
}

// 用户偏好设置类型
export interface UserPreferences {
  language: Language;
  timezone: Timezone;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  dashboard: {
    defaultView: 'grid' | 'list';
    itemsPerPage: number;
    autoRefresh: boolean;
    refreshInterval: number;
  };
}

// 系统健康状态类型
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    api: 'up' | 'down';
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
  lastCheck: string;
}

// 审计日志类型
export interface AuditLog {
  id: string;
  userId: number;
  action: string;
  resource: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

// 数据质量类型
export interface DataQuality {
  completeness: number; // 完整性百分比
  accuracy: number; // 准确性百分比
  consistency: number; // 一致性百分比
  timeliness: number; // 及时性百分比
  validity: number; // 有效性百分比
  issues: {
    type: 'missing' | 'invalid' | 'duplicate' | 'outdated';
    count: number;
    description: string;
  }[];
  lastCheck: string;
}

// 数据血缘类型
export interface DataLineage {
  id: string;
  source: {
    type: 'table' | 'view' | 'api' | 'file';
    name: string;
    schema?: string;
  };
  target: {
    type: 'table' | 'view' | 'chart' | 'dashboard';
    name: string;
    schema?: string;
  };
  transformations: {
    type: string;
    description: string;
    sql?: string;
  }[];
  lastUpdated: string;
}

// 数据字典类型
export interface DataDictionary {
  tableName: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: any;
    description?: string;
    constraints?: string[];
  }[];
  description?: string;
  owner?: string;
  lastUpdated: string;
}

// 报告类型
export interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'scheduled' | 'adhoc';
  format: 'pdf' | 'excel' | 'csv' | 'html';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    timezone: string;
    recipients: string[];
  };
  dashboardId: number;
  filters?: Filter[];
  createdBy: number;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'error';
}

// 警报类型
export interface Alert {
  id: string;
  name: string;
  description?: string;
  chartId: number;
  condition: {
    metric: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
    value: number;
    aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  };
  frequency: number; // 检查频率（分钟）
  notifications: {
    email?: string[];
    webhook?: string;
    slack?: string;
  };
  enabled: boolean;
  createdBy: number;
  createdAt: string;
  lastTriggered?: string;
  status: 'normal' | 'triggered' | 'error';
}

// 工作流类型
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  trigger: {
    type: 'manual' | 'schedule' | 'event';
    config: any;
  };
  enabled: boolean;
  createdBy: number;
  createdAt: string;
  lastRun?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'data_extract' | 'data_transform' | 'data_load' | 'notification' | 'approval';
  config: any;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
}

// 数据集类型
export interface Dataset {
  id: string;
  name: string;
  description?: string;
  source: {
    type: 'database' | 'api' | 'file';
    config: any;
  };
  schema: {
    columns: {
      name: string;
      type: 'string' | 'number' | 'boolean' | 'date' | 'datetime';
      nullable: boolean;
      description?: string;
    }[];
  };
  refreshConfig: RefreshConfig;
  tags: string[];
  owner: number;
  createdAt: string;
  lastRefresh?: string;
  rowCount?: number;
  size?: number;
}

// 计算字段类型
export interface CalculatedField {
  id: string;
  name: string;
  expression: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
  description?: string;
  dependencies: string[]; // 依赖的字段名
}

// 数据视图类型
export interface DataView {
  id: string;
  name: string;
  description?: string;
  datasetId: string;
  filters: Filter[];
  sorts: Sort[];
  columns: string[];
  calculatedFields: CalculatedField[];
  aggregations?: {
    groupBy: string[];
    measures: {
      field: string;
      function: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';
      alias?: string;
    }[];
  };
  createdBy: number;
  createdAt: string;
  isPublic: boolean;
}

// 数据连接器类型
export interface DataConnector {
  id: string;
  name: string;
  type: string;
  version: string;
  description?: string;
  configSchema: any; // JSON Schema
  icon?: string;
  category: string;
  supported: boolean;
  documentation?: string;
}

// 模板类型
export interface Template {
  id: string;
  name: string;
  description?: string;
  type: 'dashboard' | 'chart' | 'report';
  category: string;
  preview?: string;
  config: any;
  tags: string[];
  downloads: number;
  rating: number;
  author: string;
  createdAt: string;
  updatedAt: string;
}

// 插件类型
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  type: 'chart' | 'connector' | 'transform' | 'export';
  enabled: boolean;
  config?: any;
  dependencies?: string[];
  author: string;
  homepage?: string;
  repository?: string;
  license: string;
  installedAt: string;
}

// 组织类型
export interface Organization {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  settings: {
    allowPublicDashboards: boolean;
    defaultRole: 'viewer' | 'editor' | 'admin';
    dataRetentionDays: number;
    maxUsers: number;
    features: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// 团队类型
export interface Team {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  members: {
    userId: number;
    role: 'member' | 'admin';
    joinedAt: string;
  }[];
  permissions: {
    dashboards: string[];
    dataSources: string[];
  };
  createdBy: number;
  createdAt: string;
}

// 项目类型
export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  teamId?: string;
  dashboards: string[];
  dataSources: string[];
  status: 'active' | 'archived';
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  category?: string;
  usageCount: number;
  createdAt: string;
}

// 收藏类型
export interface Favorite {
  id: string;
  userId: number;
  resourceType: 'dashboard' | 'chart' | 'dataset';
  resourceId: string;
  createdAt: string;
}

// 评论类型
export interface Comment {
  id: string;
  resourceType: 'dashboard' | 'chart';
  resourceId: string;
  userId: number;
  content: string;
  parentId?: string;
  mentions?: number[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// 分享类型
export interface Share {
  id: string;
  resourceType: 'dashboard' | 'chart';
  resourceId: string;
  shareType: 'public' | 'password' | 'users';
  password?: string;
  allowedUsers?: number[];
  expiresAt?: string;
  permissions: ('view' | 'comment' | 'edit')[];
  createdBy: number;
  createdAt: string;
  accessCount: number;
  lastAccessed?: string;
}

// 订阅类型
export interface Subscription {
  id: string;
  userId: number;
  resourceType: 'dashboard' | 'chart' | 'dataset';
  resourceId: string;
  frequency: 'realtime' | 'daily' | 'weekly' | 'monthly';
  channels: ('email' | 'push' | 'webhook')[];
  filters?: Filter[];
  enabled: boolean;
  createdAt: string;
  lastSent?: string;
}

// 使用统计类型
export interface UsageStats {
  resourceType: 'dashboard' | 'chart' | 'dataset';
  resourceId: string;
  views: {
    date: string;
    count: number;
    uniqueUsers: number;
  }[];
  totalViews: number;
  uniqueViewers: number;
  avgViewDuration: number;
  popularTimes: {
    hour: number;
    count: number;
  }[];
  topUsers: {
    userId: number;
    viewCount: number;
  }[];
}

// 性能指标类型
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  change: number;
  timestamp: string;
}

// 容量规划类型
export interface CapacityPlan {
  resource: 'storage' | 'compute' | 'memory' | 'network';
  current: {
    used: number;
    total: number;
    unit: string;
  };
  forecast: {
    date: string;
    predicted: number;
    confidence: number;
  }[];
  recommendations: {
    action: 'scale_up' | 'optimize' | 'archive';
    description: string;
    priority: 'low' | 'medium' | 'high';
    estimatedSavings?: number;
  }[];
  lastUpdated: string;
}

// 成本分析类型
export interface CostAnalysis {
  period: {
    start: string;
    end: string;
  };
  total: number;
  currency: string;
  breakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  trends: {
    date: string;
    amount: number;
  }[];
  optimization: {
    potential: number;
    recommendations: string[];
  };
}

// 合规性类型
export interface Compliance {
  framework: 'GDPR' | 'HIPAA' | 'SOX' | 'PCI-DSS';
  status: 'compliant' | 'non_compliant' | 'partial';
  requirements: {
    id: string;
    description: string;
    status: 'met' | 'not_met' | 'partial';
    evidence?: string[];
    lastChecked: string;
  }[];
  score: number;
  lastAssessment: string;
  nextAssessment: string;
}

// 数据治理类型
export interface DataGovernance {
  policies: {
    id: string;
    name: string;
    description: string;
    type: 'access' | 'retention' | 'quality' | 'privacy';
    rules: any[];
    enabled: boolean;
    createdAt: string;
  }[];
  classifications: {
    level: 'public' | 'internal' | 'confidential' | 'restricted';
    criteria: string;
    resources: string[];
  }[];
  stewards: {
    userId: number;
    domain: string;
    responsibilities: string[];
  }[];
}

// 数据目录类型
export interface DataCatalog {
  id: string;
  name: string;
  description?: string;
  type: 'table' | 'view' | 'dataset' | 'api';
  source: string;
  schema: any;
  metadata: {
    owner: string;
    steward?: string;
    classification: string;
    tags: string[];
    businessTerms: string[];
    technicalTerms: string[];
  };
  lineage: DataLineage[];
  quality: DataQuality;
  usage: UsageStats;
  documentation?: string;
  samples?: any[];
  createdAt: string;
  updatedAt: string;
}

// 机器学习模型类型
export interface MLModel {
  id: string;
  name: string;
  description?: string;
  type: 'classification' | 'regression' | 'clustering' | 'forecasting';
  algorithm: string;
  version: string;
  status: 'training' | 'ready' | 'deployed' | 'deprecated';
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    rmse?: number;
    mae?: number;
  };
  features: {
    name: string;
    type: string;
    importance?: number;
  }[];
  trainingData: {
    datasetId: string;
    samples: number;
    features: number;
  };
  deployment: {
    endpoint?: string;
    instances: number;
    lastDeployed?: string;
  };
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// 预测类型
export interface Prediction {
  id: string;
  modelId: string;
  input: any;
  output: any;
  confidence: number;
  timestamp: string;
  feedback?: {
    actual: any;
    rating: number;
    comments?: string;
  };
}

// 实验类型
export interface Experiment {
  id: string;
  name: string;
  description?: string;
  hypothesis: string;
  variants: {
    id: string;
    name: string;
    config: any;
    traffic: number; // 流量分配百分比
  }[];
  metrics: {
    name: string;
    type: 'conversion' | 'revenue' | 'engagement';
    goal: 'increase' | 'decrease';
  }[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  results?: {
    variant: string;
    metrics: {
      name: string;
      value: number;
      confidence: number;
    }[];
  }[];
  winner?: string;
  createdBy: number;
  createdAt: string;
}

// 特征标志类型
export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  rules: {
    condition: any;
    value: any;
  }[];
  defaultValue: any;
  type: 'boolean' | 'string' | 'number' | 'json';
  tags: string[];
  environments: string[];
  rollout: {
    percentage: number;
    users?: string[];
    groups?: string[];
  };
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// 配置类型
export interface Configuration {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  environment: 'development' | 'staging' | 'production';
  encrypted: boolean;
  description?: string;
  tags: string[];
  lastModified: string;
  modifiedBy: number;
}

// 密钥类型
export interface Secret {
  id: string;
  name: string;
  description?: string;
  type: 'api_key' | 'password' | 'certificate' | 'token';
  environment: string;
  encrypted: boolean;
  expiresAt?: string;
  lastRotated?: string;
  rotationPolicy?: {
    enabled: boolean;
    frequency: number; // 天数
    notifyBefore: number; // 提前通知天数
  };
  accessLog: {
    userId: number;
    action: 'read' | 'write' | 'delete';
    timestamp: string;
    ipAddress: string;
  }[];
  createdBy: number;
  createdAt: string;
}

// 环境类型
export interface Environment {
  id: string;
  name: string;
  type: 'development' | 'staging' | 'production';
  description?: string;
  url?: string;
  status: 'active' | 'inactive' | 'maintenance';
  variables: Configuration[];
  secrets: Secret[];
  deployments: {
    version: string;
    deployedAt: string;
    deployedBy: number;
    status: 'success' | 'failed' | 'rollback';
  }[];
  monitoring: {
    healthCheck: string;
    metrics: string[];
    alerts: string[];
  };
  createdAt: string;
}

// 部署类型
export interface Deployment {
  id: string;
  version: string;
  environment: string;
  status: 'pending' | 'deploying' | 'success' | 'failed' | 'rollback';
  strategy: 'blue_green' | 'rolling' | 'canary';
  changes: {
    type: 'feature' | 'bugfix' | 'hotfix' | 'config';
    description: string;
    author: string;
    commit?: string;
  }[];
  rollback?: {
    reason: string;
    previousVersion: string;
    rollbackAt: string;
    rollbackBy: number;
  };
  metrics: {
    deployTime: number;
    errorRate: number;
    successRate: number;
  };
  deployedBy: number;
  deployedAt: string;
  completedAt?: string;
}

// 监控规则类型
export interface MonitoringRule {
  id: string;
  name: string;
  description?: string;
  type: 'threshold' | 'anomaly' | 'trend';
  metric: string;
  condition: {
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
    value: number;
    duration?: number; // 持续时间（秒）
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notifications: {
    channels: string[];
    escalation?: {
      delay: number;
      channels: string[];
    }[];
  };
  suppressions: {
    start: string;
    end: string;
    reason: string;
  }[];
  createdBy: number;
  createdAt: string;
  lastTriggered?: string;
}

// 事件类型
export interface Event {
  id: string;
  type: string;
  source: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  metadata: any;
  tags: string[];
  acknowledged: boolean;
  acknowledgedBy?: number;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedBy?: number;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
}

// 服务类型
export interface Service {
  id: string;
  name: string;
  description?: string;
  type: 'web' | 'api' | 'database' | 'cache' | 'queue';
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  endpoints: {
    name: string;
    url: string;
    method: string;
    status: number;
    responseTime: number;
    lastCheck: string;
  }[];
  dependencies: string[];
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  sla: {
    uptime: number;
    target: number;
    responseTime: number;
    errorRate: number;
  };
  owner: string;
  oncall: string[];
  documentation: string;
  repository: string;
  lastDeployed: string;
}

// 运行手册类型
export interface Runbook {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggers: string[];
  steps: {
    order: number;
    title: string;
    description: string;
    command?: string;
    expectedOutput?: string;
    troubleshooting?: string;
  }[];
  escalation: {
    level: number;
    contact: string;
    delay: number;
  }[];
  tags: string[];
  owner: string;
  reviewers: string[];
  lastReviewed: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

// 变更请求类型
export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  type: 'standard' | 'normal' | 'emergency';
  category: 'infrastructure' | 'application' | 'configuration' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'implemented' | 'closed';
  requestor: number;
  approvers: {
    userId: number;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    timestamp?: string;
  }[];
  implementation: {
    plannedStart: string;
    plannedEnd: string;
    actualStart?: string;
    actualEnd?: string;
    rollbackPlan: string;
    testPlan: string;
  };
  impact: {
    services: string[];
    users: number;
    downtime: number;
    risk: 'low' | 'medium' | 'high';
  };
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

// 知识库类型
export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  type: 'article' | 'faq' | 'tutorial' | 'troubleshooting';
  status: 'draft' | 'published' | 'archived';
  author: number;
  reviewers: number[];
  views: number;
  likes: number;
  rating: number;
  comments: {
    id: string;
    userId: number;
    content: string;
    createdAt: string;
  }[];
  attachments: string[];
  relatedArticles: string[];
  lastUpdated: string;
  createdAt: string;
}

// 培训材料类型
export interface TrainingMaterial {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'interactive' | 'quiz';
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // 分钟
  content: {
    url?: string;
    text?: string;
    questions?: {
      question: string;
      options: string[];
      correct: number;
      explanation?: string;
    }[];
  };
  prerequisites: string[];
  objectives: string[];
  tags: string[];
  author: number;
  status: 'draft' | 'published' | 'archived';
  completions: {
    userId: number;
    completedAt: string;
    score?: number;
    timeSpent: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

// 认证类型
export interface Certification {
  id: string;
  name: string;
  description: string;
  requirements: {
    trainings: string[];
    experience: number; // 月数
    projects: number;
  };
  assessment: {
    type: 'quiz' | 'practical' | 'interview';
    passingScore: number;
    timeLimit: number;
    retakePolicy: {
      allowed: boolean;
      cooldown: number; // 天数
      maxAttempts: number;
    };
  };
  validity: {
    duration: number; // 月数
    renewalRequired: boolean;
  };
  holders: {
    userId: number;
    earnedAt: string;
    expiresAt?: string;
    score: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

// 技能矩阵类型
export interface SkillMatrix {
  userId: number;
  skills: {
    category: string;
    name: string;
    level: 'novice' | 'beginner' | 'competent' | 'proficient' | 'expert';
    verified: boolean;
    verifiedBy?: number;
    verifiedAt?: string;
    evidence?: string[];
    lastAssessed: string;
  }[];
  certifications: string[];
  goals: {
    skill: string;
    targetLevel: string;
    deadline: string;
    progress: number;
  }[];
  updatedAt: string;
}

// 职业发展类型
export interface CareerPath {
  id: string;
  title: string;
  description: string;
  levels: {
    name: string;
    requirements: {
      skills: string[];
      experience: number;
      certifications: string[];
      projects: string[];
    };
    responsibilities: string[];
    compensation?: {
      min: number;
      max: number;
      currency: string;
    };
  }[];
  transitions: {
    from: string;
    to: string;
    requirements: string[];
    timeline: number; // 月数
  }[];
  resources: {
    trainings: string[];
    mentors: number[];
    projects: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// 绩效评估类型
export interface PerformanceReview {
  id: string;
  userId: number;
  reviewerId: number;
  period: {
    start: string;
    end: string;
  };
  type: 'annual' | 'quarterly' | 'project' | 'probation';
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'completed';
  goals: {
    id: string;
    description: string;
    weight: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'exceeded';
    rating: number;
    comments: string;
  }[];
  competencies: {
    name: string;
    rating: number;
    comments: string;
  }[];
  feedback: {
    strengths: string[];
    improvements: string[];
    development: string[];
  };
  overallRating: number;
  promotion: {
    recommended: boolean;
    newLevel?: string;
    justification?: string;
  };
  compensation: {
    increase: number;
    bonus: number;
    effectiveDate: string;
  };
  nextReview: string;
  createdAt: string;
  submittedAt?: string;
  completedAt?: string;
}

// 反馈类型
export interface Feedback {
  id: string;
  type: 'praise' | 'constructive' | 'suggestion' | 'concern';
  from: number;
  to: number;
  subject: string;
  content: string;
  category: string;
  anonymous: boolean;
  status: 'pending' | 'acknowledged' | 'addressed';
  response?: {
    content: string;
    respondedBy: number;
    respondedAt: string;
  };
  tags: string[];
  createdAt: string;
  acknowledgedAt?: string;
}

// 目标类型
export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'team' | 'company';
  category: 'performance' | 'development' | 'project' | 'learning';
  owner: number;
  assignees: number[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  progress: number;
  metrics: {
    name: string;
    target: number;
    current: number;
    unit: string;
  }[];
  milestones: {
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
    completedAt?: string;
  }[];
  dependencies: string[];
  startDate: string;
  dueDate: string;
  completedAt?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// 项目管理类型
export interface ProjectManagement {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  manager: number;
  team: {
    userId: number;
    role: string;
    allocation: number; // 百分比
    joinedAt: string;
  }[];
  timeline: {
    start: string;
    end: string;
    milestones: {
      name: string;
      date: string;
      completed: boolean;
    }[];
  };
  budget: {
    allocated: number;
    spent: number;
    currency: string;
  };
  risks: {
    id: string;
    description: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
    owner: number;
    status: 'open' | 'mitigated' | 'closed';
  }[];
  deliverables: {
    name: string;
    description: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    owner: number;
  }[];
  stakeholders: {
    userId: number;
    role: 'sponsor' | 'customer' | 'user' | 'vendor';
    influence: 'low' | 'medium' | 'high';
    interest: 'low' | 'medium' | 'high';
  }[];
  communications: {
    type: 'status_report' | 'meeting' | 'email' | 'presentation';
    frequency: string;
    audience: number[];
    template?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// 任务类型
export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'improvement' | 'research' | 'documentation';
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'testing' | 'done' | 'cancelled';
  priority: 'lowest' | 'low' | 'medium' | 'high' | 'highest';
  assignee?: number;
  reporter: number;
  project?: string;
  epic?: string;
  sprint?: string;
  labels: string[];
  components: string[];
  estimate: {
    original: number;
    remaining: number;
    logged: number;
    unit: 'hours' | 'days' | 'points';
  };
  dates: {
    created: string;
    updated: string;
    started?: string;
    due?: string;
    resolved?: string;
  };
  relationships: {
    type: 'blocks' | 'is_blocked_by' | 'relates_to' | 'duplicates' | 'is_duplicated_by';
    taskId: string;
  }[];
  attachments: string[];
  comments: {
    id: string;
    author: number;
    content: string;
    createdAt: string;
    updatedAt?: string;
  }[];
  worklog: {
    id: string;
    author: number;
    timeSpent: number;
    description: string;
    date: string;
  }[];
  customFields: Record<string, any>;
}

// 冲刺类型
export interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: 'future' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  capacity: {
    userId: number;
    hours: number;
  }[];
  tasks: string[];
  metrics: {
    planned: number;
    completed: number;
    added: number;
    removed: number;
    velocity: number;
  };
  retrospective?: {
    whatWentWell: string[];
    whatCouldImprove: string[];
    actionItems: {
      description: string;
      owner: number;
      dueDate: string;
      status: 'open' | 'in_progress' | 'completed';
    }[];
  };
  createdAt: string;
  completedAt?: string;
}

// 史诗类型
export interface Epic {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'done' | 'cancelled';
  owner: number;
  startDate?: string;
  targetDate?: string;
  completedDate?: string;
  progress: number;
  tasks: string[];
  objectives: string[];
  successCriteria: string[];
  stakeholders: number[];
  businessValue: {
    score: number;
    justification: string;
  };
  effort: {
    estimate: number;
    actual?: number;
    unit: 'hours' | 'days' | 'weeks' | 'points';
  };
  dependencies: {
    epicId: string;
    type: 'blocks' | 'is_blocked_by';
  }[];
  createdAt: string;
  updatedAt: string;
}

// 发布类型
export interface Release {
  id: string;
  name: string;
  version: string;
  description: string;
  status: 'planning' | 'development' | 'testing' | 'staging' | 'released' | 'cancelled';
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  releaseDate: string;
  features: {
    epicId: string;
    status: 'planned' | 'in_progress' | 'completed' | 'deferred';
  }[];
  bugfixes: string[];
  improvements: string[];
  breakingChanges: {
    description: string;
    migration: string;
    impact: 'low' | 'medium' | 'high';
  }[];
  testing: {
    plan: string;
    coverage: number;
    passed: number;
    failed: number;
    blocked: number;
  };
  deployment: {
    strategy: 'blue_green' | 'rolling' | 'canary';
    environments: {
      name: string;
      deployedAt?: string;
      status: 'pending' | 'deploying' | 'deployed' | 'failed';
    }[];
  };
  rollback: {
    plan: string;
    triggers: string[];
  };
  communications: {
    releaseNotes: string;
    announcement: string;
    training?: string;
  };
  metrics: {
    adoption: number;
    satisfaction: number;
    issues: number;
  };
  createdBy: number;
  createdAt: string;
  releasedAt?: string;
}

// 代码审查类型
export interface CodeReview {
  id: string;
  title: string;
  description: string;
  author: number;
  reviewers: {
    userId: number;
    status: 'pending' | 'approved' | 'changes_requested' | 'commented';
    reviewedAt?: string;
  }[];
  status: 'draft' | 'open' | 'approved' | 'merged' | 'closed';
  branch: {
    source: string;
    target: string;
    ahead: number;
    behind: number;
  };
  changes: {
    files: number;
    additions: number;
    deletions: number;
  };
  comments: {
    id: string;
    author: number;
    content: string;
    file?: string;
    line?: number;
    type: 'general' | 'inline' | 'suggestion';
    resolved: boolean;
    createdAt: string;
  }[];
  checks: {
    name: string;
    status: 'pending' | 'success' | 'failure' | 'error';
    conclusion?: string;
    url?: string;
  }[];
  labels: string[];
  milestone?: string;
  assignees: number[];
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  closedAt?: string;
}

// 技术债务类型
export interface TechnicalDebt {
  id: string;
  title: string;
  description: string;
  type: 'code_quality' | 'architecture' | 'documentation' | 'testing' | 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: {
    development: 'low' | 'medium' | 'high';
    maintenance: 'low' | 'medium' | 'high';
    performance: 'low' | 'medium' | 'high';
    security: 'low' | 'medium' | 'high';
  };
  effort: {
    estimate: number;
    unit: 'hours' | 'days' | 'weeks';
  };
  location: {
    repository: string;
    files: string[];
    components: string[];
  };
  root_cause: string;
  proposed_solution: string;
  alternatives: string[];
  risks: string[];
  benefits: string[];
  status: 'identified' | 'planned' | 'in_progress' | 'resolved' | 'deferred' | 'wont_fix';
  assignee?: number;
  priority: number;
  created_by: number;
  created_at: string;
  resolved_at?: string;
  tags: string[];
}

// 架构决策记录类型
export interface ArchitectureDecisionRecord {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  context: string;
  decision: string;
  consequences: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  alternatives: {
    option: string;
    pros: string[];
    cons: string[];
    rejected_reason: string;
  }[];
  stakeholders: number[];
  related_decisions: string[];
  superseded_by?: string;
  tags: string[];
  author: number;
  reviewers: number[];
  approved_by?: number;
  created_at: string;
  updated_at: string;
  approved_at?: string;
}

// 服务级别协议类型
export interface ServiceLevelAgreement {
  id: string;
  name: string;
  service: string;
  version: string;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  objectives: {
    metric: string;
    target: number;
    unit: string;
    measurement: string;
  }[];
  penalties: {
    threshold: number;
    penalty: string;
    amount?: number;
  }[];
  exclusions: string[];
  reporting: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'dashboard' | 'email' | 'api';
  };
  contacts: {
    role: 'service_owner' | 'customer' | 'escalation';
    name: string;
    email: string;
    phone?: string;
  }[];
  effective_date: string;
  expiry_date: string;
  review_date: string;
  created_by: number;
  approved_by: number[];
  created_at: string;
  updated_at: string;
}

// 容器类型
export interface Container {
  id: string;
  name: string;
  image: string;
  tag: string;
  status: 'running' | 'stopped' | 'error' | 'pending';
  ports: {
    container: number;
    host: number;
    protocol: 'tcp' | 'udp';
  }[];
  environment: Record<string, string>;
  volumes: {
    host: string;
    container: string;
    mode: 'ro' | 'rw';
  }[];
  resources: {
    cpu: {
      limit: string;
      request: string;
    };
    memory: {
      limit: string;
      request: string;
    };
  };
  health: {
    status: 'healthy' | 'unhealthy' | 'starting';
    checks: {
      name: string;
      status: boolean;
      message?: string;
    }[];
  };
  logs: {
    driver: string;
    options: Record<string, string>;
  };
  created_at: string;
  started_at?: string;
  finished_at?: string;
}

// 集群类型
export interface Cluster {
  id: string;
  name: string;
  type: 'kubernetes' | 'docker_swarm' | 'nomad';
  status: 'active' | 'inactive' | 'maintenance';
  version: string;
  nodes: {
    id: string;
    name: string;
    role: 'master' | 'worker';
    status: 'ready' | 'not_ready' | 'unknown';
    resources: {
      cpu: {
        total: string;
        used: string;
      };
      memory: {
        total: string;
        used: string;
      };
      storage: {
        total: string;
        used: string;
      };
    };
    labels: Record<string, string>;
    taints: {
      key: string;
      value: string;
      effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
    }[];
  }[];
  namespaces: {
    name: string;
    status: 'active' | 'terminating';
    resources: {
      pods: number;
      services: number;
      deployments: number;
    };
  }[];
  networking: {
    cni: string;
    pod_cidr: string;
    service_cidr: string;
  };
  storage: {
    classes: {
      name: string;
      provisioner: string;
      parameters: Record<string, string>;
    }[];
  };
  created_at: string;
  updated_at: string;
}

// 工作负载类型
export interface Workload {
  id: string;
  name: string;
  namespace: string;
  type: 'deployment' | 'statefulset' | 'daemonset' | 'job' | 'cronjob';
  status: {
    phase: 'pending' | 'running' | 'succeeded' | 'failed' | 'unknown';
    replicas: {
      desired: number;
      current: number;
      ready: number;
      available: number;
    };
  };
  spec: {
    replicas: number;
    selector: Record<string, string>;
    template: {
      metadata: {
        labels: Record<string, string>;
        annotations: Record<string, string>;
      };
      spec: {
        containers: {
          name: string;
          image: string;
          ports: {
            name: string;
            containerPort: number;
            protocol: 'TCP' | 'UDP';
          }[];
          env: {
            name: string;
            value?: string;
            valueFrom?: any;
          }[];
          resources: {
            requests: Record<string, string>;
            limits: Record<string, string>;
          };
          volumeMounts: {
            name: string;
            mountPath: string;
            readOnly?: boolean;
          }[];
        }[];
        volumes: {
          name: string;
          source: any;
        }[];
      };
    };
  };
  created_at: string;
  updated_at: string;
}

// 网络策略类型
export interface NetworkPolicy {
  id: string;
  name: string;
  namespace: string;
  spec: {
    podSelector: Record<string, string>;
    policyTypes: ('Ingress' | 'Egress')[];
    ingress?: {
      from?: {
        podSelector?: Record<string, string>;
        namespaceSelector?: Record<string, string>;
        ipBlock?: {
          cidr: string;
          except?: string[];
        };
      }[];
      ports?: {
        protocol: 'TCP' | 'UDP';
        port: number;
      }[];
    }[];
    egress?: {
      to?: {
        podSelector?: Record<string, string>;
        namespaceSelector?: Record<string, string>;
        ipBlock?: {
          cidr: string;
          except?: string[];
        };
      }[];
      ports?: {
        protocol: 'TCP' | 'UDP';
        port: number;
      }[];
    }[];
  };
  created_at: string;
}

// 存储类型
export interface Storage {
  id: string;
  name: string;
  type: 'persistent_volume' | 'persistent_volume_claim' | 'storage_class';
  capacity: string;
  access_modes: ('ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany')[];
  reclaim_policy: 'Retain' | 'Recycle' | 'Delete';
  storage_class: string;
  status: {
    phase: 'pending' | 'available' | 'bound' | 'released' | 'failed';
  };
  claim?: {
    namespace: string;
    name: string;
  };
  mount_options: string[];
  node_affinity?: {
    required: {
      nodeSelectorTerms: {
        matchExpressions: {
          key: string;
          operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
          values: string[];
        }[];
      }[];
    };
  };
  created_at: string;
}

// 密钥管理类型
export interface SecretManagement {
  id: string;
  name: string;
  namespace: string;
  type: 'Opaque' | 'kubernetes.io/service-account-token' | 'kubernetes.io/dockercfg' | 'kubernetes.io/tls';
  data: Record<string, string>;
  metadata: {
    labels: Record<string, string>;
    annotations: Record<string, string>;
  };
  immutable: boolean;
  created_at: string;
  updated_at: string;
}

// 配置映射类型
export interface ConfigMap {
  id: string;
  name: string;
  namespace: string;
  data: Record<string, string>;
  binary_data: Record<string, string>;
  metadata: {
    labels: Record<string, string>;
    annotations: Record<string, string>;
  };
  immutable: boolean;
  created_at: string;
  updated_at: string;
}

// 入口类型
export interface Ingress {
  id: string;
  name: string;
  namespace: string;
  spec: {
    ingressClassName?: string;
    defaultBackend?: {
      service: {
        name: string;
        port: {
          number: number;
        };
      };
    };
    tls?: {
      hosts: string[];
      secretName: string;
    }[];
    rules: {
      host: string;
      http: {
        paths: {
          path: string;
          pathType: 'Exact' | 'Prefix' | 'ImplementationSpecific';
          backend: {
            service: {
              name: string;
              port: {
                number: number;
              };
            };
          };
        }[];
      };
    }[];
  };
  status: {
    loadBalancer: {
      ingress: {
        ip?: string;
        hostname?: string;
      }[];
    };
  };
  created_at: string;
}

// 服务网格类型
export interface ServiceMesh {
  id: string;
  name: string;
  type: 'istio' | 'linkerd' | 'consul_connect';
  version: string;
  status: 'installing' | 'ready' | 'updating' | 'error';
  components: {
    name: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    version: string;
  }[];
  configuration: {
    mtls: {
      mode: 'STRICT' | 'PERMISSIVE' | 'DISABLE';
    };
    tracing: {
      enabled: boolean;
      sampling: number;
    };
    metrics: {
      enabled: boolean;
      retention: string;
    };
  };
  policies: {
    traffic: string[];
    security: string[];
    telemetry: string[];
  };
  gateways: {
    name: string;
    type: 'ingress' | 'egress';
    hosts: string[];
    ports: {
      number: number;
      protocol: string;
      name: string;
    }[];
  }[];
  virtual_services: {
    name: string;
    hosts: string[];
    gateways: string[];
    routes: {
      match: any[];
      route: any[];
    }[];
  }[];
  destination_rules: {
    name: string;
    host: string;
    traffic_policy: any;
    subsets: {
      name: string;
      labels: Record<string, string>;
    }[];
  }[];
  created_at: string;
  updated_at: string;
}

// 可观测性类型
export interface Observability {
  metrics: {
    prometheus: {
      endpoint: string;
      retention: string;
      storage: string;
    };
    grafana: {
      endpoint: string;
      dashboards: {
        name: string;
        url: string;
        tags: string[];
      }[];
    };
  };
  logging: {
    elasticsearch: {
      endpoint: string;
      indices: {
        name: string;
        size: string;
        documents: number;
      }[];
    };
    kibana: {
      endpoint: string;
      dashboards: string[];
    };
  };
  tracing: {
    jaeger: {
      endpoint: string;
      services: {
        name: string;
        operations: number;
        traces: number;
      }[];
    };
  };
  alerting: {
    alertmanager: {
      endpoint: string;
      rules: {
        name: string;
        severity: string;
        status: 'firing' | 'pending' | 'inactive';
      }[];
    };
  };
}

// 备份类型
export interface Backup {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  source: {
    type: 'database' | 'filesystem' | 'application';
    location: string;
    credentials?: string;
  };
  destination: {
    type: 's3' | 'gcs' | 'azure' | 'local';
    location: string;
    credentials?: string;
  };
  schedule: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time: string;
    timezone: string;
  };
  retention: {
    count: number;
    duration: string;
  };
  encryption: {
    enabled: boolean;
    algorithm?: string;
    key?: string;
  };
  compression: {
    enabled: boolean;
    algorithm?: string;
    level?: number;
  };
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    percentage: number;
    bytes_processed: number;
    bytes_total: number;
    files_processed: number;
    files_total: number;
  };
  history: {
    id: string;
    started_at: string;
    completed_at?: string;
    status: 'success' | 'failure' | 'partial';
    size: number;
    duration: number;
    error?: string;
  }[];
  created_by: number;
  created_at: string;
  last_run?: string;
  next_run?: string;
}

// 灾难恢复类型
export interface DisasterRecovery {
  id: string;
  name: string;
  type: 'hot' | 'warm' | 'cold';
  rpo: number; // Recovery Point Objective (minutes)
  rto: number; // Recovery Time Objective (minutes)
  primary_site: {
    name: string;
    location: string;
    status: 'active' | 'failed' | 'maintenance';
  };
  secondary_site: {
    name: string;
    location: string;
    status: 'standby' | 'active' | 'failed';
  };
  replication: {
    method: 'synchronous' | 'asynchronous';
    lag: number; // seconds
    status: 'healthy' | 'degraded' | 'failed';
  };
  failover: {
    automatic: boolean;
    triggers: string[];
    procedures: {
      step: number;
      description: string;
      automated: boolean;
      estimated_time: number;
    }[];
  };
  testing: {
    frequency: 'monthly' | 'quarterly' | 'annually';
    last_test: string;
    next_test: string;
    results: {
      date: string;
      success: boolean;
      rto_achieved: number;
      rpo_achieved: number;
      issues: string[];
    }[];
  };
  contacts: {
    role: 'primary' | 'secondary' | 'escalation';
    name: string;
    phone: string;
    email: string;
  }[];
  created_at: string;
  updated_at: string;
}

// 业务连续性类型
export interface BusinessContinuity {
  id: string;
  name: string;
  scope: string;
  impact_analysis: {
    process: string;
    criticality: 'low' | 'medium' | 'high' | 'critical';
    dependencies: string[];
    maximum_tolerable_downtime: number; // hours
    recovery_time_objective: number; // hours
    recovery_point_objective: number; // hours
  }[];
  strategies: {
    type: 'prevention' | 'mitigation' | 'response' | 'recovery';
    description: string;
    resources_required: string[];
    estimated_cost: number;
    effectiveness: 'low' | 'medium' | 'high';
  }[];
  procedures: {
    scenario: string;
    steps: {
      order: number;
      action: string;
      responsible: string;
      estimated_time: number;
      dependencies: string[];
    }[];
  }[];
  resources: {
    type: 'personnel' | 'technology' | 'facilities' | 'suppliers';
    name: string;
    availability: 'primary' | 'backup' | 'alternative';
    contact: string;
  }[];
  testing: {
    type: 'tabletop' | 'walkthrough' | 'simulation' | 'full_scale';
    frequency: string;
    last_test: string;
    next_test: string;
    results: {
      date: string;
      type: string;
      participants: string[];
      objectives_met: boolean;
      lessons_learned: string[];
      action_items: {
        description: string;
        owner: string;
        due_date: string;
        status: 'open' | 'in_progress' | 'completed';
      }[];
    }[];
  };
  maintenance: {
    review_frequency: string;
    last_review: string;
    next_review: string;
    version: string;
    approved_by: string;
    approval_date: string;
  };
  created_at: string;
  updated_at: string;
}

// 导出所有类型
export type * from './index';