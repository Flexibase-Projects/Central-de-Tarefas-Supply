import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { AuthProvider } from './contexts/AuthContext'
import { AuthGuard } from './components/auth/AuthGuard'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

const insightFallback = <Navigate to="/desenvolvimentos" replace />
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Login'
import { FeatureFlagsProvider, useFeatureFlags } from './contexts/FeatureFlagsContext'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Desenvolvimentos = lazy(() => import('./pages/Desenvolvimentos'))
const Atividades = lazy(() => import('./pages/Atividades'))
const ConfiguracoesLayout = lazy(() => import('./pages/ConfiguracoesLayout'))
const ConfiguracoesHub = lazy(() => import('./pages/ConfiguracoesHub'))
const Administracao = lazy(() => import('./pages/Administracao'))
const Mapa = lazy(() => import('./pages/Mapa'))
const Prioridades = lazy(() => import('./pages/Prioridades'))
const Indicadores = lazy(() => import('./pages/Indicadores'))
const CanvaEquipe = lazy(() => import('./pages/CanvaEquipe'))
const Perfil = lazy(() => import('./pages/Perfil'))
const Conquistas = lazy(() => import('./pages/Conquistas'))
const Niveis = lazy(() => import('./pages/Niveis'))
const Tutorial = lazy(() => import('./pages/Tutorial'))
const CustosDepartamento = lazy(() => import('./pages/CustosDepartamento'))
const Organograma = lazy(() => import('./pages/Organograma'))

function AppRouteFallback() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '45vh',
      }}
      aria-busy="true"
      aria-label="Carregando página"
    >
      <CircularProgress size={36} />
    </Box>
  )
}

function AppRoutes() {
  const { gamificationEnabled } = useFeatureFlags()

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <MainLayout>
                <Suspense fallback={<AppRouteFallback />}>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute permission="access_insight" fallback={insightFallback}>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/mapa"
                      element={
                        <ProtectedRoute permission="access_insight" fallback={insightFallback}>
                          <Mapa />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/prioridades"
                      element={
                        <ProtectedRoute permission="access_insight" fallback={insightFallback}>
                          <Prioridades />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/desenvolvimentos" element={<Desenvolvimentos />} />
                    <Route path="/atividades" element={<Atividades />} />
                    <Route path="/canva-equipe" element={<CanvaEquipe />} />
                    <Route
                      path="/indicadores"
                      element={
                        <ProtectedRoute permission="access_insight" fallback={insightFallback}>
                          <Indicadores />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/perfil" element={<Perfil />} />
                    {gamificationEnabled ? (
                      <>
                        <Route path="/conquistas" element={<Conquistas />} />
                        <Route path="/niveis" element={<Niveis />} />
                        <Route path="/tutorial" element={<Tutorial />} />
                      </>
                    ) : (
                      <>
                        <Route path="/conquistas" element={<Navigate to="/perfil" replace />} />
                        <Route path="/niveis" element={<Navigate to="/perfil" replace />} />
                        <Route path="/tutorial" element={<Navigate to="/perfil" replace />} />
                      </>
                    )}
                    <Route path="/organograma" element={<ProtectedRoute role="admin"><Organograma /></ProtectedRoute>} />
                    <Route path="/custos-departamento" element={<ProtectedRoute role="admin"><CustosDepartamento /></ProtectedRoute>} />
                    <Route path="/configuracoes/organograma" element={<Navigate to="/organograma" replace />} />
                    <Route
                      path="/configuracoes/custos-departamento"
                      element={<Navigate to="/custos-departamento" replace />}
                    />
                    <Route
                      path="/configuracoes"
                      element={<ProtectedRoute role="admin"><ConfiguracoesLayout /></ProtectedRoute>}
                    >
                      <Route index element={<ConfiguracoesHub />} />
                      <Route path="administracao" element={<Administracao />} />
                    </Route>
                    <Route path="/admin" element={<Navigate to="/configuracoes/administracao" replace />} />
                  </Routes>
                </Suspense>
              </MainLayout>
            </AuthGuard>
          }
        />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <FeatureFlagsProvider>
        <AppRoutes />
      </FeatureFlagsProvider>
    </AuthProvider>
  )
}

export default App
