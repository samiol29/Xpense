import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { 
  Home, 
  Plus, 
  List, 
  BarChart3, 
  LogOut, 
  User,
  Moon,
  Sun,
  ChevronDown
} from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { currency, setCurrency, currencies, getCurrentCurrency } = useCurrency()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Add', href: '/add', icon: Plus },
    { name: 'Transactions', href: '/transactions', icon: List },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 dark:from-cyan-500/5 dark:via-transparent dark:to-purple-500/5 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent dark:from-cyan-500/10 dark:via-transparent dark:to-transparent pointer-events-none" />
      
      <div className="flex flex-col h-screen">
        {/* Top Header */}
        <header className="bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-surface-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500 dark:from-cyan-400 dark:to-purple-400">
                Xpense
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Currency Selector */}
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="appearance-none bg-gray-100 dark:bg-surface-700/50 hover:bg-gray-200 dark:hover:bg-surface-600/50 text-gray-900 dark:text-white px-3 py-2 pr-8 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-gray-400 pointer-events-none" />
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-gray-900 dark:text-white font-medium text-sm">{user?.name}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">{user?.email}</p>
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-surface-700/50 hover:bg-gray-200 dark:hover:bg-surface-600/50 transition-colors"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 pb-20">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-800/90 backdrop-blur-xl border-t border-gray-200 dark:border-surface-700/50 px-4 py-2">
          <div className="flex justify-around items-center max-w-md mx-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-lg shadow-cyan-500/10'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-surface-700/50'
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}