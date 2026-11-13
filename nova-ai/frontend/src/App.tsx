import { useEffect, useRef, useState } from 'react'
import { Plus, PanelLeftClose, PanelLeftOpen, Send, Paperclip, Sparkles, MessageSquare, Trash2, LogOut, Sun, Moon, Copy, Check, Menu, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { API, getToken, request } from './api'

type Message = { role: 'user'|'assistant'; content: string }
type Conversation = { id: string; title: string }
export default function App() {
  const [token,setToken] = useState(getToken())
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [authMode,setAuthMode] = useState<'login'|'register'>('login')
  const [authError,setAuthError] = useState('')
  const [conversations,setConversations] = useState<Conversation[]>([])
  const [active,setActive] = useState('')
  const [messages,setMessages] = useState<Message[]>([])
  const [input,setInput] = useState('')
  const [busy,setBusy] = useState(false)
  const [sidebar,setSidebar] = useState(true)
  const [mobileMenu,setMobileMenu] = useState(false)
  const [dark,setDark] = useState(true)
  const [model,setModel] = useState('')
  const [copied,setCopied] = useState(-1)
  const bottom = useRef<HTMLDivElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)

  async function loadConversations() {
    const r = await request('/api/conversations')
    setConversations(await r.json())
  }
  useEffect(() => { if (token) { loadConversations().catch(e=>console.error(e)); request('/api/models').then(r=>r.json()).then(d=>setModel(d.models?.[0]?.id || '')).catch(()=>{}) } }, [token])
  useEffect(() => { bottom.current?.scrollIntoView({behavior:'smooth'}) }, [messages])
  async function authenticate(e: React.FormEvent) {
    e.preventDefault(); setAuthError('')
    try {
      const r = await fetch(`${API}/api/auth/${authMode}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})})
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Authentication failed')
      localStorage.setItem('nova_token',d.access_token); setEmail(d.email || email); setToken(d.access_token)
    } catch(err) { setAuthError(err instanceof Error ? err.message : 'Unable to sign in') }
  }
  async function openChat(id: string) {
    try { const r=await request(`/api/conversations/${id}`); const d=await r.json(); setActive(id); setMessages(d.messages || []); setMobileMenu(false) }
    catch(e) { alert(e instanceof Error ? e.message : 'Unable to load chat') }
  }
  function newChat() { setActive(''); setMessages([]); setInput(''); setMobileMenu(false); textarea.current?.focus() }
  async function deleteChat(id:string,e:React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    await request(`/api/conversations/${id}`,{method:'DELETE'})
    setConversations(c=>c.filter(x=>x.id!==id))
    if(active===id) newChat()
  }
  async function sendMessage() {
    const prompt=input.trim()
    if(!prompt || busy) return
    setInput(''); setBusy(true)
    const next=[...messages,{role:'user' as const,content:prompt},{role:'assistant' as const,content:''}]
    setMessages(next)
    let conversationId=active
    try {
      const response=await request('/api/chat',{method:'POST',body:JSON.stringify({conversation_id:active || null,message:prompt,model:model || undefined})})
      if(!response.body) throw new Error('Streaming is not supported by this browser')
      const reader=response.body.getReader(); const decoder=new TextDecoder(); let buffer=''; let answer=''
      while(true) {
        const {value,done}=await reader.read(); if(done) break
        buffer+=decoder.decode(value,{stream:true})
        const events=buffer.split('\n\n'); buffer=events.pop() || ''
        for(const event of events) {
          const line=event.split('\n').find(x=>x.startsWith('data:'))
          if(!line) continue
          const data=JSON.parse(line.slice(5).trim())
          if(data.error) throw new Error(data.error)
          if(data.token) { answer+=data.token; setMessages(m=>{const copy=[...m]; copy[copy.length-1]={role:'assistant',content:answer}; return copy}) }
          if(data.done && data.conversation_id) conversationId=data.conversation_id
        }
      }
      if(conversationId) { setActive(conversationId); await loadConversations() }
    } catch(e) {
      const msg=e instanceof Error ? e.message : 'Something went wrong'
      setMessages(m=>{const copy=[...m]; copy[copy.length-1]={role:'assistant',content:`**Error:** ${msg}`}; return copy})
    } finally { setBusy(false); textarea.current?.focus() }
  }
  function logout(){localStorage.removeItem('nova_token');setToken('');setMessages([]);setConversations([]);setActive('')}
  if(!token) return <main className="auth-shell"><div className="auth-card"><div className="brand-mark">✳</div><p className="eyebrow">YOUR PERSONAL AI</p><h1>Meet NOVA.</h1><p className="muted">A thoughtful AI assistant, powered by NVIDIA models.</p><form onSubmit={authenticate}><label>Email address</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><label>Password</label><input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/>{authError&&<p className="error">{authError}</p>}<button className="primary full">{authMode==='login'?'Sign in':'Create account'}</button></form><p className="switch-auth">{authMode==='login'?"New to NOVA?":"Already have an account?"} <button onClick={()=>setAuthMode(authMode==='login'?'register':'login')}>{authMode==='login'?'Create account':'Sign in'}</button></p></div></main>
  return <div className={dark?'app dark':'app light'}>
    {(mobileMenu||sidebar)&&<div className={`sidebar ${mobileMenu?'mobile-open':''} ${!sidebar?'collapsed':''}`}><div className="side-top"><div className="brand"><span className="brand-mark small">✳</span><span>NOVA</span></div><button className="icon-btn mobile-close" onClick={()=>setMobileMenu(false)}><X size={18}/></button><button className="icon-btn desktop-toggle" onClick={()=>setSidebar(false)}><PanelLeftClose size={18}/></button></div><button className="new-chat" onClick={newChat}><Plus size={17}/> New chat</button><div className="history-label">RECENT</div><div className="history-list">{conversations.map(c=><div className={`history-item ${active===c.id?'selected':''}`} key={c.id} onClick={()=>openChat(c.id)}><MessageSquare size={15}/><span>{c.title}</span><button className="delete-btn" onClick={e=>deleteChat(c.id,e)}><Trash2 size={14}/></button></div>)}</div><div className="side-bottom"><div className="profile"><div className="avatar">{email?email[0].toUpperCase():'N'}</div><span>{email || 'NOVA user'}</span></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={17}/></button></div></div>}
    <section className="main"><header className="topbar"><div className="top-left">{!sidebar&&<button className="icon-btn" onClick={()=>setSidebar(true)}><PanelLeftOpen size={18}/></button>}<button className="icon-btn mobile-menu" onClick={()=>setMobileMenu(true)}><Menu size={19}/></button><span className="model-label">NOVA <span>·</span> {model || 'NVIDIA model'}</span></div><button className="icon-btn" onClick={()=>setDark(!dark)} title="Toggle theme">{dark?<Sun size={18}/>:<Moon size={18}/>}</button></header>
    <div className="chat-scroll"><div className={`conversation ${messages.length===0?'welcome':''}`}>{messages.length===0?<div className="welcome-content"><div className="welcome-symbol"><Sparkles size={25}/></div><p className="eyebrow">A NEW KIND OF WORKSPACE</p><h1>What can I help<br/>you <em>think through?</em></h1><p className="muted">Ask a question, explore an idea, or work through something complex.</p><div className="suggestions">{['Explain a complex topic simply','Help me debug a Python program','Create a project plan','Summarize a document'].map(s=><button key={s} onClick={()=>setInput(s)}>{s}<span>↗</span></button>)}</div></div>:<div className="messages">{messages.map((m,i)=><article className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role==='assistant'?'✳':(email[0]||'Y').toUpperCase()}</div><div className="message-body"><div className="message-role">{m.role==='assistant'?'NOVA':'You'}</div><div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || (busy?'Thinking…':'')}</ReactMarkdown></div>{m.role==='assistant'&&m.content&&<button className="copy-btn" onClick={()=>{navigator.clipboard.writeText(m.content);setCopied(i);setTimeout(()=>setCopied(-1),1200)}}>{copied===i?<Check size={13}/>:<Copy size={13}/>} {copied===i?'Copied':'Copy'}</button>}</div></article>)}<div ref={bottom}/></div>}</div></div>
    <div className="composer-wrap"><div className="composer"><textarea ref={textarea} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}}} placeholder="Message NOVA…" rows={1}/><div className="composer-bottom"><div className="composer-hint"><Paperclip size={15}/><span>Attachments coming soon</span></div><button className="send-btn" disabled={!input.trim()||busy} onClick={sendMessage}>{busy?'…':<Send size={17}/>}</button></div></div><p className="disclaimer">NOVA can make mistakes. Verify important information.</p></div></section>
  </div>
}
