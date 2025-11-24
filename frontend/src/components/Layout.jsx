import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useCurrency } from '../contexts/CurrencyContext'
import {
  LayoutDashboard,
  Receipt,
  Layers,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  Search,
  Bell
} from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { currency, setCurrency, currencies } = useCurrency()
  const location = useLocation()

  const sidebarNav = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'Categories', href: '/reports', icon: Layers },
    { name: 'Settings', href: '/reports', icon: Settings, disabled: true },
  ]

  const mobileNav = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'Reports', href: '/reports', icon: Layers },
  ]

  const initial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),transparent_45%),_radial-gradient(circle_at_bottom,_rgba(45,212,191,0.08),transparent_45%),_linear-gradient(135deg,#0f2027,#203a43,#2c5364)] text-gray-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col border-r border-white/10 bg-white/5 backdrop-blur-2xl">
          <div className="px-8 pt-8 pb-6">
            <div className="text-sm uppercase tracking-[0.3em] text-emerald-300">Xpense</div>
            <p className="mt-3 text-2xl font-semibold">Control Center</p>
          </div>
          <nav className="flex-1 px-6 space-y-2">
            {sidebarNav.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              return item.disabled ? (
                <div
                  key={item.name}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/30 border border-white/5 cursor-not-allowed"
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </div>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-neon'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="px-6 py-6 border-t border-white/10">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1 w-full lg:ml-72">
          <div className="px-4 py-4 sm:px-8 sm:py-6">
            {/* Top bar */}
            <header className="glass-card p-5 sm:p-6 mb-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex-1 flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-2 border border-white/10">
                  <Search className="h-5 w-5 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search payment"
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-4">
                  {/* Currency */}
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="appearance-none bg-white/5 border border-white/10 rounded-2xl pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                    >
                      {currencies.map((curr) => (
                        <option key={curr.code} value={curr.code} className="bg-slate-900 text-white">
                          {curr.symbol} {curr.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                  </div>
                  {/* Theme */}
                  <button
                    onClick={toggleTheme}
                    className="rounded-2xl border border-white/10 p-3 hover:bg-white/10 transition"
                  >
                    {isDark ? <Sun className="h-5 w-5 text-yellow-300" /> : <Moon className="h-5 w-5 text-white/70" />}
                  </button>
                  {/* Notifications */}
                  <button className="rounded-2xl border border-white/10 p-3 hover:bg-white/10 transition relative">
                    <Bell className="h-5 w-5 text-white/70" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400"></span>
                  </button>
                  {/* Profile */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-white/60">Hi,</p>
                      <p className="text-sm font-semibold text-white">{user?.name || 'Explorer'}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 text-slate-900 font-bold flex items-center justify-center">
                      {initial}
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main className="pb-24">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass-card px-4 py-3 flex items-center justify-between">
        {mobileNav.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center text-xs font-medium ${
                isActive ? 'text-emerald-300' : 'text-white/50'
              }`}
            >
              <item.icon className={`h-5 w-5 mb-1 ${isActive ? 'text-emerald-300' : 'text-white/50'}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}