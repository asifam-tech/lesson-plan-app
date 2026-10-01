import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { getNotifications, markNotificationRead } from '../services/miscService';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(({ data }) => setItems(data.notifications))
      .finally(() => setLoading(false));
  }, []);

  async function handleRead(id) {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      // non-critical, ignore
    }
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Updates on your lesson plan reviews and comments.</p>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <div className="empty-state">No notifications yet.</div>}

      {items.map((n) => (
        <div
          key={n.id}
          className="card"
          style={{
            marginBottom: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: n.is_read ? 0.6 : 1,
          }}
        >
          <div>
            <p style={{ margin: 0 }}>{n.message}</p>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {new Date(n.created_at).toLocaleString()}
            </span>
          </div>
          {!n.is_read && (
            <button className="btn btn-secondary" onClick={() => handleRead(n.id)}>
              Mark read
            </button>
          )}
        </div>
      ))}
    </DashboardLayout>
  );
}
