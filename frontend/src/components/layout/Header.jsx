// 공통 헤더 컴포넌트 — 로고, 모바일 햄버거 메뉴 포함
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthSession, getAuthSession } from '../../api/auth';

function Header({ onMenuToggle }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getAuthSession());

  useEffect(() => {
    function syncSession() {
      setSession(getAuthSession());
    }

    window.addEventListener('auth-session-changed', syncSession);
    return () =>
      window.removeEventListener('auth-session-changed', syncSession);
  }, []);

  function handleLogout() {
    clearAuthSession();
    navigate('/login');
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center h-full px-4">
        {/* 모바일 햄버거 */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden mr-3 p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="메뉴 열기"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* 로고 */}
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-tight">
              AI
            </span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white hidden sm:block">
            Enterprise AI Hub
          </span>
        </a>

        {/* 우측 여백 확보용 */}
        <div className="flex-1" />

        {session?.employee ? (
          <div className="flex items-center gap-2">
            <div className="hidden rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 sm:block">
              {session.employee.name}
              {session.employee.department
                ? ` · ${session.employee.department}`
                : ' · 승인 대기'}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-[36px] items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="inline-flex min-h-[36px] items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
