import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlarmClock, ArrowDownToLine, Bell, BellRing, CalendarDays, Check, CheckCircle2,
  ChevronLeft, ChevronRight, Circle, Clock3, Download, FileUp, MapPin, Menu,
  MoreHorizontal, Plus, Search, SlidersHorizontal, Sparkles, Tag, Trash2, X
} from 'lucide-react';

const STORAGE_KEY = 'nao-me-esqueca-events-v2';
const OLD_KEY = 'nao-me-esqueca-events-v1';
const CATEGORIES = ['Pessoal', 'Trabalho', 'Saúde', 'Estudos', 'Família', 'Lazer', 'Outros'];
const CATEGORY_COLORS = { Pessoal:'#8B6E5A', Trabalho:'#557C78', Saúde:'#B86F78', Estudos:'#7183A5', Família:'#A17B9B', Lazer:'#B28B4E', Outros:'#85858A' };
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const dateObj = value => new Date(`${value}T12:00:00`);
const formatDate = value => dateObj(value).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const emptyForm = date => ({ title:'', date:date || todayISO(), time:'09:00', category:'Pessoal', priority:'Normal', location:'', notes:'', duration:'60' });

function App(){
  const [events,setEvents] = useState(()=>{
    try { const current=localStorage.getItem(STORAGE_KEY); if(current) return JSON.parse(current); const old=localStorage.getItem(OLD_KEY); return old ? JSON.parse(old) : []; }
    catch { return []; }
  });
  const [month,setMonth] = useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1)});
  const [selected,setSelected] = useState(todayISO());
  const [modal,setModal] = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState(emptyForm(todayISO()));
  const [query,setQuery] = useState('');
  const [filter,setFilter] = useState('Todos');
  const [categoryFilter,setCategoryFilter] = useState('Todas');
  const [permission,setPermission] = useState(typeof Notification==='undefined'?'unsupported':Notification.permission);
  const [toast,setToast] = useState('');
  const importRef = useRef(null);

  useEffect(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(events));},[events]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2800);return()=>clearTimeout(t)},[toast]);

  // Lembretes locais: são verificados enquanto o app está aberto. O horário usa a data local do dispositivo.
  useEffect(()=>{
    const checkReminders=()=>{
      if(typeof Notification==='undefined'||Notification.permission!=='granted') return;
      const now=new Date();
      const sent=JSON.parse(localStorage.getItem('nao-me-esqueca-sent-v2')||'{}');
      const localToday=todayISO();
      events.filter(e=>!e.completed).forEach(e=>{
        const eventDay=dateObj(e.date);
        const dayBefore=new Date(eventDay); dayBefore.setDate(dayBefore.getDate()-1);
        const beforeISO=`${dayBefore.getFullYear()}-${String(dayBefore.getMonth()+1).padStart(2,'0')}-${String(dayBefore.getDate()).padStart(2,'0')}`;
        const send=(kind,message)=>{const key=`${e.id}-${kind}-${e.date}`;if(sent[key])return;new Notification('Não me esqueça',{body:message,tag:key});sent[key]=true;localStorage.setItem('nao-me-esqueca-sent-v2',JSON.stringify(sent));};
        if(localToday===beforeISO && now.getHours()>=9) send('before',`Amanhã: ${e.title}, às ${e.time}.`);
        if(localToday===e.date && now.getHours()>=8) send('today',`Hoje: ${e.title}, às ${e.time}.`);
      });
    };
    checkReminders(); const id=setInterval(checkReminders,60000); return()=>clearInterval(id);
  },[events]);

  const sortedEvents = useMemo(()=>[...events].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)),[events]);
  const upcoming = sortedEvents.filter(e=>e.date>=todayISO()&&!e.completed);
  const todayEvents = sortedEvents.filter(e=>e.date===todayISO()&&!e.completed);
  const completedCount = events.filter(e=>e.completed).length;
  const nextEvent = upcoming[0];
  const dayEvents = sortedEvents.filter(e=>e.date===selected);
  const visibleEvents = sortedEvents.filter(e=>{
    const matchText=(e.title+' '+(e.notes||'')+' '+(e.location||'')+' '+e.category).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'));
    const matchFilter=filter==='Todos' || (filter==='Pendentes'&&!e.completed&&e.date>=todayISO()) || (filter==='Concluídos'&&e.completed) || (filter==='Atrasados'&&!e.completed&&e.date<todayISO());
    const matchCategory=categoryFilter==='Todas'||e.category===categoryFilter;
    return matchText&&matchFilter&&matchCategory;
  });

  const openNew=(date=selected)=>{setEditing(null);setForm(emptyForm(date));setModal(true)};
  const openEdit=e=>{setEditing(e.id);setForm({...emptyForm(e.date),...e});setModal(true)};
  const save=()=>{
    if(!form.title.trim()||!form.date){setToast('Preencha o título e a data.');return;}
    const item={...form,title:form.title.trim(),id:editing||uid(),completed:editing?!!events.find(e=>e.id===editing)?.completed:false};
    setEvents(prev=>editing?prev.map(e=>e.id===editing?item:e):[...prev,item]);
    setSelected(form.date);setMonth(new Date(`${form.date}T12:00:00`));setModal(false);setToast(editing?'Compromisso atualizado.':'Compromisso salvo.');
  };
  const toggleDone=(id)=>setEvents(prev=>prev.map(e=>e.id===id?{...e,completed:!e.completed}:e));
  const remove=(id)=>{setEvents(prev=>prev.filter(e=>e.id!==id));setToast('Compromisso excluído.');};
  const askPermission=async()=>{
    if(!('Notification'in window)){setToast('Este navegador não oferece notificações.');return;}
    const p=await Notification.requestPermission();setPermission(p);
    if(p==='granted'){new Notification('Não me esqueça',{body:'Avisos ativados. Deixe o app aberto para conferir seus lembretes.'});setToast('Notificações ativadas.');}
    else setToast('Permissão de notificações não concedida.');
  };
  const exportBackup=()=>{const blob=new Blob([JSON.stringify({app:'Não me esqueça',version:2,exportedAt:new Date().toISOString(),events},null,2)],{type:'application/json'});downloadBlob(blob,'nao-me-esqueca-backup.json');setToast('Backup exportado.');};
  const importBackup=e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);const list=Array.isArray(parsed)?parsed:parsed.events;if(!Array.isArray(list))throw new Error();setEvents(list.map(x=>({...x,id:x.id||uid(),completed:!!x.completed})));setToast('Backup importado com sucesso.');}catch{setToast('Não foi possível ler esse arquivo.');}};reader.readAsText(file);e.target.value='';};
  const exportCalendar=()=>{const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nao me esqueca//Agenda//PT-BR'];events.filter(e=>!e.completed).forEach(e=>{const start=e.date.replaceAll('-','')+'T'+(e.time||'0900').replace(':','')+'00';const endDate=new Date(`${e.date}T${e.time||'09:00'}:00`);endDate.setMinutes(endDate.getMinutes()+Number(e.duration||60));const end=`${endDate.getFullYear()}${String(endDate.getMonth()+1).padStart(2,'0')}${String(endDate.getDate()).padStart(2,'0')}T${String(endDate.getHours()).padStart(2,'0')}${String(endDate.getMinutes()).padStart(2,'0')}00`;const esc=s=>String(s||'').replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n');lines.push('BEGIN:VEVENT',`UID:${e.id}@nao-me-esqueca`,`DTSTART:${start}`,`DTEND:${end}`,`SUMMARY:${esc(e.title)}`,`DESCRIPTION:${esc(e.notes)}`,`LOCATION:${esc(e.location)}`,'END:VEVENT');});lines.push('END:VCALENDAR');downloadBlob(new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'}),'minha-agenda.ics');setToast('Arquivo de calendário exportado.');};

  const year=month.getFullYear(), mon=month.getMonth();
  const first=(new Date(year,mon,1).getDay()+6)%7, days=new Date(year,mon+1,0).getDate();
  const cells=[...Array(first).fill(null),...Array.from({length:days},(_,i)=>i+1)];while(cells.length%7)cells.push(null);
  const monthName=month.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  const goToday=()=>{setSelected(todayISO());setMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1));};

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-symbol"><span>n.</span></div><div><b>não me esqueça</b><small>agenda para a vida real</small></div></div>
      <div className="side-caption">ESPAÇO PESSOAL</div>
      <button className="side-link active" onClick={()=>document.getElementById('calendar-section')?.scrollIntoView({behavior:'smooth'})}><CalendarDays size={17}/> Calendário</button>
      <button className="side-link" onClick={()=>document.getElementById('agenda-section')?.scrollIntoView({behavior:'smooth'})}><AlarmClock size={17}/> Minha agenda <span>{upcoming.length}</span></button>
      <div className="side-rule"/>
      <div className="side-caption">FERRAMENTAS</div>
      <button className="side-link" onClick={exportCalendar}><Download size={17}/> Exportar calendário</button>
      <button className="side-link" onClick={exportBackup}><ArrowDownToLine size={17}/> Fazer backup</button>
      <button className="side-link" onClick={()=>importRef.current?.click()}><FileUp size={17}/> Importar backup</button>
      <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importBackup}/>
      <div className="sidebar-bottom"><div className="sidebar-note"><Sparkles size={17}/><p>“O que importa merece um lugar na sua agenda.”</p><small>UM LEMBRETE DE CADA VEZ</small></div><div className="sidebar-footer"><div className="avatar">N</div><div><b>Meu espaço</b><small>Seus planos, no seu ritmo</small></div></div></div>
    </aside>

    <main className="main-content">
      <header className="page-header"><div><div className="date-kicker">{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</div><h1>Cuide do que <em>importa.</em></h1><p>Um pouco de organização deixa espaço para viver.</p></div><div className="header-actions"><button className={`notification-button ${permission==='granted'?'is-on':''}`} onClick={askPermission}><Bell size={16}/><span>{permission==='granted'?'Avisos ligados':'Ativar avisos'}</span></button><button className="primary-button" onClick={()=>openNew(todayISO())}><Plus size={17}/> Novo compromisso</button></div></header>

      <section className="overview-strip">
        <div className="overview-item"><span className="overview-label">A SEGUIR</span><strong>{nextEvent?nextEvent.title:'Agenda livre'}</strong><small>{nextEvent?`${formatDate(nextEvent.date)} · ${nextEvent.time}`:'Nenhum compromisso pendente'}</small></div>
        <div className="overview-divider"/>
        <div className="overview-metric"><span className="metric-number">{todayEvents.length.toString().padStart(2,'0')}</span><span className="metric-copy">para hoje</span></div>
        <div className="overview-divider"/>
        <div className="overview-metric"><span className="metric-number">{upcoming.length.toString().padStart(2,'0')}</span><span className="metric-copy">na fila</span></div>
        <div className="overview-divider"/>
        <div className="overview-metric"><span className="metric-number">{completedCount.toString().padStart(2,'0')}</span><span className="metric-copy">concluídos</span></div>
      </section>

      <div className="workspace-grid" id="calendar-section">
        <section className="calendar-card">
          <div className="section-heading"><div><span className="section-overline">ORGANIZE SEUS DIAS</span><h2>Calendário</h2></div><button className="quiet-button" onClick={goToday}>Hoje</button></div>
          <div className="calendar-navigation"><button className="month-arrow" aria-label="Mês anterior" onClick={()=>setMonth(new Date(year,mon-1,1))}><ChevronLeft size={19}/></button><h3>{monthName}</h3><button className="month-arrow" aria-label="Próximo mês" onClick={()=>setMonth(new Date(year,mon+1,1))}><ChevronRight size={19}/></button></div>
          <div className="calendar-grid"><div className="weekday-row">{['seg','ter','qua','qui','sex','sáb','dom'].map(x=><span key={x}>{x}</span>)}</div><div className="date-grid">{cells.map((d,i)=>{const iso=d?`${year}-${String(mon+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`:'';const dayItems=events.filter(e=>e.date===iso);return <button key={i} disabled={!d} className={`calendar-day ${iso===selected?'chosen':''} ${iso===todayISO()?'today':''}`} onClick={()=>setSelected(iso)}><span>{d||''}</span>{dayItems.length>0&&<div className="day-indicators">{dayItems.slice(0,3).map((e,j)=><i key={j} style={{background:e.completed?'#c9c6c0':CATEGORY_COLORS[e.category]||CATEGORY_COLORS.Outros}}/>)}</div>}</button>})}</div></div>
          <div className="calendar-foot"><span><i className="today-dot"/> hoje</span><span><i className="event-dot"/> tem compromisso</span><span className="calendar-foot-note">Toque em um dia para ver os detalhes</span></div>
        </section>

        <section className="day-card">
          <div className="day-card-top"><div><span className="section-overline">SEU DIA, SEM PRESSA</span><h2>{dateObj(selected).toLocaleDateString('pt-BR',{weekday:'long'})}</h2><p>{formatDate(selected)}</p></div><div className="day-count">{dayEvents.length}<small>{dayEvents.length===1?'item':'itens'}</small></div></div>
          <div className="day-timeline">{dayEvents.length===0?<div className="day-empty"><div className="empty-illustration"><CalendarDays size={24}/></div><b>Dia em aberto.</b><p>Um espaço livre também é parte de uma boa agenda.</p><button className="inline-add" onClick={()=>openNew(selected)}><Plus size={15}/> Adicionar algo</button></div>:dayEvents.map(e=><article className={`timeline-event ${e.completed?'is-completed':''}`} key={e.id}><div className="timeline-time">{e.time}</div><div className="timeline-marker" style={{'--event-color':CATEGORY_COLORS[e.category]||CATEGORY_COLORS.Outros}}/><div className="timeline-content" onClick={()=>openEdit(e)}><div className="timeline-title-row"><b>{e.title}</b><button className="more-button" title="Editar" onClick={()=>openEdit(e)}><MoreHorizontal size={17}/></button></div><div className="timeline-meta"><span>{e.category}</span>{e.location&&<span><MapPin size={12}/>{e.location}</span>}</div>{e.notes&&<p>{e.notes}</p>}<div className="timeline-actions"><button onClick={()=>toggleDone(e.id)}>{e.completed?<CheckCircle2 size={14}/>:<Circle size={14}/>} {e.completed?'Concluído':'Marcar como feito'}</button><button onClick={()=>remove(e.id)} aria-label="Excluir compromisso"><Trash2 size={13}/></button></div></div></article>)}</div>
        </section>
      </div>

      <section className="agenda-section" id="agenda-section">
        <div className="agenda-heading"><div><span className="section-overline">TUDO NO SEU TEMPO</span><h2>Minha agenda</h2><p>Encontre, acompanhe e organize seus compromissos.</p></div><div className="agenda-tools"><label className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar na agenda"/></label><label className="filter-select"><SlidersHorizontal size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>Todos</option><option>Pendentes</option><option>Concluídos</option><option>Atrasados</option></select></label></div></div>
        <div className="category-tabs"><button className={categoryFilter==='Todas'?'selected':''} onClick={()=>setCategoryFilter('Todas')}>Todas</button>{CATEGORIES.map(c=><button key={c} className={categoryFilter===c?'selected':''} onClick={()=>setCategoryFilter(c)}>{c}</button>)}</div>
        <div className="agenda-list">{visibleEvents.length===0?<div className="agenda-empty">Nada encontrado com esses filtros.</div>:visibleEvents.slice(0,12).map(e=><article className={`agenda-row ${e.completed?'done':''}`} key={e.id}><button className="complete-button" onClick={()=>toggleDone(e.id)} title={e.completed?'Reabrir compromisso':'Marcar como concluído'}>{e.completed?<CheckCircle2 size={19}/>:<Circle size={19}/>}</button><div className="agenda-date"><b>{dateObj(e.date).getDate().toString().padStart(2,'0')}</b><span>{dateObj(e.date).toLocaleDateString('pt-BR',{month:'short'}).replace('.','')}</span></div><div className="agenda-event-info" onClick={()=>openEdit(e)}><b>{e.title}</b><span>{formatDate(e.date)} · {e.time}{e.location?` · ${e.location}`:''}</span></div><span className="agenda-category" style={{'--category-color':CATEGORY_COLORS[e.category]||CATEGORY_COLORS.Outros}}>{e.category}</span>{e.priority==='Alta'&&<span className="priority-tag">Prioridade alta</span>}<button className="row-edit" onClick={()=>openEdit(e)} aria-label="Editar"><MoreHorizontal size={18}/></button></article>)}</div>
        {visibleEvents.length>12&&<div className="more-results">Mostrando 12 de {visibleEvents.length} compromissos.</div>}
      </section>
      <footer className="page-footer">feito para lembrar do que faz sentido <span>✳</span></footer>
    </main>

    {modal&&<div className="modal-layer" onMouseDown={e=>e.target===e.currentTarget&&setModal(false)}><form className="event-modal" onSubmit={e=>{e.preventDefault();save()}}><div className="modal-top"><div><span className="section-overline">UM NOVO ESPAÇO NA AGENDA</span><h2>{editing?'Editar compromisso':'O que não pode passar?'}</h2><p>Guarde os detalhes. A gente ajuda a lembrar.</p></div><button type="button" className="modal-close" onClick={()=>setModal(false)}><X size={19}/></button></div>
      <label className="field-label">Nome do compromisso<input autoFocus required maxLength="90" placeholder="Ex.: Consulta com a dentista" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
      <div className="field-pair"><label className="field-label">Data<input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label className="field-label">Horário<input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label></div>
      <div className="field-pair"><label className="field-label">Categoria<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label><label className="field-label">Prioridade<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Normal</option><option>Alta</option><option>Baixa</option></select></label></div>
      <div className="field-pair"><label className="field-label">Local (opcional)<input placeholder="Onde vai acontecer?" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label><label className="field-label">Duração<select value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">1 hora</option><option value="90">1h30</option><option value="120">2 horas</option><option value="180">3 horas</option></select></label></div>
      <label className="field-label">Anotações<textarea rows="3" placeholder="O que mais você precisa lembrar?" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
      <div className="reminder-explainer"><BellRing size={17}/><div><b>Lembretes um dia antes e no dia</b><span>Ative as notificações do navegador. Para receber avisos com o app fechado, será necessária uma versão com notificações Push.</span></div></div>
      <div className="modal-bottom"><button type="button" className="secondary-button" onClick={()=>setModal(false)}>Cancelar</button><button type="submit" className="primary-button"><Check size={16}/>{editing?'Salvar alterações':'Salvar compromisso'}</button></div>
    </form></div>}
    {toast&&<div className="toast"><CheckCircle2 size={16}/>{toast}</div>}
  </div>;
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
export default App;
