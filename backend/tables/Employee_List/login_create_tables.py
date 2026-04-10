import sys
import os
import pg8000.dbapi as pg8000
from dotenv import load_dotenv

# .env 로드: 현재 실행 디렉토리에서 .env를 찾습니다.
load_dotenv()

DB_HOST     = os.environ.get("DB_HOST")
DB_PORT     = int(os.environ.get("DB_PORT", 5432))
DB_USER     = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_DATABASE = os.environ.get("DB_DATABASE")

# ────────────────────────────────────────────────────────────
# DDL 정의 (사번 employee_id를 PRIMARY KEY로 설정)
# ────────────────────────────────────────────────────────────
TABLES: list[tuple[str, str]] = [
    (
        "employees",
        """
        CREATE TABLE IF NOT EXISTS employees (
            employee_id   VARCHAR(50)     PRIMARY KEY,          -- 사번 (기본키 & 로그인 ID)
            name          VARCHAR(100)    NOT NULL,             -- 성명
            email         VARCHAR(255)    UNIQUE NOT NULL,      -- 이메일 (중복 불가)
            password      VARCHAR(255)    NOT NULL,             -- 암호화된 비밀번호
            phone_number  VARCHAR(20)     NOT NULL,             -- 연락처
            birth_date    DATE,                                 -- 생년월일 (선택)
            department    VARCHAR(100)    NOT NULL,             -- 소속 부서
            position      VARCHAR(100)    NOT NULL,             -- 직위/직급
            nickname      VARCHAR(100),                         -- 서비스 내 닉네임
            is_active     BOOLEAN         DEFAULT TRUE,         -- 계정 활성화 상태
            created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
        )
        """,
    ),
]

INDEXES: list[tuple[str, str]] = [
    ("idx_employees_email", "CREATE INDEX IF NOT EXISTS idx_employees_email ON employees (email)"),
    ("idx_employees_dept",  "CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees (department)"),
    ("idx_employees_name",  "CREATE INDEX IF NOT EXISTS idx_employees_name ON employees (name)"),
]

# 수정 시각 자동 갱신을 위한 트리거 함수
TRIGGER_FUNCTION = """
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$
"""

TRIGGERS: list[tuple[str, str]] = [
    (
        "trg_employees_updated_at",
        """
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_employees_updated_at') THEN
                CREATE TRIGGER trg_employees_updated_at
                    BEFORE UPDATE ON employees
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            END IF;
        END $$
        """,
    ),
]

# ────────────────────────────────────────────────────────────
# 실행 로직
# ────────────────────────────────────────────────────────────
def create_employee_db() -> None:
    print(f"사원정보 DB 구축 시작: {DB_HOST} ({DB_DATABASE})")

    conn = None
    try:
        conn = pg8000.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_DATABASE,
        )
        conn.autocommit = True
        cur = conn.cursor()

        # 1. 테이블 생성
        for table_name, ddl in TABLES:
            cur.execute(ddl)
            print(f"[Table] {table_name} 생성 완료")

        # 2. 인덱스 생성
        for idx_name, ddl in INDEXES:
            cur.execute(ddl)
            print(f"[Index] {idx_name} 생성 완료")

        # 3. 트리거 설정
        cur.execute(TRIGGER_FUNCTION)
        for trig_name, ddl in TRIGGERS:
            cur.execute(ddl)
            print(f"[Trigger] {trig_name} 설정 완료")

        print("\n모든 설정이 성공적으로 완료되었습니다.")

    except Exception as e:
        print(f"\n오류 발생: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    create_employee_db()