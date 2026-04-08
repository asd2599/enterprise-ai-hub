// 부서 전용 페이지 — 현재 빈 페이지 (추후 AI 도구 추가 예정)
import { useParams, Navigate } from 'react-router-dom'
import { CATEGORY_MAP, DEPT_MAP, COLOR_THEMES } from '../data/departments'
import Breadcrumb from '../components/layout/Breadcrumb'

function DepartmentPage() {
  const { categoryId, deptId } = useParams()
  const cat = CATEGORY_MAP[categoryId]
  const dept = DEPT_MAP[deptId]

  // 잘못된 경로 접근 시 리다이렉트
  if (!cat || !dept || dept.categoryId !== categoryId) {
    return <Navigate to="/" replace />
  }

  const theme = COLOR_THEMES[cat.color]

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: cat.label, to: `/${cat.id}` },
          { label: dept.label },
        ]}
      />

      {/* 부서 헤더 */}
      <div className="mt-4 mb-7">
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${theme.iconBg}`}>
            {dept.label.slice(0, 2)}
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${theme.text}`}>
              {cat.sublabel}
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {dept.label}
            </h1>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-13">
          {dept.description}
        </p>
      </div>

      {/* 준비 중 안내 */}
      <div className={`rounded-xl border-2 border-dashed p-10 text-center ${theme.cardBorder}`}>
        <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${theme.badge}`}>
          <svg className={`w-7 h-7 ${theme.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          AI 도구 준비 중
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          {dept.label}을 위한 AI 자동화 도구가 곧 추가될 예정입니다.
        </p>
        <span className={`inline-block mt-4 text-xs px-3 py-1.5 rounded-full font-medium ${theme.badge}`}>
          Coming Soon
        </span>
      </div>
    </div>
  )
}

export default DepartmentPage
