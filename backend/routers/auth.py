"""
인증 라우터 — /api/auth/*
"""
import hashlib
import hmac
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import get_connection

router = APIRouter()


def hash_password(employee_id: str, password: str) -> str:
    """
    사번을 salt처럼 사용해 비밀번호를 해시합니다.
    """
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        employee_id.encode("utf-8"),
        100_000,
    ).hex()


class RegisterEmployeeRequest(BaseModel):
    employee_id: str
    name: str
    email: str
    password: str
    phone_number: str
    birth_date: Optional[date] = None
    nickname: Optional[str] = None


class LoginRequest(BaseModel):
    employee_id: str
    password: str


class ApproveEmployeeRequest(BaseModel):
    employee_id: str
    department: str
    position: str


class UpdateProfileRequest(BaseModel):
    employee_id: str
    name: str
    email: str
    phone_number: str
    birth_date: Optional[date] = None
    nickname: Optional[str] = None
    password: Optional[str] = None


@router.delete("/reject/{employee_id}")
def reject_employee(employee_id: str):
    employee_id = employee_id.strip()

    if not employee_id:
        raise HTTPException(status_code=400, detail="사번이 비어 있습니다.")

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            DELETE FROM info_employees
            WHERE employee_id = %s AND is_verified = FALSE
            RETURNING employee_id, name
            """,
            (employee_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="거절할 승인 대기 계정을 찾을 수 없습니다.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"가입 거절 처리 실패: {str(exc)}")
    finally:
        cur.close()
        conn.close()

    return {
        "employee_id": row[0],
        "name": row[1],
        "message": "가입 요청이 거절되었습니다.",
    }


@router.get("/pending")
def list_pending_employees():
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT employee_id, name, email, phone_number, birth_date, nickname,
                   is_verified, is_active, created_at
            FROM info_employees
            WHERE is_verified = FALSE
            ORDER BY created_at DESC
            """
        )
        rows = cur.fetchall()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"승인 대기 목록 조회 실패: {str(exc)}")
    finally:
        cur.close()
        conn.close()

    return {
        "total": len(rows),
        "items": [
            {
                "employee_id": row[0],
                "name": row[1],
                "email": row[2],
                "phone_number": row[3],
                "birth_date": row[4].isoformat() if isinstance(row[4], date) else None,
                "nickname": row[5],
                "is_verified": row[6],
                "is_active": row[7],
                "created_at": str(row[8]),
            }
            for row in rows
        ],
    }


@router.post("/register", status_code=201)
def register_employee(body: RegisterEmployeeRequest):
    employee_id = body.employee_id.strip()
    name = body.name.strip()
    email = body.email.strip().lower()
    password = body.password
    phone_number = body.phone_number.strip()
    nickname = body.nickname.strip() if body.nickname else None

    if not employee_id or not name or not email or not password or not phone_number:
        raise HTTPException(status_code=400, detail="필수 회원가입 정보가 비어 있습니다.")

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT employee_id, email
            FROM info_employees
            WHERE employee_id = %s OR email = %s
            """,
            (employee_id, email),
        )
        duplicated = cur.fetchone()
        if duplicated:
            if duplicated[0] == employee_id:
                raise HTTPException(status_code=409, detail="이미 사용 중인 사번입니다.")
            raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")

        cur.execute(
            """
            INSERT INTO info_employees
                (employee_id, name, email, password, phone_number, birth_date, nickname,
                 department, position, is_verified, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NULL, NULL, FALSE, FALSE)
            RETURNING employee_id, created_at
            """,
            (
                employee_id,
                name,
                email,
                hash_password(employee_id, password),
                phone_number,
                body.birth_date,
                nickname,
            ),
        )
        row = cur.fetchone()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"회원가입 처리 실패: {str(exc)}")
    finally:
        cur.close()
        conn.close()

    return {
        "employee_id": row[0],
        "created_at": str(row[1]),
        "status": "pending_approval",
        "message": "회원가입 요청이 완료되었습니다. 인사팀 승인 후 로그인할 수 있습니다.",
    }


@router.post("/approve")
def approve_employee(body: ApproveEmployeeRequest):
    employee_id = body.employee_id.strip()
    department = body.department.strip()
    position = body.position.strip()

    if not employee_id or not department or not position:
        raise HTTPException(status_code=400, detail="사번, 부서, 직급은 모두 필수입니다.")

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            UPDATE info_employees
               SET department = %s,
                   position = %s,
                   is_verified = TRUE,
                   is_active = TRUE,
                   updated_at = NOW()
             WHERE employee_id = %s
            RETURNING employee_id, name, department, position, is_verified, is_active, updated_at
            """,
            (department, position, employee_id),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="승인할 사원 계정을 찾을 수 없습니다.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"승인 처리 실패: {str(exc)}")
    finally:
        cur.close()
        conn.close()

    return {
        "employee_id": row[0],
        "name": row[1],
        "department": row[2],
        "position": row[3],
        "is_verified": row[4],
        "is_active": row[5],
        "updated_at": str(row[6]),
        "message": "인사팀 승인과 부서/직급 배정이 완료되었습니다.",
    }


@router.put("/profile")
def update_profile(body: UpdateProfileRequest):
    employee_id = body.employee_id.strip()
    name = body.name.strip()
    email = body.email.strip().lower()
    phone_number = body.phone_number.strip()
    nickname = body.nickname.strip() if body.nickname else None

    if not employee_id or not name or not email or not phone_number:
        raise HTTPException(status_code=400, detail="이름, 이메일, 전화번호는 필수입니다.")

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT employee_id
            FROM info_employees
            WHERE email = %s AND employee_id <> %s
            """,
            (email, employee_id),
        )
        duplicated = cur.fetchone()
        if duplicated:
            raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")

        if body.password:
            cur.execute(
                """
                UPDATE info_employees
                   SET name = %s,
                       email = %s,
                       phone_number = %s,
                       birth_date = %s,
                       nickname = %s,
                       password = %s,
                       updated_at = NOW()
                 WHERE employee_id = %s
                RETURNING employee_id, name, email, phone_number, birth_date, nickname,
                          department, position, is_verified, is_active, updated_at
                """,
                (
                    name,
                    email,
                    phone_number,
                    body.birth_date,
                    nickname,
                    hash_password(employee_id, body.password),
                    employee_id,
                ),
            )
        else:
            cur.execute(
                """
                UPDATE info_employees
                   SET name = %s,
                       email = %s,
                       phone_number = %s,
                       birth_date = %s,
                       nickname = %s,
                       updated_at = NOW()
                 WHERE employee_id = %s
                RETURNING employee_id, name, email, phone_number, birth_date, nickname,
                          department, position, is_verified, is_active, updated_at
                """,
                (
                    name,
                    email,
                    phone_number,
                    body.birth_date,
                    nickname,
                    employee_id,
                ),
            )

        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="수정할 계정을 찾을 수 없습니다.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"내 정보 수정 실패: {str(exc)}")
    finally:
        cur.close()
        conn.close()

    return {
        "employee": {
            "employee_id": row[0],
            "name": row[1],
            "email": row[2],
            "phone_number": row[3],
            "birth_date": row[4].isoformat() if isinstance(row[4], date) else None,
            "nickname": row[5],
            "department": row[6],
            "position": row[7],
            "is_verified": row[8],
            "is_active": row[9],
        },
        "approval_status": "approved" if row[8] else "pending_approval",
        "updated_at": str(row[10]),
        "message": "내 정보가 수정되었습니다.",
    }


@router.post("/login")
def login_employee(body: LoginRequest):
    employee_id = body.employee_id.strip()
    password = body.password

    if not employee_id or not password:
        raise HTTPException(status_code=400, detail="사번과 비밀번호를 모두 입력해 주세요.")

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT employee_id, name, email, password, department, position,
                   is_verified, is_active, birth_date, nickname, phone_number
            FROM info_employees
            WHERE employee_id = %s
            """,
            (employee_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="사번 또는 비밀번호가 올바르지 않습니다.")

        stored_password = row[3]
        expected_password = hash_password(employee_id, password)
        if not hmac.compare_digest(stored_password, expected_password):
            raise HTTPException(status_code=401, detail="사번 또는 비밀번호가 올바르지 않습니다.")

        is_verified = row[6]
        is_active = row[7]
        department = row[4]
        position = row[5]

        if is_verified and not is_active:
            raise HTTPException(status_code=403, detail="비활성화된 계정입니다.")
        if is_verified and (not department or not position):
            raise HTTPException(status_code=403, detail="부서 또는 직급이 아직 배정되지 않았습니다.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"로그인 처리 실패: {str(exc)}")
    finally:
        cur.close()
        conn.close()

    birth_date = row[8]
    approval_status = "approved" if row[6] else "pending_approval"
    message = (
        f"{row[1]}님, 로그인되었습니다. 현재 인사팀 승인 대기 상태입니다."
        if approval_status == "pending_approval"
        else f"{row[1]}님, 로그인되었습니다."
    )

    return {
        "employee": {
            "employee_id": row[0],
            "name": row[1],
            "email": row[2],
            "phone_number": row[10],
            "department": row[4],
            "position": row[5],
            "is_verified": row[6],
            "is_active": row[7],
            "birth_date": birth_date.isoformat() if isinstance(birth_date, date) else None,
            "nickname": row[9],
        },
        "approval_status": approval_status,
        "message": message,
        "redirectTo": "/",
    }
