# Vercel 部署指南

## 自动部署设置

### 1. 连接 GitHub 仓库
- 登录 [Vercel Dashboard](https://vercel.com/dashboard)
- 点击 "New Project"
- 选择你的 GitHub 仓库：`ai-image-generator`
- 点击 "Import"

### 2. 配置环境变量
在 Vercel 项目设置中添加以下环境变量：

#### Supabase 配置
```
NEXT_PUBLIC_SUPABASE_URL=你的_supabase_项目_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的_supabase_service_role_key
```

#### AI 服务配置
```
DOUBAO_API_KEY=你的_豆包_api_key
DOUBAO_ENDPOINT_ID=你的_豆包_endpoint_id
REPLICATE_API_TOKEN=你的_replicate_api_token
```

### 3. 部署设置
- 构建命令：`npm run build`
- 输出目录：`.next`
- 安装命令：`npm install`
- Node.js 版本：18.x

### 4. 自动重新部署
每次推送到 GitHub 主分支时，Vercel 会自动检测更改并重新部署。

## 隐私保护注意事项

⚠️ **重要提醒**：
- 永远不要在代码中硬编码 API 密钥
- 所有敏感信息都应通过环境变量配置
- 定期轮换 API 密钥以确保安全
- 不要在公共仓库中提交 `.env.local` 文件

## 验证部署

部署完成后，请验证以下功能：
1. 页面正常加载
2. AI 图片生成功能正常
3. 数据库连接正常
4. 图片上传和存储功能正常

## 故障排除

如果部署失败，请检查：
1. 所有环境变量是否正确配置
2. API 密钥是否有效
3. Supabase 项目是否正常运行
4. 构建日志中的错误信息

---

**注意**：本项目已配置 `vercel.json` 文件，包含了正确的构建和环境变量设置。