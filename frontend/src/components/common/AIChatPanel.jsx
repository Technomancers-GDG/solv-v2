import { useState, useRef, useEffect } from "react";

export function AIChatPanel({ apiFetch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiFetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          query: userMsg.content,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      setMessages(prev => [...prev, { role: "model", content: response.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "model", content: "Error: Could not reach AI assistant." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (query) => {
    setInput(query);
    setTimeout(() => {
      // simulate enter key logic (we can't easily rely on handleSend directly since input state update is async)
    }, 0);
  };
  
  // Since input state update is async, we'll implement quick actions via a direct fetch
  const executeQuickAction = async (query) => {
    if (isLoading) return;
    const userMsg = { role: "user", content: query };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await apiFetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          query: userMsg.content,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      setMessages(prev => [...prev, { role: "model", content: response.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "model", content: "Error: Could not reach AI assistant." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        className="chat-fab" 
        onClick={() => setIsOpen(true)}
        title="SOLV Ops Assistant"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
          cursor: "pointer",
          display: isOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          zIndex: 1000
        }}
      >
        ✨
      </button>

      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "380px",
          height: "550px",
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          zIndex: 1000,
          overflow: "hidden",
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{ padding: "12px 16px", backgroundColor: "#0f172a", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>✨</span>
              <span style={{ fontWeight: 600, color: "#f8fafc" }}>Ops Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "20px" }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "20px" }}>
                <p style={{ marginBottom: "20px", lineHeight: "1.5" }}>Hello! I'm your AI supply chain assistant. How can I help you today?</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button onClick={() => executeQuickAction("Summarize current risk")} style={{ padding: "8px", borderRadius: "6px", backgroundColor: "#334155", color: "#cbd5e1", border: "1px solid #475569", cursor: "pointer", fontSize: "0.85rem" }}>Summarize current risk</button>
                  <button onClick={() => executeQuickAction("Why did AI reroute recent trucks?")} style={{ padding: "8px", borderRadius: "6px", backgroundColor: "#334155", color: "#cbd5e1", border: "1px solid #475569", cursor: "pointer", fontSize: "0.85rem" }}>Why did AI reroute recent trucks?</button>
                  <button onClick={() => executeQuickAction("What is the impact of current disruptions?")} style={{ padding: "8px", borderRadius: "6px", backgroundColor: "#334155", color: "#cbd5e1", border: "1px solid #475569", cursor: "pointer", fontSize: "0.85rem" }}>Impact of current disruptions?</button>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", backgroundColor: msg.role === "user" ? "#3b82f6" : "#334155", color: "#f8fafc", padding: "10px 14px", borderRadius: "12px", borderBottomRightRadius: msg.role === "user" ? "2px" : "12px", borderBottomLeftRadius: msg.role === "model" ? "2px" : "12px", fontSize: "0.9rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: "flex-start", backgroundColor: "#334155", color: "#94a3b8", padding: "10px 14px", borderRadius: "12px", borderBottomLeftRadius: "2px", fontSize: "0.9rem" }}>
                Typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: "12px", borderTop: "1px solid #334155", display: "flex", gap: "8px", backgroundColor: "#0f172a" }}>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Ask a question..."
              style={{ flex: 1, padding: "10px 16px", borderRadius: "24px", border: "1px solid #334155", backgroundColor: "#1e293b", color: "white", outline: "none", fontSize: "0.9rem" }}
            />
            <button onClick={handleSend} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: "0 8px", fontWeight: 600 }}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
