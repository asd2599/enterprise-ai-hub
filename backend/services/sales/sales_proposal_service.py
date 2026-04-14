"""
영업 제안서 자동 생성 서비스 — 업종별 구조 프리셋 + 성공 사례 RAG
"""
import json
from openai import OpenAI
from config import settings

client = OpenAI(api_key=settings.openai_api_key)

# 업종별 구조 프리셋
INDUSTRY_PRESETS = {
    "제조업": {
        "structure": "경영 현황 분석 → 생산성 Pain Point → AI 자동화 솔루션 → 도입 ROI → 유사 제조사 성공 사례 → 구축 일정 → 투자 비용",
        "focus": "생산 효율화, 불량률 감소, 예지 정비, SCM 최적화",
    },
    "유통·서비스": {
        "structure": "고객 현황 분석 → 운영 비효율 Pain Point → AI 고객경험 솔루션 → 매출 증대 효과 → 유사 유통사 성공 사례 → 구축 일정 → 투자 비용",
        "focus": "고객 이탈 방지, 재구매율 향상, 수요 예측, 개인화 추천",
    },
    "IT": {
        "structure": "기술 스택 현황 분석 → 개발/운영 Pain Point → AI DevOps 솔루션 → 생산성 향상 수치 → 유사 IT기업 성공 사례 → 구축 일정 → 투자 비용",
        "focus": "코드 품질 자동화, 장애 예측, 고객 지원 자동화, 데이터 파이프라인",
    },
}

# 성공 사례 DB (RAG 역할)
SUCCESS_CASES = {
    "제조업": [
        {"company": "A제조(임직원 500명)", "issue": "수작업 품질 검사로 불량률 3.2%", "solution": "AI 비전 검사 시스템 도입", "result": "불량률 0.4%로 87% 감소, 연간 18억 원 절감"},
        {"company": "B금속(임직원 200명)", "issue": "설비 고장으로 월 평균 40시간 라인 정지", "solution": "예지 정비 AI 도입", "result": "비계획 정지 65% 감소, 설비 수명 30% 연장"},
    ],
    "유통·서비스": [
        {"company": "C유통(임직원 800명)", "issue": "CS 응대 인력 부족, 고객 대기 시간 평균 8분", "solution": "AI 챗봇 + 상담 자동화", "result": "응대 시간 1분으로 단축, CS 인건비 40% 절감"},
        {"company": "D리테일(임직원 300명)", "issue": "재고 과잉 및 결품으로 연간 손실 12억", "solution": "AI 수요 예측 모델 도입", "result": "재고 비용 28% 절감, 결품률 71% 감소"},
    ],
    "IT": [
        {"company": "E소프트(임직원 150명)", "issue": "코드 리뷰 병목으로 배포 주기 3주", "solution": "AI 코드 리뷰 자동화 + CI/CD 최적화", "result": "배포 주기 1주로 단축, 개발자 리뷰 시간 60% 감소"},
        {"company": "F테크(임직원 400명)", "issue": "고객 티켓 처리 2,000건/월, 평균 24시간 응답", "solution": "AI 1차 분류 + 자동 응답 시스템", "result": "단순 문의 80% 자동 해결, 응답 시간 2시간으로 단축"},
    ],
}

PROPOSAL_PROMPT = """
당신은 테크원(TechOne) 영업팀의 AI Hub 솔루션 전문 영업 대표입니다.
아래 고객사 정보와 성공 사례를 참고하여 고객 맞춤형 제안서 초안을 작성하세요.

고객사명: {company_name}
업종: {industry}
규모: {company_size}
핵심 니즈: {key_needs}

업종별 구조 프리셋: {structure}
핵심 가치 포인트: {focus}

참고 성공 사례:
{success_cases}

작성 규칙:
- 고객사 이름을 본문 전체에 걸쳐 직접 언급하여 맞춤형 느낌을 살리세요.
- 모든 수치는 구체적인 숫자로 작성하세요. 예: "약 40%", "연간 1.2억 원 절감", "3주 → 1주".
- 각 섹션을 충분히 풍부하게 작성하세요. 특히 situation_analysis(5~7문장), solution(7~10문장).
- pain_points는 4~5개, 각 항목은 1~2문장의 구체적인 내용으로 작성하세요.
- expected_benefits의 before/after는 반드시 "숫자+단위" 형식으로 작성하세요.
  올바른 예시: {{"metric": "제안서 작성 시간", "before": "건당 4~8시간", "after": "건당 1시간 미만"}}
  잘못된 예시: {{"metric": "작업 시간", "before": "도입 전", "after": "도입 후"}}
- 투자 비용은 "문의 후 확정" 방식으로 범위만 제시하세요.
- 문체는 격식체(~합니다) 사용.

JSON으로만 응답하세요:
{{
  "executive_summary": "경영진 요약 (4~5문장, 고객사명·핵심 Pain Point·기대 ROI 포함)",
  "situation_analysis": "현황 분석 (고객사 업종·규모·시장 상황 기반, 5~7문장, 구체적 수치 포함)",
  "pain_points": [
    "Pain Point 1 — 구체적 문제와 비용/시간 손실 수치 포함 (1~2문장)",
    "Pain Point 2 — 구체적 문제와 비용/시간 손실 수치 포함 (1~2문장)",
    "Pain Point 3 — 구체적 문제와 비용/시간 손실 수치 포함 (1~2문장)",
    "Pain Point 4 — 구체적 문제와 비용/시간 손실 수치 포함 (1~2문장)"
  ],
  "solution": "AI Hub 솔루션 제안 (핵심 기능 4~5가지를 각각 구체적으로 설명, 7~10문장)",
  "expected_benefits": [
    {{"metric": "측정 지표명", "before": "숫자+단위 (예: 건당 6시간)", "after": "숫자+단위 (예: 건당 45분)"}},
    {{"metric": "측정 지표명", "before": "숫자+단위", "after": "숫자+단위"}},
    {{"metric": "측정 지표명", "before": "숫자+단위", "after": "숫자+단위"}},
    {{"metric": "측정 지표명", "before": "숫자+단위", "after": "숫자+단위"}}
  ],
  "success_case": {{
    "company": "유사 고객사명 (업종·규모 포함)",
    "issue": "도입 전 구체적 문제 (수치 포함)",
    "solution": "적용한 AI Hub 솔루션 기능",
    "result": "도입 후 성과 (수치 포함)"
  }},
  "implementation_schedule": [
    {{"phase": "1단계", "duration": "N주", "content": "구체적 작업 내용"}},
    {{"phase": "2단계", "duration": "N주", "content": "구체적 작업 내용"}},
    {{"phase": "3단계", "duration": "N주", "content": "구체적 작업 내용"}}
  ],
  "investment": "투자 비용 안내 (규모별 범위 제시, 3~4문장)",
  "email_draft": "영업 담당자 발송용 이메일 초안 (제목 1줄 + 본문 400자 이내, 고객사명 직접 언급)"
}}
"""


def generate_proposal(
    company_name: str,
    industry: str,
    company_size: str,
    key_needs: str,
) -> dict:
    """
    고객사 맞춤형 영업 제안서 초안을 생성합니다.

    Args:
        company_name: 고객사명
        industry:     '제조업' | '유통·서비스' | 'IT'
        company_size: 규모 (임직원 수, 매출 규모 등)
        key_needs:    핵심 니즈 (자유 입력)

    Returns:
        {
          executive_summary, situation_analysis, pain_points,
          solution, expected_benefits, success_case,
          implementation_schedule, investment, email_draft
        }
    """
    preset = INDUSTRY_PRESETS.get(industry, INDUSTRY_PRESETS["IT"])
    cases = SUCCESS_CASES.get(industry, SUCCESS_CASES["IT"])
    cases_text = "\n".join(
        f"- {c['company']}: {c['issue']} → {c['solution']} → {c['result']}"
        for c in cases
    )

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[{
            "role": "user",
            "content": PROPOSAL_PROMPT.format(
                company_name=company_name,
                industry=industry,
                company_size=company_size,
                key_needs=key_needs,
                structure=preset["structure"],
                focus=preset["focus"],
                success_cases=cases_text,
            ),
        }],
        max_tokens=3000,
    )

    return json.loads(res.choices[0].message.content)
