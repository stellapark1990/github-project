"""
DeepSeek V3 analysis pipeline:
  Step 1 — README semantic check: is this an AI project?
  Step 2 — Per-project deep summary
  Step 3 — Batch trend synthesis across all selected projects
"""
import json
import logging
import time
from typing import Optional

from openai import OpenAI

from .config import settings

logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=settings.DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com",
)

MODEL = "deepseek-chat"  # DeepSeek V3


def _chat(system: str, user: str, retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            resp = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.3,
                max_tokens=2048,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"DeepSeek call failed (attempt {attempt + 1}): {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise


def _parse_json(raw: str) -> dict:
    """Extract JSON from LLM output that may have markdown fences."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.rstrip("```").strip()
    return json.loads(raw)


# ── Step 1: AI project classifier ──────────────────────────────────────────

AI_CHECK_SYSTEM = """你是一个 GitHub 项目分类器。判断给定 README 是否属于 AI/ML/LLM 相关项目。
只输出 JSON，格式如下，不要有任何额外内容：
{"is_ai": true, "reason": "一句话理由"}"""


def is_ai_project(readme: str) -> tuple[bool, str]:
    """Return (is_ai, reason) based on README content."""
    snippet = readme[:3000]  # first 3k chars is enough for classification
    try:
        raw = _chat(AI_CHECK_SYSTEM, f"README:\n{snippet}")
        parsed = _parse_json(raw)
        return bool(parsed.get("is_ai", False)), parsed.get("reason", "")
    except Exception as e:
        logger.warning(f"AI classification failed: {e}")
        return False, "parse error"


# ── Step 2: Per-project deep analysis ──────────────────────────────────────

PROJECT_ANALYSIS_SYSTEM = """你是一位顶级 AI 开源项目分析师。
根据给定的 GitHub 项目基本信息和 README，输出结构化 JSON 分析报告。
注意：所有输出中 "Agent" 保持英文原文，不要翻译成"代理"。

输出格式（严格 JSON，不要有额外内容）：
{
  "tagline": "一句话定位（20字以内，中文）",
  "problem": "解决什么问题（50字以内，中文）",
  "target_users": "目标用户（30字以内，中文）",
  "tech_highlights": ["技术亮点1", "技术亮点2", "技术亮点3"],
  "why_trending": "为什么这周突然火——结合技术背景和社区动态推测（80字以内，中文）",
  "category": "RAG工具|Agent框架|推理引擎|训练框架|数据工具|评测工具|模型|应用|其他",
  "target_business": "适合哪类业务方向的人重点关注，例如：AI 应用创业者、企业智能化团队、算法研究员、独立开发者（25字以内，中文）"
}"""


def analyze_project(repo: dict) -> Optional[dict]:
    """
    Deep-analyze a single project.
    repo must have: name, description, url, stars, star_delta, star_velocity, readme
    """
    meta = (
        f"项目名: {repo['name']}\n"
        f"描述: {repo['description']}\n"
        f"GitHub URL: {repo['url']}\n"
        f"⭐ 总 star: {repo['stars']}"
    )
    if repo.get("star_delta") is not None:
        meta += f" | 本周新增: +{repo['star_delta']}"
    meta += f" | Star 速率: {repo['star_velocity']} stars/day\n\n"

    readme_snippet = repo.get("readme", "")[:6000]
    user_msg = f"{meta}README（截取前6000字）:\n{readme_snippet}"

    try:
        raw = _chat(PROJECT_ANALYSIS_SYSTEM, user_msg)
        return _parse_json(raw)
    except Exception as e:
        logger.error(f"Project analysis failed for {repo.get('repo_full_name')}: {e}")
        return None


# ── Step 3: Batch trend synthesis ──────────────────────────────────────────

TREND_SYSTEM = """你是 AI 开源生态的深度观察者，擅长从多个项目中提炼行业趋势和洞察。
根据本周筛选出的黑马 AI 项目摘要，输出结构化 JSON 洞察报告。
注意：所有输出中 "Agent" 保持英文原文，不要翻译成"代理"。

输出格式（严格 JSON，不要有额外内容）：
{
  "weekly_summary": "一句话概括本周 AI 开源圈整体动向（50字以内，中文，语气客观直接）",
  "trends": [
    {
      "title": "趋势标题（10-15字）",
      "description": "趋势描述（100字以内）",
      "evidence": ["支撑论据：项目名 - 一句话说明", "..."]
    }
  ],
  "product_insights": [
    "对 AI 产品经理的思考1（50字以内）",
    "对 AI 产品经理的思考2（50字以内）"
  ],
  "engineer_insights": [
    "对 AI 工程师的思考1（50字以内）",
    "对 AI 工程师的思考2（50字以内）"
  ]
}

趋势数量：恰好 3 个，论据要具体到项目名。"""


def synthesize_trends(projects_with_summaries: list[dict]) -> Optional[dict]:
    """
    projects_with_summaries: list of {name, url, stars, star_delta, readme_summary}
    Returns trend synthesis JSON.
    """
    summaries_text = ""
    for i, p in enumerate(projects_with_summaries, 1):
        s = p.get("readme_summary") or {}
        delta_str = f"+{p['star_delta']} 本周" if p.get("star_delta") else f"{p['star_velocity']} stars/day"
        summaries_text += (
            f"【{i}】{p['name']} ({delta_str})\n"
            f"  定位: {s.get('tagline', '—')}\n"
            f"  问题: {s.get('problem', '—')}\n"
            f"  用户: {s.get('target_users', '—')}\n"
            f"  亮点: {', '.join(s.get('tech_highlights', []))}\n"
            f"  为何火: {s.get('why_trending', '—')}\n"
            f"  分类: {s.get('category', '—')}\n\n"
        )

    user_msg = f"本周黑马 AI 项目摘要（共 {len(projects_with_summaries)} 个）：\n\n{summaries_text}"

    try:
        raw = _chat(TREND_SYSTEM, user_msg)
        return _parse_json(raw)
    except Exception as e:
        logger.error(f"Trend synthesis failed: {e}")
        return None
