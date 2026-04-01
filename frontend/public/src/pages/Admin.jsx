import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function Admin() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [plans, setPlans] = useState([])
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanPrice, setNewPlanPrice] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchPlans()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPlans = async () => {
    try {
      const res = await api.get('/admin/plans')
      setPlans(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const updateUserPlan = async (userId, planId) => {
    try {
      await api.patch(`/admin/users/${userId}/plan`, { planId })
      fetchUsers()
    } catch (err) {
      alert('Failed to update plan')
    }
  }

  const createPlan = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/plans', { name: newPlanName, price: parseFloat(newPlanPrice) })
      setNewPlanName('')
      setNewPlanPrice('')
      fetchPlans()
    } catch (err) {
      alert('Failed to create plan')
    }
  }

  return (
    <div>
      <h2>Admin Panel</h2>
      <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>

      <h3>Plans</h3>
      <ul>
        {plans.map(plan => (
          <li key={plan.id}>{plan.name} - ${plan.price}/month</li>
        ))}
      </ul>
      <form onSubmit={createPlan}>
        <input placeholder="Plan name" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} required />
        <input placeholder="Price" type="number" step="0.01" value={newPlanPrice} onChange={e => setNewPlanPrice(e.target.value)} required />
        <button type="submit">Create Plan</button>
      </form>

      <h3>Users</h3>
      <table border="1">
        <thead>
          <tr><th>Email</th><th>Plan</th><th>Action</th></tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.plan_name}</td>
              <td>
                <select onChange={e => updateUserPlan(user.id, e.target.value)} defaultValue={user.plan_id}>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Admin