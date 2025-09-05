# 贡献指南

感谢您对51Talk数据中台项目的关注！本文档将指导您如何参与项目开发和贡献代码。

## 📋 目录

- [开发环境准备](#开发环境准备)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [分支管理](#分支管理)
- [Pull Request流程](#pull-request流程)
- [问题报告](#问题报告)
- [功能建议](#功能建议)
- [代码审查](#代码审查)

## 🛠️ 开发环境准备

### 1. Fork项目

1. 访问项目仓库页面
2. 点击右上角的 "Fork" 按钮
3. 将项目Fork到您的GitHub账户

### 2. 克隆代码

```bash
# 克隆您Fork的仓库
git clone https://github.com/YOUR_USERNAME/51talk-data-platform.git
cd 51talk-data-platform

# 添加上游仓库
git remote add upstream https://github.com/51talk/51talk-data-platform.git
```

### 3. 安装依赖

```bash
# 安装所有依赖
npm run install:all

# 或者分别安装
cd frontend && npm install
cd ../backend && npm install
```

### 4. 配置环境

```bash
# 复制环境配置文件
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# 根据实际情况修改配置
```

### 5. 启动开发服务

```bash
# 启动数据库（如果使用Docker）
docker-compose up -d mysql redis

# 运行数据库迁移
npm run db:migrate

# 启动开发服务器
npm run dev
```

## 📝 代码规范

### TypeScript/JavaScript规范

我们使用ESLint和Prettier来保证代码质量和风格一致性。

#### 基本规则

- 使用TypeScript进行开发
- 使用2个空格进行缩进
- 使用单引号字符串
- 行末不加分号
- 最大行长度100字符
- 使用驼峰命名法

#### 示例代码

```typescript
// ✅ 正确示例
interface UserData {
  id: number
  username: string
  email: string
  createdAt: Date
}

const getUserById = async (id: number): Promise<UserData | null> => {
  try {
    const user = await userRepository.findById(id)
    return user
  } catch (error) {
    console.error('Failed to get user:', error)
    return null
  }
}

// ❌ 错误示例
function get_user_by_id(id) {
    var user = userRepository.findById(id);
    return user;
}
```

### React组件规范

```tsx
// ✅ 正确示例
import React, { useState, useEffect } from 'react'
import { Button, Card } from 'antd'
import type { User } from '@/types'

interface UserCardProps {
  user: User
  onEdit: (user: User) => void
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  const [loading, setLoading] = useState(false)

  const handleEdit = () => {
    setLoading(true)
    onEdit(user)
    setLoading(false)
  }

  return (
    <Card title={user.username}>
      <p>Email: {user.email}</p>
      <Button onClick={handleEdit} loading={loading}>
        编辑
      </Button>
    </Card>
  )
}

export default UserCard
```

### CSS/样式规范

- 使用CSS Modules或styled-components
- 遵循BEM命名规范
- 使用Tailwind CSS工具类
- 避免内联样式

```css
/* ✅ 正确示例 */
.user-card {
  @apply bg-white rounded-lg shadow-md p-4;
}

.user-card__title {
  @apply text-lg font-semibold text-gray-800;
}

.user-card__content {
  @apply mt-2 text-gray-600;
}

/* ❌ 错误示例 */
.usercard {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 16px;
}
```

### 后端API规范

```typescript
// ✅ 正确示例
import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { userService } from '@/services'
import { ApiResponse } from '@/types'

export const createUser = [
  // 验证中间件
  body('username').isLength({ min: 3, max: 20 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  
  // 控制器函数
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        } as ApiResponse)
      }

      const user = await userService.createUser(req.body)
      
      res.status(201).json({
        success: true,
        data: user,
        message: '用户创建成功'
      } as ApiResponse)
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '内部服务器错误'
        }
      } as ApiResponse)
    }
  }
]
```

## 📋 提交规范

我们使用[Conventional Commits](https://www.conventionalcommits.org/)规范来管理提交信息。

### 提交格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 提交类型

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI/CD相关
- `build`: 构建系统或外部依赖的变动

### 提交示例

```bash
# 新功能
git commit -m "feat(auth): add user registration endpoint"

# 修复bug
git commit -m "fix(dashboard): resolve chart rendering issue"

# 文档更新
git commit -m "docs: update API documentation"

# 重构
git commit -m "refactor(user): extract user validation logic"

# 性能优化
git commit -m "perf(query): optimize database query performance"
```

### 提交信息详细说明

```bash
git commit -m "feat(auth): add OAuth2 authentication

- Implement Google OAuth2 integration
- Add JWT token generation and validation
- Update user model to support OAuth providers
- Add comprehensive test coverage

Closes #123"
```

## 🌿 分支管理

我们使用Git Flow工作流程：

### 主要分支

- `main`: 生产环境分支，始终保持稳定
- `develop`: 开发分支，集成最新功能
- `feature/*`: 功能分支
- `hotfix/*`: 热修复分支
- `release/*`: 发布分支

### 分支命名规范

```bash
# 功能分支
feature/user-authentication
feature/dashboard-charts
feature/data-export

# 修复分支
fix/login-validation
fix/chart-rendering

# 热修复分支
hotfix/security-patch
hotfix/critical-bug

# 发布分支
release/v1.2.0
release/v1.2.1
```

### 分支工作流程

1. **创建功能分支**
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. **开发和提交**
   ```bash
   # 进行开发工作
   git add .
   git commit -m "feat: add new feature"
   ```

3. **保持同步**
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

4. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🔄 Pull Request流程

### 1. 创建Pull Request

1. 推送您的功能分支到GitHub
2. 在GitHub上创建Pull Request
3. 选择正确的目标分支（通常是`develop`）
4. 填写详细的PR描述

### 2. PR模板

```markdown
## 📝 变更描述

简要描述此PR的变更内容。

## 🔗 相关Issue

Closes #123
Related to #456

## 📋 变更类型

- [ ] 新功能
- [ ] Bug修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 测试相关
- [ ] 其他

## 🧪 测试

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成
- [ ] 代码覆盖率满足要求

## 📸 截图（如适用）

添加相关截图或GIF来展示变更效果。

## 📝 检查清单

- [ ] 代码遵循项目规范
- [ ] 已添加必要的测试
- [ ] 文档已更新
- [ ] 无破坏性变更
- [ ] 已自测功能正常
```

### 3. 代码审查

- 至少需要1个审查者批准
- 所有CI检查必须通过
- 解决所有审查意见
- 保持提交历史清晰

### 4. 合并要求

- 使用"Squash and merge"合并小功能
- 使用"Merge commit"合并大功能
- 删除已合并的功能分支

## 🐛 问题报告

### 报告Bug

使用GitHub Issues报告问题，请包含：

1. **问题描述**: 清晰描述遇到的问题
2. **复现步骤**: 详细的复现步骤
3. **期望行为**: 描述期望的正确行为
4. **实际行为**: 描述实际发生的行为
5. **环境信息**: 操作系统、浏览器、Node.js版本等
6. **截图/日志**: 相关的错误截图或日志

### Bug报告模板

```markdown
## 🐛 Bug描述

简要描述遇到的问题。

## 🔄 复现步骤

1. 进入页面 '...'
2. 点击按钮 '...'
3. 滚动到 '...'
4. 看到错误

## ✅ 期望行为

描述期望发生的行为。

## ❌ 实际行为

描述实际发生的行为。

## 🖥️ 环境信息

- OS: [e.g. Windows 10, macOS 12.0]
- Browser: [e.g. Chrome 96, Firefox 95]
- Node.js: [e.g. 18.12.0]
- npm: [e.g. 8.19.2]

## 📸 截图

如果适用，添加截图来帮助解释问题。

## 📝 附加信息

添加任何其他相关信息。
```

## 💡 功能建议

### 提出新功能

1. 检查是否已有类似的功能请求
2. 创建Feature Request Issue
3. 详细描述功能需求和使用场景
4. 提供设计草图或原型（如有）

### 功能请求模板

```markdown
## 🚀 功能描述

简要描述建议的功能。

## 💭 动机

解释为什么需要这个功能，它解决了什么问题。

## 📋 详细设计

详细描述功能的工作方式。

## 🎯 验收标准

- [ ] 标准1
- [ ] 标准2
- [ ] 标准3

## 🔄 替代方案

描述考虑过的其他解决方案。

## 📸 设计稿

如果有设计稿或原型，请添加。
```

## 👀 代码审查

### 审查者指南

1. **功能性**: 代码是否实现了预期功能
2. **可读性**: 代码是否清晰易懂
3. **性能**: 是否存在性能问题
4. **安全性**: 是否存在安全漏洞
5. **测试**: 是否有足够的测试覆盖
6. **文档**: 是否需要更新文档

### 审查清单

- [ ] 代码逻辑正确
- [ ] 遵循编码规范
- [ ] 无明显性能问题
- [ ] 无安全漏洞
- [ ] 测试覆盖充分
- [ ] 文档已更新
- [ ] 无破坏性变更
- [ ] 错误处理完善

### 审查反馈

提供建设性的反馈：

```markdown
# ✅ 优点
- 代码结构清晰
- 测试覆盖完整
- 性能优化良好

# 🔧 建议改进
- 建议提取公共函数以减少重复代码
- 可以添加更多的错误处理
- 考虑使用更具描述性的变量名

# ❓ 问题
- 第45行的逻辑是否正确？
- 是否考虑了边界情况？
```

## 🏆 贡献者认可

我们感谢每一位贡献者的努力！贡献者将会：

- 在项目README中被列出
- 获得贡献者徽章
- 参与项目决策讨论
- 优先获得新功能预览

## 📞 联系我们

如有任何问题，请通过以下方式联系我们：

- **GitHub Issues**: 技术问题和功能建议
- **邮箱**: dev@51talk.com
- **微信群**: 扫描二维码加入开发者群

## 📄 许可证

通过贡献代码，您同意您的贡献将在[MIT License](../LICENSE)下授权。

---

再次感谢您的贡献！🎉