"""
인사 규정 서비스 — DB 저장/텍스트 추출/규정 기반 질의응답
"""
import json
import re
import zlib
from datetime import datetime
from io import BytesIO
from itertools import combinations
from pathlib import Path

from openai import OpenAI

from config import settings
from database import get_connection

client = OpenAI(api_key=settings.openai_api_key)

HWP_TEXT_TAG_ID = 67

REGULATION_TABLE_DDL = """
CREATE TABLE IF NOT EXISTS hr_regulation_documents (
    id                      SERIAL          PRIMARY KEY,
    file_name               VARCHAR(255)    NOT NULL,
    file_type               VARCHAR(20)     NOT NULL,
    file_bytes              BYTEA           NOT NULL,
    text_content            TEXT            NOT NULL,
    text_length             INTEGER         NOT NULL,
    preview                 TEXT,
    uploaded_by_employee_id VARCHAR(50),
    uploaded_by_name        VARCHAR(100),
    uploaded_by_department  VARCHAR(100),
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ
)
"""

REGULATION_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_hr_reg_docs_active ON hr_regulation_documents (is_active, deleted_at)",
    "CREATE INDEX IF NOT EXISTS idx_hr_reg_docs_created_at ON hr_regulation_documents (created_at DESC)",
]

CLAUSE_PATTERN = re.compile(r"^제\s*\d+\s*조(?:의\s*\d+)?(?:\s*\([^)]+\))?", re.MULTILINE)


def _get_olefile_module():
    try:
        import olefile
    except ImportError as exc:
        raise RuntimeError(
            "HWP 업로드 기능을 사용하려면 olefile 패키지가 필요합니다. "
            "python -m pip install olefile 후 다시 시도해 주세요."
        ) from exc
    return olefile


def _get_docx_document():
    try:
        from docx import Document
    except ImportError as exc:
        raise RuntimeError(
            "DOCX 업로드 기능을 사용하려면 python-docx 패키지가 필요합니다. "
            "python -m pip install python-docx 후 다시 시도해 주세요."
        ) from exc
    return Document


def _get_pdf_reader():
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError(
            "PDF 업로드 기능을 사용하려면 pypdf 패키지가 필요합니다. "
            "python -m pip install pypdf 후 다시 시도해 주세요."
        ) from exc
    return PdfReader


def _normalize_text(text: str) -> str:
    cleaned = text.replace("\r", "\n").replace("\x00", "")
    cleaned = re.sub(r"[\x01-\x08\x0b-\x1f\x7f]", " ", cleaned)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def _format_datetime_value(value) -> str:
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")

    text = str(value or "").strip()
    if not text:
        return ""

    normalized = text.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
        return parsed.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return text[:19] if len(text) >= 19 else text


def _sanitize_filename(filename: str) -> str:
    safe = re.sub(r"[^0-9A-Za-z가-힣._-]+", "_", filename or "regulation.hwp")
    return safe or "regulation.hwp"


def _read_utf16_stream(ole, stream_name: str) -> str:
    data = ole.openstream(stream_name).read()
    for encoding in ("utf-16-le", "utf-16", "utf-8"):
        try:
            text = data.decode(encoding)
            normalized = _normalize_text(text)
            if normalized:
                return normalized
        except UnicodeDecodeError:
            continue
    return ""


def _extract_preview_text(ole) -> str:
    if ole.exists("PrvText"):
        return _read_utf16_stream(ole, "PrvText")
    return ""


def _maybe_decompress(data: bytes) -> bytes:
    for wbits in (-15, zlib.MAX_WBITS):
        try:
            return zlib.decompress(data, wbits)
        except zlib.error:
            continue
    return data


def _extract_body_text(ole) -> str:
    section_names = []
    for entry in ole.listdir():
        if len(entry) == 2 and entry[0] == "BodyText" and entry[1].startswith("Section"):
            section_names.append("/".join(entry))

    texts = []
    for stream_name in sorted(section_names):
        raw = ole.openstream(stream_name).read()
        data = _maybe_decompress(raw)
        offset = 0

        while offset + 4 <= len(data):
            header = int.from_bytes(data[offset:offset + 4], "little")
            tag_id = header & 0x3FF
            size = (header >> 20) & 0xFFF
            offset += 4

            if size == 0xFFF:
                if offset + 4 > len(data):
                    break
                size = int.from_bytes(data[offset:offset + 4], "little")
                offset += 4

            record = data[offset:offset + size]
            offset += size

            if tag_id != HWP_TEXT_TAG_ID or not record:
                continue

            try:
                text = record.decode("utf-16-le", errors="ignore")
            except UnicodeDecodeError:
                continue

            normalized = _normalize_text(text)
            if normalized:
                texts.append(normalized)

    return "\n".join(texts).strip()


def extract_hwp_text(hwp_bytes: bytes) -> str:
    olefile = _get_olefile_module()
    buffer = BytesIO(hwp_bytes)
    if not olefile.isOleFile(buffer):
        raise ValueError("올바른 HWP 파일 형식이 아닙니다.")

    buffer.seek(0)
    with olefile.OleFileIO(buffer) as ole:
        preview_text = _extract_preview_text(ole)
        body_text = _extract_body_text(ole)

    extracted = body_text if len(body_text) >= len(preview_text) else preview_text
    extracted = _normalize_text(extracted)

    if len(extracted) < 20:
        raise ValueError("HWP 문서에서 읽을 수 있는 텍스트를 추출하지 못했습니다.")

    return extracted


def extract_docx_text(docx_bytes: bytes) -> str:
    Document = _get_docx_document()
    document = Document(BytesIO(docx_bytes))

    paragraphs = [
        paragraph.text.strip()
        for paragraph in document.paragraphs
        if paragraph.text and paragraph.text.strip()
    ]
    extracted = _normalize_text("\n".join(paragraphs))

    if len(extracted) < 20:
        raise ValueError("DOCX 문서에서 읽을 수 있는 텍스트를 추출하지 못했습니다.")

    return extracted


def extract_pdf_text(pdf_bytes: bytes) -> str:
    PdfReader = _get_pdf_reader()
    reader = PdfReader(BytesIO(pdf_bytes))

    pages = []
    for page in reader.pages:
        text = page.extract_text() or ""
        normalized = _normalize_text(text)
        if normalized:
            pages.append(normalized)

    extracted = "\n\n".join(pages).strip()
    if len(extracted) < 20:
        raise ValueError("PDF 문서에서 읽을 수 있는 텍스트를 추출하지 못했습니다.")

    return extracted


def extract_regulation_text(filename: str, file_bytes: bytes) -> str:
    extension = Path(filename or "").suffix.lower()

    if extension == ".hwp":
        return extract_hwp_text(file_bytes)
    if extension == ".docx":
        return extract_docx_text(file_bytes)
    if extension == ".pdf":
        return extract_pdf_text(file_bytes)

    raise ValueError("지원하지 않는 파일 형식입니다. hwp, docx, pdf만 업로드할 수 있습니다.")


def _build_preview(text: str, max_lines: int = 3) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    preview = "\n".join(lines[:max_lines])
    return preview[:500]


def _ensure_regulation_table(cur) -> None:
    cur.execute(REGULATION_TABLE_DDL)
    for ddl in REGULATION_INDEXES:
        cur.execute(ddl)


def _serialize_status_row(row) -> dict:
    if not row:
        return {
            "ready": False,
            "document_id": None,
            "file_name": "",
            "file_type": "",
            "uploaded_at": "",
            "text_length": 0,
            "preview": "",
            "uploaded_by_employee_id": "",
            "uploaded_by_name": "",
            "uploaded_by_department": "",
        }

    return {
        "ready": True,
        "document_id": row[0],
        "file_name": row[1],
        "file_type": row[2],
        "uploaded_at": _format_datetime_value(row[3]),
        "text_length": int(row[4] or 0),
        "preview": row[5] or "",
        "uploaded_by_employee_id": row[6] or "",
        "uploaded_by_name": row[7] or "",
        "uploaded_by_department": row[8] or "",
    }


def _fetch_active_document_row(cur):
    cur.execute(
        """
        SELECT id, file_name, file_type, created_at, text_length, preview,
               uploaded_by_employee_id, uploaded_by_name, uploaded_by_department
        FROM hr_regulation_documents
        WHERE deleted_at IS NULL AND is_active = TRUE
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        """
    )
    return cur.fetchone()


def list_active_regulation_documents() -> list[dict]:
    conn = get_connection()
    cur = conn.cursor()

    try:
        _ensure_regulation_table(cur)
        cur.execute(
            """
            SELECT id, file_name, file_type, created_at, text_length, preview,
                   uploaded_by_employee_id, uploaded_by_name, uploaded_by_department
            FROM hr_regulation_documents
            WHERE deleted_at IS NULL AND is_active = TRUE
            ORDER BY created_at DESC, id DESC
            """
        )
        rows = cur.fetchall()
    finally:
        cur.close()
        conn.close()

    return [_serialize_status_row(row) for row in rows]


def _fetch_active_document_with_text(cur):
    cur.execute(
        """
        SELECT id, file_name, file_type, created_at, text_length, preview,
               uploaded_by_employee_id, uploaded_by_name, uploaded_by_department,
               text_content
        FROM hr_regulation_documents
        WHERE deleted_at IS NULL AND is_active = TRUE
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        """
    )
    return cur.fetchone()


def _fetch_active_documents_with_text(cur):
    cur.execute(
        """
        SELECT id, file_name, file_type, created_at, text_length, preview,
               uploaded_by_employee_id, uploaded_by_name, uploaded_by_department,
               text_content
        FROM hr_regulation_documents
        WHERE deleted_at IS NULL AND is_active = TRUE
        ORDER BY created_at DESC, id DESC
        """
    )
    return cur.fetchall()


def save_regulation_document(filename: str, file_bytes: bytes, uploader: dict | None = None) -> dict:
    if not file_bytes:
        raise ValueError("파일이 비어 있습니다.")

    extracted_text = extract_regulation_text(filename, file_bytes)
    safe_filename = _sanitize_filename(filename)
    file_type = Path(safe_filename).suffix.lower().lstrip(".")
    preview = _build_preview(extracted_text)

    conn = get_connection()
    cur = conn.cursor()

    try:
        _ensure_regulation_table(cur)
        cur.execute(
            """
            UPDATE hr_regulation_documents
               SET is_active = FALSE,
                   updated_at = NOW()
             WHERE deleted_at IS NULL
               AND is_active = TRUE
            """
        )
        cur.execute(
            """
            INSERT INTO hr_regulation_documents (
                file_name, file_type, file_bytes, text_content, text_length, preview,
                uploaded_by_employee_id, uploaded_by_name, uploaded_by_department,
                is_active
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
            RETURNING id, file_name, file_type, created_at, text_length, preview,
                      uploaded_by_employee_id, uploaded_by_name, uploaded_by_department
            """,
            (
                safe_filename,
                file_type,
                file_bytes,
                extracted_text,
                len(extracted_text),
                preview,
                (uploader or {}).get("employee_id"),
                (uploader or {}).get("name"),
                (uploader or {}).get("department"),
            ),
        )
        row = cur.fetchone()
    finally:
        cur.close()
        conn.close()

    return _serialize_status_row(row)


def save_regulation_documents(files: list[tuple[str, bytes]], uploader: dict | None = None) -> list[dict]:
    if not files:
        raise ValueError("업로드할 파일이 없습니다.")

    conn = get_connection()
    cur = conn.cursor()
    saved_rows = []

    try:
        _ensure_regulation_table(cur)

        for filename, file_bytes in files:
            if not file_bytes:
                raise ValueError("파일이 비어 있습니다.")

            extracted_text = extract_regulation_text(filename, file_bytes)
            safe_filename = _sanitize_filename(filename)
            file_type = Path(safe_filename).suffix.lower().lstrip(".")
            preview = _build_preview(extracted_text)

            cur.execute(
                """
                INSERT INTO hr_regulation_documents (
                    file_name, file_type, file_bytes, text_content, text_length, preview,
                    uploaded_by_employee_id, uploaded_by_name, uploaded_by_department,
                    is_active
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                RETURNING id, file_name, file_type, created_at, text_length, preview,
                          uploaded_by_employee_id, uploaded_by_name, uploaded_by_department
                """,
                (
                    safe_filename,
                    file_type,
                    file_bytes,
                    extracted_text,
                    len(extracted_text),
                    preview,
                    (uploader or {}).get("employee_id"),
                    (uploader or {}).get("name"),
                    (uploader or {}).get("department"),
                ),
            )
            saved_rows.append(cur.fetchone())
    finally:
        cur.close()
        conn.close()

    return [_serialize_status_row(row) for row in saved_rows]


def get_regulation_status() -> dict:
    conn = get_connection()
    cur = conn.cursor()

    try:
        _ensure_regulation_table(cur)
        row = _fetch_active_document_row(cur)
    finally:
        cur.close()
        conn.close()

    return _serialize_status_row(row)


def delete_current_regulation_document() -> dict:
    conn = get_connection()
    cur = conn.cursor()

    try:
        _ensure_regulation_table(cur)
        active_row = _fetch_active_document_row(cur)
        if not active_row:
            raise ValueError("삭제할 규정 문서가 없습니다.")

        deleted_document_id = active_row[0]
        deleted_file_name = active_row[1]

        cur.execute(
            """
            UPDATE hr_regulation_documents
               SET is_active = FALSE,
                   deleted_at = NOW(),
                   updated_at = NOW()
             WHERE id = %s
            """,
            (deleted_document_id,),
        )

        cur.execute(
            """
            SELECT id
            FROM hr_regulation_documents
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """
        )
        fallback = cur.fetchone()
        if fallback:
            cur.execute(
                """
                UPDATE hr_regulation_documents
                   SET is_active = TRUE,
                       updated_at = NOW()
                 WHERE id = %s
                """,
                (fallback[0],),
            )

        next_status = _serialize_status_row(_fetch_active_document_row(cur))
    finally:
        cur.close()
        conn.close()

    return {
        "message": f"{deleted_file_name} 문서를 삭제했습니다.",
        "deleted_document_id": deleted_document_id,
        "deleted_file_name": deleted_file_name,
        "current_status": next_status,
    }


def delete_regulation_document(document_id: int) -> dict:
    conn = get_connection()
    cur = conn.cursor()

    try:
        _ensure_regulation_table(cur)
        cur.execute(
            """
            SELECT id, file_name
            FROM hr_regulation_documents
            WHERE id = %s
              AND deleted_at IS NULL
            """,
            (document_id,),
        )
        row = cur.fetchone()
        if not row:
            raise ValueError("삭제할 규정 문서를 찾을 수 없습니다.")

        cur.execute(
            """
            DELETE FROM hr_regulation_documents
            WHERE id = %s
            """,
            (document_id,),
        )

        remaining = list_active_regulation_documents()
    finally:
        cur.close()
        conn.close()

    return {
        "message": f"{row[1]} 문서를 삭제했습니다.",
        "deleted_document_id": row[0],
        "deleted_file_name": row[1],
        "items": remaining,
    }


def _load_regulation_document() -> dict:
    conn = get_connection()
    cur = conn.cursor()

    try:
        _ensure_regulation_table(cur)
        row = _fetch_active_document_with_text(cur)
    finally:
        cur.close()
        conn.close()

    if not row:
        raise RuntimeError("먼저 인사 규정 문서(hwp, docx, pdf)를 업로드해 주세요.")

    text = (row[9] or "").strip()
    if not text:
        raise RuntimeError("업로드된 규정 문서에서 텍스트를 읽지 못했습니다.")

    return {
        "document_id": row[0],
        "file_name": row[1],
        "file_type": row[2],
        "uploaded_at": str(row[3]),
        "text_length": int(row[4] or 0),
        "preview": row[5] or "",
        "uploaded_by_employee_id": row[6] or "",
        "uploaded_by_name": row[7] or "",
        "uploaded_by_department": row[8] or "",
        "text_content": text,
    }


def _load_regulation_documents() -> list[dict]:
    conn = get_connection()
    cur = conn.cursor()

    try:
        _ensure_regulation_table(cur)
        rows = _fetch_active_documents_with_text(cur)
    finally:
        cur.close()
        conn.close()

    documents = []
    for row in rows:
        text = (row[9] or "").strip()
        if not text:
            continue
        documents.append(
            {
                "document_id": row[0],
                "file_name": row[1],
                "file_type": row[2],
                "uploaded_at": _format_datetime_value(row[3]),
                "text_length": int(row[4] or 0),
                "preview": row[5] or "",
                "uploaded_by_employee_id": row[6] or "",
                "uploaded_by_name": row[7] or "",
                "uploaded_by_department": row[8] or "",
                "text_content": text,
            }
        )

    if not documents:
        raise RuntimeError("먼저 인사 규정 문서(hwp, docx, pdf)를 업로드해 주세요.")

    return documents


def _normalize_clause_body(text: str) -> str:
    normalized = re.sub(r"\s+", "", text or "")
    normalized = re.sub(r"[^\w가-힣]", "", normalized)
    return normalized.lower()


def _extract_regulation_clauses(text: str) -> list[dict]:
    matches = list(CLAUSE_PATTERN.finditer(text or ""))
    if not matches:
        return []

    clauses = []
    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        chunk = (text[start:end] or "").strip()
        if not chunk:
            continue

        lines = [line.strip() for line in chunk.splitlines() if line.strip()]
        if not lines:
            continue

        title = lines[0][:160]
        body = "\n".join(lines[1:]).strip()
        normalized_body = _normalize_clause_body(body)
        if not normalized_body:
            continue

        clauses.append(
            {
                "title": title,
                "body": body,
                "normalized_body": normalized_body,
            }
        )

    return clauses


def get_regulation_conflicts() -> dict:
    documents = _load_regulation_documents()
    if len(documents) < 2:
        return {"has_conflict": False, "items": []}

    conflict_items = []

    for left_doc, right_doc in combinations(documents, 2):
        left_clauses = {
            clause["title"]: clause for clause in _extract_regulation_clauses(left_doc["text_content"])
        }
        right_clauses = {
            clause["title"]: clause for clause in _extract_regulation_clauses(right_doc["text_content"])
        }

        shared_titles = sorted(set(left_clauses) & set(right_clauses))
        conflicting_titles = [
            title
            for title in shared_titles
            if left_clauses[title]["normalized_body"] != right_clauses[title]["normalized_body"]
        ]

        if conflicting_titles:
            conflict_items.append(
                {
                    "file_names": [left_doc["file_name"], right_doc["file_name"]],
                    "clause_titles": conflicting_titles[:5],
                    "clause_count": len(conflicting_titles),
                    "created_at": max(
                        str(left_doc.get("uploaded_at") or ""),
                        str(right_doc.get("uploaded_at") or ""),
                    ),
                }
            )

    return {
        "has_conflict": bool(conflict_items),
        "items": conflict_items,
    }


def _chunk_text(text: str, chunk_size: int = 1200) -> list[str]:
    paragraphs = [paragraph.strip() for paragraph in text.split("\n") if paragraph.strip()]
    chunks = []
    current = []
    current_len = 0

    for paragraph in paragraphs:
        if current and current_len + len(paragraph) + 1 > chunk_size:
            chunks.append("\n".join(current))
            current = [paragraph]
            current_len = len(paragraph)
            continue

        current.append(paragraph)
        current_len += len(paragraph) + 1

    if current:
        chunks.append("\n".join(current))

    return chunks or [text[:chunk_size]]


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[0-9A-Za-z가-힣]{2,}", text.lower())


def _select_relevant_chunks(text: str, question: str, top_k: int = 5) -> list[str]:
    chunks = _chunk_text(text)
    tokens = _tokenize(question)
    scored = []

    for index, chunk in enumerate(chunks):
        lowered = chunk.lower()
        score = 0
        for token in tokens:
            score += lowered.count(token) * 3
        if question.strip() and question.strip().lower() in lowered:
            score += 10
        score -= index * 0.01
        scored.append((score, chunk))

    scored.sort(key=lambda item: item[0], reverse=True)
    selected = [chunk for score, chunk in scored[:top_k] if score > 0]
    return selected or chunks[: min(top_k, len(chunks))]


def _select_relevant_document_chunks(documents: list[dict], question: str, top_k: int = 5) -> list[dict]:
    tokens = _tokenize(question)
    scored = []

    for doc_index, document in enumerate(documents):
        chunks = _chunk_text(document["text_content"])
        for chunk_index, chunk in enumerate(chunks):
            lowered = chunk.lower()
            score = 0
            for token in tokens:
                score += lowered.count(token) * 3
            if question.strip() and question.strip().lower() in lowered:
                score += 10
            score -= doc_index * 0.01
            score -= chunk_index * 0.001
            scored.append(
                (
                    score,
                    {
                        "file_name": document["file_name"],
                        "chunk": chunk,
                    },
                )
            )

    scored.sort(key=lambda item: item[0], reverse=True)
    selected = [item for score, item in scored[:top_k] if score > 0]
    return selected or [item for _, item in scored[: min(top_k, len(scored))]]


def answer_regulation_question(question: str) -> dict:
    if not question.strip():
        raise ValueError("질문을 입력해 주세요.")

    documents = _load_regulation_documents()
    relevant_chunks = _select_relevant_document_chunks(documents, question)
    context = "\n\n".join(
        f"[문서 {index + 1}: {item['file_name']}]\n{item['chunk']}"
        for index, item in enumerate(relevant_chunks)
    )
    file_names = ", ".join(document["file_name"] for document in documents)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 사내 인사 규정 안내 챗봇입니다. "
                    "반드시 제공된 규정 문서 내용만 근거로 답변하세요. "
                    "문서에 없는 내용은 추측하지 말고, 문서에서 확인되지 않는다고 분명히 말하세요. "
                    "응답은 JSON만 반환하세요."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"[업로드 문서명]\n{file_names}\n\n"
                    f"[사용자 질문]\n{question}\n\n"
                    f"[규정 문맥]\n{context}\n\n"
                    "[반환 형식]\n"
                    "{\n"
                    '  "answer": "질문에 대한 한국어 답변",\n'
                    '  "evidence": ["답변 근거가 된 문장 또는 핵심 구절", "..."]\n'
                    "}"
                ),
            },
        ],
        max_tokens=1200,
        temperature=0.2,
    )

    payload = json.loads(response.choices[0].message.content)
    evidence = payload.get("evidence") if isinstance(payload.get("evidence"), list) else []

    return {
        "answer": payload.get("answer", "규정 문서에서 답변을 생성하지 못했습니다."),
        "evidence": [str(item).strip() for item in evidence if str(item).strip()][:3],
        "file_name": file_names,
        "document_ids": [document.get("document_id") for document in documents],
    }
