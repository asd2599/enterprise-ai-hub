import { useMemo, useState } from 'react';
import Breadcrumb from '../../../components/layout/Breadcrumb';

const INITIAL_EMPLOYEES = [
  {
    id: 1,
    name: '김민지',
    department: '인사(HR)팀',
    team: '채용팀',
    role: '팀장',
  },
  {
    id: 2,
    name: '이준호',
    department: '인사(HR)팀',
    team: '평가보상팀',
    role: '사원',
  },
  {
    id: 3,
    name: '박서연',
    department: '전략/기획팀',
    team: '사업기획팀',
    role: '팀장',
  },
  {
    id: 4,
    name: '정우성',
    department: '영업/영업관리팀',
    team: '영업1팀',
    role: '팀장',
  },
  {
    id: 5,
    name: '최유진',
    department: '영업/영업관리팀',
    team: '영업2팀',
    role: '사원',
  },
  {
    id: 6,
    name: '한도윤',
    department: 'CS/고객지원팀',
    team: '고객성공팀',
    role: '사원',
  },
  {
    id: 7,
    name: '오하늘',
    department: '개발/IT운영팀',
    team: '플랫폼팀',
    role: '팀장',
  },
  {
    id: 8,
    name: '윤지수',
    department: '개발/IT운영팀',
    team: '서비스개발팀',
    role: '사원',
  },
  {
    id: 9,
    name: '임수아',
    department: '디자인/UX팀',
    team: '프로덕트디자인팀',
    role: '사원',
  },
];

const DEPARTMENT_OPTIONS = [
  '인사(HR)팀',
  '재무/회계팀',
  '법무/컴플라이언스팀',
  '총무/구매팀',
  '전략/기획팀',
  '영업/영업관리팀',
  '마케팅/PR팀',
  'CS/고객지원팀',
  '개발/IT운영팀',
  'QA/품질관리팀',
  '디자인/UX팀',
];

const DEPARTMENT_TEAM_OPTIONS = {
  '인사(HR)팀': ['채용팀', '평가보상팀', '인사운영팀'],
  '재무/회계팀': ['회계팀', '자금팀'],
  '법무/컴플라이언스팀': ['법무팀', '컴플라이언스팀'],
  '총무/구매팀': ['총무팀', '구매팀'],
  '전략/기획팀': ['사업기획팀', '전략기획팀'],
  '영업/영업관리팀': ['영업1팀', '영업2팀', '영업관리팀'],
  '마케팅/PR팀': ['브랜드마케팅팀', 'PR팀'],
  'CS/고객지원팀': ['고객성공팀', 'VOC운영팀'],
  '개발/IT운영팀': ['플랫폼팀', '서비스개발팀', 'IT운영팀'],
  'QA/품질관리팀': ['QA팀', '품질관리팀'],
  '디자인/UX팀': ['프로덕트디자인팀', 'UX리서치팀'],
};

function getDefaultTeam(department) {
  return DEPARTMENT_TEAM_OPTIONS[department]?.[0] ?? '운영팀';
}

function formatTeamLabel(team) {
  if (!team) return '';
  return /\d+$/.test(team) ? team : `${team}1`;
}

export default function HumanResources() {
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [teamTargetDepartment, setTeamTargetDepartment] = useState('인사(HR)팀');
  const [changeReason, setChangeReason] = useState('2026년 상반기 조직 개편');
  const [lastAppliedMessage, setLastAppliedMessage] = useState('');

  const currentSummary = useMemo(() => {
    const summaryMap = employees.reduce((acc, employee) => {
      if (!acc[employee.department]) {
        acc[employee.department] = {
          count: 0,
          teams: new Set(),
        };
      }

      acc[employee.department].count += 1;
      acc[employee.department].teams.add(employee.team);
      return acc;
    }, {});

    return Object.entries(summaryMap)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([department, info]) => ({
        department,
        count: info.count,
        teamCount: info.teams.size,
      }));
  }, [employees]);

  const teamGroups = useMemo(() => {
    const groupedTeams = employees.reduce((acc, employee) => {
      const key = `${employee.department}::${employee.team}`;

      if (!acc[key]) {
        acc[key] = {
          key,
          department: employee.department,
          team: employee.team,
          count: 0,
        };
      }

      acc[key].count += 1;
      return acc;
    }, {});

    return Object.values(groupedTeams).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.team.localeCompare(b.team, 'ko');
    });
  }, [employees]);

  const handleEmployeeDepartmentChange = (employeeId, nextDepartment) => {
    const employee = employees.find((item) => item.id === employeeId);

    setEmployees((prev) =>
      prev.map((item) =>
        item.id === employeeId
          ? {
              ...item,
              department: nextDepartment,
              team: getDefaultTeam(nextDepartment),
            }
          : item,
      ),
    );

    if (employee) {
      setLastAppliedMessage(
        `${employee.name}님의 부서를 "${nextDepartment}"으로 변경했습니다.`,
      );
    }
  };
 
  const handleTeamApply = (selectedTeam) => {
    const nextTeam = getDefaultTeam(teamTargetDepartment);

    setEmployees((prev) =>
      prev.map((employee) =>
        employee.department === selectedTeam.department &&
        employee.team === selectedTeam.team
          ? {
              ...employee,
              department: teamTargetDepartment,
              team: nextTeam,
            }
          : employee,
      ),
    );

    setLastAppliedMessage(
      `"${formatTeamLabel(selectedTeam.team)}" 소속 ${selectedTeam.count}명의 부서를 "${teamTargetDepartment}"으로 변경했습니다.`,
    );
  };

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '경영지원 및 관리', to: '/backoffice' },
          { label: '인사(HR)팀', to: '/backoffice/hr' },
          { label: '전체 인원 부서 변경' },
        ]}
      />

      <div className="mt-4 space-y-6">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            HumanResources
          </span>
          <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            전체 인원 부서 변경
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            조직 개편, 프로젝트 전환, 임시 배치 등에 맞춰 전체 임직원의 소속
            부서를 한 번에 변경합니다.
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-blue-200 bg-white p-6 dark:border-blue-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              현재 부서 분포
            </h2>
            <div className="mt-4 space-y-3">
              {currentSummary.map((item) => (
                <div
                  key={item.department}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/70"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {item.department}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      {item.teamCount}팀
                    </span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      {item.count}명
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-white p-6 dark:border-blue-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                전체 인원 미리보기
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                이 표에서 개별 변경을 직접 적용하거나 팀명을 눌러 팀 전체 부서를 변경할 수 있습니다.
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              총 {employees.length}명
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                팀 클릭 시 변경될 부서
              </span>
              <select
                value={teamTargetDepartment}
                onChange={(e) => setTeamTargetDepartment(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                {DEPARTMENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                대상 인원 {employees.length}명
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                팀 클릭 변경 지원
              </span>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              변경 사유
            </span>
            <textarea
              rows={3}
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              placeholder="예: 상반기 조직 개편에 따른 부서 재배치"
            />
          </label>

          {lastAppliedMessage ? (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
              {lastAppliedMessage}
              {changeReason ? ` 변경 사유: ${changeReason}` : ''}
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">팀</th>
                  <th className="px-4 py-3 font-medium">직무</th>
                  <th className="px-4 py-3 font-medium">현재 부서</th>
                  <th className="px-4 py-3 font-medium">개별 부서 변경</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {employee.name}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleTeamApply({
                            key: `${employee.department}::${employee.team}`,
                            department: employee.department,
                            team: employee.team,
                            count: teamGroups.find(
                              (team) =>
                                team.department === employee.department &&
                                team.team === employee.team,
                            )?.count ?? 1,
                          })
                        }
                        className="text-sm text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                      >
                        {formatTeamLabel(employee.team)}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {employee.role}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {employee.department}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={employee.department}
                        onChange={(e) =>
                          handleEmployeeDepartmentChange(employee.id, e.target.value)
                        }
                        className="min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                      >
                        {DEPARTMENT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
