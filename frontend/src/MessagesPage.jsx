import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './MessagesPage.css';

async function request(path, method = 'GET', data) {
  const headers = {};
  if (method !== 'GET') {
    const tokenRes = await fetch('/api/auth/csrf', { credentials: 'include' });
    if (!tokenRes.ok) throw new Error('Could not get security token');
    const token = await tokenRes.json();
    headers[token.headerName] = token.token;
    if (data) headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(path, { method, credentials: 'include', headers, body: data ? JSON.stringify(data) : undefined });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const raw = await res.text();
  return raw ? JSON.parse(raw) : null;
}

export default function MessagesPage() {
  const [params, setParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [selected, setSelected] = useState(params.get('booking') || '');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const auth = await request('/api/auth/me');
        const results = await Promise.allSettled([
          request('/api/bookings/my'), request('/api/professionals/bookings'), request('/api/specialists')
        ]);
        if (!alive) return;
        const client = results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value : [];
        const pro = results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value : [];
        const unique = [...new Map([...client, ...pro].map(b => [String(b.id), b])).values()];
        unique.sort((a,b) => Number(b.id)-Number(a.id));
        setUser(auth);
        setBookings(unique);
        setSpecialists(results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value : []);
        if (!params.get('booking') && unique.length) setSelected(String(unique[0].id));
      } catch (e) { if (alive) setError(e.message); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    const load = async () => {
      try {
        const rows = await request(`/api/workspace/messages/${selected}`);
        if (alive) { setMessages(Array.isArray(rows) ? rows : []); setError(''); }
      } catch(e) { if (alive) setError(e.message); }
    };
    load();
    const timer = setInterval(load, 15000);
    return () => { alive = false; clearInterval(timer); };
  }, [selected]);

  const select = id => { setSelected(String(id)); setParams({ booking: String(id) }); setMessages([]); };
  const send = async e => {
    e.preventDefault();
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    try {
      await request(`/api/workspace/messages/${selected}`, 'POST', { body: draft.trim() });
      setDraft('');
      const rows = await request(`/api/workspace/messages/${selected}`);
      setMessages(Array.isArray(rows) ? rows : []);
      setError('');
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  };
  const filtered = useMemo(() => bookings.filter(b => {
    const specialist = specialists.find(s => String(s.id) === String(b.specialistId));
    return `${b.id} ${b.status} ${specialist?.name || ''}`.toLowerCase().includes(search.toLowerCase());
  }), [bookings, specialists, search]);
  const selectedBooking = bookings.find(b => String(b.id) === selected);
  const personName = b => specialists.find(s => String(s.id) === String(b.specialistId))?.name || `Booking #${b.id}`;
  return <main className="sh-msg-page"><div className="sh-msg-container">
    <Link className="sh-msg-back sh-return-link" to="/">← Back to Home</Link>
    <div className="sh-msg-title"><div><span className="sh-msg-eyebrow">SERVICEHUB / INBOX</span><h1>Messages</h1><p>Talk to clients and professionals about your bookings.</p></div><Link className="sh-msg-notifications" to="/workspace?tab=notifications">Notifications</Link></div>
    {error && <div role="alert" className="sh-msg-error">{error}</div>}
    <div className="sh-msg-layout"><aside className="sh-msg-sidebar"><div className="sh-msg-sidebar-top"><h2>Conversations <span>{bookings.length}</span></h2><input aria-label="Search conversations" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations..." /></div>
      <div className="sh-msg-conversations">{loading && <p className="sh-msg-muted">Loading conversations...</p>}{!loading && !filtered.length && <p className="sh-msg-muted">No conversations found.</p>}{filtered.map(b => <button key={b.id} className={`sh-msg-conversation ${selected === String(b.id) ? 'active' : ''}`} onClick={() => select(b.id)}><span className="sh-msg-avatar">{personName(b).charAt(0).toUpperCase()}</span><span className="sh-msg-conversation-body"><strong>{personName(b)}</strong><small>Booking #{b.id} · {b.bookingDate || 'Appointment'}</small></span><span className="sh-msg-status">{b.status}</span></button>)}</div>
    </aside><section className="sh-msg-chat-area">{selectedBooking ? <><div className="sh-msg-chat-heading"><div className="sh-msg-avatar">{personName(selectedBooking).charAt(0).toUpperCase()}</div><div><h2>{personName(selectedBooking)}</h2><p>Booking #{selectedBooking.id} · {selectedBooking.status}</p></div></div><div className="sh-msg-thread" aria-live="polite">{!messages.length && <p className="sh-msg-empty">No messages yet. Start the conversation!</p>}{messages.map(m=><div key={m.id} className={`sh-msg-bubble ${String(m.senderId) === String(user?.id) ? 'mine' : ''}`}><strong>{String(m.senderId) === String(user?.id) ? 'You' : 'Other participant'}</strong><p>{m.body}</p><small>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</small></div>)}</div><form className="sh-msg-compose" onSubmit={send}><input value={draft} maxLength={2000} onChange={e=>setDraft(e.target.value)} placeholder="Type your message..." aria-label="Message"/><button disabled={!draft.trim() || sending}>{sending ? 'Sending...' : 'Send ↗'}</button></form></> : <div className="sh-msg-empty-chat"><span>💬</span><h2>Select a conversation</h2><p>Choose a booking from the left to start chatting.</p></div>}</section></div>
  </div></main>;
}
