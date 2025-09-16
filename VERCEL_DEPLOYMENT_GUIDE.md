# Vercel 部署指南

## 问题解决

您的项目部署失败是因为 Vercel 中缺少必要的环境变量配置。以下是完整的解决方案：

## 🔧 修复步骤

### 1. 在 Vercel 控制台配置环境变量

请访问 [Vercel Dashboard](https://vercel.com/dashboard) 并按以下步骤操作：

1. **进入项目设置**
   - 找到您的 `ai-image-generator` 项目
   - 点击项目名称进入项目详情
   - 点击 "Settings" 标签

2. **配置环境变量**
   - 在左侧菜单中点击 "Environment Variables"
   - 添加以下环境变量：

#### 必需的环境变量：

```
# Supabase 配置（如果使用 Supabase）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# DOUBAO API 配置
DOUBAO_API_KEY=your_doubao_api_key_here
DOUBAO_ENDPOINT_ID=ep-your-endpoint-id

# Replicate API（如果使用）
REPLICATE_API_TOKEN=your_replicate_api_token
```

### 2. 获取 Supabase 配置信息

如果您还没有 Supabase 项目，请按以下步骤创建：

1. **创建 Supabase 项目**
   - 访问 [Supabase Dashboard](https://app.supabase.com)
   - 点击 "New Project"
   - 填写项目信息并创建项目

2. **获取 API 密钥**
   - 在项目 Dashboard 中，点击 "Settings" → "API"
   - 复制以下信息：
     - `URL`: 项目 URL
     - `anon public`: 匿名公钥
     - `service_role`: 服务角色密钥（保密）

### 3. 获取 DOUBAO API 配置

1. 访问 [火山引擎控制台](https://console.volcengine.com/ark)
2. 创建 API 密钥和推理端点
3. 复制 API 密钥和端点 ID

### 4. 重新部署

配置完环境变量后：

1. **自动重新部署**
   - Vercel 会自动检测到环境变量更改
   - 等待几分钟让部署完成

2. **手动触发部署**（如果需要）
   - 在项目 Dashboard 中点击 "Deployments"
   - 点击最新部署旁的 "..." 菜单
   - 选择 "Redeploy"

## 🚀 验证部署

部署完成后：

1. 访问您的 Vercel 部署 URL
2. 检查应用是否正常加载
3. 测试 AI 图片生成功能

## 📋 环境变量检查清单

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase 服务角色密钥
- [ ] `DOUBAO_API_KEY` - DOUBAO API 密钥
- [ ] `DOUBAO_ENDPOINT_ID` - DOUBAO 端点 ID
- [ ] `REPLICATE_API_TOKEN` - Replicate API 令牌（可选）

## 🔍 故障排除

### 常见错误：

1. **"Environment Variable references Secret which does not exist"**
   - 确保在 Vercel 中正确配置了所有环境变量
   - 检查变量名称是否完全匹配

2. **"The functions property cannot be used in conjunction with the builds property"**
   - 这个问题已经修复（移除了 builds 属性）

3. **部署成功但应用无法工作**
   - 检查浏览器控制台的错误信息
   - 确认所有 API 密钥都是有效的

## 📞 需要帮助？

如果您在配置过程中遇到问题：

1. 检查 Vercel 部署日志中的具体错误信息
2. 确认所有环境变量都已正确设置
3. 验证 API 密钥的有效性

---

**注意**: 请确保不要在代码中硬编码任何 API 密钥或敏感信息。所有敏感配置都应通过环境变量管理。