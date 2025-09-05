# 部署指南

本文档详细介绍了51Talk数据中台项目的部署方法和最佳实践。

## 📋 目录

- [环境要求](#环境要求)
- [本地开发部署](#本地开发部署)
- [Docker部署](#docker部署)
- [生产环境部署](#生产环境部署)
- [云平台部署](#云平台部署)
- [监控和日志](#监控和日志)
- [备份和恢复](#备份和恢复)
- [故障排除](#故障排除)
- [性能优化](#性能优化)

## 🛠️ 环境要求

### 最低系统要求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 2核 | 4核+ |
| 内存 | 4GB | 8GB+ |
| 存储 | 20GB | 100GB+ SSD |
| 网络 | 100Mbps | 1Gbps |

### 软件依赖

#### 必需软件

- **Node.js**: >= 18.0.0
- **MySQL**: >= 8.0
- **Redis**: >= 6.0 (可选，用于缓存)
- **Nginx**: >= 1.18 (生产环境)
- **Docker**: >= 20.10 (Docker部署)
- **Docker Compose**: >= 2.0

#### 开发工具

- **Git**: >= 2.30
- **npm**: >= 8.0 或 **yarn**: >= 1.22
- **PM2**: >= 5.0 (生产环境进程管理)

### 操作系统支持

- **Linux**: Ubuntu 20.04+, CentOS 8+, RHEL 8+
- **macOS**: 10.15+
- **Windows**: 10/11 (开发环境)

## 🏠 本地开发部署

### 1. 环境准备

#### 安装Node.js

```bash
# 使用nvm安装Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

#### 安装MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# CentOS/RHEL
sudo yum install mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld

# macOS (使用Homebrew)
brew install mysql
brew services start mysql
```

#### 安装Redis (可选)

```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# CentOS/RHEL
sudo yum install redis
sudo systemctl start redis
sudo systemctl enable redis

# macOS
brew install redis
brew services start redis
```

### 2. 项目设置

#### 克隆项目

```bash
git clone https://github.com/51talk/data-platform.git
cd data-platform
```

#### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install

# 返回根目录
cd ..
```

### 3. 数据库配置

#### 创建数据库

```sql
-- 连接MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE data_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'data_platform'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON data_platform.* TO 'data_platform'@'localhost';
FLUSH PRIVILEGES;
```

#### 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

#### 后端环境变量 (backend/.env)

```env
# 服务配置
NODE_ENV=development
PORT=3000
HOST=localhost

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=data_platform
DB_USER=data_platform
DB_PASSWORD=your_password

# Redis配置 (可选)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 文件上传
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=./uploads

# 邮件配置 (可选)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password

# 日志配置
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
```

#### 前端环境变量 (frontend/.env)

```env
# API配置
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=51Talk数据中台
VITE_APP_VERSION=1.0.0

# 开发配置
VITE_DEV_PORT=5173
VITE_DEV_HOST=localhost

# 功能开关
VITE_ENABLE_MOCK=false
VITE_ENABLE_DEBUG=true
```

### 4. 数据库初始化

```bash
# 运行数据库迁移
cd backend
npm run db:migrate

# 检查迁移状态
npm run db:status
```

### 5. 启动服务

#### 启动后端服务

```bash
cd backend
npm run dev
```

#### 启动前端服务

```bash
# 新开终端窗口
cd frontend
npm run dev
```

### 6. 验证部署

- **前端**: http://localhost:5173
- **后端API**: http://localhost:3000/api
- **健康检查**: http://localhost:3000/api/health

## 🐳 Docker部署

### 1. 快速启动

```bash
# 克隆项目
git clone https://github.com/51talk/data-platform.git
cd data-platform

# 复制环境变量文件
cp .env.example .env

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 2. 环境配置

#### 主环境变量文件 (.env)

```env
# 数据库配置
MYSQL_ROOT_PASSWORD=root_password_here
MYSQL_DATABASE=data_platform
MYSQL_USER=data_platform
MYSQL_PASSWORD=user_password_here

# Redis配置
REDIS_PASSWORD=redis_password_here

# 应用配置
JWT_SECRET=your_jwt_secret_key_here
API_PORT=3000
WEB_PORT=80

# 网络配置
DOMAIN=localhost
SSL_ENABLED=false
```

### 3. 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 进入容器
docker-compose exec backend bash
docker-compose exec mysql mysql -u root -p

# 更新服务
docker-compose pull
docker-compose up -d
```

### 4. 数据持久化

```yaml
# docker-compose.yml 中的卷配置
volumes:
  mysql_data:
    driver: local
  redis_data:
    driver: local
  uploads:
    driver: local
```

### 5. 网络配置

```yaml
# 自定义网络
networks:
  data_platform:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## 🚀 生产环境部署

### 1. 服务器准备

#### 系统配置

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y curl wget git unzip

# 配置防火墙
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# 优化系统参数
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf
echo 'fs.file-max=65536' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### 创建应用用户

```bash
# 创建应用用户
sudo useradd -m -s /bin/bash dataplatform
sudo usermod -aG docker dataplatform

# 切换到应用用户
sudo su - dataplatform
```

### 2. 使用Docker Compose部署

#### 生产环境配置文件

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - data_platform

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - REDIS_HOST=redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs/backend:/app/logs
    depends_on:
      - mysql
      - redis
    restart: unless-stopped
    networks:
      - data_platform

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    networks:
      - data_platform

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/init.sql:/docker-entrypoint-initdb.d/02-init.sql
      - ./mysql/my.cnf:/etc/mysql/conf.d/my.cnf
    restart: unless-stopped
    networks:
      - data_platform

  redis:
    image: redis:alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - data_platform

volumes:
  mysql_data:
  redis_data:

networks:
  data_platform:
    driver: bridge
```

#### Nginx配置

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # 上游服务器
    upstream backend {
        server backend:3000;
        keepalive 32;
    }

    upstream frontend {
        server frontend:80;
        keepalive 32;
    }

    # HTTP重定向到HTTPS
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS服务器
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;

        # 现代SSL配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # HSTS
        add_header Strict-Transport-Security "max-age=63072000" always;

        # 前端静态文件
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 缓存静态资源
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # API代理
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket支持
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # 超时设置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### 3. SSL证书配置

#### 使用Let's Encrypt

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

#### 手动证书配置

```bash
# 创建SSL目录
mkdir -p nginx/ssl

# 复制证书文件
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem

# 设置权限
chmod 600 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem
```

### 4. 部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

echo "开始部署数据中台..."

# 检查环境
if [ ! -f ".env" ]; then
    echo "错误: .env 文件不存在"
    exit 1
fi

# 备份数据库
echo "备份数据库..."
docker-compose exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE > backup_$(date +%Y%m%d_%H%M%S).sql

# 拉取最新代码
echo "拉取最新代码..."
git pull origin main

# 构建镜像
echo "构建Docker镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 停止旧服务
echo "停止旧服务..."
docker-compose -f docker-compose.prod.yml down

# 启动新服务
echo "启动新服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 健康检查
echo "执行健康检查..."
if curl -f http://localhost/health; then
    echo "部署成功!"
else
    echo "部署失败，回滚..."
    docker-compose -f docker-compose.prod.yml down
    # 这里可以添加回滚逻辑
    exit 1
fi

# 清理旧镜像
echo "清理旧镜像..."
docker image prune -f

echo "部署完成!"
```

### 5. 进程管理

#### 使用PM2 (非Docker部署)

```bash
# 安装PM2
npm install -g pm2

# PM2配置文件
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'data-platform-backend',
    script: './dist/server.js',
    cwd: './backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart all

# 停止应用
pm2 stop all

# 设置开机自启
pm2 startup
pm2 save
```

## ☁️ 云平台部署

### 1. AWS部署

#### 使用ECS

```yaml
# aws-task-definition.json
{
  "family": "data-platform",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/data-platform-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/data-platform",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 使用RDS和ElastiCache

```bash
# 创建RDS实例
aws rds create-db-instance \
    --db-instance-identifier data-platform-db \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --master-username admin \
    --master-user-password your-password \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-xxxxxxxx

# 创建ElastiCache集群
aws elasticache create-cache-cluster \
    --cache-cluster-id data-platform-redis \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --num-cache-nodes 1
```

### 2. 阿里云部署

#### 使用容器服务ACK

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: data-platform-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: data-platform-backend
  template:
    metadata:
      labels:
        app: data-platform-backend
    spec:
      containers:
      - name: backend
        image: registry.cn-hangzhou.aliyuncs.com/your-namespace/data-platform-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          value: "your-rds-endpoint"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: data-platform-backend-service
spec:
  selector:
    app: data-platform-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 3. 腾讯云部署

#### 使用云函数SCF

```javascript
// serverless.yml
service: data-platform

provider:
  name: tencent
  runtime: Nodejs14.18
  region: ap-guangzhou
  memorySize: 512
  timeout: 30

functions:
  api:
    handler: index.handler
    events:
      - apigw:
          path: /{proxy+}
          method: ANY
    environment:
      NODE_ENV: production
      DB_HOST: ${env:DB_HOST}
      DB_PASSWORD: ${env:DB_PASSWORD}

package:
  exclude:
    - node_modules/**
    - .git/**
```

## 📊 监控和日志

### 1. 应用监控

#### Prometheus + Grafana

```yaml
# monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

volumes:
  prometheus_data:
  grafana_data:
```

#### Prometheus配置

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'data-platform-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'mysql'
    static_configs:
      - targets: ['mysql-exporter:9104']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### 2. 日志管理

#### ELK Stack

```yaml
# logging/docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    ports:
      - "5044:5044"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config:/usr/share/logstash/config
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:7.15.0
    user: root
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ../logs:/logs:ro
    depends_on:
      - logstash

volumes:
  elasticsearch_data:
```

### 3. 健康检查

```bash
#!/bin/bash
# scripts/health-check.sh

# 检查服务状态
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=$3
    
    echo "检查 $service_name..."
    
    status=$(curl -s -o /dev/null -w "%{http_code}" $url)
    
    if [ "$status" = "$expected_status" ]; then
        echo "✅ $service_name 正常"
        return 0
    else
        echo "❌ $service_name 异常 (状态码: $status)"
        return 1
    fi
}

# 检查数据库连接
check_database() {
    echo "检查数据库连接..."
    
    if docker-compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD -e "SELECT 1" > /dev/null 2>&1; then
        echo "✅ 数据库连接正常"
        return 0
    else
        echo "❌ 数据库连接失败"
        return 1
    fi
}

# 检查Redis连接
check_redis() {
    echo "检查Redis连接..."
    
    if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
        echo "✅ Redis连接正常"
        return 0
    else
        echo "❌ Redis连接失败"
        return 1
    fi
}

# 执行检查
echo "开始健康检查..."
echo "=================="

failed=0

check_service "前端服务" "http://localhost" "200" || failed=1
check_service "后端API" "http://localhost/api/health" "200" || failed=1
check_database || failed=1
check_redis || failed=1

echo "=================="

if [ $failed -eq 0 ]; then
    echo "✅ 所有服务正常"
    exit 0
else
    echo "❌ 部分服务异常"
    exit 1
fi
```

## 💾 备份和恢复

### 1. 数据库备份

```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/database_backup_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
echo "开始备份数据库..."
docker-compose exec -T mysql mysqldump \
    -u root \
    -p$MYSQL_ROOT_PASSWORD \
    --single-transaction \
    --routines \
    --triggers \
    $MYSQL_DATABASE > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "数据库备份成功: $BACKUP_FILE"
    
    # 压缩备份文件
    gzip $BACKUP_FILE
    echo "备份文件已压缩: $BACKUP_FILE.gz"
    
    # 删除7天前的备份
    find $BACKUP_DIR -name "database_backup_*.sql.gz" -mtime +7 -delete
    echo "已清理7天前的备份文件"
else
    echo "数据库备份失败"
    exit 1
fi
```

### 2. 文件备份

```bash
#!/bin/bash
# scripts/backup-files.sh

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILE_BACKUP="$BACKUP_DIR/files_backup_$DATE.tar.gz"

# 备份上传文件和配置
echo "开始备份文件..."
tar -czf $FILE_BACKUP \
    uploads/ \
    .env \
    nginx/ \
    --exclude='*.log'

if [ $? -eq 0 ]; then
    echo "文件备份成功: $FILE_BACKUP"
else
    echo "文件备份失败"
    exit 1
fi
```

### 3. 自动备份

```bash
# 添加到crontab
crontab -e

# 每天凌晨2点备份数据库
0 2 * * * /path/to/data-platform/scripts/backup-database.sh

# 每周日凌晨3点备份文件
0 3 * * 0 /path/to/data-platform/scripts/backup-files.sh
```

### 4. 数据恢复

```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "用法: $0 <backup_file>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "备份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "警告: 此操作将覆盖当前数据库!"
read -p "确认继续? (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "操作已取消"
    exit 0
fi

echo "开始恢复数据库..."

# 如果是压缩文件，先解压
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | docker-compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE
else
    docker-compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE < $BACKUP_FILE
fi

if [ $? -eq 0 ]; then
    echo "数据库恢复成功"
else
    echo "数据库恢复失败"
    exit 1
fi
```

## 🔧 故障排除

### 1. 常见问题

#### 服务无法启动

```bash
# 检查端口占用
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :80

# 检查Docker服务
sudo systemctl status docker
sudo systemctl start docker

# 检查容器日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# 检查容器状态
docker-compose ps
docker stats
```

#### 数据库连接失败

```bash
# 检查MySQL容器
docker-compose exec mysql mysql -u root -p

# 检查网络连接
docker-compose exec backend ping mysql

# 检查环境变量
docker-compose exec backend env | grep DB_

# 查看MySQL日志
docker-compose logs mysql
```

#### 前端无法访问后端

```bash
# 检查API配置
cat frontend/.env | grep VITE_API_BASE_URL

# 测试API连接
curl http://localhost:3000/api/health

# 检查Nginx配置
nginx -t
docker-compose exec nginx nginx -t
```

### 2. 性能问题

#### 数据库性能优化

```sql
-- 查看慢查询
SHOW VARIABLES LIKE 'slow_query_log';
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- 查看进程列表
SHOW PROCESSLIST;

-- 分析查询
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- 查看索引使用情况
SHOW INDEX FROM users;
```

#### 应用性能监控

```bash
# 查看容器资源使用
docker stats

# 查看系统负载
top
htop
iostat -x 1

# 查看内存使用
free -h

# 查看磁盘使用
df -h
du -sh /var/lib/docker
```

### 3. 日志分析

```bash
# 查看应用日志
docker-compose logs -f --tail=100 backend

# 查看Nginx访问日志
tail -f logs/nginx/access.log

# 查看错误日志
tail -f logs/nginx/error.log
grep "ERROR" logs/backend/app.log

# 分析日志模式
awk '{print $1}' logs/nginx/access.log | sort | uniq -c | sort -nr
```

## ⚡ 性能优化

### 1. 数据库优化

```sql
-- 优化MySQL配置
-- my.cnf
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
query_cache_size = 128M
max_connections = 200
tmp_table_size = 64M
max_heap_table_size = 64M

-- 添加必要索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_dashboards_created_by ON dashboards(created_by);
CREATE INDEX idx_charts_dashboard_id ON charts(dashboard_id);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);
```

### 2. 应用优化

```javascript
// 启用压缩
const compression = require('compression');
app.use(compression());

// 启用缓存
const redis = require('redis');
const client = redis.createClient();

// 数据库连接池
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### 3. 前端优化

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          charts: ['echarts']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

### 4. CDN配置

```nginx
# 静态资源CDN
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
    
    # 如果使用CDN
    # return 301 https://cdn.example.com$request_uri;
}
```

---

## 📞 技术支持

如有部署问题，请联系：

- **邮箱**: ops@51talk.com
- **文档**: https://docs.51talk-data.com/deployment
- **GitHub Issues**: https://github.com/51talk/data-platform/issues

---

**版本**: v1.0.0  
**更新时间**: 2024-01-15