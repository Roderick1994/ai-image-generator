# 数据库架构修复指南

## 问题描述
根据错误日志显示：`Could not find the 'guidance_scale' column of 'generated_images' in the schema cache`

这表明线上Supabase数据库中的 `generated_images` 表缺少 `guidance_scale` 列，导致应用无法正常保存图片数据。

## 快速修复步骤

### 方法1：通过Supabase控制台修复（推荐）

1. **登录Supabase控制台**
   - 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - 登录你的账户并选择对应的项目

2. **打开SQL编辑器**
   - 在左侧菜单中点击 "SQL Editor"
   - 点击 "New query" 创建新查询

3. **执行修复脚本**
   复制以下SQL脚本并执行：

```sql
-- 检查并添加缺失的列
DO $$
BEGIN
    -- 添加 guidance_scale 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'guidance_scale'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN guidance_scale DECIMAL(4,2) NOT NULL DEFAULT 7.5;
        RAISE NOTICE 'Added guidance_scale column';
    END IF;
    
    -- 添加 seed 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'seed'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN seed BIGINT;
        RAISE NOTICE 'Added seed column';
    END IF;
    
    -- 添加 steps 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'steps'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN steps INTEGER NOT NULL DEFAULT 20;
        RAISE NOTICE 'Added steps column';
    END IF;
    
    RAISE NOTICE 'Database schema fix completed';
END $$;

-- 刷新架构缓存
NOTIFY pgrst, 'reload schema';

-- 确保权限正确
GRANT SELECT, INSERT, UPDATE, DELETE ON generated_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON generated_images TO authenticated;
```

4. **验证修复结果**
   执行以下查询验证表结构：

```sql
-- 查看表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'generated_images'
ORDER BY ordinal_position;
```

### 方法2：使用本地迁移文件

如果你有Supabase CLI配置：

1. 确保Supabase CLI已安装并登录
2. 在项目根目录执行：
```bash
supabase db push
```

## 验证修复

修复完成后：

1. **重新部署Vercel应用**
   - 在Vercel控制台触发重新部署
   - 或者推送新的代码提交触发自动部署

2. **测试图片生成功能**
   - 访问部署的应用
   - 尝试生成一张图片
   - 检查浏览器控制台是否还有数据库错误

3. **检查数据库记录**
   在Supabase控制台的Table Editor中查看 `generated_images` 表，确认新生成的图片记录包含所有必需字段。

## 预期结果

修复成功后，应用应该能够：
- ✅ 正常生成图片
- ✅ 将图片元数据保存到数据库
- ✅ 在图片库中显示历史记录
- ✅ 不再出现 "guidance_scale column not found" 错误

## 故障排除

如果修复后仍有问题：

1. **检查环境变量**
   确保Vercel中的Supabase环境变量配置正确：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **检查RLS策略**
   确保 `generated_images` 表的行级安全策略允许匿名用户操作

3. **清除缓存**
   在Supabase控制台执行：
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

## 联系支持

如果问题持续存在，请提供：
- 错误日志截图
- Supabase项目ID
- 执行的SQL语句和结果