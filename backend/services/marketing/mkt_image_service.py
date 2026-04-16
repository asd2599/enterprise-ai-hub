"""
마케팅 캠페인 이미지 생성 서비스 — DALL-E 3
"""
from openai import OpenAI
from config import settings

client = OpenAI(api_key=settings.openai_api_key)


def generate_image(
    product_name: str,
    description: str,
    style: str,
    size: str,
) -> dict:
    """
    캠페인 정보를 기반으로 DALL-E 3 이미지를 생성합니다.

    Returns:
        {"image_url": str, "revised_prompt": str}
    """
    prompt = (
        f"마케팅 캠페인용 고퀄리티 광고 이미지를 생성해주세요.\n"
        f"제품명: {product_name}\n"
        f"설명: {description}\n"
        f"스타일: {style}\n"
        f"텍스트나 글자는 절대 포함하지 마세요. "
        f"깔끔하고 전문적인 광고 비주얼로 제작해주세요."
    )

    res = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        n=1,
        size=size,
        quality="standard",
    )

    image_data = res.data[0]
    return {
        "image_url": image_data.url,
        "revised_prompt": image_data.revised_prompt,
    }
