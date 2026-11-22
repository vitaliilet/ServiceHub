import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import './ClientProfile.css';

const empty={name:'',phone:'',city:'',address:''};
const fmtDate=b=>[b.bookingDate,b.bookingTime?.slice(0,5)].filter(Boolean).join(' · ');
export default function ClientProfile(){
 const [user,setUser]=useState(null),[form,setForm]=useState(empty),[bookings,setBookings]=useState([]),[reviews,setReviews]=useState([]),[specialists,setSpecialists]=useState([]);
 const [loading,setLoading]=useState(true),[editing,setEditing]=useState(false),[saving,setSaving]=useState(false),[photo,setPhoto]=useState(null),[message,setMessage]=useState(''),[tab,setTab]=useState('all');
 const load=async()=>{
  try{
   const r=await fetch('/api/clients/me',{credentials:'include'});
   if(!r.ok){setMessage(r.status===401?'Your session has expired. Please sign in again.':r.status===403?'Profile access was denied. Check that the Java backend was restarted after installing the update.':`Could not load profile (HTTP ${r.status}). Please check the backend.`);return;}
   const data=await r.json();setUser(data);setForm({name:data.name||'',phone:data.phone||'',city:data.city||'',address:data.address||''});
   const results=await Promise.allSettled([fetch('/api/bookings/my',{credentials:'include'}),fetch('/api/reviews/my',{credentials:'include'}),fetch('/api/specialists')]);
   const values=await Promise.all(results.map(async x=>x.status==='fulfilled'&&x.value.ok?x.value.json():[]));
   setBookings(Array.isArray(values[0])?values[0]:[]);setReviews(Array.isArray(values[1])?values[1]:[]);setSpecialists(Array.isArray(values[2])?values[2]:[]);
  }catch(e){setMessage('Could not load your profile. Please refresh the page.')}finally{setLoading(false)}
 };
 useEffect(()=>{load()},[]);
 const csrf=async()=>{const r=await fetch('/api/auth/csrf',{credentials:'include'});if(!r.ok)throw Error('Security token unavailable');return r.json()};
 const save=async(e)=>{e.preventDefault();setSaving(true);setMessage('');try{const token=await csrf();const r=await fetch('/api/clients/me',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json',[token.headerName]:token.token},body:JSON.stringify(form)});const data=await r.json();if(!r.ok)throw Error(data.message||'Could not save profile');setUser(data);setEditing(false);setMessage('Profile saved successfully.')}catch(e){setMessage(e.message)}finally{setSaving(false)}};
 const upload=async()=>{if(!photo)return;setSaving(true);setMessage('');try{const token=await csrf();const body=new FormData();body.append('file',photo);const r=await fetch('/api/clients/me/photo',{method:'POST',credentials:'include',headers:{[token.headerName]:token.token},body});const data=await r.json();if(!r.ok)throw Error(data.message||'Upload failed');setUser(data);setPhoto(null);setMessage('Photo updated successfully.')}catch(e){setMessage(e.message)}finally{setSaving(false)}};
 const completed=bookings.filter(b=>b.status==='COMPLETED');
 const past=bookings.filter(b=>['COMPLETED','CANCELLED'].includes(b.status));
 const active=bookings.filter(b=>!['COMPLETED','CANCELLED'].includes(b.status));
 const shown=tab==='active'?active:tab==='history'?past:bookings;
 const specialistName=id=>specialists.find(s=>Number(s.id)===Number(id))?.name||`Professional #${id}`;
 if(loading)return <div className="client-profile-page"><p>Loading your profile...</p></div>;
 if(!user)return <div className="client-profile-page"><div className="client-wrap"><h1>My Profile</h1><p role="alert">{message||'Could not load your profile.'}</p><button className="client-button" onClick={()=>{setLoading(true);load()}}>Try Again</button> <Link to="/" className="sh-return-link">Back to Home</Link> {message.includes('expired')&&<Link to="/login">Sign In</Link>}</div></div>;
 return <div className="client-profile-page">
  <header className="client-top"><Link to="/" className="client-brand">Service<span>Hub</span></Link><nav><Link to="/">Home</Link><Link to="/my-bookings">My Bookings</Link><span className="client-current">Profile</span></nav></header>
  <main className="client-wrap">
   <Link to="/" className="client-button subtle sh-return-link" style={{display:"inline-flex",alignItems:"center",gap:8,textDecoration:"none",marginBottom:18,padding:"9px 15px"}}>← Back to Home</Link>
   <div className="client-title"><div><p className="client-eyebrow">CLIENT ACCOUNT</p><h1>My Profile</h1><p>Manage your personal details, bookings and reviews.</p></div><span className="client-role">● Client</span></div>
   <section className="client-panel"><div className="client-identity"><div className="client-avatar">{user.imageUrl?<img src={user.imageUrl} alt="Profile"/>:<span>{user.name?.charAt(0)?.toUpperCase()||'U'}</span>}</div><div className="client-identity-text"><h2>{user.name}</h2><p>{user.email}</p><span>Client account</span></div><button className="client-button" onClick={()=>setEditing(!editing)}>{editing?'Cancel':'Edit Profile'}</button></div>
    <div className="client-photo"><label>Profile photo <input type="file" accept="image/png,image/jpeg" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label><button className="client-button subtle" disabled={!photo||saving} onClick={upload}>{saving?'Please wait...':'Upload Photo'}</button></div>
    {message&&<p className="client-message" role="status">{message}</p>}
    {editing?<form className="client-edit" onSubmit={save}><label>Full name<input required maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Phone<input maxLength={30} type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>City<input maxLength={120} value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label><label>Address<input maxLength={300} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label><button disabled={saving} className="client-button">{saving?'Saving...':'Save Changes'}</button></form>:<div className="client-info">{[['Phone',user.phone],['City',user.city],['Address',user.address]].map(([k,v])=><div key={k}><small>{k}</small><strong>{v||'Not provided'}</strong></div>)}</div>}
   </section>
   <div className="client-stats">{[['Total Orders',bookings.length],['Active Bookings',active.length],['Completed',completed.length],['My Reviews',reviews.length]].map(([label,num])=><div className="client-stat" key={label}><small>{label}</small><strong>{num}</strong></div>)}</div>
   <section className="client-panel"><div className="client-section-head"><div><h2>My Bookings & Order History</h2><p>All your appointments in one place</p></div><Link to="/my-bookings">Manage Bookings</Link></div><div className="client-tabs">{[['all','All Orders'],['active','Active'],['history','History']].map(([key,label])=><button key={key} className={tab===key?'selected':''} onClick={()=>setTab(key)}>{label}</button>)}</div><div className="client-orders">{shown.length===0?<p className="client-empty">No orders in this section yet.</p>:shown.slice().sort((a,b)=>String(b.bookingDate||'').localeCompare(String(a.bookingDate||''))).map(b=><div className="client-order" key={b.id}><div><strong>{specialistName(b.specialistId)}</strong><small>{fmtDate(b)}</small></div><span className={'client-status status-'+(b.status||'').toLowerCase()}>{b.status||'Unknown'}</span></div>)}</div></section>
   <section className="client-panel"><div className="client-section-head"><div><h2>My Reviews</h2><p>Feedback you've left for professionals</p></div></div>{reviews.length===0?<p className="client-empty">You haven't written any reviews yet.</p>:reviews.map(r=><div className="client-review" key={r.id}><div><strong>{specialistName(r.specialistId)}</strong><span>{'★'.repeat(Math.max(0,Math.min(5,r.rating)))}</span></div><p>{r.comment}</p></div>)}</section>
  </main>
 </div>
}
