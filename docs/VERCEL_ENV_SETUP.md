# Vercel 环境变量配置指南

## 问题描述
您的 Vercel 部署显示错误：`DOUBAO endpoint ID is not configured or invalid. Please add DOUBAO_ENDPOINT_ID to your .env.local file.`

## 解决方案

### 步骤 1: 获取豆包 API 端点 ID

1. 访问 [火山引擎控制台](https://console.volcengine.com)
2. 登录您的账户
3. 进入 [方舟大模型服务](https://console.volcengine.com/ark)
4. 导航到 [推理接入点管理](https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint)
5. 创建或查看现有的推理端点
6. 复制端点 ID（格式：`ep-xxxxxxxxxx`）

### 步骤 2: 在 Vercel 中配置环境变量

#### 方法 1: 通过 Vercel 网页控制台

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到您的项目并点击进入
3. 点击顶部导航栏的 "Settings" 选项卡
4. 在左侧菜单中选择 "Environment Variables"
5. 点击 "Add New" 按钮
6. 填写以下信息：
   - **Name**: `DOUBAO_ENDPOINT_ID`
   - **Value**: 您从步骤1获取的端点ID（例如：`ep-20241201123456-abcde`）
   - **Environment**: 选择 `Production`, `Preview`, 和 `Development`（全选）
7. 点击 "Save" 保存

#### 方法 2: 通过 Vercel CLI

```bash
# 安装 Vercel CLI（如果尚未安装）
npm i -g vercel

# 登录到 Vercel
vercel login

# 在项目目录中添加环境变量
vercel env add DOUBAO_ENDPOINT_ID
# 输入您的端点ID值
# 选择适用的环境（Production, Preview, Development）
```

### 步骤 3: 重新部署项目

#### 方法 1: 通过 Vercel 控制台
1. 在项目页面点击 "Deployments" 选项卡
2. 点击最新部署右侧的三个点菜单
3. 选择 "Redeploy"
4. 确认重新部署

#### 方法 2: 通过 Git 推送
```bash
# 推送任何更改到 GitHub 将自动触发重新部署
git add .
git commit -m "trigger redeploy"
git push
```

#### 方法 3: 通过 Vercel CLI
```bash
# 在项目目录中执行
vercel --prod
```

### 步骤 4: 验证配置

1. 等待部署完成（通常需要1-3分钟）
2. 访问您的 Vercel 应用 URL
3. 检查是否还有 DOUBAO_ENDPOINT_ID 错误
4. 尝试生成图像以确认 API 正常工作

## 完整的环境变量清单

确保在 Vercel 中配置了以下环境变量：

- `DOUBAO_API_KEY`: 您的豆包 API 密钥
- `DOUBAO_ENDPOINT_ID`: 您的豆包推理端点 ID

## 故障排除

### 如果仍然出现错误：

1. **检查端点 ID 格式**：确保以 `ep-` 开头
2. **验证端点状态**：在火山引擎控制台确认端点处于"运行中"状态
3. **清除缓存**：在 Vercel 项目设置中清除构建缓存
4. **检查环境变量作用域**：确保环境变量应用于 Production 环境

### 常见错误：

- ❌ `ep-your-endpoint-id` (示例值)
- ✅ `ep-20241201123456-abcde` (实际端点ID)

## 联系支持

如果问题仍然存在，请检查：
1. 火山引擎账户是否有足够的配额
2. API 密钥是否有效且未过期
3. 推理端点是否正常运行

---

配置完成后，您的 AI 图像生成器应该能够正常工作！