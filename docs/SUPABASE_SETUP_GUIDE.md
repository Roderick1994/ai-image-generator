# Supabase 设置指南

## 概述
由于集成系统暂时无法连接到Supabase，请按照以下步骤手动设置Supabase项目。

## 步骤 1: 创建Supabase项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 选择组织并填写项目信息：
   - Project name: `ai-image-generator`
   - Database password: 创建一个强密码
   - Region: 选择离你最近的区域
4. 点击 "Create new project"

## 步骤 2: 获取项目配置

1. 在项目仪表板中，点击左侧菜单的 "Settings"
2. 点击 "API" 标签
3. 复制以下信息：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...` (以 eyJ 开头的长字符串)
   - **service_role secret key**: `eyJ...` (另一个以 eyJ 开头的长字符串)

## 步骤 3: 配置环境变量

1. 打开项目根目录的 `.env.local` 文件
2. 替换以下占位符为实际值：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

## 步骤 4: 设置数据库表

1. 在Supabase仪表板中，点击左侧菜单的 "SQL Editor"
2. 点击 "New query"
3. 复制并粘贴 `supabase/migrations/001_create_generated_images_table.sql` 文件的内容
4. 点击 "Run" 执行SQL

## 步骤 5: 验证设置

1. 在SQL Editor中运行以下查询来验证表是否创建成功：
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'generated_images';
```

2. 检查存储桶是否创建：
```sql
SELECT * FROM storage.buckets WHERE id = 'images';
```

## 步骤 6: 测试连接

1. 重启开发服务器：
```bash
npm run dev
```

2. 打开浏览器控制台，检查是否有Supabase连接错误
3. 尝试生成一张图片，验证是否能正常保存到Supabase

## 故障排除

### 连接错误
- 确保环境变量正确设置
- 检查Supabase项目是否处于活跃状态
- 验证API密钥是否正确复制（注意不要包含额外的空格）

### 权限错误
- 确保RLS策略已正确设置
- 检查anon和authenticated角色是否有适当的权限

### 存储错误
- 确保images存储桶已创建且设置为公开
- 检查存储策略是否允许上传和读取

## 完成后

设置完成后，应用程序将：
- 将所有生成的图片保存到Supabase数据库
- 将图片文件存储在Supabase Storage中
- 支持搜索、分页和收藏功能
- 提供持久化的云端存储

如果遇到问题，请检查浏览器控制台的错误信息，或参考Supabase官方文档。