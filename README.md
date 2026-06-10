# Trailpack

登山装备智能清单：用自然语言描述路线，系统解析行程、参考天气并生成可勾选的装备清单。支持 **Web** 与 **微信小程序** 双端，共用同一套后端 API。

## 功能

- 自然语言路线解析（DeepSeek AI 或规则模板演示模式）
- 装备清单生成（规则引擎 + 可选 AI 增强）
- Open-Meteo 天气参考与风险提示
- 多人分工视图
- Web：邮箱 + GitHub 登录
- 小程序：微信登录（开发环境支持 dev-login 降级）
- 行程云端保存（SQLite 本地库）
- 清单勾选与 Markdown 导出（Web）

## 快速开始

### 1. 环境要求

- Node.js **20.9+**（推荐 22 LTS）
- npm 或 pnpm

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串（见下方本地 / Vercel） |
| `BLOB_READ_WRITE_TOKEN` | 可选本地；**Vercel 装备图上传必填** |
| `AUTH_SECRET` | 随机字符串，`openssl rand -base64 32` |
| `AUTH_URL` | `http://localhost:3000` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | 可选，GitHub OAuth |
| `DEEPSEEK_API_KEY` | 可选，未配置时使用**规则演示模式** |
| `DEEPSEEK_MODEL` | 默认 `deepseek-reasoner`（思考模式） |
| `DEEPSEEK_THINKING_ENABLED` | `true` 启用链式推理 |
| `DEEPSEEK_REASONING_EFFORT` | 可选 `high` / `max` |

### 3. 安装与数据库

```bash
npm install
npx prisma migrate deploy   # 首次建表
```

### 4. 启动

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，注册账号后创建行程。

## 微信小程序

### 架构

```
miniprogram/          ← 微信小程序前端（WXML/WXSS/JS）
src/app/api/          ← Next.js 后端 API（共用）
```

### 本地调试

1. 启动后端：`npm run dev`
2. 用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 打开项目根目录 `trailpack`（会自动读取 `project.config.json`）
3. 修改 `miniprogram/utils/config.js` 中的 `API_BASE`：
   - 模拟器：`http://127.0.0.1:3000`
   - 真机：改为你电脑的局域网 IP，如 `http://192.168.x.x:3000`
4. 开发者工具 → 详情 → 本地设置 → 勾选「不校验合法域名」

### 微信登录配置（上线前）

在 `.env` 中配置：

```env
WECHAT_APP_ID=wx...
WECHAT_APP_SECRET=...
MP_DEV_LOGIN=false
```

并在微信公众平台配置：
- 服务器域名：你的 HTTPS API 域名
- `project.config.json` 中的 `appid` 改为真实 AppID

未配置微信时，开发环境会自动降级到 `/api/mp/auth/dev-login`。

### 小程序页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 首页 | `pages/index/index` | 示例一键试用 |
| 我的行程 | `pages/trips/list` | 下拉刷新、骨架屏 |
| 我的 | `pages/mine/index` | 用户信息、行程统计 |
| 新建行程 | `pages/trips/new` | 分步进度、失败重试 |
| 行程详情 | `pages/trips/detail` | 装备/分工 Tab、路线编辑、复制清单 |

底部 **TabBar**：首页 / 行程 / 我的

**P2 体验优化**：
- 清单版本切换、打包进度条
- 筛选：全部 / 必需 / 待准备
- 装备「已有」标记（排除待购项）
- 分享行程、长按/详情页删除
- AI 请求 120s 超时保护

## GitHub OAuth

1. GitHub → Settings → Developer settings → OAuth Apps → New
2. Homepage URL: `http://localhost:3000`
3. Callback URL: `http://localhost:3000/api/auth/callback/github`
4. 将 Client ID / Secret 写入 `.env`

## DeepSeek AI（思考模式）

1. 在 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 创建 API Key
2. 写入 `.env`：

```env
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-reasoner
DEEPSEEK_THINKING_ENABLED=true
DEEPSEEK_REASONING_EFFORT=high
```

3. 重启开发服务器：`npm run dev`

启用后：
- 路线解析与装备生成使用 **deepseek-reasoner** 链式推理
- 行程详情页可展开查看「模型思考过程」（`reasoning_content`）
- AI 输出与规则引擎合并，安全类必需项不遗漏

若需更快响应，可改用 `DEEPSEEK_MODEL=deepseek-chat` 并设 `DEEPSEEK_THINKING_ENABLED=false`。

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建（含 `prisma migrate deploy`） |
| `npm run db:push` | 开发时快速同步 schema（无 migration 时） |
| `npm run db:studio` | 打开 Prisma Studio |

## 部署到 Vercel（Web）

> SQLite 无法在 Vercel 无状态环境使用，项目已切换为 **PostgreSQL**。

### 1. 准备代码仓库

将项目推送到 GitHub / GitLab / Bitbucket。

### 2. 创建数据库

任选其一（推荐 **Neon** 免费版，与 Vercel 集成简单）：

- [Neon](https://neon.tech) → 新建项目 → 复制 **Connection string**
- 或在 Vercel 项目 → **Storage** → **Postgres** → 创建并连接

### 3. 导入 Vercel 项目

1. 打开 [vercel.com/new](https://vercel.com/new) → Import 你的仓库  
2. Framework 自动识别为 **Next.js**，保持默认  
3. **Environment Variables** 添加：

| 变量 | 值 |
|------|-----|
| `DATABASE_URL` | PostgreSQL 连接串（Neon 用 **pooled** 连接即可） |
| `AUTH_SECRET` | `openssl rand -base64 32` 生成 |
| `AUTH_URL` | 部署后的 URL，如 `https://trailpack.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob → 创建 Store → Token |
| `DEEPSEEK_API_KEY` | 可选；未配置则演示模式 |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | 可选；Callback 改为 `https://你的域名/api/auth/callback/github` |

4. 点击 **Deploy**

构建时会自动执行 `prisma migrate deploy` 建表。

### 4. 部署后检查

- 打开 `https://你的项目.vercel.app` → 注册账号 → 创建行程  
- 装备库上传图片需已配置 `BLOB_READ_WRITE_TOKEN`  
- **AI 路线解析**：Vercel Hobby 函数超时 **10 秒**，长推理可能失败；可升级 Pro、或设 `DEEPSEEK_MODEL=deepseek-chat` 加快响应  

### 5. 本地开发（PostgreSQL）

```bash
# 方式 A：Docker
docker run -d --name trailpack-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=trailpack -e POSTGRES_DB=trailpack postgres:16

# .env
DATABASE_URL="postgresql://postgres:trailpack@localhost:5432/trailpack"

npx prisma migrate deploy
npm run dev
```

方式 B：Neon 开发分支，本地 `.env` 填同一 `DATABASE_URL`。

## 技术栈

Next.js 16 · 微信小程序 · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Auth.js · Zod

## 免责声明

本应用生成的装备与风险提示仅供参考，不构成专业登山指导。请务必查阅官方气象与景区管理规定，并结合队伍经验做最终决策。
