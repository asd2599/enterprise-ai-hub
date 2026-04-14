"""
인사 계정 승인/부서 관리 라우터 — /api/auth/*
"""
from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import get_connection
from services.HR.hr_notification_service import create_notification

router = APIRouter()


class ApproveEmployeeRequest(BaseModel):
    employee_id: str
    department: str
    position: str


class UpdateEmployeeDepartmentRequest(BaseModel):
    department: str
    reason: str


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

    create_notification(f"({row[0]}) 계정의 승인 요청이 거부되었습니다.", "계정 승인 관리")

    return {
        "employee_id": row[0],
        "name": row[1],
        "message": "가입 요청이 거절되었습니다.",
    }


@router.get("/employees")
def list_employees():
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT employee_id, name, email, phone_number, birth_date, nickname,
                   department, position, is_verified, is_active, created_at, updated_at
            FROM info_employees
            WHERE is_verified = TRUE
            ORDER BY department ASC, name ASC
            """
        )
        rows = cur.fetchall()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"사원 목록 조회 실패: {str(exc)}")
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
                "department": row[6],
                "position": row[7],
                "is_verified": row[8],
                "is_active": row[9],
                "created_at": str(row[10]),
                "updated_at": str(row[11]),
            }
            for row in rows
        ],
    }


@router.put("/employees/{employee_id}/department")
def update_employee_department(employee_id: str, body: UpdateEmployeeDepartmentRequest):
    employee_id = employee_id.strip()
    department = body.department.strip()
    reason = body.reason.strip()

    if not employee_id or not department or not reason:
        raise HTTPException(status_code=400, detail="사번, 변경할 부서, 변경 사유는 모두 필수입니다.")

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT name, department
            FROM info_employees
            WHERE employee_id = %s
              AND is_verified = TRUE
            """,
            (employee_id,),
        )
        current_row = cur.fetchone()
        if not current_row:
            raise HTTPException(status_code=404, detail="부서를 변경할 사원 계정을 찾을 수 없습니다.")

        previous_department = current_row[1]
        cur.execute(
            """
            UPDATE info_employees
               SET department = %s,
                   updated_at = NOW()
             WHERE employee_id = %s
               AND is_verified = TRUE
            RETURNING employee_id, name, department, position, updated_at
            """,
            (department, employee_id),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="부서를 변경할 사원 계정을 찾을 수 없습니다.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"부서 변경 실패: {str(exc)}")
    finally:
        cur.close()
        conn.close()

    create_notification(
        f"{row[1]}님의 부서를 '{previous_department}'에서 '{row[2]}'으로 변경했습니다. 변경 사유: {reason}",
        "부서",
    )

    return {
        "employee_id": row[0],
        "name": row[1],
        "department": row[2],
        "position": row[3],
        "updated_at": str(row[4]),
        "message": "사원 부서가 변경되었습니다.",
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

    create_notification(f"({row[0]}) 계정이 승인되었습니다.", "계정 승인 관리")

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
