// 사이드바 컴포넌트 — 카테고리 & 부서 네비게이션
import { NavLink, useParams } from 'react-router-dom'
import { CATEGORIES, COLOR_THEMES } from '../../data/departments'

function Sidebar({ isOpen, onClose }) {
  const { categoryId, deptId } = useParams()

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 본체 */}
      <aside
        className={[
          'fixed top-14 left-0 bottom-0 z-30 w-64 bg-white dark:bg-gray-900',
          'border-r border-gray-200 dark:border-gray-800 overflow-y-auto',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <nav className="p-3 space-y-1">
          {/* 홈 링크 */}
          <NavLink
            to="/"
            end
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white',
              ].join(' ')
            }
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            대시보드
          </NavLink>

          <div className="pt-2">
            {CATEGORIES.map(cat => {
              const theme = COLOR_THEMES[cat.color]
              const isCatActive = categoryId === cat.id

              return (
                <div key={cat.id} className="mb-1">
                  {/* 카테고리 헤더 */}
                  <NavLink
                    to={`/${cat.id}`}
                    onClick={onClose}
                    className={[
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors w-full',
                      isCatActive && !deptId
                        ? `${theme.badge} `
                        : `text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60`,
                    ].join(' ')}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                    <span className="truncate">{cat.sublabel}</span>
                  </NavLink>

                  {/* 부서 목록 */}
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {cat.departments.map(dept => (
                      <NavLink
                        key={dept.id}
                        to={`/${cat.id}/${dept.id}`}
                        onClick={onClose}
                        className={({ isActive }) =>
                          [
                            'block px-3 py-2 rounded-r-lg text-sm transition-colors truncate min-h-[44px] flex items-center',
                            isActive
                              ? theme.sidebarActive
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white',
                          ].join(' ')
                        }
                      >
                        {dept.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
