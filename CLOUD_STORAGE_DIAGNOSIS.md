# 云端存储诊断报告

## 🔍 问题诊断

### 当前状态
- ✅ 应用正常运行，显示 "Local Storage Active"
- ❌ 云端存储未激活，显示本地存储模式
- ❌ Supabase 连接配置不完整

### 根本原因分析

#### 1. 环境变量配置问题
**本地环境 (.env.local)**:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**问题**: 所有 Supabase 配置都是占位符，不是真实的项目配置。

#### 2. 存储检测逻辑
应用通过 `isSupabaseConfigured()` 函数检测配置：
```typescript
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey)
}
```

由于环境变量为占位符，函数返回 `false`，应用默认使用本地存储。

## 🛠️ 解决方案

### 方案 1: 配置真实的 Supabase 项目（推荐）

#### 步骤 1: 创建 Supabase 项目
1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息：
   - Project name: `ai-image-generator`
   - Database password: 创建强密码
   - Region: 选择最近区域

#### 步骤 2: 获取配置信息
1. 在项目 Dashboard 中，进入 Settings → API
2. 复制以下信息：
   - **URL**: `https://your-project-id.supabase.co`
   - **anon public**: 匿名公钥
   - **service_role**: 服务角色密钥

#### 步骤 3: 配置 Vercel 环境变量
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入 `ai-image-generator` 项目设置
3. 点击 "Environment Variables"
4. 添加以下变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

#### 步骤 4: 设置数据库和存储
1. 运行数据库迁移脚本：
```bash
node scripts/setup-supabase.js
```

2. 或手动在 Supabase SQL Editor 中执行：
```sql
-- 创建 generated_images 表
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  image_url TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  quality TEXT NOT NULL DEFAULT 'standard',
  style TEXT,
  width INTEGER NOT NULL DEFAULT 1024,
  height INTEGER NOT NULL DEFAULT 1024,
  steps INTEGER NOT NULL DEFAULT 20,
  guidance_scale DECIMAL NOT NULL DEFAULT 7.5,
  seed INTEGER,
  model TEXT NOT NULL DEFAULT 'doubao',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE
);

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 设置存储策略
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
```

### 方案 2: 临时禁用云端存储检查

如果暂时不想配置 Supabase，可以修改检测逻辑：

```typescript
// 在 src/lib/supabase.ts 中
export const isSupabaseConfigured = (): boolean => {
  // 临时返回 false 以使用本地存储
  return false;
  // 原逻辑: return !!(supabaseUrl && supabaseAnonKey)
}
```

## 🔄 部署流程

### 自动重新部署
配置 Vercel 环境变量后，系统会自动触发重新部署。

### 验证步骤
1. 等待部署完成（约 2-3 分钟）
2. 访问部署 URL
3. 检查存储状态：
   - 应显示 "Cloud Storage Active"
   - 而不是 "Local Storage Active"
4. 测试图片生成和保存功能

## 📋 检查清单

### Vercel 环境变量
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 已配置
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已配置
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 已配置
- [ ] `DOUBAO_API_KEY` 已配置
- [ ] `DOUBAO_ENDPOINT_ID` 已配置

### Supabase 配置
- [ ] 项目已创建
- [ ] `generated_images` 表已创建
- [ ] `images` 存储桶已创建
- [ ] RLS 策略已设置
- [ ] 存储权限已配置

### 应用验证
- [ ] 部署成功
- [ ] 显示 "Cloud Storage Active"
- [ ] 图片生成功能正常
- [ ] 图片保存到云端
- [ ] 图片列表正常显示

## 🚨 注意事项

1. **安全性**: 确保 `SUPABASE_SERVICE_ROLE_KEY` 只在服务端使用
2. **权限**: 检查 RLS 策略是否正确配置
3. **存储**: 确认存储桶为公开访问
4. **API 限制**: 注意 Supabase 免费计划的使用限制

## 📞 故障排除

### 常见错误

1. **"Supabase is not configured"**
   - 检查环境变量是否正确设置
   - 确认变量名称完全匹配

2. **"Storage bucket not found"**
   - 确认 `images` 存储桶已创建
   - 检查存储桶权限设置

3. **"Permission denied"**
   - 检查 RLS 策略配置
   - 确认匿名访问权限

### 调试步骤

1. 检查浏览器控制台错误
2. 查看 Vercel 部署日志
3. 测试 Supabase 连接：
```javascript
// 在浏览器控制台中运行
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase configured:', isSupabaseConfigured());
```

---

**总结**: 云端存储问题主要是由于 Vercel 环境变量配置不完整导致的。按照上述步骤配置真实的 Supabase 项目和环境变量即可解决问题。