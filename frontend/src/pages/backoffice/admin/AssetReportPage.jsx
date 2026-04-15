// 자산 실사 보고서 — 자산 현황 입력 → AI 노후 분석 + 교체 우선순위 판단 → DOCX 생성
import Breadcrumb from '../../../components/layout/Breadcrumb'

export default function AssetReportPage() {
  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '경영지원 및 관리', to: '/backoffice' },
          { label: '총무/구매팀', to: '/backoffice/admin' },
          { label: '자산 실사 보고서' },
        ]}
      />
      {/* TODO: 기능 구현 예정 */}
      <div className="mt-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-8 text-center">
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">자산 실사 보고서 구현 예정</p>
      </div>
    </div>
  )
}
