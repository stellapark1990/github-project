import { Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Home } from './pages/Home'
import { Archive } from './pages/Archive'
import { RunDetail } from './pages/RunDetail'

export default function App() {
  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/run/:id" element={<RunDetail />} />
        </Routes>
      </main>
    </div>
  )
}
