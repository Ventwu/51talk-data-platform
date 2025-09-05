# 安全指南

本文档详细说明了51Talk数据中台项目的安全策略、最佳实践和安全配置指南。

## 📋 目录

- [安全策略](#安全策略)
- [认证与授权](#认证与授权)
- [数据安全](#数据安全)
- [网络安全](#网络安全)
- [应用安全](#应用安全)
- [部署安全](#部署安全)
- [监控与审计](#监控与审计)
- [安全检查清单](#安全检查清单)
- [漏洞报告](#漏洞报告)

## 🛡️ 安全策略

### 安全原则

1. **最小权限原则**: 用户和服务只获得完成任务所需的最小权限
2. **深度防御**: 多层安全控制，避免单点故障
3. **零信任架构**: 不信任任何网络流量，验证所有访问请求
4. **数据保护**: 保护数据的机密性、完整性和可用性
5. **持续监控**: 实时监控和检测安全威胁

### 安全责任

| 角色 | 责任 |
|------|------|
| 开发团队 | 安全编码、代码审查、漏洞修复 |
| 运维团队 | 基础设施安全、部署安全、监控 |
| 安全团队 | 安全策略、风险评估、安全审计 |
| 产品团队 | 安全需求、用户教育、合规性 |

## 🔐 认证与授权

### JWT令牌安全

#### 令牌配置

```typescript
// 安全的JWT配置
const jwtConfig = {
  secret: process.env.JWT_SECRET, // 至少32字符的随机字符串
  algorithm: 'HS256',
  expiresIn: '15m', // 短期访问令牌
  issuer: '51talk-data-platform',
  audience: 'api.51talk-data.com'
}

const refreshTokenConfig = {
  secret: process.env.JWT_REFRESH_SECRET, // 不同于访问令牌的密钥
  expiresIn: '7d', // 刷新令牌有效期
  httpOnly: true, // 防止XSS攻击
  secure: true, // 仅HTTPS传输
  sameSite: 'strict' // 防止CSRF攻击
}
```

#### 令牌最佳实践

```typescript
// ✅ 正确的令牌验证
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

interface AuthRequest extends Request {
  user?: {
    id: number
    role: string
    permissions: string[]
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: '访问令牌缺失' }
      })
    }

    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // 检查令牌是否在黑名单中
    const isBlacklisted = await tokenBlacklist.isBlacklisted(token)
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_002', message: '令牌已失效' }
      })
    }

    // 获取用户信息
    const user = await userService.findById(decoded.userId)
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_003', message: '用户不存在或已禁用' }
      })
    }

    req.user = {
      id: user.id,
      role: user.role,
      permissions: user.permissions
    }

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_004', message: '令牌已过期' }
      })
    }
    
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_005', message: '令牌无效' }
    })
  }
}
```

### 基于角色的访问控制(RBAC)

```typescript
// 权限定义
enum Permission {
  READ_DASHBOARD = 'read:dashboard',
  WRITE_DASHBOARD = 'write:dashboard',
  DELETE_DASHBOARD = 'delete:dashboard',
  READ_DATASOURCE = 'read:datasource',
  WRITE_DATASOURCE = 'write:datasource',
  ADMIN_USER = 'admin:user',
  ADMIN_SYSTEM = 'admin:system'
}

// 角色权限映射
const rolePermissions = {
  viewer: [
    Permission.READ_DASHBOARD,
    Permission.READ_DATASOURCE
  ],
  user: [
    Permission.READ_DASHBOARD,
    Permission.WRITE_DASHBOARD,
    Permission.READ_DATASOURCE
  ],
  admin: [
    Permission.READ_DASHBOARD,
    Permission.WRITE_DASHBOARD,
    Permission.DELETE_DASHBOARD,
    Permission.READ_DATASOURCE,
    Permission.WRITE_DATASOURCE,
    Permission.ADMIN_USER
  ],
  superadmin: Object.values(Permission)
}

// 权限检查中间件
export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_006', message: '未认证' }
      })
    }

    const userPermissions = rolePermissions[req.user.role] || []
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: { code: 'AUTH_007', message: '权限不足' }
      })
    }

    next()
  }
}
```

### 密码安全

```typescript
import bcrypt from 'bcryptjs'
import zxcvbn from 'zxcvbn'

// 密码强度验证
export const validatePasswordStrength = (password: string) => {
  const result = zxcvbn(password)
  
  if (result.score < 3) {
    throw new Error('密码强度不足，请使用更复杂的密码')
  }
  
  // 额外的密码规则
  const rules = [
    { test: /.{8,}/, message: '密码至少8个字符' },
    { test: /[A-Z]/, message: '密码必须包含大写字母' },
    { test: /[a-z]/, message: '密码必须包含小写字母' },
    { test: /\d/, message: '密码必须包含数字' },
    { test: /[!@#$%^&*(),.?":{}|<>]/, message: '密码必须包含特殊字符' }
  ]
  
  for (const rule of rules) {
    if (!rule.test.test(password)) {
      throw new Error(rule.message)
    }
  }
}

// 安全的密码哈希
export const hashPassword = async (password: string): Promise<string> => {
  validatePasswordStrength(password)
  const saltRounds = 12 // 高强度盐值
  return bcrypt.hash(password, saltRounds)
}

// 密码验证
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}
```

## 🗄️ 数据安全

### 数据库安全

#### 连接安全

```typescript
// 安全的数据库配置
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(process.env.DB_SSL_CA!),
    cert: fs.readFileSync(process.env.DB_SSL_CERT!),
    key: fs.readFileSync(process.env.DB_SSL_KEY!)
  },
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
}
```

#### SQL注入防护

```typescript
// ✅ 使用参数化查询
export const getUserById = async (id: number) => {
  const query = 'SELECT * FROM users WHERE id = ? AND is_active = 1'
  const [rows] = await pool.execute(query, [id])
  return rows[0]
}

// ✅ 使用ORM的安全方法
export const searchUsers = async (searchTerm: string) => {
  return User.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } }
      ],
      is_active: true
    }
  })
}

// ❌ 避免字符串拼接
// const query = `SELECT * FROM users WHERE name = '${name}'` // 危险！
```

### 数据加密

```typescript
import crypto from 'crypto'

// AES加密工具
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm'
  private readonly key: Buffer

  constructor() {
    this.key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32)
  }

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(this.algorithm, this.key)
    cipher.setAAD(Buffer.from('51talk-data-platform'))
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    }
  }

  decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(this.algorithm, this.key)
    decipher.setAAD(Buffer.from('51talk-data-platform'))
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}

// 敏感数据加密存储
export const storeSensitiveData = async (userId: number, data: any) => {
  const encryption = new EncryptionService()
  const encryptedData = encryption.encrypt(JSON.stringify(data))
  
  await SensitiveData.create({
    user_id: userId,
    encrypted_data: encryptedData.encrypted,
    iv: encryptedData.iv,
    tag: encryptedData.tag
  })
}
```

### 数据脱敏

```typescript
// 数据脱敏工具
export class DataMaskingService {
  // 邮箱脱敏
  static maskEmail(email: string): string {
    const [username, domain] = email.split('@')
    const maskedUsername = username.length > 2 
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : '*'.repeat(username.length)
    return `${maskedUsername}@${domain}`
  }

  // 手机号脱敏
  static maskPhone(phone: string): string {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  // 身份证脱敏
  static maskIdCard(idCard: string): string {
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  }

  // 通用脱敏
  static maskSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const masked = { ...data }
    
    // 脱敏字段列表
    const sensitiveFields = ['email', 'phone', 'id_card', 'password']
    
    for (const field of sensitiveFields) {
      if (masked[field]) {
        switch (field) {
          case 'email':
            masked[field] = this.maskEmail(masked[field])
            break
          case 'phone':
            masked[field] = this.maskPhone(masked[field])
            break
          case 'id_card':
            masked[field] = this.maskIdCard(masked[field])
            break
          case 'password':
            delete masked[field] // 完全移除密码字段
            break
        }
      }
    }

    return masked
  }
}
```

## 🌐 网络安全

### HTTPS配置

```nginx
# Nginx HTTPS配置
server {
    listen 443 ssl http2;
    server_name api.51talk-data.com;

    # SSL证书配置
    ssl_certificate /etc/ssl/certs/51talk-data.crt;
    ssl_certificate_key /etc/ssl/private/51talk-data.key;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 其他安全头
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" always;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name api.51talk-data.com;
    return 301 https://$server_name$request_uri;
}
```

### CORS安全配置

```typescript
import cors from 'cors'

// 安全的CORS配置
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // 允许的域名列表
    const allowedOrigins = [
      'https://51talk-data.com',
      'https://www.51talk-data.com',
      'https://admin.51talk-data.com'
    ]
    
    // 开发环境允许localhost
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:5173')
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('不允许的CORS来源'))
    }
  },
  credentials: true, // 允许携带凭证
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  maxAge: 86400 // 预检请求缓存时间
}

app.use(cors(corsOptions))
```

### 请求限流

```typescript
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

// 通用限流
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:general:'
  }),
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_001',
      message: '请求过于频繁，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

// 认证接口限流
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每个IP最多5次认证请求
  skipSuccessfulRequests: true, // 成功请求不计入限制
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_002',
      message: '认证请求过于频繁，请15分钟后再试'
    }
  }
})

// 应用限流中间件
app.use('/api/', generalLimiter)
app.use('/api/auth/', authLimiter)
```

## 🔒 应用安全

### 输入验证

```typescript
import { body, param, query, validationResult } from 'express-validator'
import DOMPurify from 'isomorphic-dompurify'

// 输入验证中间件
export const validateInput = [
  // 用户注册验证
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请提供有效的邮箱地址'),
  
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('密码必须包含大小写字母、数字和特殊字符'),
  
  // 处理验证结果
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '输入验证失败',
          details: errors.array()
        }
      })
    }
    next()
  }
]

// XSS防护
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // 清理请求体中的HTML
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = DOMPurify.sanitize(req.body[key])
      }
    }
  }
  
  // 清理查询参数
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = DOMPurify.sanitize(req.query[key] as string)
      }
    }
  }
  
  next()
}
```

### 安全头配置

```typescript
import helmet from 'helmet'

// 安全头配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}))
```

## 🚀 部署安全

### 环境变量安全

```bash
# .env.example - 不包含敏感信息
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=51talk_data_platform
# 以下变量需要在部署时设置
# DB_USER=
# DB_PASSWORD=
# JWT_SECRET=
# JWT_REFRESH_SECRET=
# ENCRYPTION_KEY=
```

```typescript
// 环境变量验证
import Joi from 'joi'

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
  PORT: Joi.number().port().default(3000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(3306),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().min(8).required(),
  DB_NAME: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  ENCRYPTION_KEY: Joi.string().min(32).required(),
  REDIS_URL: Joi.string().uri().optional()
})

const { error, value: envVars } = envSchema.validate(process.env)

if (error) {
  throw new Error(`环境变量验证失败: ${error.message}`)
}

export default envVars
```

### Docker安全

```dockerfile
# 使用非root用户
FROM node:18-alpine

# 创建应用用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY --chown=nextjs:nodejs . .

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

## 📊 监控与审计

### 安全日志

```typescript
import winston from 'winston'

// 安全日志配置
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: '51talk-data-platform-security' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/security.log',
      level: 'info'
    }),
    new winston.transports.File({ 
      filename: 'logs/security-error.log',
      level: 'error'
    })
  ]
})

// 安全事件记录
export const logSecurityEvent = (event: {
  type: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'data_access'
  userId?: number
  ip: string
  userAgent: string
  details?: any
}) => {
  securityLogger.info('Security Event', {
    ...event,
    timestamp: new Date().toISOString()
  })
}

// 使用示例
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await authService.login(email, password)
    
    logSecurityEvent({
      type: 'login',
      userId: user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent') || ''
    })
    
    res.json({ success: true, data: user })
  } catch (error) {
    logSecurityEvent({
      type: 'failed_login',
      ip: req.ip,
      userAgent: req.get('User-Agent') || '',
      details: { email: req.body.email }
    })
    
    res.status(401).json({ success: false, error: 'Login failed' })
  }
})
```

### 异常检测

```typescript
// 异常行为检测
class SecurityMonitor {
  private redis: Redis
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!)
  }
  
  // 检测暴力破解
  async checkBruteForce(ip: string, action: string): Promise<boolean> {
    const key = `security:bruteforce:${action}:${ip}`
    const attempts = await this.redis.incr(key)
    
    if (attempts === 1) {
      await this.redis.expire(key, 900) // 15分钟过期
    }
    
    if (attempts > 5) {
      await this.alertSecurity({
        type: 'brute_force_detected',
        ip,
        action,
        attempts
      })
      return true
    }
    
    return false
  }
  
  // 检测异常登录
  async checkAnomalousLogin(userId: number, ip: string, userAgent: string): Promise<void> {
    const userKey = `security:user:${userId}`
    const lastLogin = await this.redis.hgetall(userKey)
    
    if (lastLogin.ip && lastLogin.ip !== ip) {
      await this.alertSecurity({
        type: 'anomalous_login',
        userId,
        newIp: ip,
        lastIp: lastLogin.ip,
        userAgent
      })
    }
    
    await this.redis.hmset(userKey, {
      ip,
      userAgent,
      lastLogin: new Date().toISOString()
    })
    await this.redis.expire(userKey, 86400 * 30) // 30天过期
  }
  
  // 安全告警
  private async alertSecurity(alert: any): Promise<void> {
    securityLogger.warn('Security Alert', alert)
    
    // 发送告警通知（邮件、短信、Slack等）
    // await notificationService.sendSecurityAlert(alert)
  }
}
```

## ✅ 安全检查清单

### 开发阶段

- [ ] 使用参数化查询防止SQL注入
- [ ] 实施输入验证和输出编码
- [ ] 使用安全的密码哈希算法
- [ ] 实施适当的错误处理
- [ ] 避免在代码中硬编码敏感信息
- [ ] 使用安全的随机数生成器
- [ ] 实施适当的日志记录
- [ ] 进行代码安全审查

### 部署阶段

- [ ] 使用HTTPS加密传输
- [ ] 配置安全的HTTP头
- [ ] 实施请求限流
- [ ] 配置防火墙规则
- [ ] 使用非root用户运行应用
- [ ] 定期更新依赖包
- [ ] 配置安全的数据库连接
- [ ] 实施备份和恢复策略

### 运维阶段

- [ ] 监控安全日志
- [ ] 定期进行安全扫描
- [ ] 实施入侵检测
- [ ] 定期更新系统补丁
- [ ] 进行安全培训
- [ ] 制定应急响应计划
- [ ] 定期进行安全审计
- [ ] 监控第三方依赖漏洞

## 🚨 漏洞报告

### 报告流程

1. **发现漏洞**: 如果您发现了安全漏洞，请不要公开披露
2. **联系我们**: 发送邮件至 security@51talk.com
3. **提供详情**: 包含漏洞详细信息和复现步骤
4. **等待回复**: 我们将在24小时内回复确认
5. **协作修复**: 与我们合作修复漏洞
6. **负责披露**: 在修复完成后进行负责任的披露

### 报告模板

```markdown
# 安全漏洞报告

## 基本信息
- 发现者: [您的姓名]
- 发现时间: [YYYY-MM-DD]
- 漏洞类型: [SQL注入/XSS/CSRF/等]
- 严重程度: [低/中/高/严重]

## 漏洞描述
[详细描述漏洞的性质和影响]

## 影响范围
[描述漏洞可能影响的系统和数据]

## 复现步骤
1. [步骤1]
2. [步骤2]
3. [步骤3]

## 概念验证
[提供PoC代码或截图]

## 修复建议
[如果有修复建议，请提供]

## 联系方式
[您的联系方式，便于我们与您沟通]
```

### 奖励计划

我们为负责任地报告安全漏洞的研究人员提供奖励：

| 严重程度 | 奖励金额 |
|----------|----------|
| 严重 | ¥5000-¥20000 |
| 高 | ¥1000-¥5000 |
| 中 | ¥500-¥1000 |
| 低 | ¥100-¥500 |

## 📞 联系我们

如有安全相关问题，请联系：

- **安全邮箱**: security@51talk.com
- **紧急联系**: +86-400-XXX-XXXX
- **PGP公钥**: [链接到公钥]

---

**注意**: 本文档会定期更新，请关注最新版本。最后更新时间：2024-01-15