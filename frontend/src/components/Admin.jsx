import { useState, useEffect } from 'react'
import axios from 'axios'

function Admin() {
  const [users, setUsers] = useState([])
  const [plans, setPlans] = useState([])
  const [newPlan, setNewPlan] = useState({ name: '', price: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [uRes, pRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/plans')
      ])
      setUsers(uRes.data)
      setPlans(pRes.data)
    } finally {
      setLoading(false)
    }
  }

  const changeUserPlan = async (userId, planId) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/plan`, { planId })
      fetchData()
    } catch {
      alert('Failed to update plan')
    }
  }

  const handleAddPlan = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/admin/plans', newPlan)
      setNewPlan({ name: '', price: 0 })
      fetchData()
    } catch {
      alert('Failed to add plan')
    }
  }

  if (loading) return <div>Loading Admin Panel...</div>

  return (
    <div className="grid-2">
      <div className="card">
        <h2 className="text-xl font-bold mb-4">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-2">Email</th>
                <th className="py-2">Plan</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-800">
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.plan_name}</td>
                  <td className="py-2">
                    <select 
                      className="bg-slate-900 border-slate-700 text-sm p-1 rounded"
                      value={u.plan_id}
                      onChange={(e) => changeUserPlan(u.id, e.target.value)}
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Plan Management</h2>
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Existing Plans</h3>
          <ul className="space-y-2">
            {plans.map(p => (
              <li key={p.id} className="flex justify-between items-center text-slate-300">
                <span>{p.name}</span>
                <span className="font-mono">${Number(p.price).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <form onSubmit={handleAddPlan} className="border-t border-slate-700 pt-4">
          <h3 className="text-sm font-medium mb-3">Add New Plan</h3>
          <input 
            placeholder="Plan Name" 
            value={newPlan.name} 
            onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
            required
          />
          <input 
            type="number" 
            placeholder="Price" 
            value={newPlan.price} 
            onChange={(e) => setNewPlan({...newPlan, price: e.target.value})}
            required
            step="0.01"
          />
          <button type="submit">Create Plan</button>
        </form>
      </div>
    </div>
  )
}

export default Admin
