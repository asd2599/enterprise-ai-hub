"""
마케팅 캠페인 이미지 생성 라우터 — /api/marketing/image/*
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.marketing.mkt_image_service import generate_image

router = APIRouter()


class ImageRequest(BaseModel):
    product_name: str
    description: str
    style: str = "모던하고 세련된"  # 스타일 프리셋
    size: str = "1024x1024"       # 1024x1024 | 1024x1792 | 1792x1024


# ──────────────────────────────────────────────────────────────
# POST /api/marketing/image/generate
# ──────────────────────────────────────────────────────────────
@router.post("/generate")
def image_generate(body: ImageRequest):
    """
    캠페인 정보를 기반으로 마케팅 이미지를 생성합니다.

    Request : { product_name, description, style?, size? }
    Response: { image_url, revised_prompt }
    """
    if not body.product_name.strip():
        raise HTTPException(status_code=400, detail="제품명을 입력해 주세요.")
    if not body.description.strip():
        raise HTTPException(status_code=400, detail="이미지 설명을 입력해 주세요.")

    valid_sizes = ("1024x1024", "1024x1792", "1792x1024")
    if body.size not in valid_sizes:
        raise HTTPException(
            status_code=400,
            detail=f"size는 {', '.join(valid_sizes)} 중 하나여야 합니다.",
        )

    try:
        result = generate_image(
            product_name=body.product_name,
            description=body.description,
            style=body.style,
            size=body.size,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"이미지 생성 실패: {str(e)}")

    return result
