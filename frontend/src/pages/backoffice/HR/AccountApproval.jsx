import { useCallback, useEffect, useMemo, useState } from 'react';
import Breadcrumb from '../../../components/layout/Breadcrumb';
import {
  approveEmployee,
  getPendingEmployees,
  rejectEmployee,
} from '../../../api/auth';
import { CATEGORIES } from '../../../data/departments';

function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  );
}

function SuccessBanner({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
      {message}
    </div>
  );
}

export default function AccountApproval() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState('');
  const [rejectingId, setRejectingId] = useState('');
  const departmentOptions = useMemo(
    () =>
      CATEGORIES.flatMap((category) =>
        category.departments.map((department) => department.label),
      ),
    [],
  );

  const fetchPendingEmployees = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getPendingEmployees();
      setItems(data.items || []);
      setDrafts((prev) => {
        const next = {};
        for (const item of data.items || []) {
          next[item.employee_id] = prev[item.employee_id] || {
            department: '',
            teamNumber: '',
            positionType: '사원',
            customPosition: '',
          };
        }
        return next;
      });
    } catch (fetchError) {
      setError(fetchError.message || '승인 대기 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingEmployees();
  }, [fetchPendingEmployees]);

  const pendingCount = useMemo(() => items.length, [items]);

  function handleDraftChange(employeeId, field, value) {
    setDrafts((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value,
      },
    }));
  }

  async function handleApprove(employeeId) {
    const draft = drafts[employeeId] || {
      department: '',
      teamNumber: '',
      positionType: '사원',
      customPosition: '',
    };

    const resolvedPosition =
      draft.positionType === '기타'
        ? draft.customPosition.trim()
        : draft.positionType.trim();
    const resolvedDepartment = draft.department.trim();

    if (!draft.department.trim() || !resolvedPosition) {
      setError('부서와 직급을 입력한 뒤 승인해 주세요.');
      return;
    }

    setSavingId(employeeId);
    setError('');
    setSuccessMessage('');

    try {
      const result = await approveEmployee({
        employee_id: employeeId,
        department: resolvedDepartment,
        position: resolvedPosition,
      });

      setItems((prev) =>
        prev.filter((item) => item.employee_id !== employeeId),
      );
      setSuccessMessage(
        `${result.name || employeeId} 계정을 승인하고 ${result.department} / ${result.position}으로 배정했습니다.`,
      );
    } catch (approveError) {
      setError(approveError.message || '계정 승인 중 오류가 발생했습니다.');
    } finally {
      setSavingId('');
    }
  }

  async function handleReject(employeeId) {
    setRejectingId(employeeId);
    setError('');
    setSuccessMessage('');

    try {
      const result = await rejectEmployee(employeeId);
      setItems((prev) =>
        prev.filter((item) => item.employee_id !== employeeId),
      );
      setSuccessMessage(
        `${result.name || employeeId} 계정의 가입 요청을 거절했습니다.`,
      );
    } catch (rejectError) {
      setError(rejectError.message || '가입 거절 처리 중 오류가 발생했습니다.');
    } finally {
      setRejectingId('');
    }
  }

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '경영지원 및 관리', to: '/backoffice' },
          { label: '인사(HR)팀', to: '/backoffice/hr' },
          { label: '계정 승인 관리' },
        ]}
      />

      <div className="mt-4 space-y-6">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            HumanResources
          </span>
          <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            계정 승인 관리
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            회원가입한 사원의 승인 대기 계정을 검토하고 부서와 직급을
            배정합니다.
          </p>
          <div className="mt-4 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
            승인 대기 {pendingCount}명
          </div>
        </div>

        <ErrorBanner message={error} />
        <SuccessBanner message={successMessage} />

        <div className="rounded-xl border border-blue-200 bg-white p-6 dark:border-blue-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                승인 대기 목록
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                부서와 직급을 입력한 뒤 승인하면 즉시 로그인 계정으로
                활성화됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchPendingEmployees}
              className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
            >
              새로고침
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-gray-500">
              승인 대기 목록을 불러오는 중입니다...
            </div>
          ) : null}

          {!loading && items.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-400 dark:border-gray-700">
              현재 승인 대기 중인 계정이 없습니다.
            </div>
          ) : null}

          {!loading && items.length > 0 ? (
            <div className="mt-5 space-y-4">
              {items.map((item) => {
                const draft = drafts[item.employee_id] || {
                  department: '',
                  teamNumber: '',
                  positionType: '사원',
                  customPosition: '',
                };
                const resolvedPosition =
                  draft.positionType === '기타'
                    ? draft.customPosition.trim()
                    : draft.positionType.trim();

                const disabled =
                  savingId === item.employee_id ||
                  rejectingId === item.employee_id ||
                  !draft.department.trim() ||
                  !resolvedPosition;

                return (
                  <div
                    key={item.employee_id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/60"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </h3>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                            {item.employee_id}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          {item.email}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          연락처 {item.phone_number}
                          {item.birth_date
                            ? ` · 생년월일 ${item.birth_date}`
                            : ''}
                          {item.nickname ? ` · 닉네임 ${item.nickname}` : ''}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          가입일{' '}
                          {String(item.created_at)
                            .slice(0, 19)
                            .replace('T', ' ')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr_0.9fr] lg:items-end">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          배정 부서
                        </span>
                        <select
                          value={draft.department}
                          onChange={(event) =>
                            handleDraftChange(
                              item.employee_id,
                              'department',
                              event.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        >
                          <option value="">부서 선택</option>
                          {departmentOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      {/* 배정 팀 번호는 추후 다시 사용할 수 있도록 임시 비활성화 */}
                      {/*
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          배정 팀 번호
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={draft.teamNumber}
                          onChange={(event) =>
                            handleDraftChange(
                              item.employee_id,
                              'teamNumber',
                              event.target.value.replace(/\D/g, ''),
                            )
                          }
                          placeholder="예: 1"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                      </label>
                      */}

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          배정 직급
                        </span>
                        <select
                          value={draft.positionType}
                          onChange={(event) =>
                            handleDraftChange(
                              item.employee_id,
                              'positionType',
                              event.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        >
                          <option value="팀장">팀장</option>
                          <option value="사원">사원</option>
                          <option value="기타">기타(직접입력)</option>
                        </select>
                      </label>

                      {draft.positionType === '기타' ? (
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            직급 직접입력
                          </span>
                          <input
                            type="text"
                            value={draft.customPosition}
                            onChange={(event) =>
                              handleDraftChange(
                                item.employee_id,
                                'customPosition',
                                event.target.value,
                              )
                            }
                            placeholder="예: 대리"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                          />
                        </label>
                      ) : (
                        <div />
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(item.employee_id)}
                        disabled={disabled}
                        className="min-h-[44px] rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {savingId === item.employee_id
                          ? '승인 중...'
                          : '승인 완료'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(item.employee_id)}
                        disabled={
                          savingId === item.employee_id ||
                          rejectingId === item.employee_id
                        }
                        className="min-h-[44px] rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {rejectingId === item.employee_id
                          ? '거절 중...'
                          : '가입 거절'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
