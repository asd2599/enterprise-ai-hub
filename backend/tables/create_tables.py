"""
테이블 생성 스크립트 — .env의 DB 정보로 PostgreSQL에 테이블을 생성합니다.
실행: python -m tables.create_tables  (backend/ 디렉토리에서 실행)
"""
import sys
import os
import pg8000.dbapi as pg8000
from dotenv import load_dotenv

# backend/.env 로드 (backend/ 또는 그 하위에서 실행 시 모두 탐색)
_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(_env_path)

DB_HOST     = os.environ["DB_HOST"]
DB_PORT     = int(os.environ.get("DB_PORT", 5432))
DB_USER     = os.environ["DB_USER"]
DB_PASSWORD = os.environ["DB_PASSWORD"]
DB_DATABASE = os.environ["DB_DATABASE"]

# ────────────────────────────────────────────────────────────
# DDL 정의 — (테이블명, CREATE 구문) 순서대로 실행
# ────────────────────────────────────────────────────────────
TABLES: list[tuple[str, str]] = [
    (
        "transactions",
        """
        CREATE TABLE IF NOT EXISTS transactions (
            id              SERIAL          PRIMARY KEY,
            receipt_date    DATE            NOT NULL,
            item            VARCHAR(255)    NOT NULL,
            amount          INTEGER         NOT NULL,
            tax_amount      INTEGER         NOT NULL DEFAULT 0,
            total_amount    INTEGER         GENERATED ALWAYS AS (amount + tax_amount) STORED,
            account_code    VARCHAR(100)    NOT NULL,
            department      VARCHAR(100),
            vendor          VARCHAR(255),
            memo            TEXT,
            ai_confidence   NUMERIC(5, 2),
            raw_json        JSONB,
            created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
        )
        """,
    ),
    (
        "budgets",
        """
        CREATE TABLE IF NOT EXISTS budgets (
            id              SERIAL          PRIMARY KEY,
            fiscal_year     SMALLINT        NOT NULL,
            department      VARCHAR(100)    NOT NULL,
            account_code    VARCHAR(100)    NOT NULL,
            budget_amount   INTEGER         NOT NULL,
            created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            UNIQUE (fiscal_year, department, account_code)
        )
        """,
    ),
    (
        "audit_logs",
        """
        CREATE TABLE IF NOT EXISTS audit_logs (
            id              SERIAL          PRIMARY KEY,
            transaction_id  INTEGER         REFERENCES transactions (id) ON DELETE SET NULL,
            risk_level      VARCHAR(10)     NOT NULL CHECK (risk_level IN ('safe', 'warning', 'danger')),
            violated_rule   VARCHAR(255),
            ai_reason       TEXT            NOT NULL,
            is_confirmed    BOOLEAN         NOT NULL DEFAULT FALSE,
            confirmed_by    VARCHAR(100),
            confirmed_at    TIMESTAMPTZ,
            raw_json        JSONB,
            created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
        )
        """,
    ),
]

INDEXES: list[tuple[str, str]] = [
    ("idx_transactions_receipt_date", "CREATE INDEX IF NOT EXISTS idx_transactions_receipt_date ON transactions (receipt_date)"),
    ("idx_transactions_account_code", "CREATE INDEX IF NOT EXISTS idx_transactions_account_code ON transactions (account_code)"),
    ("idx_transactions_department",   "CREATE INDEX IF NOT EXISTS idx_transactions_department   ON transactions (department)"),
    ("idx_budgets_fiscal_year",       "CREATE INDEX IF NOT EXISTS idx_budgets_fiscal_year       ON budgets (fiscal_year)"),
    ("idx_budgets_department",        "CREATE INDEX IF NOT EXISTS idx_budgets_department        ON budgets (department)"),
    ("idx_audit_logs_risk_level",     "CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level     ON audit_logs (risk_level)"),
    ("idx_audit_logs_transaction_id", "CREATE INDEX IF NOT EXISTS idx_audit_logs_transaction_id ON audit_logs (transaction_id)"),
    ("idx_audit_logs_is_confirmed",   "CREATE INDEX IF NOT EXISTS idx_audit_logs_is_confirmed   ON audit_logs (is_confirmed)"),
]

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
        "trg_transactions_updated_at",
        """
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_transactions_updated_at') THEN
                CREATE TRIGGER trg_transactions_updated_at
                    BEFORE UPDATE ON transactions
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            END IF;
        END $$
        """,
    ),
    (
        "trg_budgets_updated_at",
        """
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_budgets_updated_at') THEN
                CREATE TRIGGER trg_budgets_updated_at
                    BEFORE UPDATE ON budgets
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            END IF;
        END $$
        """,
    ),
]


# ────────────────────────────────────────────────────────────
# 실행
# ────────────────────────────────────────────────────────────
def create_tables() -> None:
    print(f"[DB] 접속 중: {DB_HOST}:{DB_PORT}/{DB_DATABASE}")

    conn = pg8000.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_DATABASE,
    )
    conn.autocommit = True

    cur = conn.cursor()
    try:
        # 1. 테이블 생성
        for table_name, ddl in TABLES:
            cur.execute(ddl)
            print(f"  [OK] 테이블: {table_name}")

        # 2. 인덱스 생성
        for idx_name, ddl in INDEXES:
            cur.execute(ddl)
            print(f"  [OK] 인덱스: {idx_name}")

        # 3. 트리거 함수
        cur.execute(TRIGGER_FUNCTION)
        print("  [OK] 함수: set_updated_at()")

        # 4. 트리거
        for trig_name, ddl in TRIGGERS:
            cur.execute(ddl)
            print(f"  [OK] 트리거: {trig_name}")

        print("\n[완료] 모든 테이블이 정상적으로 생성되었습니다.")

    except Exception as e:
        print(f"\n[오류] 테이블 생성 실패: {e}", file=sys.stderr)
        sys.exit(1)

    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    create_tables()
