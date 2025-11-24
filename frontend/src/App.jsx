import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import AddTransaction from './pages/AddTransaction'
import Reports from './pages/Reports'
import Budgets from './pages/Budgets'
import Analytics from './pages/Analytics'
import RecurringTransactions from './pages/RecurringTransactions'
import Subscriptions from './pages/Subscriptions'
import Groups from './pages/Groups'
import Layout from './components/Layout'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="add" element={<AddTransaction />} />
        <Route path="add-transaction" element={<AddTransaction />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="recurring" element={<RecurringTransactions />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="groups" element={<Groups />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}

function App() {
  return <AppRoutes />
}

export default App
