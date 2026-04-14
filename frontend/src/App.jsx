// 앱 루트 — React Router 라우팅 구조 정의
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getAuthSession } from './api/auth';

// 재무팀 전용 라우터 가드 — department가 '재무/회계팀' 또는 '재무팀'이거나 position이 '대표이사'인 경우만 허용
function TreasuryGuard({ children }) {
  const session = getAuthSession();
  const employee = session?.employee;
  const hasAccess =
    employee?.department === '재무팀' ||
    employee?.department === '재무/회계팀' ||
    employee?.position === '대표이사';
  return hasAccess ? children : <Navigate to="/backoffice/finance" replace />;
}
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import CategoryPage from './pages/CategoryPage';
import Login from './pages/web_login/Login';
import Register from './pages/web_login/Register';
import Setting from './pages/setting/Setting';

// Back-Office
import HRPage from './pages/backoffice/HRPage';
import FinancePage from './pages/backoffice/FinancePage';
import LegalPage from './pages/backoffice/LegalPage';
import AdminPage from './pages/backoffice/AdminPage';
import HireCreate from './pages/backoffice/HR/HireCreate';
import HireRequest from './pages/backoffice/HR/HireRequest';
import QGenerate from './pages/backoffice/HR/QGenerate';
import RegulationChat from './pages/backoffice/HR/RegulationChat';
import UploadRegulation from './pages/backoffice/HR/UploadRegulation';
import Pay from './pages/backoffice/HR/Pay';
import HumanResources from './pages/backoffice/HR/HumanResources';
import AccountApproval from './pages/backoffice/HR/AccountApproval';
import Match from './pages/backoffice/HR/Match';
import Evaluate from './pages/backoffice/HR/Evaluate';
import AutoManual from './pages/backoffice/HR/AutoManual';

// 재무본부 세부 직무
import AccountantPage from './pages/backoffice/finance/AccountantPage';
import TreasuryPage from './pages/backoffice/finance/TreasuryPage';
import AuditPage from './pages/backoffice/finance/AuditPage';

// Front-Office
import StrategyPage from "./pages/frontoffice/StrategyPage";
import SalesPage from "./pages/frontoffice/SalesPage";
import MarketingPage from "./pages/frontoffice/MarketingPage";
import CopywritingPage from "./pages/frontoffice/Marketing/CopywritingPage";
import SnsPage from "./pages/frontoffice/Marketing/SnsPage";
import PressPage from "./pages/frontoffice/Marketing/PressPage";
import ProposalPage from "./pages/frontoffice/sales/ProposalPage";
import PerformancePage from "./pages/frontoffice/sales/PerformancePage";
import MeetingPage from "./pages/frontoffice/sales/MeetingPage";
import CSPage from "./pages/frontoffice/CSPage";
import ResponseDraftPage from "./pages/frontoffice/CS/ResponseDraftPage";
import FaqPage from "./pages/frontoffice/CS/FaqPage";
import VocReportPage from "./pages/frontoffice/CS/VocReportPage";

// R&D / Product
import DevPage from './pages/rnd/DevPage';
import QAPage from './pages/rnd/QAPage';
import DesignPage from './pages/rnd/DesignPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="setting" element={<Setting />} />

          {/* 카테고리 페이지 */}
          <Route path=":categoryId" element={<CategoryPage />} />

          {/* Back-Office 부서 */}
          <Route path="backoffice/hr" element={<HRPage />} />
          <Route path="backoffice/hr/hire-create" element={<HireCreate />} />
          <Route path="backoffice/hr/hire-request" element={<HireRequest />} />
          <Route path="backoffice/hr/q-generate" element={<QGenerate />} />
          <Route
            path="backoffice/hr/regulation-chat"
            element={<RegulationChat />}
          />
          <Route
            path="backoffice/hr/upload-regulation"
            element={<UploadRegulation />}
          />
          <Route path="backoffice/hr/pay" element={<Pay />} />
          <Route
            path="backoffice/hr/humanresources"
            element={<HumanResources />}
          />
          <Route
            path="backoffice/hr/account-approval"
            element={<AccountApproval />}
          />
          <Route path="backoffice/hr/match" element={<Match />} />
          <Route path="backoffice/hr/evaluate" element={<Evaluate />} />
          <Route path="backoffice/hr/auto-manual" element={<AutoManual />} />
          <Route path="backoffice/legal" element={<LegalPage />} />
          <Route path="backoffice/admin" element={<AdminPage />} />

          {/* 재무본부 — 서브 대시보드 + 세부 직무 */}
          <Route path="backoffice/finance" element={<FinancePage />} />
          <Route
            path="backoffice/finance/accounting"
            element={<AccountantPage />}
          />
          <Route
            path="backoffice/finance/treasury"
            element={
              <TreasuryGuard>
                <TreasuryPage />
              </TreasuryGuard>
            }
          />
          <Route path="backoffice/finance/audit" element={<AuditPage />} />

          {/* Front-Office 부서 */}
          <Route path="frontoffice/strategy" element={<StrategyPage />} />
          <Route path="frontoffice/sales" element={<SalesPage />} />
          <Route path="frontoffice/sales/proposal"    element={<ProposalPage />} />
          <Route path="frontoffice/sales/performance" element={<PerformancePage />} />
          <Route path="frontoffice/sales/meeting"     element={<MeetingPage />} />
          <Route path="frontoffice/marketing" element={<MarketingPage />} />
          <Route
            path="frontoffice/marketing/copywriting"
            element={<CopywritingPage />}
          />
          <Route path="frontoffice/marketing/sns" element={<SnsPage />} />
          <Route path="frontoffice/marketing/press" element={<PressPage />} />
          <Route path="frontoffice/cs" element={<CSPage />} />
          <Route
            path="frontoffice/cs/response"
            element={<ResponseDraftPage />}
          />
          <Route path="frontoffice/cs/faq" element={<FaqPage />} />
          <Route path="frontoffice/cs/voc" element={<VocReportPage />} />
          {/* R&D / Product 부서 */}
          <Route path="rnd/dev" element={<DevPage />} />
          <Route path="rnd/qa" element={<QAPage />} />
          <Route path="rnd/design" element={<DesignPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
