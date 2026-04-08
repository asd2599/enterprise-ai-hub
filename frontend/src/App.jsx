import './App.css'

// 메인 앱 컴포넌트 - 엔터프라이즈 AI 허브 진입점
function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Enterprise AI Hub
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">HR</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">마케팅</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">IT</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            업무 자동화 AI 포털
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            부서별 AI 도구를 통해 업무 효율을 높이세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { dept: 'HR', label: '인사팀', desc: '채용 공고 생성 · 면접 질문 자동화', color: 'blue' },
            { dept: 'MK', label: '마케팅팀', desc: '카피라이팅 · 콘텐츠 생성', color: 'purple' },
            { dept: 'IT', label: 'IT팀', desc: '코드 리뷰 · 기술 문서 작성', color: 'green' },
          ].map((item) => (
            <div
              key={item.dept}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-blue-100 dark:bg-blue-900">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                  {item.dept}
                </span>
              </div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-2">{item.label}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
