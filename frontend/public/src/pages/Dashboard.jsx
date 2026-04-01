import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import api from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [usage, setUsage] = useState({ apiCalls: [], storage: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await api.get('/usage');
      setUsage(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const simulateApiCall = async () => {
    try {
      await api.post('/usage/api-call');
      fetchUsage(); // refresh
    } catch (err) {
      alert('Failed to record API call');
    }
  };

  const simulateStorage = async () => {
    try {
      // Add random MB between 1 and 50
      const mb = Math.floor(Math.random() * 50) + 1;
      await api.post('/usage/storage', { mb });
      fetchUsage();
    } catch (err) {
      alert('Failed to record storage');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div>Loading...</div>;

  const apiChartData = {
    labels: usage.apiCalls.map(d => d.date),
    datasets: [{ label: 'API Calls', data: usage.apiCalls.map(d => d.count), borderColor: 'blue', fill: false }]
  };
  const storageChartData = {
    labels: usage.storage.map(d => d.date),
    datasets: [{ label: 'Storage (MB)', data: usage.storage.map(d => d.mb), backgroundColor: 'green' }]
  };

  return (
    <div>
      <h2>Welcome, {user.email}</h2>
      <button onClick={logout}>Logout</button>
      <p>Plan: {user.plan_name}</p>

      <div>
        <button onClick={simulateApiCall}>Simulate API Call</button>
        <button onClick={simulateStorage}>Simulate Storage Usage</button>
      </div>

      <h3>API Calls (Last 7 days)</h3>
      <Line data={apiChartData} />

      <h3>Storage Used (Last 7 days)</h3>
      <Bar data={storageChartData} />

      {user.role === 'admin' && (
        <button onClick={() => navigate('/admin')}>Admin Panel</button>
      )}
    </div>
  );
}

export default Dashboard;