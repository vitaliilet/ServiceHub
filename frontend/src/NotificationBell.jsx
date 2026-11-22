import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './NotificationBell.css';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const wrapperRef = useRef(null);

  const refresh = async () => {
    try {
      const response = await fetch('/api/workspace/notifications', { credentials: 'include' });
      if (!response.ok) throw new Error('Could not load notifications');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    refresh();
    const onClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = items.filter(item => !item.isRead).length;
  const latest = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const markRead = async (item) => {
    if (item.isRead) return;
    try {
      const tokenResponse = await fetch('/api/auth/csrf', { credentials: 'include' });
      if (!tokenResponse.ok) throw new Error('Security token unavailable');
      const csrf = await tokenResponse.json();
      const response = await fetch(`/api/workspace/notifications/${item.id}/read`, {
        method: 'PATCH', credentials: 'include', headers: { [csrf.headerName]: csrf.token }
      });
      if (!response.ok) throw new Error('Could not mark notification as read');
      setItems(current => current.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="sh-bell-wrap" ref={wrapperRef}>
      <button type="button" className="sh-bell-button" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(v => !v)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
        {unread > 0 && <span className="sh-bell-count">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && <div className="sh-bell-popover" role="dialog" aria-label="Recent notifications">
        <div className="sh-bell-heading"><strong>Notifications</strong><span>{unread ? `${unread} unread` : 'All caught up'}</span></div>
        <div className="sh-bell-list">
          {error && <p className="sh-bell-error">{error}</p>}
          {!error && latest.length === 0 && <p className="sh-bell-empty">No notifications yet.</p>}
          {latest.map(item => (
            <div key={item.id} className={`sh-bell-item ${!item.isRead ? 'sh-bell-unread' : ''}`}>
              <div className="sh-bell-item-top"><span className="sh-bell-dot"/><p>{/message/i.test(item.message) && /booking\s*#(\d+)/i.test(item.message) ? <Link className="sh-bell-notification-link" to={`/messages?booking=${item.message.match(/booking\s*#(\d+)/i)[1]}`} onClick={() => setOpen(false)}>{item.message}</Link> : item.message}</p></div>
              <div className="sh-bell-item-bottom"><small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</small>{!item.isRead && <button type="button" onClick={() => markRead(item)}>Mark read</button>}</div>
            </div>
          ))}
        </div>
        <div className="sh-bell-footer"><Link to="/workspace?tab=notifications" onClick={() => setOpen(false)}>View All Notifications</Link></div>
      </div>}
    </div>
  );
}
