import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useAuth } from '../App'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
)

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])
  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  )
}

function Dashboard() {
  const [usage, setUsage] = useState({ apiCalls: [], storage: [] })
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    fetchUsage()
  }, [])

  const fetchUsage = async () => {
    try {
      const { data } = await axios.get('/api/usage')
      setUsage(data)
    } catch (err) {
      console.error('Failed to fetch usage', err)
    } finally {
      setLoading(false)
    }
  }

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const simulateActivity = async (type, amount) => {
    try {
      if (type === 'api') {
        await axios.post('/api/usage/api-call', { count: amount })
        addToast(amount > 0 ? 'API Call Executed Successfully!' : 'API Call Removed')
      } else {
        await axios.post('/api/usage/storage', { mb: amount })
        addToast(amount > 0 ? `${amount}MB Storage Added` : `${Math.abs(amount)}MB Storage Removed`, amount > 0 ? 'success' : 'warning')
      }
      fetchUsage()
    } catch (err) {
      addToast('Action failed', 'error')
    }
  }

  const totalCalls = usage.apiCalls.length ? usage.apiCalls[usage.apiCalls.length - 1].value : 0
  const totalStorage = usage.storage.length ? usage.storage[usage.storage.length - 1].value : 0

  const chartData = (label, dataKey, color) => ({
    labels: usage[dataKey].map((d) => d.date),
    datasets: [
      {
        fill: true,
        label: label,
        data: usage[dataKey].map((d) => d.value),
        borderColor: color,
        backgroundColor: color + '22',
        borderWidth: 3,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        tension: 0.4,
      },
    ],
  })

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { family: 'Plus Jakarta Sans', size: 13 },
        bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
        stacked: false
      },
      x: { 
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
        stacked: false
      },
    },
  }

  if (loading) return <div className="text-center mt-4">Loading dashboard...</div>

  return (
    <div>
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 text-gradient">Dashboard</h1>
          <p className="text-text-muted">Welcome back, <span className="text-white font-semibold">{user.email}</span></p>
        </div>
        <div className="flex gap-4">
          <div className="flex gap-2">
            <button className="danger text-xs" onClick={() => simulateActivity('storage', -10)}>Remove Space</button>
            <button className="secondary" onClick={() => simulateActivity('storage', 10)}>+ Add Storage</button>
          </div>
          <div className="flex gap-2">
            <button className="danger text-xs" onClick={() => simulateActivity('api', -1)}>Remove API Call</button>
            <button className="primary" onClick={() => simulateActivity('api', 1)}>Trigger API Call</button>
          </div>
        </div>
      </header>

      <div className="stats-row">
        <div className="card glass stat-card">
          <span className="stat-label">Current Plan</span>
          <span className="stat-value text-gradient">{user.plan_name}</span>
          <span className="text-xs text-text-muted mt-2">Active subscription</span>
        </div>
        <div className="card glass stat-card">
          <span className="stat-label">Total API Calls</span>
          <span className="stat-value">{totalCalls}</span>
          <span className="text-xs text-secondary mt-2">↑ 12% from last week</span>
        </div>
        <div className="card glass stat-card">
          <span className="stat-label">Current Storage</span>
          <span className="stat-value">{totalStorage} <span className="text-lg font-medium text-text-muted">MB</span></span>
          <span className="text-xs text-text-muted mt-2">of 500MB allowance</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card col-8 glass" style={{ minHeight: '400px' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl">API Usage Trends</h2>
            <span className="text-sm text-text-muted">7-day period</span>
          </div>
          <div style={{ height: '300px' }}>
            <Line data={chartData('API Calls', 'apiCalls', '#818cf8')} options={options} />
          </div>
        </div>
        
        <div className="card col-4 glass" style={{ minHeight: '400px' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl">Storage Trend</h2>
          </div>
          <div style={{ height: '300px' }}>
            <Line data={chartData('Storage (MB)', 'storage', '#10b981')} options={options} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
