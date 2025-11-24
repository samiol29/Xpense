import { useState, useEffect } from 'react'
import axios from 'axios'
import { TrendingUp, TrendingDown, Calendar, Zap, BarChart3, Lightbulb } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend 
} from 'recharts'

export default function Analytics() {
  const { formatAmount } = useCurrency()
  const [trends, setTrends] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [velocity, setVelocity] = useState(null)
  const [comparisons, setComparisons] = useState([])
  const [heatmap, setHeatmap] = useState(null)
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const [trendsRes, forecastRes, velocityRes, comparisonsRes, heatmapRes, insightsRes] = await Promise.all([
        axios.get('/api/analytics/trends'),
        axios.get('/api/analytics/forecast'),
        axios.get('/api/analytics/velocity'),
        axios.get('/api/analytics/category-comparison?period=month'),
        axios.get('/api/analytics/heatmap'),
        axios.get('/api/analytics/insights')
      ])
      setTrends(trendsRes.data)
      setForecast(forecastRes.data)
      setVelocity(velocityRes.data)
      setComparisons(comparisonsRes.data)
      setHeatmap(heatmapRes.data)
      setInsights(insightsRes.data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  const COLORS = ['#34d399', '#2dd4bf', '#22d3ee', '#a5b4fc', '#f472b6', '#c084fc']

  return (
    <div className="space-y-8 text-gray-100">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Analytics</p>
        <h1 className="text-3xl font-semibold mt-2">Advanced Insights</h1>
        <p className="text-white/60 mt-1">Deep dive into your spending patterns and trends.</p>
      </div>

      {/* Spending Trends */}
      {trends && (
        <div className="glass-panel">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5" />
            <h3 className="text-xl font-semibold">Spending Trends</h3>
          </div>
          {trends.insights && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300/30">
              <p className="text-emerald-200">{trends.insights.message}</p>
            </div>
          )}
          {trends.dayOfWeek && trends.dayOfWeek.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends.dayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                  formatter={(value) => [formatAmount(value, { skipConversion: true }), 'Spent']}
                />
                <Bar dataKey="total" fill="#34d399" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Predictive Analytics & Velocity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {forecast && (
          <div className="glass-panel">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Next Month Forecast</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-white/60 text-sm">Projected Spending</p>
                <p className="text-3xl font-semibold mt-1">{formatAmount(forecast.forecast)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`pill ${forecast.trend === 'increasing' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {forecast.trend}
                </span>
                <span className="text-sm text-white/60">Confidence: {forecast.confidence}%</span>
              </div>
            </div>
          </div>
        )}

        {velocity && (
          <div className="glass-panel">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Spending Velocity</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm">Daily Rate</p>
                  <p className="text-2xl font-semibold mt-1">{formatAmount(velocity.dailyRate)}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Weekly Rate</p>
                  <p className="text-2xl font-semibold mt-1">{formatAmount(velocity.weeklyRate)}</p>
                </div>
              </div>
              <div>
                <p className="text-white/60 text-sm">Projected Monthly</p>
                <p className="text-xl font-semibold mt-1">{formatAmount(velocity.projectedMonthly)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Comparisons */}
      {comparisons.length > 0 && (
        <div className="glass-panel">
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown className="h-5 w-5" />
            <h3 className="text-xl font-semibold">Category Comparison</h3>
          </div>
          <div className="space-y-3">
            {comparisons.map((comp, idx) => (
              <div key={idx} className="border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{comp.category}</h4>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-white/60">This Month</p>
                      <p className="font-semibold">{formatAmount(comp.current)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/60">Last Month</p>
                      <p className="font-semibold">{formatAmount(comp.previous)}</p>
                    </div>
                    <div className={`pill ${
                      comp.trend === 'up' ? 'bg-rose-500/20 text-rose-300' :
                      comp.trend === 'down' ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {comp.change > 0 ? '+' : ''}{comp.change.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending Heatmap */}
      {heatmap && (
        <div className="glass-panel">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5" />
            <h3 className="text-xl font-semibold">Spending Heatmap - {heatmap.year}</h3>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 365 }, (_, i) => {
              const date = new Date(heatmap.year, 0, i + 1)
              const dateKey = date.toISOString().split('T')[0]
              const data = heatmap.data.find(d => d.date === dateKey)
              const intensity = data ? data.intensity : 0
              return (
                <div
                  key={i}
                  className="aspect-square rounded border border-white/5"
                  style={{
                    backgroundColor: intensity > 0 
                      ? `rgba(52, 211, 153, ${intensity / 100})`
                      : 'rgba(255, 255, 255, 0.05)'
                  }}
                  title={data ? `${dateKey}: ${formatAmount(data.amount)}` : 'No spending'}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="glass-panel">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="h-5 w-5" />
            <h3 className="text-xl font-semibold">AI Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${
                  insight.type === 'warning'
                    ? 'bg-rose-500/10 border-rose-300/30 text-rose-200'
                    : 'bg-emerald-500/10 border-emerald-300/30 text-emerald-200'
                }`}
              >
                <p>{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

