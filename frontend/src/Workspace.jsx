import {useEffect,useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import './Workspace.css';
const api=async(path,method='GET',body)=>{
 const headers={};if(method!=='GET'){const r=await fetch('/api/auth/csrf',{credentials:'include'});if(!r.ok)throw Error('Security token unavailable');const c=await r.json();headers[c.headerName]=c.token;if(body)headers['Content-Type']='application/json';}
 const r=await fetch('/api/workspace'+path,{method,credentials:'include',headers,body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error(`Request failed (${r.status})`);return r.status===204?null:r.text().then(t=>t?JSON.parse(t):null);
};
export default function Workspace(){
 const [searchParams]=useSearchParams();
 const [tab,setTab]=useState(()=>['notifications','favorites'].includes(searchParams.get('tab'))?searchParams.get('tab'):'notifications'),[notifications,setNotifications]=useState([]),[favorites,setFavorites]=useState([]),[specialists,setSpecialists]=useState([]),[bookings,setBookings]=useState([]),[profile,setProfile]=useState(null),[bookingId,setBookingId]=useState(''),[messages,setMessages]=useState([]),[draft,setDraft]=useState(''),[error,setError]=useState('');
 const reload=async()=>{try{setError('');const auth=await fetch('/api/auth/me',{credentials:'include'});if(!auth.ok)throw Error('Please sign in');const u=await auth.json();setProfile(u);const [n,f,s,my,professional]=await Promise.allSettled([api('/notifications'),api('/favorites'),fetch('/api/specialists').then(r=>r.json()),fetch('/api/bookings/my',{credentials:'include'}).then(r=>r.ok?r.json():[]),fetch('/api/professionals/bookings',{credentials:'include'}).then(r=>r.ok?r.json():[])]);setNotifications(n.status==='fulfilled'?n.value:[]);setFavorites(f.status==='fulfilled'?f.value:[]);setSpecialists(s.status==='fulfilled'?s.value:[]);setBookings([...(my.status==='fulfilled'&&Array.isArray(my.value)?my.value:[]),...(professional.status==='fulfilled'&&Array.isArray(professional.value)?professional.value:[])]);}catch(e){setError(e.message)}};
 useEffect(()=>{reload()},[]);
 const act=async(path,method,body)=>{try{setError('');await api(path,method,body);await reload()}catch(e){setError(e.message)}};
 const loadMessages=async(id)=>{setBookingId(String(id));try{setError('');setMessages(await api('/messages/'+id))}catch(e){setError(e.message)}};
 const send=async(e)=>{e.preventDefault();if(!draft.trim())return;try{await api('/messages/'+bookingId,'POST',{body:draft});setDraft('');await loadMessages(bookingId)}catch(e){setError(e.message)}};
 const name=id=>specialists.find(s=>s.id===id)?.name||'Professional #'+id;
 return <div className="sh-workspace"><div className="sh-w-wrap"><Link to="/" className="sh-return-link">← Back to Home</Link><h1>My Workspace</h1><p>Notifications and saved professionals</p><div className="sh-w-tabs">{[['notifications','🔔 Notifications'],['favorites','♡ Favorites']].map(([id,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}</button>)}</div>{error&&<p className="sh-w-error">{error}</p>}
 {tab==='notifications'&&<section className="sh-w-panel"><h2>Notifications</h2>{notifications.length===0?<p>No notifications yet.</p>:notifications.map(n=><div className="sh-w-row" key={n.id}><div><strong>{n.message}</strong><small>{new Date(n.createdAt).toLocaleString()}</small></div>{!n.isRead&&<button onClick={()=>act('/notifications/'+n.id+'/read','PATCH')}>Mark read</button>}</div>)}</section>}
 {tab==='favorites'&&<section className="sh-w-panel"><h2>Saved professionals</h2>{profile?.role!=='CLIENT'&&<p>Favorites are available for clients.</p>}{favorites.length===0?<p>No favorites yet. Browse professionals on the home page.</p>:favorites.map(v=><div className="sh-w-row" key={v.id}><Link to={'/professionals/'+v.specialistId}>{name(v.specialistId)}</Link><button onClick={()=>act('/favorites/'+v.specialistId,'DELETE')}>Remove</button></div>)}</section>}

 </div></div>
}
