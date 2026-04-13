import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Breadcrumb from '../../../components/layout/Breadcrumb';
import { CATEGORIES } from '../../../data/departments';
import { getEmployees, updateEmployeeDepartment } from '../../../api/auth';

const DEPARTMENT_OPTIONS = CATEGORIES.flatMap((category) =>
  category.departments.map((department) => department.label),
);

function getPositionPriority(position) {
  return String(position || '').includes('팀장') ? 0 : 1;
}

export default function HumanResources() {
  const [employees, setEmployees] = useState([]);
  const [departmentDrafts, setDepartmentDrafts] = useState({});
  const [changeReasonDrafts, setChangeReasonDrafts] = useState({});
  const [lastAppliedMessage, setLastAppliedMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [expandedDepartment, setExpandedDepartment] = useState('');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getEmployees();
      const items = data.items || [];
      setEmployees(items);
      setDepartmentDrafts(
        Object.fromEntries(
          items.map((employee) => [employee.employee_id, employee.department]),
        ),
      );
      setChangeReasonDrafts(
        Object.fromEntries(items.map((employee) => [employee.employee_id, ''])),
      );
    } catch (fetchError) {
      setError(fetchError.message || '사원 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const currentSummary = useMemo(() => {
    const summaryMap = employees.reduce((acc, employee) => {
      if (!acc[employee.department]) {
        acc[employee.department] = {
          count: 0,
          activeCount: 0,
          members: [],
        };
      }

      acc[employee.department].count += 1;
      if (employee.is_active) {
        acc[employee.department].activeCount += 1;
      }
      acc[employee.department].members.push(employee);
      return acc;
    }, {});

    return Object.entries(summaryMap)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([department, info]) => ({
        department,
        count: info.count,
        activeCount: info.activeCount,
        members: info.members.sort((a, b) => {
          const priorityDiff =
            getPositionPriority(a.position) - getPositionPriority(b.position);

          if (priorityDiff !== 0) return priorityDiff;
          return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
        }),
      }));
  }, [employees]);

  function handleDepartmentDraftChange(employeeId, nextDepartment) {
    setDepartmentDrafts((prev) => ({
      ...prev,
      [employeeId]: nextDepartment,
    }));
  }

  function handleChangeReasonDraftChange(employeeId, nextReason) {
    setChangeReasonDrafts((prev) => ({
      ...prev,
      [employeeId]: nextReason,
    }));
  }

  const handleEmployeeDepartmentChange = async (employeeId) => {
    const employee = employees.find((item) => item.employee_id === employeeId);
    if (!employee) return;

    const previousDepartment = employee.department;
    const nextDepartment = departmentDrafts[employeeId] || previousDepartment;
    const changeReason = (changeReasonDrafts[employeeId] || '').trim();

    if (nextDepartment === previousDepartment) {
      return;
    }

    if (!changeReason) {
      setError('변경 사유를 입력해 주세요.');
      return;
    }

    setUpdatingId(employeeId);
    setError('');
    setLastAppliedMessage('');

    try {
      const updated = await updateEmployeeDepartment(employeeId, {
        department: nextDepartment,
      });

      setEmployees((prev) =>
        prev.map((item) =>
          item.employee_id === employeeId
            ? {
                ...item,
                department: updated.department,
                position: updated.position,
              }
            : item,
        ),
      );
      setDepartmentDrafts((prev) => ({
        ...prev,
        [employeeId]: updated.department,
      }));
      setChangeReasonDrafts((prev) => ({
        ...prev,
        [employeeId]: '',
      }));

      setLastAppliedMessage(
        `${employee.name}님의 부서를 "${previousDepartment}"에서 "${updated.department}"으로 변경했습니다. 변경 사유: ${changeReason}`,
      );
    } catch (updateError) {
      setDepartmentDrafts((prev) => ({
        ...prev,
        [employeeId]: previousDepartment,
      }));
      setError(updateError.message || '부서 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdatingId('');
    }
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
              부서 분포
            </h2>
            <div className="mt-4 space-y-3">
              {currentSummary.map((item) => (
                <div
                  key={item.department}
                  className="rounded-lg bg-gray-50 dark:bg-gray-800/70"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDepartment((prev) =>
                        prev === item.department ? '' : item.department,
                      )
                    }
                    className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      {item.department}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        {item.count}명
                      </span>
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        {expandedDepartment === item.department ? (
                          <FaChevronUp />
                        ) : (
                          <FaChevronDown />
                        )}
                      </span>
                    </div>
                  </button>

                  {expandedDepartment === item.department ? (
                    <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                      <div className="space-y-2">
                        {item.members.map((member) => (
                          <div
                            key={member.employee_id}
                            className="grid gap-1 rounded-lg bg-white px-3 py-2 text-sm dark:bg-gray-900 sm:grid-cols-[minmax(120px,1fr)_88px_110px] sm:items-center sm:gap-6"
                          >
                            <span className="font-medium text-gray-900 dark:text-white">
                              {member.name}
                            </span>
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                              {member.position || '직급 미지정'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {member.employee_id}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
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
                데이터베이스의 승인 완료 사원 목록을 기준으로 부서를 선택한 뒤
                저장 버튼을 눌러 변경을 적용합니다.
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              총 {employees.length}명
            </span>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          ) : null}

          {lastAppliedMessage ? (
            <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
              {lastAppliedMessage}
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-gray-200 text-sm dark:divide-gray-800">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="w-[16%] px-4 py-3 font-medium">사번</th>
                  <th className="w-[16%] px-4 py-3 font-medium">이름</th>
                  <th className="w-[14%] px-4 py-3 font-medium">직급</th>
                  <th className="w-[22%] px-4 py-3 font-medium">현재 부서</th>
                  <th className="w-[32%] px-4 py-3 font-medium">
                    개별 부서 변경
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      사원 데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : null}

                {!loading && employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      표시할 승인 완료 사원 데이터가 없습니다.
                    </td>
                  </tr>
                ) : null}

                {!loading &&
                  employees.map((employee) => {
                    const hasDepartmentChanged =
                      (departmentDrafts[employee.employee_id] ??
                        employee.department) !== employee.department;

                    return (
                      <Fragment key={employee.employee_id}>
                        <tr key={employee.employee_id}>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {employee.employee_id}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {employee.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {employee.position || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {employee.department}
                          </td>
                          <td className="px-4 py-3">
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                              <select
                                value={
                                  departmentDrafts[employee.employee_id] ??
                                  employee.department
                                }
                                onChange={(e) =>
                                  handleDepartmentDraftChange(
                                    employee.employee_id,
                                    e.target.value,
                                  )
                                }
                                disabled={updatingId === employee.employee_id}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                              >
                                {DEPARTMENT_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() =>
                                  handleEmployeeDepartmentChange(
                                    employee.employee_id,
                                  )
                                }
                                disabled={
                                  updatingId === employee.employee_id ||
                                  !hasDepartmentChanged
                                }
                                className="min-w-[56px] rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                              >
                                {updatingId === employee.employee_id
                                  ? '. . .'
                                  : '저장'}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {hasDepartmentChanged ? (
                          <tr key={`${employee.employee_id}-reason`}>
                            <td colSpan={5} className="px-4 pb-3 pt-0">
                              <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                  변경 사유
                                </label>
                                <textarea
                                  rows={2}
                                  value={
                                    changeReasonDrafts[employee.employee_id] ??
                                    ''
                                  }
                                  onChange={(e) =>
                                    handleChangeReasonDraftChange(
                                      employee.employee_id,
                                      e.target.value,
                                    )
                                  }
                                  disabled={updatingId === employee.employee_id}
                                  className="block w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                  placeholder="예: 상반기 조직 개편"
                                />
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
