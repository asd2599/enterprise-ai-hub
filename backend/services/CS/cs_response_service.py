"""
CS 응답 초안 서비스 — 고객 문의 분류 + 정책 기반 응답 초안 생성
"""
import json
from openai import OpenAI
from config import settings

client = OpenAI(api_key=settings.openai_api_key)

# 문의 유형
INQUIRY_TYPES = ["배송", "환불", "기술", "기타"]

CLASSIFY_PROMPT = """
당신은 CS 담당자 보조 AI입니다.
고객 문의 원문을 읽고 아래 JSON 구조로만 응답하세요. 다른 텍스트 없이 JSON만 반환하세요.

{
  "type": "배송 | 환불 | 기술 | 기타 중 하나",
  "escalation_needed": true | false,
  "escalation_reason": "에스컬레이션 필요 시 사유, 불필요하면 빈 문자열"
}

에스컬레이션 기준:
- 고객이 법적 조치 언급 (소송, 신고, 공정거래위원회 등)
- 심각한 신체·재산 피해 주장
- 반복 미해결로 극도로 감정적인 문의
- 담당자 권한 밖의 환불액 (30만원 초과)
"""

DRAFT_PROMPT = """
당신은 테크원(TechOne) CS 담당자입니다.
주어진 고객 문의에 대해 아래 조건에 맞는 응답 초안을 작성하세요.

조건:
- 어조: {tone}
- 문의 유형: {inquiry_type}
- 첫 줄은 고객 인사, 마지막 줄은 담당자 서명으로 마무리
- 구체적인 처리 절차나 기한을 포함하되 확정되지 않은 정보는 "[확인 필요]"로 표시
- 길이: 150~300자 이내

고객 문의:
{inquiry}

주문번호: {order_no}

응답 초안만 작성하세요 (JSON 불필요).
"""

TONE_MAP = {
    "formal":   "공식체 (격식 있고 정중하게)",
    "friendly": "친근체 (따뜻하고 부드럽게)",
}


def classify_and_draft(inquiry: str, order_no: str, tone: str) -> dict:
    """
    고객 문의를 분류하고 응답 초안을 생성합니다.

    Args:
        inquiry:  고객 문의 원문
        order_no: 주문번호 (없으면 빈 문자열)
        tone:     어조 ("formal" | "friendly")

    Returns:
        {
          "type": str,
          "draft": str,
          "escalation": {"needed": bool, "reason": str}
        }
    """
    # 1단계: 문의 유형 분류 + 에스컬레이션 판단
    classify_res = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": CLASSIFY_PROMPT},
            {"role": "user",   "content": inquiry},
        ],
        max_tokens=200,
    )
    classify_data = json.loads(classify_res.choices[0].message.content)
    inquiry_type  = classify_data.get("type", "기타")

    # 2단계: 응답 초안 생성
    draft_prompt = DRAFT_PROMPT.format(
        tone=TONE_MAP.get(tone, TONE_MAP["formal"]),
        inquiry_type=inquiry_type,
        inquiry=inquiry,
        order_no=order_no if order_no else "미제공",
    )
    draft_res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": draft_prompt},
        ],
        max_tokens=600,
    )
    draft = draft_res.choices[0].message.content.strip()

    return {
        "type":  inquiry_type,
        "draft": draft,
        "escalation": {
            "needed": classify_data.get("escalation_needed", False),
            "reason": classify_data.get("escalation_reason", ""),
        },
    }
