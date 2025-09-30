import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Paperclip, Image as ImageIcon, Settings, Sun, Moon, Loader2, CheckCheck, Check, Trash2, Sparkles, Bot, User, ChevronLeft, ChevronRight, Smile, Keyboard, MoreHorizontal, MessageSquare, Search, Filter, Clock, Shield, Bell, Globe, Accessibility, Zap } from "lucide-react";

/**
 * Chat UI/UX Showcase – Single‑file React component
 *
 * Highlights:
 * - Polished layout (sidebar + chat pane + utility header)
 * - Light/Dark themes with smooth transitions
 * - Accessibility: ARIA roles, labels, focus rings, skip link
 * - Micro‑interactions: hover, press, typing bubble, message send
 * - Empty/error/success states
 * - Message status (sent/delivered/read)
 * - Quick actions, attachments, emoji, command palette hint
 * - Responsive and keyboard friendly
 * - No external CSS required (Tailwind classes)
 */

// Utility: fake delay
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Types
type Sender = "user" | "bot";

type MsgStatus = "sending" | "sent" | "delivered" | "read";

interface Message {
  id: string;
  sender: Sender;
  text: string;
  time: string; // e.g., "10:24"
  status?: MsgStatus; // user messages
  attachments?: { type: "image" | "file"; name: string }[];
}

interface Thread {
  id: string;
  title: string;
  lastMessage: string;
  unread?: number;
  pinned?: boolean;
}

// Demo data
const demoThreads: Thread[] = [
  { id: "t1", title: "Portfolio Review ✨", lastMessage: "Let’s make it pop.", pinned: true, unread: 2 },
  { id: "t2", title: "UX Interview Prep", lastMessage: "Walk me through a flow." },
  { id: "t3", title: "Client – AI Keyboard", lastMessage: "Ship date confirmed." },
  { id: "t4", title: "Hackathon Team", lastMessage: "Standup in 10 mins", unread: 1 },
];

const introMessages: Message[] = [
  { id: "m1", sender: "bot", text: "Hey! I’m the demo assistant. Ask me anything about this UI.", time: "09:58" },
  { id: "m2", sender: "user", text: "Show me your best micro‑interactions.", time: "10:01", status: "read" },
  { id: "m3", sender: "bot", text: "You’ll see motion, affordances, and accessible controls throughout.", time: "10:02" },
];

// Avatar
const Avatar = ({ who }: { who: Sender }) => (
  <div
    className={`size-9 rounded-2xl grid place-items-center shrink-0 shadow-inner ${
      who === "bot"
        ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
        : "bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 text-zinc-800 dark:text-zinc-100"
    }`}
    aria-hidden
  >
    {who === "bot" ? <Bot className="size-4" /> : <User className="size-4" />}
  </div>
);

// Message bubble
function Bubble({ m }: { m: Message }) {
  const mine = m.sender === "user";
  return (
    <div className={`flex gap-3 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && <Avatar who="bot" />}
      <div className={`max-w-[80%] md:max-w-[65%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
        {m.attachments && (
          <div className="flex gap-2 mb-1 flex-wrap">
            {m.attachments.map((a, i) => (
              <div
                key={i}
                className="px-2 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs flex items-center gap-2"
              >
                {a.type === "image" ? <ImageIcon className="size-3.5" /> : <Paperclip className="size-3.5" />}
                <span className="truncate max-w-40" title={a.name}>{a.name}</span>
              </div>
            ))}
          </div>
        )}
        <motion.div
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className={`${
            mine
              ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50"
          } rounded-2xl px-4 py-2 shadow-sm relative`}
          role="text"
        >
          {m.text}
          {mine && (
            <div className="absolute -bottom-5 right-0 flex items-center gap-1 text-xs text-zinc-500">
              {/* Status ticks */}
              {m.status === "sending" && <Loader2 className="size-3 animate-spin" aria-label="Sending" />}
              {m.status === "sent" && <Check className="size-3" aria-label="Sent" />}
              {m.status === "delivered" && <CheckCheck className="size-3" aria-label="Delivered" />}
              {m.status === "read" && <Sparkles className="size-3" aria-label="Read" />}
            </div>
          )}
        </motion.div>
        <span className="text-[11px] mt-2 text-zinc-400" aria-hidden>
          {m.time}
        </span>
      </div>
      {mine && <Avatar who="user" />}
    </div>
  );
}

// Typing indicator
const Typing = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
    aria-live="polite"
  >
    <Loader2 className="size-4 animate-spin" />
    <span>Typing…</span>
  </motion.div>
);

// Header button
function IconBtn({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200/70 dark:border-zinc-700/70 hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 transition"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

// Message input with autosize
function MessageInput({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState("");
  const [rows, setRows] = useState(1);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setValue(v);
    const lines = v.split("\n").length;
    setRows(Math.min(6, Math.max(1, lines)));
  }

  function send() {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
    setRows(1);
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/70 backdrop-blur p-2 flex items-end gap-2">
      <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Insert emoji" title="Emoji (:)" >
        <Smile className="size-5" />
      </button>
      <textarea
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        rows={rows}
        aria-label="Message input"
        placeholder="Type a message…  Press Enter to send, Shift+Enter for new line"
        className="flex-1 resize-none bg-transparent outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 text-sm leading-6 px-2 py-2"
      />
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Attach file" title="Attach">
          <Paperclip className="size-5" />
        </button>
        <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Record voice" title="Voice">
          <Mic className="size-5" />
        </button>
        <button
          onClick={send}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Send message"
        >
          <Send className="size-4" />
          <span className="hidden md:inline">Send</span>
        </button>
      </div>
    </div>
  );
}

// Sidebar thread item
function ThreadItem({ t, active, onClick }: { t: Thread; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-xl border transition group ${
        active
          ? "border-blue-500/50 bg-blue-50/60 dark:bg-blue-500/10"
          : "border-transparent hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
      }`}
      aria-current={active ? "true" : undefined}
    >
      <div className="flex items-center gap-2">
        <MessageSquare className={`size-4 ${active ? "text-blue-600" : "text-zinc-400"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{t.title}</span>
            {t.pinned && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-800">Pinned</span>
            )}
          </div>
          <div className="text-xs text-zinc-500 truncate">{t.lastMessage}</div>
        </div>
        {t.unread ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">{t.unread}</span>
        ) : null}
      </div>
    </button>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="h-full grid place-items-center text-center p-10">
      <div className="max-w-md">
        <div className="mx-auto mb-4 size-12 rounded-2xl grid place-items-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
          <Zap className="size-6" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Start a new conversation</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Ask the bot about the UI decisions here. Try
          <span className="mx-1 rounded-md px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800">/help</span>,
          <span className="mx-1 rounded-md px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800">/shortcuts</span>, or
          <span className="mx-1 rounded-md px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800">/theme</span>.
        </p>
      </div>
    </div>
  );
}

// Settings panel (inline for demo)
function SettingsPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute right-3 top-16 z-20 w-80 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-4"
      role="dialog"
      aria-label="Settings"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Settings</h4>
        <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close settings">
          <MoreHorizontal className="size-4" />
        </button>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2"><Bell className="size-4" /><span>Notifications</span></div>
        <div className="flex items-center gap-2"><Shield className="size-4" /><span>Privacy</span></div>
        <div className="flex items-center gap-2"><Globe className="size-4" /><span>Language</span></div>
        <div className="flex items-center gap-2"><Accessibility className="size-4" /><span>Accessibility</span></div>
        <p className="text-xs text-zinc-500">This panel is a visual placeholder for a full settings page.</p>
      </div>
    </motion.div>
  );
}

export default function ChatUIUXShowcase() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [messages, setMessages] = useState<Message[]>(introMessages);
  const [typing, setTyping] = useState(false);
  const [activeThread, setActiveThread] = useState("t1");
  const [showSettings, setShowSettings] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Derived: time now
  const timeNow = useMemo(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), [messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        alert("Command palette would open (demo)");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setTheme((t) => (t === "light" ? "dark" : "light"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleSend(text: string) {
    const id = crypto.randomUUID();
    const newMsg: Message = { id, sender: "user", text, time: timeNow, status: "sending" };
    setMessages((prev) => [...prev, newMsg]);

    // Simulate network + delivery + read
    await wait(400);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "sent" } : m)));
    await wait(300);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "delivered" } : m)));

    // Bot typing
    setTyping(true);
    await wait(700);

    // Simple slash commands demo
    let reply = "Nice! Sending a playful, helpful response with motion and clarity.";
    if (text.startsWith("/")) {
      const cmd = text.slice(1).trim().toLowerCase();
      if (cmd === "help") reply = "Commands: /help, /shortcuts, /theme, /a11y";
      if (cmd === "shortcuts") reply = "⌘/Ctrl+K command palette • ⌘/Ctrl+J toggle theme • Enter to send";
      if (cmd === "theme") reply = `Theme is currently ${theme}. Use ⌘/Ctrl+J to toggle.`;
      if (cmd === "a11y") reply = "This UI uses roles, labels, focus states, and high contrast support.";
    }

    await wait(600);
    setTyping(false);

    setMessages((prev) => [
      ...prev.map((m) => (m.id === id ? { ...m, status: "read" } : m)),
      { id: crypto.randomUUID(), sender: "bot", text: reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <a href="#chat-main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-3 py-2 rounded">Skip to chat</a>
      <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50 transition-colors">
        {/* App shell */}
        <div className="mx-auto max-w-7xl px-3 md:px-6 py-6 grid grid-cols-12 gap-4">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/60 backdrop-blur p-4 sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="size-9 rounded-2xl grid place-items-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <div className="font-semibold leading-tight">Chat UI Showcase</div>
                    <div className="text-xs text-zinc-500">Focus: UX patterns</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                    aria-label="Toggle theme"
                    title="Toggle theme (⌘/Ctrl+J)"
                  >
                    {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  </button>
                  <button
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    aria-label="Settings"
                    title="Settings"
                    onClick={() => setShowSettings((s) => !s)}
                  >
                    <Settings className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <input
                    aria-label="Search conversations"
                    placeholder="Search"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent outline-none focus:ring-2 focus:ring-blue-500/60"
                  />
                </div>
                <button className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Filter">
                  <Filter className="size-4" />
                </button>
              </div>

              <div className="space-y-2" role="list" aria-label="Conversations">
                {demoThreads.map((t) => (
                  <ThreadItem key={t.id} t={t} active={t.id === activeThread} onClick={() => setActiveThread(t.id)} />
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-2"><Clock className="size-3.5" /> Recent</div>
                <div className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-2"><Keyboard className="size-3.5" /> Shortcuts</div>
              </div>
            </div>
          </aside>

          {/* Main chat */}
          <main id="chat-main" className="col-span-12 md:col-span-8 lg:col-span-9">
            <div className="relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/60 backdrop-blur overflow-hidden">
              {/* Header */}
              <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-zinc-200/70 dark:border-zinc-800/70">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Previous chat"><ChevronLeft className="size-4" /></button>
                  <div>
                    <div className="font-semibold leading-tight">Portfolio Review</div>
                    <div className="text-xs text-zinc-500">You + Demo Assistant</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IconBtn label="Info"><User className="size-4" /><span className="hidden md:inline text-sm">Profile</span></IconBtn>
                  <IconBtn label="More"><MoreHorizontal className="size-4" /></IconBtn>
                </div>
              </header>

              {/* Scroll area */}
              <div ref={scrollerRef} className="h-[58vh] md:h-[62vh] overflow-y-auto px-4 md:px-6 py-5 space-y-4 scroll-smooth">
                {messages.map((m) => (
                  <Bubble key={m.id} m={m} />
                ))}
                <AnimatePresence>{typing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex">
                    <div className="ml-12"><Typing /></div>
                  </motion.div>
                )}</AnimatePresence>
                {!messages.length && <EmptyState />}
              </div>

              {/* Footer composer */}
              <div className="border-t border-zinc-200/70 dark:border-zinc-800/70 p-3 md:p-4">
                <div className="flex items-center justify-between mb-2 text-[11px] text-zinc-500">
                  <div className="flex items-center gap-3">
                    <span>Press <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">Enter</kbd> to send</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">⌘/Ctrl + J to toggle theme</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline">Status:</span>
                    <span className="inline-flex items-center gap-1"><Shield className="size-3" />E2EE (demo)</span>
                  </div>
                </div>
                <MessageInput onSend={handleSend} />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <button className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Clear chat" aria-label="Clear chat" onClick={() => setMessages([])}>
                      <Trash2 className="size-3.5 inline mr-1" />Clear
                    </button>
                    <button className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Demo attachments" aria-label="Demo attachments" onClick={() => setMessages((prev)=>[...prev, {id:crypto.randomUUID(), sender:"user", text:"Here are the brand assets.", time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}), status:"read", attachments:[{type:"image", name:"logo@2x.png"},{type:"file", name:"brand‑guidelines.pdf"}]}])}>
                      <Paperclip className="size-3.5 inline mr-1" />Attach
                    </button>
                  </div>
                  <div className="text-[11px] text-zinc-500">Demo build • No network calls</div>
                </div>
              </div>

              {/* Settings */}
              <AnimatePresence>{showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}</AnimatePresence>
            </div>
          </main>
        </div>

        {/* Footer note */}
        <footer className="px-6 pb-8 text-center text-xs text-zinc-500">
          Built to showcase UI/UX craft: motion, clarity, accessibility, and delightful details.
        </footer>
      </div>
    </div>
  );
}
