import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Plus, Search, Trash2, X, Sparkles, CalendarCheck, ListTodo, BellRing } from 'lucide-react';

const KEY='nao-me-esqueca-events-v1';
const todayISO=()=>{const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const seed=[];
const colors={Pessoal:'#8b7cf6',Trabalho:'#36a6a0',Saúde:'#e58a9a',Estudos:'#e6ad57',Outros:'#8292a8'};
const fmt=(s)=>new Date(`${s}T12:00:00`).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
function App(){
 const [events,setEvents]=useState(()=>{try{return JSON.parse(localStorage.getItem(KEY))||seed}catch{return seed}});
 const [month,setMonth]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1)});
 const [selected,setSelected]=useState(todayISO());
 const [modal,setModal]=useState(false);
 const [editing,setEditing]=useState(null);
 const [query,setQuery]=useState('');
 const [permission,setPermission]=useState(typeof Notification==='undefined'?'unsupported':Notification.permission);
 const [form,setForm]=useState({title:'',date:todayISO(),time:'09:00',category:'Pessoal',notes:''});
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(events)),[events]);
 useEffect(()=>{
   const check=()=>{
    if(typeof Notification==='undefined'||Notification.permission!=='granted')return;
    const now=new Date();
    events.forEach(e=>{
      const due=new Date(`${e.date}T${e.time||'09:00'}:00`);
      const dayBefore=new Date(due);dayBefore.setDate(dayBefore.getDate()-1);
      const keyNow=now.toISOString().slice(0,16);
      const dateKey=now.toISOString().slice(0,10);
      const sent=JSON.parse(localStorage.getItem('nao-me-esqueca-sent')||'{}');
      const send=(kind,msg)=>{const k=`${e.id}-${kind}`;if(!sent[k]){new Notification('Não me esqueça',{body:msg,icon:'/icon.svg'});sent[k]=true;localStorage.setItem('nao-me-esqueca-sent',JSON.stringify(sent));}};
      if(dayBefore.toDateString()===now.toDateString() && now.getHours()>=9)send('before',`Amanhã: ${e.title} às ${e.time}.`);
      if(due.toDateString()===now.toDateString() && now.getHours()>=8)send('today',`Hoje: ${e.title} às ${e.time}.`);
    });
   };
   check();const id=setInterval(check,60000);return()=>clearInterval(id);
 },[events]);
 const year=month.getFullYear(), mon=month.getMonth();
 const first=new Date(year,mon,1).getDay(), days=new Date(year,mon+1,0).getDate();
 const cells=[...Array(first).fill(null),...Array.from({length:days},(_,i)=>i+1)];
 while(cells.length%7)cells.push(null);
 const monthName=month.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 const dayEvents=events.filter(e=>e.date===selected).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
 const upcoming=events.filter(e=>e.date>=todayISO()).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const filtered=upcoming.filter(e=>(e.title+' '+e.category).toLowerCase().includes(query.toLowerCase()));
 const countToday=events.filter(e=>e.date===todayISO()).length;
 const openNew=()=>{setEditing(null);setForm({title:'',date:selected,time:'09:00',category:'Pessoal',notes:''});setModal(true)};
 const save=()=>{if(!form.title.trim()||!form.date)return;const item={...form,id:editing||crypto.randomUUID()};setEvents(prev=>editing?prev.map(e=>e.id===editing?item:e):[...prev,item]);setModal(false)};
 const edit=e=>{setEditing(e.id);setForm({title:e.title,date:e.date,time:e.time,category:e.category,notes:e.notes||''});setModal(true)};
 const askPermission=async()=>{if(!('Notification'in window))return;const p=await Notification.requestPermission();setPermission(p);if(p==='granted')new Notification('Não me esqueça',{body:'Avisos ativados! Você receberá lembretes enquanto o app estiver aberto.'})};
 return <div className="app-shell">
  <aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkles size={22}/></div><div><b>Não me esqueça</b><small>Seu tempo, bem cuidado.</small></div></div>
   <div className="side-label">MENU</div><button className="nav active"><CalendarDays size={18}/> Calendário</button><button className="nav" onClick={()=>document.getElementById('upcoming')?.scrollIntoView({behavior:'smooth'})}><ListTodo size={18}/> Próximos compromissos</button>
   <div className="side-bottom"><div className="tip"><Sparkles size={17}/><b>Um dia de cada vez.</b><p>Organize seus compromissos e deixe os lembretes cuidarem do resto.</p></div><div className="profile"><div className="avatar">N</div><div><b>Meu espaço</b><small>Agenda pessoal</small></div></div></div>
  </aside>
  <main className="main"><header className="topbar"><div><span className="eyebrow">SUA AGENDA PESSOAL</span><h1>Bom te ver por aqui <span>✦</span></h1><p>Não deixe nenhum momento importante passar.</p></div><button className={`notify ${permission==='granted'?'enabled':''}`} onClick={askPermission}><Bell size={17}/>{permission==='granted'?'Avisos ativados':'Ativar avisos'}</button></header>
   <section className="stats"><div className="stat-card"><div className="stat-icon purple"><CalendarCheck size={20}/></div><div><small>Compromissos futuros</small><strong>{upcoming.length}</strong></div></div><div className="stat-card"><div className="stat-icon coral"><BellRing size={20}/></div><div><small>Para hoje</small><strong>{countToday}</strong></div></div><div className="stat-card"><div className="stat-icon mint"><Clock3 size={20}/></div><div><small>Próximo compromisso</small><strong className="next-stat">{upcoming[0]?fmt(upcoming[0].date):'Tudo livre'}</strong></div></div></section>
   <div className="content-grid"><section className="panel calendar-panel"><div className="panel-head"><div><span className="eyebrow">VISÃO GERAL</span><h2>Calendário</h2></div><button className="add-btn" onClick={openNew}><Plus size={17}/> Novo compromisso</button></div>
    <div className="month-bar"><button className="arrow" onClick={()=>setMonth(new Date(year,mon-1,1))}><ChevronLeft/></button><h3>{monthName}</h3><button className="arrow" onClick={()=>setMonth(new Date(year,mon+1,1))}><ChevronRight/></button><button className="today-btn" onClick={()=>{setMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1));setSelected(todayISO())}}>Hoje</button></div>
    <div className="calendar"><div className="weekdays">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=><span key={x}>{x}</span>)}</div><div className="days">{cells.map((d,i)=>{const iso=d?`${year}-${String(mon+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`:'';const has=events.filter(e=>e.date===iso);return <button key={i} disabled={!d} className={`day ${iso===selected?'selected':''} ${iso===todayISO()?'is-today':''}`} onClick={()=>setSelected(iso)}><span>{d||''}</span>{has.length>0&&<div className="dots">{has.slice(0,3).map((e,j)=><i key={j} style={{background:colors[e.category]||colors.Outros}}/>)}</div>}</button>})}</div></div>
    <div className="legend">{Object.entries(colors).map(([k,v])=><span key={k}><i style={{background:v}}/>{k}</span>)}</div>
   </section>
   <section className="panel selected-panel"><div className="panel-head"><div><span className="eyebrow">AGENDA DO DIA</span><h2>{fmt(selected)}</h2></div><span className="count-pill">{dayEvents.length} {dayEvents.length===1?'evento':'eventos'}</span></div>
    {dayEvents.length===0?<div className="empty"><div className="empty-icon"><CalendarDays size={26}/></div><b>Nenhum compromisso por aqui</b><p>Esse dia está livre. Que tal aproveitar ou adicionar algo?</p><button className="text-btn" onClick={openNew}><Plus size={16}/> Adicionar compromisso</button></div>:<div className="event-list">{dayEvents.map(e=><article className="event" key={e.id} onClick={()=>edit(e)}><div className="event-time">{e.time}</div><div className="event-line" style={{background:colors[e.category]||colors.Outros}}/><div className="event-info"><b>{e.title}</b><span>{e.category}{e.notes?' · '+e.notes:''}</span></div><button className="delete" title="Excluir" onClick={ev=>{ev.stopPropagation();setEvents(prev=>prev.filter(x=>x.id!==e.id))}}><Trash2 size={16}/></button></article>)}</div>}
   </section></div>
   <section className="panel upcoming-panel" id="upcoming"><div className="panel-head"><div><span className="eyebrow">FIQUE POR DENTRO</span><h2>Próximos compromissos</h2></div><div className="search"><Search size={16}/><input placeholder="Buscar compromisso..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
    {filtered.length===0?<p className="muted empty-up">Nenhum compromisso encontrado.</p>:<div className="upcoming-list">{filtered.slice(0,6).map(e=><div className="upcoming-row" key={e.id} onClick={()=>{setSelected(e.date);setMonth(new Date(e.date+'T12:00:00'));}}><div className="date-tile"><b>{new Date(e.date+'T12:00:00').getDate()}</b><span>{new Date(e.date+'T12:00:00').toLocaleDateString('pt-BR',{month:'short'})}</span></div><div className="upcoming-desc"><b>{e.title}</b><span>{fmt(e.date)} · {e.time}</span></div><span className="category" style={{'--cat':colors[e.category]||colors.Outros}}>{e.category}</span><ChevronRight size={17} className="row-chevron"/></div>)}</div>}
   </section>
   <footer>Feito para você não esquecer do que importa. <span>✦</span></footer>
  </main>
  {modal&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setModal(false)}><div className="modal"><div className="modal-head"><div><span className="eyebrow">ORGANIZE SEU TEMPO</span><h2>{editing?'Editar compromisso':'Novo compromisso'}</h2></div><button className="close" onClick={()=>setModal(false)}><X/></button></div><label>O que você precisa lembrar?<input autoFocus placeholder="Ex.: Consulta, reunião, aniversário..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><div className="form-row"><label>Data<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Horário<input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label></div><label>Categoria<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{Object.keys(colors).map(c=><option key={c}>{c}</option>)}</select></label><label>Observações <span className="optional">(opcional)</span><textarea rows="3" placeholder="Endereço, detalhes ou algo importante..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><div className="reminder-note"><BellRing size={17}/><span><b>Lembretes automáticos</b><small>Um aviso no dia anterior e outro no dia do compromisso.</small></span></div><div className="modal-actions"><button className="cancel" onClick={()=>setModal(false)}>Cancelar</button><button className="save" onClick={save} disabled={!form.title.trim()}> <Check size={17}/> Salvar compromisso</button></div></div></div>}
 </div>
}
export default App;