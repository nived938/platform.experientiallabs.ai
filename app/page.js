"use client";

import {useEffect,useRef,useState} from "react";

export default function Home(){
  const [messages,setMessages]=useState([
    {role:"assistant",content:"Hi! I'm your AI assistant. Ask me anything."}
  ]);
  const [input,setInput]=useState("");
  const [models,setModels]=useState([]);
  const [model,setModel]=useState("");
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);

  useEffect(()=>{
    fetch("/api/models").then(r=>r.json()).then(d=>{
      if(d.models?.length){setModels(d.models);setModel(d.models.includes(d.defaultModel)?d.defaultModel:d.models[0]);}
    }).catch(()=>{});
  },[]);

  useEffect(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),[messages,loading]);

  async function sendMessage(e){
    e?.preventDefault();
    const text=input.trim();
    if(!text||loading)return;
    const next=[...messages,{role:"user",content:text}];
    setMessages(next);setInput("");setLoading(true);
    try{
      const res=await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:next,model})
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Request failed");
      setMessages([...next,{role:"assistant",content:data.content||"No response returned."}]);
    }catch(err){
      setMessages([...next,{role:"assistant",content:"Error: "+err.message}]);
    }finally{setLoading(false);}
  }

  function newChat(){setMessages([{role:"assistant",content:"New chat started. How can I help?"}]);setInput("");}

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="logo">E</div><div><b>Experiential AI</b><span>Chat</span></div></div>
      <button className="newChat" onClick={newChat}>＋ New chat</button>
      <div className="sideInfo"><p>Powered by Experiential Labs</p><small>Your API key stays on the server and is never sent to the browser.</small></div>
    </aside>
    <section className="chat">
      <header className="topbar">
        <div><h1>AI Assistant</h1><p>OpenAI-compatible Experiential Labs gateway</p></div>
        <select value={model} onChange={e=>setModel(e.target.value)} disabled={!models.length||loading}>
          {models.length?models.map(m=><option key={m} value={m}>{m}</option>):<option>Loading models...</option>}
        </select>
      </header>
      <div className="messages">
        {messages.map((m,i)=><div className={"row "+m.role} key={i}>
          <div className="avatar">{m.role==="user"?"You":"E"}</div>
          <div className="bubble">{m.content}</div>
        </div>)}
        {loading&&<div className="row assistant"><div className="avatar">E</div><div className="bubble typing"><i></i><i></i><i></i></div></div>}
        <div ref={endRef}/>
      </div>
      <form className="composer" onSubmit={sendMessage}>
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="Message the AI..." rows="1" disabled={loading}/>
        <button disabled={loading||!input.trim()}>{loading?"...":"Send"}</button>
      </form>
      <footer>AI responses may be inaccurate. Shift + Enter for a new line.</footer>
    </section>
  </main>;
}
