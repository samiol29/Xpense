import { useState, useEffect } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts'
import { Download, FileText, BarChart3, Calendar, TrendingUp, ArrowLeft } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'
import jsPDF from 'jspdf'

const COLORS = ['#34d399', '#2dd4bf', '#22d3ee', '#a5b4fc', '#f472b6', '#c084fc', '#facc15']

export default function Reports() {
  const { formatAmount, convertAmount } = useCurrency()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [viewMode, setViewMode] = useState('charts') // charts, timeline, comparison

  useEffect(() => {
    fetchTransactions()
  }, [dateRange])

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/api/transactions')
      let filtered = res.data

      // Filter by date range
      const days = parseInt(dateRange)
      if (days > 0) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)
        filtered = filtered.filter(t => new Date(t.date) >= cutoffDate)
      }

      setTransactions(filtered)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setLoading(false)
    }
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

  const incomeByCategory = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      const existing = acc.find(item => item.category === t.category)
      if (existing) {
        existing.amount += t.amount
      } else {
        acc.push({ category: t.category, amount: t.amount })
      }
      return acc
    }, [])

  // Monthly data
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
  }, []).sort((a, b) => new Date(a.month) - new Date(b.month))

  const exportToCSV = () => {
    const headers = ['Type','Description','Amount','Category','Date','Recurring']
    const escapeCell = (value) => {
      if (value == null) return ''
      const str = String(value)
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }
    const rows = transactions.map(t => [
      t.type,
      t.description,
      t.amount,
      t.category,
      new Date(t.date).toISOString(),
      t.isRecurring ? 'yes' : 'no'
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(escapeCell).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.text('Financial Report', 20, 20)
    
    // Summary
    doc.setFontSize(12)
    doc.text(`Report Period: Last ${dateRange} days`, 20, 35)
    doc.text(`Total Income: $${totalIncome.toLocaleString()}`, 20, 45)
    doc.text(`Total Expenses: $${totalExpenses.toLocaleString()}`, 20, 55)
    doc.text(`Balance: $${balance.toLocaleString()}`, 20, 65)
    
    // Transactions table
    doc.text('Recent Transactions:', 20, 80)
    let y = 90
    transactions.slice(0, 20).forEach((t, i) => {
      if (y > 280) {
        doc.addPage()
        y = 20
      }
      doc.text(`${t.type} - ${t.description} - $${t.amount}`, 20, y)
      y += 10
    })
    
    doc.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Prepare timeline data
  const timelineData = [...transactions]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(t => ({
      ...t,
      date: new Date(t.date).toISOString().split('T')[0],
      amountConverted: convertAmount(t.amount)
    }))

  // Comparison data - last two months
  const now = new Date()
  const currentMonth = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const lastMonth = transactions.filter(t => {
    const d = new Date(t.date)
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1)
    return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear()
  })

  const currentMonthExpenses = currentMonth
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  const lastMonthExpenses = lastMonth
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  const comparisonData = Object.keys({ ...currentMonthExpenses, ...lastMonthExpenses }).map(cat => ({
    category: cat,
    current: convertAmount(currentMonthExpenses[cat] || 0),
    previous: convertAmount(lastMonthExpenses[cat] || 0),
    change: lastMonthExpenses[cat] 
      ? ((currentMonthExpenses[cat] || 0) - lastMonthExpenses[cat]) / lastMonthExpenses[cat] * 100
      : 0
  }))

  const handlePieClick = (data) => {
    if (data && data.category) {
      setSelectedCategory(data.category)
    }
  }

  const filteredByCategory = selectedCategory
    ? transactions.filter(t => t.category === selectedCategory)
    : transactions

  return (
    <div className="space-y-8 text-gray-100">
      {/* Header */}
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Reports</p>
        <h1 className="text-3xl font-semibold mt-2">Financial Reports</h1>
        <p className="text-white/60 mt-1">Interactive charts, comparisons, and timeline views.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="input-field"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
          <option value="0">All time</option>
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('charts')}
            className={`btn-secondary ${viewMode === 'charts' ? 'bg-white/10' : ''}`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Charts
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`btn-secondary ${viewMode === 'timeline' ? 'bg-white/10' : ''}`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Timeline
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`btn-secondary ${viewMode === 'comparison' ? 'bg-white/10' : ''}`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Compare
          </button>
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={exportToCSV} className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </button>
          <button onClick={exportToPDF} className="btn-primary">
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </button>
        </div>
      </div>

      {selectedCategory && (
        <div className="glass-panel border-cyan-300/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Filtered by Category</p>
              <h3 className="text-xl font-semibold mt-1">{selectedCategory}</h3>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="btn-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${totalIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                balance >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <BarChart3 className={`w-5 h-5 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance</p>
              <p className={`text-2xl font-semibold ${
                balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'charts' && (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense by Category - Interactive */}
            <div className="glass-panel">
              <h3 className="text-xl font-semibold mb-4">Expenses by Category</h3>
              <p className="text-sm text-white/60 mb-4">Click a segment to filter</p>
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory.map(e => ({ ...e, amount: convertAmount(e.amount) }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      onClick={handlePieClick}
                      style={{ cursor: 'pointer' }}
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,23,42,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                      }}
                      formatter={(value) => [formatAmount(value, { skipConversion: true }), 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-white/50">
                  No expense data available
                </div>
              )}
            </div>

            {/* Income by Category */}
            <div className="glass-panel">
              <h3 className="text-xl font-semibold mb-4">Income by Category</h3>
              {incomeByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeByCategory.map(i => ({ ...i, amount: convertAmount(i.amount) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="category" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,23,42,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                      }}
                      formatter={(value) => [formatAmount(value, { skipConversion: true }), 'Amount']}
                    />
                    <Bar dataKey="amount" fill="#34d399" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-white/50">
                  No income data available
                </div>
              )}
            </div>
          </div>

          {/* Monthly Trend - Interactive */}
          <div className="glass-panel">
            <h3 className="text-xl font-semibold mb-4">Monthly Income vs Expenses</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={monthlyData.map(m => ({
                  ...m,
                  income: convertAmount(m.income),
                  expenses: convertAmount(m.expenses)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                    }}
                    formatter={(value) => [formatAmount(value, { skipConversion: true }), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    fill="#34d399"
                    fillOpacity={0.3}
                    stroke="#34d399"
                    strokeWidth={2}
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    fill="#f472b6"
                    fillOpacity={0.3}
                    stroke="#f472b6"
                    strokeWidth={2}
                    name="Expenses"
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#34d399"
                    strokeWidth={3}
                    dot={{ fill: '#34d399', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#f472b6"
                    strokeWidth={3}
                    dot={{ fill: '#f472b6', r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-white/50">
                No data available for the selected period
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
