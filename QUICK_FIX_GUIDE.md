# 🚀 云端存储快速修复指南

## 问题概述
您的应用显示 "Local Storage Active" 而不是 "Cloud Storage Active"，这是因为 Vercel 中的 Supabase 环境变量配置不完整。

## ⚡ 快速修复步骤

### 步骤 1: 配置 Vercel 环境变量

1. **访问 Vercel Dashboard**
   - 打开 [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - 找到 `ai-image-generator` 项目

2. **进入环境变量设置**
   - 点击项目名称
   - 点击 "Settings" 标签
   - 在左侧菜单点击 "Environment Variables"

3. **添加 Supabase 配置**
   
   **如果您已有 Supabase 项目**，添加以下变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **如果您没有 Supabase 项目**，请先创建：

### 步骤 2: 创建 Supabase 项目（如需要）

1. **注册/登录 Supabase**
   - 访问 [https://app.supabase.com](https://app.supabase.com)
   - 使用 GitHub 或邮箱登录

2. **创建新项目**
   - 点击 "New Project"
   - 项目名称：`ai-image-generator`
   - 数据库密码：创建一个强密码（请记住）
   - 区域：选择离您最近的区域
   - 点击 "Create new project"

3. **等待项目创建**（约 2-3 分钟）

4. **获取 API 密钥**
   - 项目创建完成后，点击 "Settings" → "API"
   - 复制以下信息：
     - **URL**: 项目 URL
     - **anon public**: 匿名公钥
     - **service_role**: 服务角色密钥

### 步骤 3: 设置数据库

1. **执行 SQL 迁移**
   - 在 Supabase Dashboard 中，点击 "SQL Editor"
   - 点击 "New query"
   - 复制并粘贴以下 SQL：

```sql
-- 创建 generated_images 表
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  width INTEGER NOT NULL DEFAULT 1024,
  height INTEGER NOT NULL DEFAULT 1024,
  steps INTEGER NOT NULL DEFAULT 20,
  guidance_scale DECIMAL(4,2) NOT NULL DEFAULT 7.5,
  seed BIGINT,
  model VARCHAR(100) NOT NULL DEFAULT 'stable-diffusion',
  quality VARCHAR(20) NOT NULL DEFAULT 'standard',
  style VARCHAR(50),
  image_url TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Allow public access" ON generated_images FOR ALL USING (TRUE);

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 存储策略
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'images');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'images');

-- 授予权限
GRANT ALL PRIVILEGES ON generated_images TO anon;
GRANT ALL PRIVILEGES ON generated_images TO authenticated;
```

2. **运行 SQL**
   - 点击 "Run" 按钮
   - 确认所有语句执行成功

### 步骤 4: 更新 Vercel 环境变量

回到 Vercel Dashboard，添加从 Supabase 获取的真实配置：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 步骤 5: 等待重新部署

- Vercel 会自动检测环境变量更改
- 等待 2-3 分钟让部署完成
- 访问您的应用 URL

## ✅ 验证修复

修复完成后，您应该看到：

1. **存储状态变更**
   - 从 "Local Storage Active" 变为 "Cloud Storage Active"
   - 显示绿色的云端存储图标

2. **功能正常**
   - 图片生成功能正常工作
   - 生成的图片保存到云端
   - 图片在不同设备间同步

## 🔧 故障排除

### 如果仍显示本地存储：

1. **检查环境变量**
   - 确认 Vercel 中的环境变量已正确设置
   - 变量名称完全匹配（区分大小写）

2. **检查 Supabase 项目**
   - 确认项目状态为 "Active"
   - 数据库表已创建
   - 存储桶已创建

3. **强制重新部署**
   - 在 Vercel Dashboard 中点击 "Deployments"
   - 点击最新部署的 "..." 菜单
   - 选择 "Redeploy"

4. **清除浏览器缓存**
   - 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
   - 或使用无痕模式访问

### 常见错误信息：

- **"Supabase is not configured"**: 环境变量未正确设置
- **"Storage bucket not found"**: 存储桶未创建或权限问题
- **"Permission denied"**: RLS 策略配置问题

## 📞 需要帮助？

如果按照上述步骤仍无法解决问题：

1. 检查浏览器控制台的错误信息
2. 查看 Vercel 部署日志
3. 确认 Supabase 项目状态
4. 验证所有 API 密钥的有效性

---

**预计修复时间**: 10-15 分钟  
**技术难度**: 初级  
**需要工具**: 浏览器访问 Vercel 和 Supabase Dashboard