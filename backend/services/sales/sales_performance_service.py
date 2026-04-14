"""
영업 실적 분석 서비스 — 모의 CRM 데이터 기반 AI 리포트
"""
import json
from openai import OpenAI
from config import settings

client = OpenAI(api_key=settings.openai_api_key)

# 모의 팀원 목록
TEAM_MEMBERS = [
    {"id": "all",  "name": "팀 전체"},
    {"id": "kim",  "name": "김민준 (시니어)"},
    {"id": "lee",  "name": "이수연 (시니어)"},
    {"id": "park", "name": "박지호 (주니어)"},
    {"id": "choi", "name": "최예린 (주니어)"},
]

_MEMBER_NAME_MAP = {"kim": "김민준", "lee": "이수연", "park": "박지호", "choi": "최예린"}

# 모의 CRM 데이터
MOCK_CRM_DATA = {
    "이번 달": {
        "period": "2026년 4월 (1~14일 기준)",
        "target_revenue": 250_000_000,
        "actual_revenue": 187_000_000,
        "deal_count": 8,
        "win_count": 3,
        "pipeline": [
            {"stage": "잠재 고객",   "count": 24, "amount": 380_000_000},
            {"stage": "니즈 분석",   "count": 12, "amount": 210_000_000},
            {"stage": "제안서 발송", "count": 8,  "amount": 145_000_000},
            {"stage": "협상 중",     "count": 4,  "amount": 87_000_000},
            {"stage": "계약 완료",   "count": 3,  "amount": 52_000_000},
        ],
        "prev_revenue": 220_000_000,
        "members": {
            "김민준": {"revenue": 89_000_000,  "deals": 3, "wins": 2},
            "이수연": {"revenue": 62_000_000,  "deals": 2, "wins": 1},
            "박지호": {"revenue": 24_000_000,  "deals": 2, "wins": 0},
            "최예린": {"revenue": 12_000_000,  "deals": 1, "wins": 0},
        },
    },
    "이번 분기": {
        "period": "2026년 Q1 (1~3월)",
        "target_revenue": 750_000_000,
        "actual_revenue": 682_000_000,
        "deal_count": 31,
        "win_count": 14,
        "pipeline": [
            {"stage": "잠재 고객",   "count": 67, "amount": 1_200_000_000},
            {"stage": "니즈 분석",   "count": 38, "amount": 680_000_000},
            {"stage": "제안서 발송", "count": 21, "amount": 420_000_000},
            {"stage": "협상 중",     "count": 11, "amount": 198_000_000},
            {"stage": "계약 완료",   "count": 14, "amount": 182_000_000},
        ],
        "prev_revenue": 590_000_000,
        "members": {
            "김민준": {"revenue": 289_000_000, "deals": 12, "wins": 6},
            "이수연": {"revenue": 220_000_000, "deals": 9,  "wins": 5},
            "박지호": {"revenue": 102_000_000, "deals": 6,  "wins": 2},
            "최예린": {"revenue": 71_000_000,  "deals": 4,  "wins": 1},
        },
    },
    "올해": {
        "period": "2026년 연간 (1~4월 14일 기준)",
        "target_revenue": 3_000_000_000,
        "actual_revenue": 869_000_000,
        "deal_count": 39,
        "win_count": 17,
        "pipeline": [
            {"stage": "잠재 고객",   "count": 89, "amount": 1_580_000_000},
            {"stage": "니즈 분석",   "count": 50, "amount": 890_000_000},
            {"stage": "제안서 발송", "count": 29, "amount": 565_000_000},
            {"stage": "협상 중",     "count": 15, "amount": 285_000_000},
            {"stage": "계약 완료",   "count": 17, "amount": 234_000_000},
        ],
        "prev_revenue": 710_000_000,
        "members": {
            "김민준": {"revenue": 378_000_000, "deals": 15, "wins": 8},
            "이수연": {"revenue": 282_000_000, "deals": 11, "wins": 6},
            "박지호": {"revenue": 126_000_000, "deals": 8,  "wins": 2},
            "최예린": {"revenue": 83_000_000,  "deals": 5,  "wins": 1},
        },
    },
}

PERFORMANCE_PROMPT = """
당신은 영업 데이터 분석 전문가입니다.
아래 CRM 실적 데이터를 분석하여 영업팀장 보고용 리포트를 생성하세요.

분석 기간: {period}
목표 매출: {target_revenue:,}원
실제 매출: {actual_revenue:,}원
목표 달성률: {achievement_rate:.1f}%
전기 대비: {growth_rate:+.1f}%

파이프라인 현황:
{pipeline_text}

팀원별 실적:
{member_text}

JSON으로만 응답하세요:
{{
  "summary": "실적 3줄 요약 (팀장 보고용, 핵심 수치 포함)",
  "achievement_comment": "목표 달성률에 대한 평가 코멘트 (1~2문장)",
  "anomalies": [
    {{"type": "급등 또는 급락 또는 주의", "item": "항목명", "detail": "상세 내용"}}
  ],
  "pipeline_insight": "파이프라인 분석 코멘트 (전환율 포함, 3~4문장)",
  "top_performer": "최고 실적자 및 코멘트 (1~2문장)",
  "risk_deals": "리스크 딜 분석 (협상 중 딜의 전환 가능성, 2~3문장)",
  "recommendations": ["액션 추천 1", "액션 추천 2", "액션 추천 3"]
}}
"""


def get_team_members() -> list:
    """팀원 목록을 반환합니다."""
    return TEAM_MEMBERS


def analyze_performance(period: str, member_id: str) -> dict:
    """
    CRM 모의 데이터를 분석하여 실적 리포트를 생성합니다.

    Args:
        period:    '이번 달' | '이번 분기' | '올해'
        member_id: 'all' | 'kim' | 'lee' | 'park' | 'choi'

    Returns:
        {
          metrics, pipeline, members,
          summary, achievement_comment, anomalies,
          pipeline_insight, top_performer, risk_deals, recommendations
        }
    """
    data = MOCK_CRM_DATA.get(period, MOCK_CRM_DATA["이번 달"])

    achievement_rate = (data["actual_revenue"] / data["target_revenue"]) * 100
    growth_rate = ((data["actual_revenue"] - data["prev_revenue"]) / data["prev_revenue"]) * 100

    pipeline_text = "\n".join(
        f"- {p['stage']}: {p['count']}건 / {p['amount']:,}원"
        for p in data["pipeline"]
    )

    # 특정 팀원 필터링
    all_members = data["members"]
    if member_id == "all":
        filtered = all_members
    else:
        name = _MEMBER_NAME_MAP.get(member_id)
        filtered = {name: all_members[name]} if name and name in all_members else all_members

    member_text = "\n".join(
        f"- {name}: 매출 {info['revenue']:,}원 / 수주 {info['wins']}건 / 진행 {info['deals']}건"
        for name, info in filtered.items()
    )

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[{
            "role": "user",
            "content": PERFORMANCE_PROMPT.format(
                period=data["period"],
                target_revenue=data["target_revenue"],
                actual_revenue=data["actual_revenue"],
                achievement_rate=achievement_rate,
                growth_rate=growth_rate,
                pipeline_text=pipeline_text,
                member_text=member_text,
            ),
        }],
        max_tokens=1000,
    )

    result = json.loads(res.choices[0].message.content)

    result["metrics"] = {
        "period":           data["period"],
        "target_revenue":   data["target_revenue"],
        "actual_revenue":   data["actual_revenue"],
        "achievement_rate": round(achievement_rate, 1),
        "growth_rate":      round(growth_rate, 1),
        "deal_count":       data["deal_count"],
        "win_count":        data["win_count"],
        "win_rate":         round((data["win_count"] / data["deal_count"]) * 100, 1) if data["deal_count"] > 0 else 0,
    }
    result["pipeline"] = data["pipeline"]
    result["members"] = [
        {"name": name, **info}
        for name, info in filtered.items()
    ]

    return result
