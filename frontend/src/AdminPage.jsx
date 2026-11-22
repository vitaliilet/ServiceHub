import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminPage.css';

const menu = [
  { id:'overview', icon:'◫', label:'Overview' },
  { id:'users', icon:'♙', label:'Users' },
  { id:'bookings', icon:'▦', label:'Bookings' },
  { id:'reviews', icon:'☆', label:'Reviews' }
];
const columns = {
  users:['ID','User','Email','Role','Status','Actions'],
  bookings:['ID','Customer','Specialist ID','Date & time','Status','Actions'],
  reviews:['ID','Booking ID','Specialist ID','Rating','Comment','Actions']
};
const normalize = v => String(v ?? '').toLowerCase();

export default function AdminPage() {
  const [data,setData] = useState(null);
  const [tab,setTab] = useState('overview');
  const [search,setSearch] = useState('');
  const [status,setStatus] = useState('all');
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState('');
  const [loading,setLoading] = useState(true);

  const load = async () => {
    try {
      const keys=['summary','users','bookings','reviews'];
      const results=await Promise.all(keys.map(async key => {
        const r=await fetch('/api/admin/'+key,{credentials:'include'});
        if (!r.ok) throw new Error(r.status===403?'Administrator access required':`Failed to load ${key} (${r.status})`);
        return r.json();
      }));
      setData(Object.fromEntries(keys.map((k,i)=>[k,results[i]])));
      setError('');
    } catch(e) {setError(e.message)} finally {setLoading(false)}
  };
  useEffect(()=>{load()},[]);
  const csrf = async () => {
    const r=await fetch('/api/auth/csrf',{credentials:'include'});
    if(!r.ok) throw new Error('Could not obtain CSRF token');
    const c=await r.json();return {[c.headerName]:c.token};
  };
  const change = async (path,method,body,confirmText) => {
    if(confirmText && !window.confirm(confirmText)) return;
    setBusy(path);setNotice('');setError('');
    try {
      const headers=await csrf();
      if(body) headers['Content-Type']='application/json';
      const r=await fetch('/api/admin/'+path,{method,credentials:'include',headers,body:body?JSON.stringify(body):undefined});
      if(!r.ok) {let message='Request failed ('+r.status+')';try{message=(await r.json()).message||message}catch{}throw new Error(message)}
      setNotice('Changes saved successfully.');await load();
    }catch(e){setError(e.message)}finally{setBusy('')}
  };
  const rows=useMemo(()=>{
    if(!data || tab==='overview')return [];
    return (data[tab]||[]).filter(row=>{
      const match=Object.values(row).some(v=>normalize(v).includes(search.toLowerCase()));
      const state=tab==='users'?(row.blocked?'blocked':'active'):tab==='bookings'?normalize(row.status):'all';
      return match&&(status==='all'||state===status);
    });
  },[data,tab,search,status]);
  const go=t=>{setTab(t);setSearch('');setStatus('all');setError('');setNotice('')};
  const stats=data?.summary||{};
  const cards=[['Users',stats.users,'♙'],['Professionals',stats.professionals,'♧'],['Bookings',stats.bookings,'▦'],['Reviews',stats.reviews,'☆'],['Upcoming',stats.upcoming,'◷'],['Suspended',stats.blocked,'⊘']];
  return <div className="adm-layout">
    <aside className="adm-sidebar">
      <Link to="/" className="adm-brand">Service<span>Hub</span><small>ADMIN CONSOLE</small></Link>
      <div className="adm-nav-label">WORKSPACE</div>
      <nav aria-label="Admin navigation">{menu.map(item=><button key={item.id} className={'adm-nav-item '+(tab===item.id?'active':'')} onClick={()=>go(item.id)}><span className="adm-nav-icon">{item.icon}</span>{item.label}</button>)}</nav>
      <div className="adm-sidebar-bottom"><Link to="/" className="sh-return-link">← Back to website</Link><span>ServiceHub Administration</span></div>
    </aside>
    <main className="adm-main">
      <header className="adm-top"><div><div className="adm-eyebrow">MANAGEMENT CENTER</div><h1>{menu.find(m=>m.id===tab)?.label}</h1><p>Manage your marketplace with confidence.</p></div><button className="adm-refresh" onClick={load} disabled={loading||!!busy}>↻ Refresh</button></header>
      {error&&<div className="adm-alert" role="alert">{error}</div>}
      {notice&&<div className="adm-notice" role="status">{notice}</div>}
      {loading?<div className="adm-panel">Loading admin data…</div>:!data?<div className="adm-panel">Could not load admin dashboard. Make sure you are signed in as an administrator.</div>:<>
        {tab==='overview'?<>
          <section className="adm-stat-grid">{cards.map(([label,value,icon])=><div className="adm-stat" key={label}><div className="adm-stat-head"><span>{label}</span><span className="adm-stat-icon">{icon}</span></div><strong>{value??'—'}</strong><small>Platform total</small></div>)}</section>
          <div className="adm-overview-grid"><section className="adm-panel"><div className="adm-panel-heading"><h2>Recent bookings</h2><button onClick={()=>go('bookings')}>View all →</button></div>{[...data.bookings].sort((a,b)=>b.id-a.id).slice(0,6).map(b=><div className="adm-activity" key={b.id}><div><strong>Booking #{b.id}</strong><small>{b.customerName||b.customerEmail||'Customer'} · {b.bookingDate||'No date'}</small></div><span className={'adm-pill '+normalize(b.status)}>{b.status}</span></div>)}{!data.bookings.length&&<p className="adm-muted">No bookings yet.</p>}</section><section className="adm-panel"><div className="adm-panel-heading"><h2>Quick actions</h2></div><p className="adm-muted">Manage your users, review feedback and handle bookings.</p>{menu.slice(1).map(m=><button className="adm-quick" key={m.id} onClick={()=>go(m.id)}>{m.icon} &nbsp; Manage {m.label.toLowerCase()} <span>→</span></button>)}</section></div>
        </>:<section className="adm-panel adm-data-panel"><div className="adm-panel-heading"><div><h2>{menu.find(m=>m.id===tab)?.label} management</h2><p>{rows.length} result{rows.length===1?'':'s'}</p></div></div><div className="adm-filters"><input aria-label="Search records" placeholder={'Search '+tab+'…'} value={search} onChange={e=>setSearch(e.target.value)}/>{tab!=='reviews'&&<select aria-label="Filter status" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option>{(tab==='users'?['active','blocked']:['confirmed','pending','completed','cancelled']).map(v=><option key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select>}</div><div className="adm-table-wrap"><table><thead><tr>{columns[tab].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}>{tab==='users'?<><td>#{row.id}</td><td><strong>{row.name}</strong>{row.city&&<small className="adm-cell-sub">{row.city}</small>}</td><td>{row.email}</td><td><span className="adm-role">{row.role}</span></td><td><span className={'adm-pill '+(row.blocked?'blocked':'active')}>{row.blocked?'Suspended':'Active'}</span></td><td>{row.role==='ADMIN'?<span className="adm-muted">Protected</span>:<button className={'adm-action '+(row.blocked?'restore':'danger')} disabled={!!busy} onClick={()=>change(`users/${row.id}/blocked`,'PATCH',{blocked:!row.blocked},`${row.blocked?'Unblock':'Suspend'} ${row.name}?`)}>{row.blocked?'Unblock':'Suspend'}</button>}</td></>:tab==='bookings'?<><td>#{row.id}</td><td><strong>{row.customerName||'—'}</strong><small className="adm-cell-sub">{row.customerEmail||''}</small></td><td>#{row.specialistId}</td><td>{row.bookingDate||'—'}<small className="adm-cell-sub">{row.bookingTime||''}</small></td><td><span className={'adm-pill '+normalize(row.status)}>{row.status||'—'}</span></td><td>{normalize(row.status)==='cancelled'?<span className="adm-muted">Cancelled</span>:<button className="adm-action danger" disabled={!!busy} onClick={()=>change(`bookings/${row.id}/cancel`,'PATCH',null,`Cancel booking #${row.id}?`)}>Cancel</button>}</td></>:<><td>#{row.id}</td><td>#{row.bookingId}</td><td>#{row.specialistId}</td><td><span className="adm-rating">★ {row.rating}/5</span></td><td className="adm-comment" title={row.comment||''}>{row.comment||'—'}</td><td><button className="adm-action danger" disabled={!!busy} onClick={()=>change(`reviews/${row.id}`,'DELETE',null,`Permanently delete review #${row.id}?`)}>Delete</button></td></>}</tr>)}</tbody></table>{!rows.length&&<div className="adm-empty">No matching records found.</div>}</div></section>}
      </>}
    </main>
  </div>;
}
