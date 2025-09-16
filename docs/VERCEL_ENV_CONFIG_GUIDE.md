# Vercel环境变量配置指南

## 问题描述

如果您在Vercel部署的应用中看到以下错误：
```
DOUBAO endpoint ID is not configured or invalid. Please add DOUBAO_ENDPOINT_ID to your .env.local file.
```

这表示您需要在Vercel项目中配置豆包API的环境变量。

## 解决步骤

### 1. 获取豆包API配置信息

首先，您需要获取以下两个配置：
- `DOUBAO_API_KEY`: 豆包API密钥
- `DOUBAO_ENDPOINT_ID`: 豆包推理端点ID

#### 获取API密钥：
1. 访问 [火山方舟控制台](https://console.volcengine.com/ark)
2. 登录您的账户
3. 在左侧菜单中找到「API密钥」或「API Keys」
4. 创建新的API密钥或复制现有密钥

#### 获取端点ID：
1. 在火山方舟控制台中，导航到「推理服务」或「Inference Service」
2. 访问 [推理端点管理页面](https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint)
3. 如果没有端点，点击「创建端点」：
   - 选择模型：`doubao-seedream-4.0` 或类似的图像生成模型
   - 配置资源规格
   - 创建端点
4. 复制端点ID（格式类似：`ep-20241220161728-xxxxx`）

### 2. 在Vercel中配置环境变量

#### 方法一：通过Vercel Dashboard
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到您的项目并点击进入
3. 点击顶部的「Settings」标签
4. 在左侧菜单中选择「Environment Variables」
5. 添加以下环境变量：

   **变量1：**
   - Name: `DOUBAO_API_KEY`
   - Value: 您的豆包API密钥
   - Environment: 选择 `Production`, `Preview`, `Development`（建议全选）

   **变量2：**
   - Name: `DOUBAO_ENDPOINT_ID`
   - Value: 您的豆包端点ID（以`ep-`开头）
   - Environment: 选择 `Production`, `Preview`, `Development`（建议全选）

6. 点击「Save」保存配置

#### 方法二：通过Vercel CLI
```bash
# 安装Vercel CLI（如果尚未安装）
npm i -g vercel

# 登录Vercel
vercel login

# 在项目目录中添加环境变量
vercel env add DOUBAO_API_KEY
# 输入您的API密钥

vercel env add DOUBAO_ENDPOINT_ID
# 输入您的端点ID
```

### 3. 重新部署项目

配置环境变量后，您需要重新部署项目以应用新的配置：

#### 方法一：通过Vercel Dashboard
1. 在项目页面中，点击「Deployments」标签
2. 找到最新的部署，点击右侧的「...」菜单
3. 选择「Redeploy」
4. 确认重新部署

#### 方法二：通过Git推送
```bash
# 提交一个小的更改来触发重新部署
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin main
```

#### 方法三：通过Vercel CLI
```bash
# 在项目目录中执行
vercel --prod
```

### 4. 验证配置

重新部署完成后：
1. 访问您的Vercel应用URL
2. 尝试生成图像
3. 如果不再出现错误信息，说明配置成功

## 常见问题

### Q: 端点ID格式是什么？
A: 端点ID必须以`ep-`开头，后跟时间戳和随机字符，例如：`ep-20241220161728-xxxxx`

### Q: 为什么需要端点ID？
A: 豆包API使用推理端点的方式提供服务，每个端点都有唯一的ID，用于更好地管理资源和权限。

### Q: 配置后仍然报错怎么办？
A: 请检查：
1. 环境变量名称是否正确（区分大小写）
2. 端点ID是否以`ep-`开头
3. API密钥是否有效
4. 是否已重新部署项目

### Q: 如何查看当前的环境变量？
A: 在Vercel Dashboard的项目设置中，Environment Variables页面可以查看已配置的变量（值会被隐藏）。

## 安全提醒

- 永远不要在代码中硬编码API密钥
- 不要将包含真实API密钥的`.env.local`文件提交到Git仓库
- 定期轮换API密钥以确保安全

## 联系支持

如果按照以上步骤操作后仍然遇到问题，请：
1. 检查豆包API控制台中的配额和使用情况
2. 查看Vercel部署日志中的详细错误信息
3. 联系豆包API技术支持或Vercel支持团队