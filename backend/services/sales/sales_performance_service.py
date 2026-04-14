"""
영업 실적 분석 서비스 — 모의 CRM 데이터 기반 AI 리포트

설계 원칙:
- 수치·이상감지·전환율은 Python 규칙으로 '결정적'으로 계산
- LLM은 요약·원인 추정·액션 추천 등 '해석' 역할만 담당
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

# 이상감지 룰 임계값 (팀 합의 시 config화 가능)
ANOMALY_RULES = {
    "target_shortfall_pct":   -20.0,  # 목표 대비 N% 이상 미달 → 급락
    "target_overshoot_pct":   +20.0,  # 목표 대비 N% 이상 초과 → 급등
    "growth_drop_pct":        -15.0,  # 전기 대비 N% 이상 하락 → 급락
    "growth_surge_pct":       +25.0,  # 전기 대비 N% 이상 상승 → 급등
    "win_rate_low_pct":        30.0,  # 수주율 N% 미만 → 주의
    "conversion_bottleneck_pct": 25.0,  # 단계 전환율 N% 미만 → 주의 (병목)
    "member_zero_win_deals":      2,  # 수주 0 & 진행 딜 N건 이상 → 주의
}


def _calc_conversion_rates(pipeline: list) -> list:
    """
    인접 파이프라인 단계 간 전환율을 계산합니다.

    Returns:
        [ { from, to, rate: float(%) }, ... ]
    """
    rates = []
    for i in range(len(pipeline) - 1):
        prev_count = pipeline[i]["count"]
        next_count = pipeline[i + 1]["count"]
        rate = (next_count / prev_count * 100) if prev_count > 0 else 0.0
        rates.append({
            "from": pipeline[i]["stage"],
            "to":   pipeline[i + 1]["stage"],
            "rate": round(rate, 1),
        })
    return rates


def _detect_anomalies(
    achievement_rate: float,
    growth_rate: float,
    win_rate: float,
    conversion_rates: list,
    filtered_members: dict,
) -> list:
    """
    규칙 기반 이상감지 — LLM 호출 전에 결정적으로 수행.

    Returns:
        [ { type, item, detail, severity }, ... ]
        type: '급등' | '급락' | '주의'
        severity: '높음' | '중간'
    """
    anomalies: list = []

    # 1. 목표 대비
    diff_target = achievement_rate - 100  # +면 초과, -면 미달
    if diff_target <= ANOMALY_RULES["target_shortfall_pct"]:
        anomalies.append({
            "type":     "급락",
            "item":     "목표 매출 미달",
            "detail":   f"목표 달성률 {achievement_rate:.1f}% — 목표 대비 {diff_target:+.1f}%p",
            "severity": "높음" if diff_target <= -30 else "중간",
        })
    elif diff_target >= ANOMALY_RULES["target_overshoot_pct"]:
        anomalies.append({
            "type":     "급등",
            "item":     "목표 매출 초과 달성",
            "detail":   f"목표 달성률 {achievement_rate:.1f}% — 목표 대비 {diff_target:+.1f}%p",
            "severity": "중간",
        })

    # 2. 전기 대비
    if growth_rate <= ANOMALY_RULES["growth_drop_pct"]:
        anomalies.append({
            "type":     "급락",
            "item":     "전기 대비 매출 하락",
            "detail":   f"전기 대비 {growth_rate:+.1f}%",
            "severity": "높음" if growth_rate <= -25 else "중간",
        })
    elif growth_rate >= ANOMALY_RULES["growth_surge_pct"]:
        anomalies.append({
            "type":     "급등",
            "item":     "전기 대비 매출 급등",
            "detail":   f"전기 대비 +{growth_rate:.1f}%",
            "severity": "중간",
        })

    # 3. 수주율
    if win_rate < ANOMALY_RULES["win_rate_low_pct"]:
        anomalies.append({
            "type":     "주의",
            "item":     "낮은 수주율",
            "detail":   f"수주율 {win_rate:.1f}% (임계 {ANOMALY_RULES['win_rate_low_pct']}% 미만)",
            "severity": "중간",
        })

    # 4. 파이프라인 전환율 병목
    for cr in conversion_rates:
        if cr["rate"] < ANOMALY_RULES["conversion_bottleneck_pct"]:
            anomalies.append({
                "type":     "주의",
                "item":     f"전환 병목: {cr['from']} → {cr['to']}",
                "detail":   f"전환율 {cr['rate']}% (임계 {ANOMALY_RULES['conversion_bottleneck_pct']}% 미만)",
                "severity": "중간",
            })

    # 5. 팀원별 — 진행 딜이 있는데 수주 0
    for name, info in filtered_members.items():
        if info["wins"] == 0 and info["deals"] >= ANOMALY_RULES["member_zero_win_deals"]:
            anomalies.append({
                "type":     "주의",
                "item":     f"{name} 수주 실적 부진",
                "detail":   f"진행 {info['deals']}건 중 수주 0건",
                "severity": "중간",
            })

    return anomalies


PERFORMANCE_PROMPT = """
당신은 영업 데이터 분석 전문가입니다.
아래 CRM 실적 데이터와 '규칙 기반으로 사전 감지된 이상 항목'을 바탕으로
영업팀장 보고용 리포트를 생성하세요.

[중요] 이상 항목(anomalies)은 이미 결정적으로 계산되었습니다.
당신의 역할은 각 이상 항목에 대해 'cause'(추정 원인, 1~2문장)만 추가하는 것입니다.
type/item/detail/severity는 원본 그대로 유지하세요.

분석 기간: {period}
목표 매출: {target_revenue:,}원
실제 매출: {actual_revenue:,}원
목표 달성률: {achievement_rate:.1f}%
전기 대비: {growth_rate:+.1f}%
수주율: {win_rate:.1f}%

파이프라인 현황 (단계별 건수·금액):
{pipeline_text}

파이프라인 전환율 (인접 단계):
{conversion_text}

팀원별 실적:
{member_text}

사전 감지된 이상 항목:
{anomalies_text}

JSON으로만 응답하세요:
{{
  "summary": "실적 3줄 요약 (팀장 보고용, 핵심 수치 포함)",
  "achievement_comment": "목표 달성률에 대한 평가 코멘트 (1~2문장)",
  "anomaly_causes": [
    {{"item": "이상 항목의 item과 동일", "cause": "원인 추정 (1~2문장)"}}
  ],
  "pipeline_insight": "파이프라인 분석 코멘트 — 전환율과 병목을 구체적으로 언급 (3~4문장)",
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

    처리 순서:
      1. 결정적 지표 계산 (달성률·증감·수주율·전환율)
      2. 규칙 기반 이상감지
      3. LLM에 사전 감지 결과 전달 → cause·요약·인사이트 생성
      4. 결과 병합
    """
    data = MOCK_CRM_DATA.get(period, MOCK_CRM_DATA["이번 달"])

    # 1. 결정적 지표 계산
    achievement_rate = (data["actual_revenue"] / data["target_revenue"]) * 100
    growth_rate = ((data["actual_revenue"] - data["prev_revenue"]) / data["prev_revenue"]) * 100
    win_rate = (data["win_count"] / data["deal_count"] * 100) if data["deal_count"] > 0 else 0.0
    conversion_rates = _calc_conversion_rates(data["pipeline"])

    # 팀원 필터링
    all_members = data["members"]
    if member_id == "all":
        filtered = all_members
    else:
        name = _MEMBER_NAME_MAP.get(member_id)
        filtered = {name: all_members[name]} if name and name in all_members else all_members

    # 2. 규칙 기반 이상감지
    anomalies = _detect_anomalies(
        achievement_rate=achievement_rate,
        growth_rate=growth_rate,
        win_rate=win_rate,
        conversion_rates=conversion_rates,
        filtered_members=filtered,
    )

    # 3. LLM 호출용 텍스트 구성
    pipeline_text = "\n".join(
        f"- {p['stage']}: {p['count']}건 / {p['amount']:,}원"
        for p in data["pipeline"]
    )
    conversion_text = "\n".join(
        f"- {cr['from']} → {cr['to']}: {cr['rate']}%"
        for cr in conversion_rates
    ) or "- (전환율 없음)"
    member_text = "\n".join(
        f"- {name}: 매출 {info['revenue']:,}원 / 수주 {info['wins']}건 / 진행 {info['deals']}건"
        for name, info in filtered.items()
    )
    anomalies_text = "\n".join(
        f"- [{a['type']}] {a['item']} — {a['detail']} (심각도: {a['severity']})"
        for a in anomalies
    ) or "- (사전 감지된 이상 항목 없음)"

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
                win_rate=win_rate,
                pipeline_text=pipeline_text,
                conversion_text=conversion_text,
                member_text=member_text,
                anomalies_text=anomalies_text,
            ),
        }],
        max_tokens=1200,
    )

    llm_result = json.loads(res.choices[0].message.content)

    # 4. LLM의 cause를 규칙 기반 anomalies에 병합
    cause_map = {
        c.get("item", ""): c.get("cause", "")
        for c in (llm_result.get("anomaly_causes") or [])
    }
    for a in anomalies:
        a["cause"] = cause_map.get(a["item"], "")

    # 최종 결과
    return {
        "metrics": {
            "period":           data["period"],
            "target_revenue":   data["target_revenue"],
            "actual_revenue":   data["actual_revenue"],
            "achievement_rate": round(achievement_rate, 1),
            "growth_rate":      round(growth_rate, 1),
            "deal_count":       data["deal_count"],
            "win_count":        data["win_count"],
            "win_rate":         round(win_rate, 1),
        },
        "pipeline":            data["pipeline"],
        "conversion_rates":    conversion_rates,
        "members": [
            {"name": name, **info}
            for name, info in filtered.items()
        ],
        "anomalies":           anomalies,
        "summary":             llm_result.get("summary", ""),
        "achievement_comment": llm_result.get("achievement_comment", ""),
        "pipeline_insight":    llm_result.get("pipeline_insight", ""),
        "top_performer":       llm_result.get("top_performer", ""),
        "risk_deals":          llm_result.get("risk_deals", ""),
        "recommendations":     llm_result.get("recommendations", []),
    }
