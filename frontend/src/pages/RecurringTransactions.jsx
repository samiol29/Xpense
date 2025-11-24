import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Repeat, Calendar, Zap, X, CheckCircle } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'

export default function RecurringTransactions() {
  const { formatAmount, toBaseAmount } = useCurrency()
  const [recurring, setRecurring] = useState([])
  const [detected, setDetected] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showDetect, setShowDetect] = useState(false)
  const [newRecurring, setNewRecurring] = useState({
    type: 'expense',
    description: '',
    amount: '',
    category: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    autoCreate: false
  })

  useEffect(() => {
    loadRecurring()
  }, [])

  const loadRecurring = async () => {
    try {
      const res = await axios.get('/api/recurring')
      setRecurring(res.data)
    } catch (err) {
      console.error('Failed to load recurring transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDetect = async () => {
    try {
      setShowDetect(true)
      const res = await axios.post('/api/recurring/detect', { days: 90 })
      setDetected(res.data)
    } catch (err) {
      console.error('Failed to detect patterns:', err)
    }
  }

  const handleAddFromDetected = async (item) => {
    try {
      await axios.post('/api/recurring', {
        type: item.type,
        description: item.description,
        amount: item.amount,
        category: item.category,
        frequency: item.frequency,
        startDate: item.startDate,
        nextDueDate: item.nextDueDate,
        autoCreate: false
      })
      loadRecurring()
      setDetected(detected.filter(d => d !== item))
    } catch (err) {
      console.error('Failed to add recurring transaction:', err)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/recurring', {
        ...newRecurring,
        amount: toBaseAmount(parseFloat(newRecurring.amount)),
        nextDueDate: newRecurring.startDate
      })
      setShowAdd(false)
      setNewRecurring({
        type: 'expense',
        description: '',
        amount: '',
        category: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        autoCreate: false
      })
      loadRecurring()
    } catch (err) {
      console.error('Failed to add recurring transaction:', err)
    }
  }

  const handleCreateTransaction = async (id) => {
    try {
      await axios.post(`/api/recurring/${id}/create-transaction`)
      loadRecurring()
    } catch (err) {
      console.error('Failed to create transaction:', err)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring transaction?')) {
      try {
        await axios.delete(`/api/recurring/${id}`)
        loadRecurring()
      } catch (err) {
        console.error('Failed to delete:', err)
      }
    }
  }

  const getNextDueDate = (date) => {
    return new Date(date).toLocaleDateString()
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
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Recurring</p>
        <h1 className="text-3xl font-semibold mt-2">Recurring Transactions</h1>
        <p className="text-white/60 mt-1">Manage your recurring income and expenses.</p>
      </div>

      <div className="flex gap-4">
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Recurring
        </button>
        <button onClick={handleDetect} className="btn-secondary">
          <Zap className="h-4 w-4 mr-2" />
          Smart Detection
        </button>
      </div>

      {showDetect && detected.length > 0 && (
        <div className="glass-panel">
          <h3 className="text-xl font-semibold mb-4">Detected Patterns</h3>
          <div className="space-y-3">
            {detected.map((item, idx) => (
              <div key={idx} className="border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{item.description}</h4>
                    <p className="text-sm text-white/60">
                      {formatAmount(item.amount)} • {item.frequency} • {item.occurrences} occurrences
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      Confidence: {item.confidence.toFixed(0)}%
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddFromDetected(item)}
                    className="btn-primary text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="glass-panel">
          <h3 className="text-xl font-semibold mb-4">Add Recurring Transaction</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                className="input-field"
                value={newRecurring.type}
                onChange={(e) => setNewRecurring({ ...newRecurring, type: e.target.value })}
                required
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                type="text"
                placeholder="Description"
                className="input-field"
                value={newRecurring.description}
                onChange={(e) => setNewRecurring({ ...newRecurring, description: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                className="input-field"
                value={newRecurring.amount}
                onChange={(e) => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Category"
                className="input-field"
                value={newRecurring.category}
                onChange={(e) => setNewRecurring({ ...newRecurring, category: e.target.value })}
                required
              />
              <select
                className="input-field"
                value={newRecurring.frequency}
                onChange={(e) => setNewRecurring({ ...newRecurring, frequency: e.target.value })}
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input
                type="date"
                className="input-field"
                value={newRecurring.startDate}
                onChange={(e) => setNewRecurring({ ...newRecurring, startDate: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoCreate"
                checked={newRecurring.autoCreate}
                onChange={(e) => setNewRecurring({ ...newRecurring, autoCreate: e.target.checked })}
              />
              <label htmlFor="autoCreate" className="text-sm">Auto-create transactions</label>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="btn-primary">Save</button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel">
        <h3 className="text-xl font-semibold mb-6">Active Recurring Transactions</h3>
        <div className="space-y-3">
          {recurring.filter(r => r.isActive).map(item => (
            <div key={item._id} className="border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Repeat className="h-5 w-5 text-cyan-300" />
                    <h4 className="font-semibold">{item.description}</h4>
                    <span className={`pill ${
                      item.type === 'income' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span>{formatAmount(item.amount)}</span>
                    <span>•</span>
                    <span>{item.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {item.frequency}
                    </span>
                    <span>•</span>
                    <span>Next: {getNextDueDate(item.nextDueDate)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCreateTransaction(item._id)}
                    className="btn-primary text-sm"
                    title="Create transaction now"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 hover:bg-white/10 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {recurring.filter(r => r.isActive).length === 0 && (
          <div className="text-center py-12 text-white/50">
            <Repeat className="mx-auto h-12 w-12 text-white/30 mb-4" />
            <p>No active recurring transactions</p>
          </div>
        )}
      </div>
    </div>
  )
}

