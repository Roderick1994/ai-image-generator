# Supabase 自动化数据库设置

本项目提供了自动化的 Supabase 数据库设置功能，可以通过代码自动创建和配置数据库表和存储桶。

## 🚀 快速开始

### 1. 配置环境变量

确保在 `.env.local` 文件中配置了以下 Supabase 环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. 运行自动化设置脚本

```bash
# 运行完整的数据库设置
npm run setup-supabase

# 或者使用别名
npm run db:setup
```

### 3. 手动执行 SQL（如果需要）

如果脚本显示需要手动执行 SQL，请：

1. 打开 [Supabase 控制台](https://supabase.com/dashboard)
2. 进入您的项目 → SQL Editor
3. 执行脚本显示的 SQL 语句
4. 重新运行验证脚本

## 📋 功能特性

### ✅ 自动化功能

- **数据库表创建**：自动创建 `generated_images` 表
- **存储桶设置**：自动创建和配置 `images` 存储桶
- **权限配置**：自动设置 RLS 策略和用户权限
- **应用启动检查**：应用启动时自动验证数据库状态
- **幂等性**：可重复执行，不会重复创建已存在的资源

### 🔧 错误处理

- **重试机制**：网络错误时自动重试
- **详细日志**：提供彩色输出和进度显示
- **故障排除**：提供具体的错误信息和解决建议
- **优雅降级**：如果自动创建失败，提供手动操作指南

## 📁 文件结构

```
├── scripts/
│   └── setup-supabase.js          # 主要的设置脚本
├── src/
│   ├── lib/
│   │   └── supabase-init.ts        # 应用启动时的初始化函数
│   └── app/
│       └── page.tsx                # 集成了自动初始化逻辑
└── supabase/
    └── migrations/
        └── 001_create_generated_images_table.sql  # SQL 迁移文件
```

## 🛠️ 脚本详解

### setup-supabase.js

主要的自动化设置脚本，功能包括：

- 检查环境变量配置
- 创建 Supabase 客户端连接
- 验证数据库连接
- 创建数据库表（如果不存在）
- 创建和配置存储桶
- 验证设置结果

### supabase-init.ts

应用启动时的初始化函数：

- 轻量级的数据库状态检查
- 静默运行，不影响用户体验
- 提供控制台日志用于调试

## 🔍 验证和测试

### 验证数据库设置

```bash
# 重新运行设置脚本进行验证
npm run setup-supabase
```

### 检查应用启动日志

启动开发服务器并检查浏览器控制台：

```bash
npm run dev
```

在浏览器控制台中查找：
- `🔄 Initializing Supabase database...`
- `✅ Supabase database initialized successfully`

## 🚨 故障排除

### 常见问题

1. **环境变量未配置**
   - 检查 `.env.local` 文件是否存在
   - 确认所有必需的环境变量都已设置

2. **权限不足**
   - 确认使用的是 `service_role_key` 而不是 `anon_key`
   - 检查 Supabase 项目的 API 设置

3. **网络连接问题**
   - 检查网络连接
   - 确认 Supabase 项目 URL 正确

4. **SQL 执行失败**
   - 按照脚本提示手动在 Supabase 控制台执行 SQL
   - 检查是否有语法错误或权限问题

### 获取帮助

如果遇到问题，请：

1. 查看脚本输出的详细错误信息
2. 检查浏览器控制台的日志
3. 确认 Supabase 项目配置正确
4. 参考 [Supabase 官方文档](https://supabase.com/docs)

## 📈 下一步

设置完成后，您可以：

1. **测试图片生成功能**：生成一张测试图片
2. **验证云端存储**：检查图片是否保存到 Supabase
3. **查看数据库**：在 Supabase 控制台查看 `generated_images` 表
4. **测试用户权限**：确认 RLS 策略正常工作

## 🎉 完成！

恭喜！您已经成功配置了 Supabase 自动化数据库设置。现在您的应用可以：

- 🌐 使用云端数据库存储图片信息
- 🔒 通过 RLS 策略保护用户数据
- 📁 在 Supabase 存储桶中保存图片文件
- 🔄 自动处理数据库初始化和验证

享受您的云端图片生成应用吧！