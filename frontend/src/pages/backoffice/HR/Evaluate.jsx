import Breadcrumb from '../../../components/layout/Breadcrumb';

export default function Evaluate() {
  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '경영지원 및 관리', to: '/backoffice' },
          { label: '인사(HR)팀', to: '/backoffice/hr' },
          { label: '인사 평가 보고서 작성' },
        ]}
      />
      <div className="mt-4 rounded-xl border border-blue-200 bg-white p-6 dark:border-blue-800 dark:bg-gray-900">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          인사 평가 보고서 작성
        </h1>
      </div>
    </div>
  );
}
