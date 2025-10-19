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
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const { formatAmount, convertAmount } = useCurrency()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [budget, setBudget] = useState(0)
  const [spent, setSpent] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [percent, setPercent] = useState(0)
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [budgetError, setBudgetError] = useState('')

  useEffect(() => {
    fetchTransactions()
    fetchBudget()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/api/transactions')
      setTransactions(res.data)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBudget = async () => {
    try {
      const res = await axios.get('/api/budget')
      setBudget(res.data.monthlyBudget)
      setSpent(res.data.spent)
      setRemaining(res.data.remaining)
      setPercent(res.data.percent)
    } catch (err) {
      console.error('Failed to fetch budget:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateBudget = async (newBudget) => {
    try {
      setBudgetLoading(true)
      setBudgetError('')
      const budgetValue = Number(newBudget)
      if (isNaN(budgetValue) || budgetValue < 0) {
        setBudgetError('Please enter a valid budget amount')
        return
      }
      await axios.put('/api/budget', { monthlyBudget: budgetValue })
      await fetchBudget()
    } catch (err) {
      setBudgetError(err.response?.data?.message || 'Failed to update budget')
    } finally {
      setBudgetLoading(false)
    }
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

  // Get recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  // Chart colors
  const COLORS = ['#22d3ee', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500 dark:from-cyan-400 dark:to-purple-400 mb-2">
          Welcome Back!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Here's your financial overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:bg-surface-800/80 backdrop-blur-xl rounded-2xl p-6 border border-emerald-200 dark:border-surface-700/50 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Income</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(totalIncome)}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/40">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:bg-surface-800/80 backdrop-blur-xl rounded-2xl p-6 border border-red-200 dark:border-surface-700/50 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Expenses</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatAmount(totalExpenses)}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/40">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:bg-surface-800/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-200 dark:border-surface-700/50 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Balance</p>
              <p className={`text-3xl font-bold ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatAmount(balance)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
              balance >= 0 ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-red-500/20 border-red-500/40'
            }`}>
              <DollarSign className={`w-6 h-6 ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:bg-surface-800/80 backdrop-blur-xl rounded-2xl p-6 border border-cyan-200 dark:border-surface-700/50 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Budget Used</p>
              <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{percent.toFixed(0)}%</p>
            </div>
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/40">
              <Target className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories Pie Chart */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:bg-surface-800/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200 dark:border-surface-700/50">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Expenses by Category</h3>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-2" />
                <p>No expense data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Trends Line Chart */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:bg-surface-800/80 backdrop-blur-xl rounded-2xl p-6 border border-indigo-200 dark:border-surface-700/50">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Monthly Trends</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  formatter={(value, name) => [`$${value.toLocaleString()}`, name === 'income' ? 'Income' : 'Expenses']}
                  labelStyle={{ color: '#f3f4f6' }}
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p>No trend data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Budget Management */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:bg-surface-800/80 backdrop-blur-xl rounded-2xl p-6 border border-orange-200 dark:border-surface-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Monthly Budget</h3>
            <p className="text-gray-600 dark:text-gray-400">Track your spending against your set monthly budget.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                className="bg-surface-700/50 border border-surface-600 rounded-lg px-3 py-2 pl-7 w-48 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                value={budget}
                min={0}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Set budget"
              />
            </div>
            <button
              onClick={() => updateBudget(budget)}
              disabled={budgetLoading}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
            >
              {budgetLoading ? 'Saving…' : 'Save Budget'}
            </button>
          </div>
        </div>

        {budgetError && (
          <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/30 p-3 text-sm text-red-400">
            {budgetError}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-300">Spent: {formatAmount(spent)}</span>
            <span className="text-gray-600 dark:text-gray-300">{percent.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div
              className={`h-3 transition-all duration-500 ${
                percent >= 100 ? 'bg-red-500' : percent >= 70 ? 'bg-yellow-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Remaining: {formatAmount(Math.max(budget - spent, 0))}</div>
        </div>

        {/* Alerts */}
        {budget > 0 && (
          <div className="space-y-2">
            {percent >= 100 ? (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">Over budget! You've exceeded your monthly limit.</span>
              </div>
            ) : percent >= 70 ? (
              <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">Warning! You've used {percent.toFixed(0)}% of your budget.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Good job! You're within your budget.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:bg-surface-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-surface-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          <Link
            to="/transactions"
            className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-sm font-medium transition-colors"
          >
            View All
          </Link>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between p-4 bg-white/60 dark:bg-surface-700/50 rounded-xl border border-gray-200 dark:border-surface-600/50 hover:bg-white/80 dark:hover:bg-surface-700/70 transition-colors">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 border ${
                    transaction.type === 'income' ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-red-500/20 border-red-500/40'
                  }`}>
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{transaction.category}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                      {transaction.isRecurring && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-400 font-medium">Recurring</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`text-lg font-semibold ${
                  transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-400 mb-4">No transactions yet</p>
            <Link
              to="/add"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-glow"
            >
              <Plus className="w-5 h-5" />
              Add Transaction
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}