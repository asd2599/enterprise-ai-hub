// 견적서 비교 분석 — 견적서 이미지 여러 장 업로드 → AI 가격·납기·조건 추출 후 비교표 생성
import Breadcrumb from '../../../components/layout/Breadcrumb'

export default function QuoteComparePage() {
  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '경영지원 및 관리', to: '/backoffice' },
          { label: '총무/구매팀', to: '/backoffice/admin' },
          { label: '견적서 비교 분석' },
        ]}
      />
      {/* TODO: 기능 구현 예정 */}
      <div className="mt-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-8 text-center">
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">견적서 비교 분석 구현 예정</p>
      </div>
    </div>
  )
}
