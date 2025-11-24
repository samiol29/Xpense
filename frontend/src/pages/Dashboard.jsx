import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useCurrency } from '../contexts/CurrencyContext'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'

export default function Dashboard() {
  const { formatAmount, convertAmount, toBaseAmount, currency, currentCurrency } = useCurrency()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [budget, setBudget] = useState(0)
  const [spent, setSpent] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [percent, setPercent] = useState(0)
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [budgetError, setBudgetError] = useState('')
  const [budgetInput, setBudgetInput] = useState('')
  const [isBudgetFocused, setIsBudgetFocused] = useState(false)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([loadTransactions(), loadBudget()])
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (isBudgetFocused) return
    const converted = convertAmount(budget)
    if (typeof converted === 'number' && !Number.isNaN(converted)) {
      setBudgetInput(converted.toFixed(2))
    } else {
      setBudgetInput('')
    }
  }, [budget, convertAmount, currency, isBudgetFocused])

  const loadTransactions = async () => {
    try {
      const res = await axios.get('/api/transactions')
      setTransactions(res.data)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    }
  }

  const loadBudget = async () => {
    try {
      const res = await axios.get('/api/budget')
      setBudget(res.data.monthlyBudget)
      setSpent(res.data.spent)
      setRemaining(res.data.remaining)
      setPercent(res.data.percent)
    } catch (err) {
      console.error('Failed to fetch budget:', err)
    }
  }

  const updateBudget = async (baseBudgetValue) => {
    try {
      setBudgetLoading(true)
      setBudgetError('')
      await axios.put('/api/budget', { monthlyBudget: baseBudgetValue })
      await loadBudget()
    } catch (err) {
      setBudgetError(err.response?.data?.message || 'Failed to update budget')
    } finally {
      setBudgetLoading(false)
    }
  }

  const handleBudgetInputChange = (e) => {
    const value = e.target.value
    if (value === '' || /^\d*(\.\d{0,2})?$/.test(value)) {
      setBudgetInput(value)
      if (budgetError) setBudgetError('')
    }
  }

  const handleBudgetSave = () => {
    const numeric = parseFloat(budgetInput)
    if (Number.isNaN(numeric)) {
      setBudgetError('Please enter a valid amount')
      return
    }
    if (numeric < 0) {
      setBudgetError('Budget cannot be negative')
      return
    }
    const baseValue = toBaseAmount(numeric)
    updateBudget(baseValue)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  // Calculate summary data
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpenses
  const currencySymbol = currentCurrency?.symbol || '$'

  // Prepare data for charts
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find(item => item.category === t.category)
      if (existing) {
        existing.amount += t.amount
      } else {
        acc.push({ category: t.category, amount: t.amount })
      }
      return acc
    }, [])

  // Monthly data for line chart
  const monthlyData = transactions.reduce((acc, t) => {
    const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const existing = acc.find(item => item.month === month)
    if (existing) {
      if (t.type === 'income') {
        existing.income += t.amount
      } else {
        existing.expenses += t.amount
      }
    } else {
      acc.push({
        month,
        income: t.type === 'income' ? t.amount : 0,
        expenses: t.type === 'expense' ? t.amount : 0
      })
    }
    return acc
  }, [])

  const expenseChartData = expenseByCategory.map((item) => ({
    ...item,
    value: convertAmount(item.amount),
  }))

  const monthlyChartData = monthlyData.map((item) => ({
    month: item.month,
    income: convertAmount(item.income),
    expenses: convertAmount(item.expenses),
  }))

  // Get recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  // Chart colors
  const CATEGORY_COLORS = ['#34d399', '#2dd4bf', '#22d3ee', '#a5b4fc', '#f472b6', '#c084fc', '#facc15']
  const incomeChange = totalIncome ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
  const expenseChange = totalExpenses ? ((totalExpenses - balance) / Math.max(totalExpenses, 1)) * 100 : 0
  const balanceTrendData = monthlyChartData.map((item) => ({
    month: item.month,
    balance: (item.income || 0) - (item.expenses || 0),
  }))
  const totalExpensesConverted = expenseChartData.reduce((sum, item) => sum + (item.value || 0), 0)

  return (
    <div className="space-y-8 text-gray-100">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Overview</p>
        <h1 className="text-3xl font-semibold mt-2">Financial Pulse</h1>
        <p className="text-white/60 mt-1">Track revenue, expenses, and habits in one place.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="glass-panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Income</p>
              <p className="text-3xl font-semibold mt-2">{formatAmount(totalIncome)}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-300" />
            </div>
          </div>
          <p className="mt-4 text-sm text-emerald-300 flex items-center gap-1">
            <ArrowUpRight className="h-4 w-4" />
            {incomeChange.toFixed(1)}% vs last period
          </p>
        </div>
        <div className="glass-panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Expenses</p>
              <p className="text-3xl font-semibold mt-2">{formatAmount(totalExpenses)}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-400/20 border border-rose-300/40 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-rose-300" />
            </div>
          </div>
          <p className="mt-4 text-sm text-rose-300 flex items-center gap-1">
            <ArrowDownRight className="h-4 w-4" />
            {expenseChange.toFixed(1)}% vs last period
          </p>
        </div>
        <div className="glass-panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Balance</p>
              <p className={`text-3xl font-semibold mt-2 ${balance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {formatAmount(balance)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white/80" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Available after bills
          </div>
        </div>
        <div className="glass-panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Budget Used</p>
              <p className="text-3xl font-semibold mt-2">{percent.toFixed(0)}%</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-teal-400/20 border border-teal-300/40 flex items-center justify-center">
              <Target className="h-6 w-6 text-teal-200" />
            </div>
          </div>
          <div className="mt-4 w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300"
              style={{ width: `${Math.min(percent, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-white/50 mt-2">Remaining {formatAmount(Math.max(budget - spent, 0))}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="glass-panel">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/50 text-sm">Revenue Flow</p>
              <h3 className="text-2xl font-semibold mt-1">Monthly Trends</h3>
            </div>
            <span className="pill">{monthlyChartData.length} months</span>
          </div>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#7f1d1d" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                  formatter={(value, name) => [
                    formatAmount(value, { skipConversion: true }),
                    name === 'income' ? 'Income' : 'Expenses',
                  ]}
                />
                <Bar dataKey="income" fill="url(#incomeGradient)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="url(#expenseGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-white/40">
              <TrendingUp className="h-10 w-10 mb-3" />
              No trend data yet
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="glass-panel relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/50 text-sm">Available</p>
                <h3 className="text-xl font-semibold mt-1">Category Split</h3>
              </div>
              <span className="text-sm text-white/60">{expenseChartData.length} categories</span>
            </div>
            {expenseChartData.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,23,42,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                      }}
                      formatter={(value) => [formatAmount(value, { skipConversion: true }), 'Spent']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-white/60 text-xs">Spent</p>
                  <p className="text-2xl font-semibold">{formatAmount(totalExpenses)}</p>
                </div>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-white/40">
                <CreditCard className="h-8 w-8 mb-3" />
                No expenses yet
              </div>
            )}
            {expenseChartData.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/70">
                {expenseChartData.slice(0, 4).map((item, index) => (
                  <div key={item.category} className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                    />
                    <span className="truncate">{item.category}</span>
                    <span className="ml-auto text-white/50">
                      {totalExpensesConverted > 0 ? ((item.value / totalExpensesConverted) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-400/10 to-cyan-400/20 blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">My Card</p>
                  <h3 className="text-3xl font-semibold mt-2">{formatAmount(balance)}</h3>
                </div>
                <span className="pill">Virtual</span>
              </div>
              <div className="mt-8 space-y-3 text-sm tracking-widest text-white/70">
                <div className="flex justify-between">
                  <span>**** **** **** 1289</span>
                  <span>VISA</span>
                </div>
                <div className="flex justify-between text-xs uppercase text-white/50">
                  <span>Valid Thru</span>
                  <span>CVV</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>12/28</span>
                  <span>•••</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions + insights */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="glass-panel">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/50 text-sm">Transactions</p>
              <h3 className="text-2xl font-semibold mt-1">Latest Activity</h3>
            </div>
            <Link to="/transactions" className="text-sm text-emerald-300 hover:text-emerald-200 transition">
              View all
            </Link>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-12 w-12 rounded-2xl border-2 flex items-center justify-center ${
                        transaction.type === 'income'
                          ? 'border-emerald-300/50 bg-emerald-400/10'
                          : 'border-rose-300/50 bg-rose-400/10'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-5 w-5 text-emerald-300" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-rose-300" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span className="inline-flex items-center gap-1">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              transaction.type === 'income' ? 'bg-emerald-300' : 'bg-rose-300'
                            }`}
                          ></span>
                          {transaction.category}
                        </span>
                        <span>•</span>
                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                        {transaction.isRecurring && (
                          <>
                            <span>•</span>
                            <span className="text-teal-300">Recurring</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatAmount(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white/50">
              <CreditCard className="mx-auto h-12 w-12 text-white/30 mb-4" />
              <p>No transactions yet</p>
              <Link to="/add" className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add transaction
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-panel">
            <p className="text-white/50 text-sm">Spending Line</p>
            <h3 className="text-xl font-semibold mt-1">Balance Snapshot</h3>
            {balanceTrendData.length > 0 ? (
              <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceTrendData}>
                    <defs>
                      <linearGradient id="balanceGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,23,42,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                      }}
                      formatter={(value) => [formatAmount(value, { skipConversion: true }), 'Balance']}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#34d399"
                      strokeWidth={3}
                      fill="url(#balanceGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-white/40">Need more data</div>
            )}
          </div>

          <div className="glass-panel">
            <p className="text-white/50 text-sm">Insights</p>
            <h3 className="text-xl font-semibold mt-2">Invite a partner</h3>
            <p className="text-white/60 text-sm mt-2">
              Collaborate with finance partners or family to keep everyone in sync. Share live dashboards and spending
              alerts instantly.
            </p>
            <button className="btn-primary mt-4 w-full">Add friend</button>
          </div>
        </div>
      </div>

      {/* Budget Management */}
      <div className="glass-panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-white/50 text-sm">Monthly Budget</p>
            <h3 className="text-2xl font-semibold mt-1">Control your burn rate</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-48">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">{currencySymbol}</span>
              <input
                type="text"
                inputMode="decimal"
                className="input-field pl-10"
                value={budgetInput}
                onChange={handleBudgetInputChange}
                onFocus={() => setIsBudgetFocused(true)}
                onBlur={() => {
                  setIsBudgetFocused(false)
                  if (budgetInput && !Number.isNaN(parseFloat(budgetInput))) {
                    setBudgetInput(parseFloat(budgetInput).toFixed(2))
                  }
                }}
                placeholder={`${currencySymbol}0.00`}
              />
            </div>
            <button
              onClick={handleBudgetSave}
              disabled={
                budgetLoading ||
                budgetInput === '' ||
                Number.isNaN(parseFloat(budgetInput))
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {budgetLoading ? 'Saving…' : 'Save budget'}
            </button>
          </div>
        </div>

        {budgetError && (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {budgetError}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm text-white/60">
            <span>Spent: {formatAmount(spent)}</span>
            <span>{percent.toFixed(0)}%</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                percent >= 100 ? 'bg-rose-400' : percent >= 70 ? 'bg-amber-300' : 'bg-emerald-300'
              }`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-white/50">Remaining: {formatAmount(Math.max(budget - spent, 0))}</div>
        </div>

        {budget > 0 && (
          <div className="mt-4">
            {percent >= 100 ? (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-rose-200">
                <AlertTriangle className="h-5 w-5" />
                Over budget! You've exceeded your monthly limit.
              </div>
            ) : percent >= 70 ? (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-amber-100">
                <AlertTriangle className="h-5 w-5" />
                Warning! You've used {percent.toFixed(0)}% of your budget.
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-emerald-100">
                <CheckCircle className="h-5 w-5" />
                Good job! You're within your budget.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}