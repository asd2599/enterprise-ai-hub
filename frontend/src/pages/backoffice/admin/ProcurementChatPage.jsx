// 구매 정책 챗봇 — 사내 구매 규정·조달 기준 문서 기반 RAG Q&A
import Breadcrumb from '../../../components/layout/Breadcrumb'

export default function ProcurementChatPage() {
  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '경영지원 및 관리', to: '/backoffice' },
          { label: '총무/구매팀', to: '/backoffice/admin' },
          { label: '구매 정책 챗봇' },
        ]}
      />
      {/* TODO: 기능 구현 예정 */}
      <div className="mt-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-8 text-center">
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">구매 정책 챗봇 구현 예정</p>
      </div>
    </div>
  )
}
