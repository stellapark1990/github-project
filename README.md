# AI 黑马雷达

每周自动爬取 GitHub 热门 AI 项目，用 DeepSeek V3 深度分析，筛选出被大厂忽略的「黑马」项目，并生成趋势洞察与产品/工程思考。

## 功能

- **黑马检测** — 排除大厂长期霸榜项目，聚焦 star 增速异常的新兴项目
- **AI 深度分析** — DeepSeek V3 三步流水线：逐项目 README 语义分析 → 批量趋势合成
- **一句话总结** — 每周 AI 开源圈整体动向
- **三大核心趋势** — 有论据支撑的趋势卡片，并列展示
- **项目洞见** — 每个项目附上 tagline、技术亮点、洞见、适合关注的业务方向
- **可追溯** — 每条记录含 Commit Hash + 时间戳
- **分类筛选** — Agent 框架、RAG 工具、推理引擎等 9 种分类
- **历史归档** — 每期快照完整保留

## 技术栈

**后端**
- Python 3.9+、FastAPI、SQLAlchemy（SQLite）
- APScheduler（每周一 02:00 UTC 自动运行）
- GitHub Search API + httpx 并发爬取
- DeepSeek V3（`deepseek-chat`）

**前端**
- React 18、Vite、TypeScript
- Tailwind CSS v3
- TanStack Query、React Router v6
- 字体：Syne / DM Sans / DM Mono / Bebas Neue

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/stellapark1990/github-project.git
cd github-project
```

### 2. 配置环境变量

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env`：

```env
GITHUB_TOKEN=your_github_personal_access_token
DEEPSEEK_API_KEY=your_deepseek_api_key
DATABASE_URL=sqlite:////absolute/path/to/backend/radar.db
```

- `GITHUB_TOKEN`：在 [GitHub Settings → Tokens](https://github.com/settings/tokens) 创建，需要 `public_repo` 读权限
- `DEEPSEEK_API_KEY`：在 [DeepSeek 开放平台](https://platform.deepseek.com) 获取

### 3. 一键启动

```bash
chmod +x start-dev.sh
./start-dev.sh
```

- 前端：http://localhost:5173
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

### 4. 手动触发爬取

```bash
curl -X POST http://localhost:8000/api/trigger
```

或在 http://localhost:8000/docs 页面直接调用。

## 目录结构

```
.
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI 路由
│   │   ├── crawler.py     # GitHub 爬虫
│   │   ├── analyzer.py    # DeepSeek 分析流水线
│   │   ├── scheduler.py   # 定时任务
│   │   ├── models.py      # 数据库模型
│   │   └── database.py    # SQLAlchemy 配置
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── pages/         # Home、Archive、RunDetail
│       ├── components/    # Header、ProjectCard、TrendCard、InsightSection
│       └── lib/           # API 客户端、类型定义、分类配置
├── docker-compose.yml
└── start-dev.sh
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/runs/latest` | 最新一期（含项目详情） |
| GET | `/api/runs` | 全部历史期列表 |
| GET | `/api/runs/{id}` | 指定期详情 |
| POST | `/api/trigger` | 手动触发爬取 |
| GET | `/api/health` | 健康检查 |

## Docker 部署

```bash
docker-compose up -d
```
