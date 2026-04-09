// 앱 루트 — React Router 라우팅 구조 정의
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import CategoryPage from './pages/CategoryPage'

// Back-Office
import HRPage       from './pages/backoffice/HRPage'
import FinancePage  from './pages/backoffice/FinancePage'
import LegalPage    from './pages/backoffice/LegalPage'
import AdminPage    from './pages/backoffice/AdminPage'

// Front-Office
import StrategyPage  from './pages/frontoffice/StrategyPage'
import SalesPage     from './pages/frontoffice/SalesPage'
import MarketingPage from './pages/frontoffice/MarketingPage'
import CSPage        from './pages/frontoffice/CSPage'

// R&D / Product
import DevPage    from './pages/rnd/DevPage'
import QAPage     from './pages/rnd/QAPage'
import DesignPage from './pages/rnd/DesignPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          {/* 카테고리 페이지 */}
          <Route path=":categoryId" element={<CategoryPage />} />

          {/* Back-Office 부서 */}
          <Route path="backoffice/hr"      element={<HRPage />} />
          <Route path="backoffice/finance" element={<FinancePage />} />
          <Route path="backoffice/legal"   element={<LegalPage />} />
          <Route path="backoffice/admin"   element={<AdminPage />} />

          {/* Front-Office 부서 */}
          <Route path="frontoffice/strategy"  element={<StrategyPage />} />
          <Route path="frontoffice/sales"     element={<SalesPage />} />
          <Route path="frontoffice/marketing" element={<MarketingPage />} />
          <Route path="frontoffice/cs"        element={<CSPage />} />

          {/* R&D / Product 부서 */}
          <Route path="rnd/dev"    element={<DevPage />} />
          <Route path="rnd/qa"     element={<QAPage />} />
          <Route path="rnd/design" element={<DesignPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
