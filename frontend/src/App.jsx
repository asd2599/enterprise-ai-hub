// 앱 루트 — React Router 라우팅 구조 정의
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import CategoryPage from './pages/CategoryPage'
import DepartmentPage from './pages/DepartmentPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path=":categoryId" element={<CategoryPage />} />
          <Route path=":categoryId/:deptId" element={<DepartmentPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
