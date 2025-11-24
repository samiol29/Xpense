import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, CreditCard, AlertCircle, Calendar, X, TrendingUp } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'

export default function Subscriptions() {
  const { formatAmount, toBaseAmount } = useCurrency()
  const [subscriptions, setSubscriptions] = useState([])
  const [insights, setInsights] = useState(null)
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    amount: '',
    category: 'Subscriptions',
    billingCycle: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    nextBillingDate: '',
    isTrial: false,
    trialEndDate: '',
    cancelReminderDays: 3,
    description: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [subsRes, insightsRes, remindersRes] = await Promise.all([
        axios.get('/api/subscriptions'),
        axios.get('/api/subscriptions/insights'),
        axios.get('/api/subscriptions/reminders')
      ])
      setSubscriptions(subsRes.data)
      setInsights(insightsRes.data)
      setReminders(remindersRes.data)
    } catch (err) {
      console.error('Failed to load subscriptions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      const nextBilling = newSubscription.nextBillingDate || newSubscription.startDate
      await axios.post('/api/subscriptions', {
        ...newSubscription,
        amount: toBaseAmount(parseFloat(newSubscription.amount)),
        nextBillingDate: nextBilling,
        trialEndDate: newSubscription.isTrial && newSubscription.trialEndDate ? newSubscription.trialEndDate : undefined
      })
      setShowAdd(false)
      setNewSubscription({
        name: '',
        amount: '',
        category: 'Subscriptions',
        billingCycle: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        nextBillingDate: '',
        isTrial: false,
        trialEndDate: '',
        cancelReminderDays: 3,
        description: ''
      })
      loadData()
    } catch (err) {
      console.error('Failed to add subscription:', err)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await axios.delete(`/api/subscriptions/${id}`)
        loadData()
      } catch (err) {
        console.error('Failed to delete:', err)
      }
    }
  }

  const handleToggleActive = async (id, isActive) => {
    try {
      await axios.put(`/api/subscriptions/${id}`, { isActive: !isActive })
      loadData()
    } catch (err) {
      console.error('Failed to update:', err)
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
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Subscriptions</p>
        <h1 className="text-3xl font-semibold mt-2">Subscription Management</h1>
        <p className="text-white/60 mt-1">Track and manage all your subscriptions.</p>
      </div>

      {/* Insights */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel">
            <p className="text-white/60 text-sm">Total Subscriptions</p>
            <p className="text-2xl font-semibold mt-2">{insights.total}</p>
          </div>
          <div className="glass-panel">
            <p className="text-white/60 text-sm">Monthly Total</p>
            <p className="text-2xl font-semibold mt-2">{formatAmount(insights.monthlyTotal)}</p>
          </div>
          <div className="glass-panel">
            <p className="text-white/60 text-sm">Yearly Equivalent</p>
            <p className="text-2xl font-semibold mt-2">{formatAmount(insights.yearlyEquivalent)}</p>
          </div>
          <div className="glass-panel">
            <p className="text-white/60 text-sm">Upcoming Renewals</p>
            <p className="text-2xl font-semibold mt-2">{insights.upcomingRenewals}</p>
          </div>
        </div>
      )}

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="glass-panel border-amber-300/30 bg-amber-500/10">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-300" />
            <h3 className="text-lg font-semibold">Cancellation Reminders</h3>
          </div>
          <div className="space-y-2">
            {reminders.map((reminder, idx) => (
              <div key={idx} className="text-amber-200">
                {reminder.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => setShowAdd(true)} className="btn-primary">
        <Plus className="h-4 w-4 mr-2" />
        Add Subscription
      </button>

      {showAdd && (
        <div className="glass-panel">
          <h3 className="text-xl font-semibold mb-4">Add Subscription</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Subscription name"
                className="input-field"
                value={newSubscription.name}
                onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                className="input-field"
                value={newSubscription.amount}
                onChange={(e) => setNewSubscription({ ...newSubscription, amount: e.target.value })}
                required
              />
              <select
                className="input-field"
                value={newSubscription.billingCycle}
                onChange={(e) => setNewSubscription({ ...newSubscription, billingCycle: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input
                type="date"
                placeholder="Start date"
                className="input-field"
                value={newSubscription.startDate}
                onChange={(e) => setNewSubscription({ ...newSubscription, startDate: e.target.value })}
                required
              />
              <input
                type="date"
                placeholder="Next billing date"
                className="input-field"
                value={newSubscription.nextBillingDate}
                onChange={(e) => setNewSubscription({ ...newSubscription, nextBillingDate: e.target.value })}
              />
              <input
                type="number"
                placeholder="Reminder days before renewal"
                className="input-field"
                value={newSubscription.cancelReminderDays}
                onChange={(e) => setNewSubscription({ ...newSubscription, cancelReminderDays: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isTrial"
                checked={newSubscription.isTrial}
                onChange={(e) => setNewSubscription({ ...newSubscription, isTrial: e.target.checked })}
              />
              <label htmlFor="isTrial" className="text-sm">Free trial</label>
            </div>
            {newSubscription.isTrial && (
              <input
                type="date"
                placeholder="Trial end date"
                className="input-field"
                value={newSubscription.trialEndDate}
                onChange={(e) => setNewSubscription({ ...newSubscription, trialEndDate: e.target.value })}
              />
            )}
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
        <h3 className="text-xl font-semibold mb-6">All Subscriptions</h3>
        <div className="space-y-3">
          {subscriptions.map(sub => {
            const daysUntil = sub.daysUntilRenewal || 0
            return (
              <div key={sub._id} className="border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-5 w-5 text-cyan-300" />
                      <h4 className="font-semibold">{sub.name}</h4>
                      {sub.isTrial && (
                        <span className="pill bg-amber-500/20 text-amber-300">Trial</span>
                      )}
                      {!sub.isActive && (
                        <span className="pill bg-white/10 text-white/60">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span>{formatAmount(sub.amount)}</span>
                      <span>•</span>
                      <span>{sub.billingCycle}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Next: {new Date(sub.nextBillingDate).toLocaleDateString()}
                      </span>
                      {daysUntil > 0 && (
                        <>
                          <span>•</span>
                          <span className={daysUntil <= 3 ? 'text-rose-300' : ''}>
                            {daysUntil} day{daysUntil !== 1 ? 's' : ''} until renewal
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(sub._id, sub.isActive)}
                      className={`btn-secondary text-sm ${!sub.isActive ? 'opacity-50' : ''}`}
                    >
                      {sub.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(sub._id)}
                      className="p-2 hover:bg-white/10 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {subscriptions.length === 0 && (
          <div className="text-center py-12 text-white/50">
            <CreditCard className="mx-auto h-12 w-12 text-white/30 mb-4" />
            <p>No subscriptions yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

