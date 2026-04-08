// 공통 헤더 컴포넌트 — 로고, 모바일 햄버거 메뉴 포함
function Header({ onMenuToggle }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center h-full px-4">
        {/* 모바일 햄버거 */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden mr-3 p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="메뉴 열기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 로고 */}
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-tight">AI</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white hidden sm:block">
            Enterprise AI Hub
          </span>
        </a>

        {/* 우측 여백 확보용 */}
        <div className="flex-1" />

        {/* 뱃지 */}
        <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full font-medium border border-blue-100 dark:border-blue-800">
          Beta
        </span>
      </div>
    </header>
  )
}

export default Header
