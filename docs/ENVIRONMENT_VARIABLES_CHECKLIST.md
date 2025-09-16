# 环境变量配置清单

## 必需的环境变量

根据代码分析，以下是项目中使用的所有环境变量：

### 🔥 豆包API（必需 - 用于图像生成）
- `DOUBAO_API_KEY`: 豆包API密钥
- `DOUBAO_ENDPOINT_ID`: 豆包推理端点ID（以`ep-`开头）

### 🎤 Deepgram API（可选 - 用于语音功能）
- `DEEPGRAM_API_KEY`: Deepgram语音识别API密钥

### 🔥 Firebase（可选 - 用于用户认证和数据存储）
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API密钥
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase认证域名
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase项目ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase存储桶
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase消息发送者ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase应用ID

## 当前错误分析

您遇到的错误：
```
DOUBAO endpoint ID is not configured or invalid. Please add DOUBAO_ENDPOINT_ID to your .env.local file.
```

**原因**: 缺少 `DOUBAO_ENDPOINT_ID` 环境变量配置

## 解决方案

### 1. 本地开发环境

创建 `.env.local` 文件（基于 `.env.local.example`）：
```bash
cp .env.local.example .env.local
```

然后编辑 `.env.local` 文件，添加真实的配置值：
```env
DOUBAO_API_KEY=your_actual_doubao_api_key
DOUBAO_ENDPOINT_ID=ep-your-actual-endpoint-id
```

### 2. Vercel生产环境

在Vercel Dashboard中配置以下环境变量：

#### 必需配置（图像生成功能）：
1. `DOUBAO_API_KEY` = 您的豆包API密钥
2. `DOUBAO_ENDPOINT_ID` = 您的豆包端点ID

#### 可选配置（根据需要）：
3. `DEEPGRAM_API_KEY` = 您的Deepgram API密钥（如果使用语音功能）
4. Firebase相关变量（如果使用Firebase功能）

## 配置步骤详解

### 获取豆包API配置

1. **获取API密钥**：
   - 访问 [火山方舟控制台](https://console.volcengine.com/ark)
   - 登录账户
   - 导航到「API密钥」页面
   - 创建或复制现有API密钥

2. **获取端点ID**：
   - 在火山方舟控制台中，访问 [推理端点页面](https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint)
   - 创建新的推理端点（选择图像生成模型，如 `doubao-seedream-4.0`）
   - 复制端点ID（格式：`ep-20241220161728-xxxxx`）

### 在Vercel中配置

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 Settings → Environment Variables
4. 添加必需的环境变量
5. 重新部署项目

## 验证配置

配置完成后，您可以通过以下方式验证：

1. **本地验证**：
   ```bash
   npm run dev
   ```
   访问 http://localhost:3000，尝试生成图像

2. **生产环境验证**：
   - 重新部署Vercel项目
   - 访问您的Vercel应用URL
   - 尝试生成图像功能

## 常见问题

### Q: 端点ID格式不正确
**错误**: `DOUBAO endpoint ID is not configured or invalid`
**解决**: 确保端点ID以 `ep-` 开头，格式类似 `ep-20241220161728-xxxxx`

### Q: API密钥无效
**错误**: `401 Unauthorized` 或类似认证错误
**解决**: 检查API密钥是否正确，是否有足够的权限

### Q: 配置后仍然报错
**解决步骤**:
1. 检查环境变量名称拼写（区分大小写）
2. 确认已重新部署项目
3. 检查API密钥和端点ID的有效性
4. 查看Vercel部署日志获取详细错误信息

## 安全注意事项

- ✅ 使用环境变量存储敏感信息
- ✅ 将 `.env.local` 添加到 `.gitignore`
- ✅ 定期轮换API密钥
- ❌ 不要在代码中硬编码API密钥
- ❌ 不要将真实的API密钥提交到Git仓库

## 下一步

1. 按照本指南配置必需的环境变量
2. 重新部署Vercel项目
3. 测试图像生成功能
4. 如有问题，查看部署日志进行调试