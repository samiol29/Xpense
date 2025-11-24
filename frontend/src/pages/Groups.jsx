import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Users, UserPlus, X, DollarSign, Share2 } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'

export default function Groups() {
  const { formatAmount, toBaseAmount } = useCurrency()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '', description: '' })
  const [newMember, setNewMember] = useState({ email: '', role: 'viewer' })
  const [newExpense, setNewExpense] = useState({
    description: '',
    totalAmount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    splits: []
  })

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetails()
      loadExpenses()
    }
  }, [selectedGroup])

  const loadGroups = async () => {
    try {
      const res = await axios.get('/api/groups')
      setGroups(res.data)
    } catch (err) {
      console.error('Failed to load groups:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadGroupDetails = async () => {
    try {
      const res = await axios.get(`/api/groups/${selectedGroup._id}`)
      setSelectedGroup(res.data)
    } catch (err) {
      console.error('Failed to load group details:', err)
    }
  }

  const loadExpenses = async () => {
    try {
      const res = await axios.get(`/api/groups/${selectedGroup._id}/expenses`)
      setExpenses(res.data)
    } catch (err) {
      console.error('Failed to load expenses:', err)
    }
  }

  const handleAddGroup = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/groups', newGroup)
      setShowAddGroup(false)
      setNewGroup({ name: '', description: '' })
      loadGroups()
    } catch (err) {
      console.error('Failed to add group:', err)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`/api/groups/${selectedGroup._id}/members`, newMember)
      setShowAddMember(false)
      setNewMember({ email: '', role: 'viewer' })
      loadGroupDetails()
    } catch (err) {
      console.error('Failed to add member:', err)
      alert(err.response?.data?.message || 'Failed to add member')
    }
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    try {
      // Calculate splits if not provided
      let splits = newExpense.splits
      if (splits.length === 0 && selectedGroup) {
        // Split equally among all members
        const totalAmount = toBaseAmount(parseFloat(newExpense.totalAmount))
        const memberCount = selectedGroup.members.length
        splits = selectedGroup.members.map(m => ({
          userId: m.userId._id || m.userId,
          amount: totalAmount / memberCount,
          percentage: 100 / memberCount
        }))
      }

      await axios.post(`/api/groups/${selectedGroup._id}/expenses`, {
        ...newExpense,
        totalAmount: toBaseAmount(parseFloat(newExpense.totalAmount)),
        splits
      })
      setShowAddExpense(false)
      setNewExpense({
        description: '',
        totalAmount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        splits: []
      })
      loadExpenses()
    } catch (err) {
      console.error('Failed to add expense:', err)
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
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Groups</p>
        <h1 className="text-3xl font-semibold mt-2">Multi-User & Sharing</h1>
        <p className="text-white/60 mt-1">Create groups, share expenses, and manage budgets together.</p>
      </div>

      <button onClick={() => setShowAddGroup(true)} className="btn-primary">
        <Plus className="h-4 w-4 mr-2" />
        Create Group
      </button>

      {showAddGroup && (
        <div className="glass-panel">
          <h3 className="text-xl font-semibold mb-4">Create New Group</h3>
          <form onSubmit={handleAddGroup} className="space-y-4">
            <input
              type="text"
              placeholder="Group name"
              className="input-field"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              required
            />
            <textarea
              placeholder="Description (optional)"
              className="input-field"
              value={newGroup.description}
              onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              rows={3}
            />
            <div className="flex gap-4">
              <button type="submit" className="btn-primary">Create</button>
              <button
                type="button"
                onClick={() => setShowAddGroup(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Groups List */}
        <div className="glass-panel">
          <h3 className="text-xl font-semibold mb-6">Your Groups</h3>
          <div className="space-y-3">
            {groups.map(group => (
              <div
                key={group._id}
                className={`border rounded-2xl p-4 cursor-pointer transition ${
                  selectedGroup?._id === group._id
                    ? 'border-cyan-300 bg-cyan-500/10'
                    : 'border-white/10 hover:bg-white/5'
                }`}
                onClick={() => setSelectedGroup(group)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-cyan-300" />
                  <h4 className="font-semibold">{group.name}</h4>
                </div>
                {group.description && (
                  <p className="text-sm text-white/60 mb-2">{group.description}</p>
                )}
                <p className="text-xs text-white/50">
                  {group.members?.length || 0} member{group.members?.length !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
          {groups.length === 0 && (
            <div className="text-center py-12 text-white/50">
              <Users className="mx-auto h-12 w-12 text-white/30 mb-4" />
              <p>No groups yet</p>
            </div>
          )}
        </div>

        {/* Group Details */}
        {selectedGroup && (
          <div className="space-y-6">
            <div className="glass-panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{selectedGroup.name}</h3>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="btn-primary text-sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </button>
              </div>

              {showAddMember && (
                <form onSubmit={handleAddMember} className="mb-4 p-4 border border-white/10 rounded-2xl">
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Member email"
                      className="input-field"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      required
                    />
                    <select
                      className="input-field"
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div className="flex gap-4">
                      <button type="submit" className="btn-primary text-sm">Add</button>
                      <button
                        type="button"
                        onClick={() => setShowAddMember(false)}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-white/60">Members</h4>
                {selectedGroup.members?.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <div>
                      <p className="text-sm font-medium">
                        {member.userId?.name || member.userId?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-white/50">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Shared Expenses</h3>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="btn-primary text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </button>
              </div>

              {showAddExpense && (
                <form onSubmit={handleAddExpense} className="mb-4 p-4 border border-white/10 rounded-2xl">
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Description"
                      className="input-field"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Total amount"
                      className="input-field"
                      value={newExpense.totalAmount}
                      onChange={(e) => setNewExpense({ ...newExpense, totalAmount: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      className="input-field"
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      required
                    />
                    <input
                      type="date"
                      className="input-field"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      required
                    />
                    <div className="flex gap-4">
                      <button type="submit" className="btn-primary text-sm">Add</button>
                      <button
                        type="button"
                        onClick={() => setShowAddExpense(false)}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {expenses.map(expense => (
                  <div key={expense._id} className="border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{expense.description}</h4>
                        <p className="text-sm text-white/60">
                          {expense.category} • {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-lg font-semibold">{formatAmount(expense.totalAmount)}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-white/50 mb-2">Split among:</p>
                      {expense.splits?.map((split, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span>{split.userId?.name || split.userId?.email || 'Unknown'}</span>
                          <span>{formatAmount(split.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {expenses.length === 0 && (
                <div className="text-center py-8 text-white/50">
                  <Share2 className="mx-auto h-8 w-8 text-white/30 mb-2" />
                  <p className="text-sm">No shared expenses yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

