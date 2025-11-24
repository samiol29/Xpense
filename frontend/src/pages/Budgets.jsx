import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Target, TrendingUp, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'

export default function Budgets() {
  const { formatAmount, convertAmount, toBaseAmount, currencySymbol } = useCurrency()
  const [categoryBudgets, setCategoryBudgets] = useState([])
  const [savingsGoals, setSavingsGoals] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [newBudget, setNewBudget] = useState({ category: '', amount: '', rollover: false })
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', targetDate: '', description: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [budgetsRes, goalsRes, templatesRes] = await Promise.all([
        axios.get('/api/budget/categories'),
        axios.get('/api/budget/savings-goals'),
        axios.get('/api/budget/templates')
      ])
      setCategoryBudgets(budgetsRes.data)
      setSavingsGoals(goalsRes.data)
      setTemplates(templatesRes.data)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBudget = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/budget/categories', {
        category: newBudget.category,
        amount: toBaseAmount(parseFloat(newBudget.amount)),
        period: selectedPeriod,
        rollover: newBudget.rollover
      })
      setShowAddBudget(false)
      setNewBudget({ category: '', amount: '', rollover: false })
      loadData()
    } catch (err) {
      console.error('Failed to add budget:', err)
    }
  }

  const handleAddGoal = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/budget/savings-goals', {
        name: newGoal.name,
        targetAmount: toBaseAmount(parseFloat(newGoal.targetAmount)),
        targetDate: newGoal.targetDate || undefined,
        description: newGoal.description
      })
      setShowAddGoal(false)
      setNewGoal({ name: '', targetAmount: '', targetDate: '', description: '' })
      loadData()
    } catch (err) {
      console.error('Failed to add goal:', err)
    }
  }

  const handleApplyTemplate = async (templateId) => {
    try {
      await axios.post(`/api/budget/templates/${templateId}/apply`)
      loadData()
    } catch (err) {
      console.error('Failed to apply template:', err)
    }
  }

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await axios.delete(`/api/budget/categories/${id}`)
        loadData()
      } catch (err) {
        console.error('Failed to delete budget:', err)
      }
    }
  }

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await axios.delete(`/api/budget/savings-goals/${id}`)
        loadData()
      } catch (err) {
        console.error('Failed to delete goal:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 text-gray-100">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Budgeting</p>
        <h1 className="text-3xl font-semibold mt-2">Advanced Budget Management</h1>
        <p className="text-white/60 mt-1">Manage category budgets, savings goals, and templates.</p>
      </div>

      {/* Budget Templates */}
      <div className="glass-panel">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Budget Templates</h3>
            <p className="text-white/60 text-sm mt-1">Quick-start budgets for different lifestyles</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map(template => (
            <div key={template._id} className="border border-white/10 rounded-2xl p-4 hover:bg-white/5 transition">
              <h4 className="font-semibold mb-2">{template.name}</h4>
              <p className="text-sm text-white/60 mb-4">{template.description}</p>
              <button
                onClick={() => handleApplyTemplate(template._id)}
                className="btn-primary w-full text-sm"
              >
                Apply Template
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Category Budgets */}
      <div className="glass-panel">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Category Budgets</h3>
            <p className="text-white/60 text-sm mt-1">Set budgets for specific categories</p>
          </div>
          <button
            onClick={() => setShowAddBudget(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Budget
          </button>
        </div>

        {showAddBudget && (
          <form onSubmit={handleAddBudget} className="mb-6 p-4 border border-white/10 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Category"
                className="input-field"
                value={newBudget.category}
                onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                className="input-field"
                value={newBudget.amount}
                onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                required
              />
              <select
                className="input-field"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newBudget.rollover}
                  onChange={(e) => setNewBudget({ ...newBudget, rollover: e.target.checked })}
                />
                <span className="text-sm">Enable rollover</span>
              </label>
              <button type="submit" className="btn-primary">Save</button>
              <button
                type="button"
                onClick={() => setShowAddBudget(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {categoryBudgets.map(budget => {
            const percent = budget.percent || 0
            return (
              <div key={budget._id} className="border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{budget.category}</h4>
                    <p className="text-sm text-white/60">
                      {formatAmount(budget.spent || 0)} / {formatAmount(budget.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-semibold ${
                      percent >= 100 ? 'text-rose-300' : percent >= 75 ? 'text-amber-300' : 'text-emerald-300'
                    }`}>
                      {percent.toFixed(0)}%
                    </span>
                    <button
                      onClick={() => handleDeleteBudget(budget._id)}
                      className="p-2 hover:bg-white/10 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      percent >= 100 ? 'bg-rose-400' : percent >= 75 ? 'bg-amber-300' : 'bg-emerald-300'
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Savings Goals */}
      <div className="glass-panel">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Savings Goals</h3>
            <p className="text-white/60 text-sm mt-1">Track your savings targets</p>
          </div>
          <button
            onClick={() => setShowAddGoal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </button>
        </div>

        {showAddGoal && (
          <form onSubmit={handleAddGoal} className="mb-6 p-4 border border-white/10 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Goal name"
                className="input-field"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Target amount"
                className="input-field"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                required
              />
              <input
                type="date"
                className="input-field"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                className="input-field"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              />
            </div>
            <div className="flex gap-4 mt-4">
              <button type="submit" className="btn-primary">Save</button>
              <button
                type="button"
                onClick={() => setShowAddGoal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingsGoals.map(goal => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
            return (
              <div key={goal._id} className="border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{goal.name}</h4>
                    {goal.description && (
                      <p className="text-sm text-white/60">{goal.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal._id)}
                    className="p-2 hover:bg-white/10 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mb-2">
                  <p className="text-sm text-white/60">
                    {formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)}
                  </p>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                  <div
                    className="h-full bg-emerald-300 transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-white/50">
                  {progress.toFixed(0)}% complete
                  {goal.targetDate && (
                    <span className="ml-2">
                      • Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

