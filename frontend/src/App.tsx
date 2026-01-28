import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Desenvolvimentos from './pages/Desenvolvimentos'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/desenvolvimentos" element={<Desenvolvimentos />} />
        </Routes>
      </MainLayout>
    </Router>
  )
}

export default App
