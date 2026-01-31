"use client";

import { FormEvent, useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
};

type CounsellorAction = {
  type: string;
  payload: Record<string, unknown>;
};

type ResponsePayload = {
  messages: Message[];
  actions: CounsellorAction[];
};

type ProfileSummary = {
  current_stage: string;
  field_of_study: string;
  preferred_countries: string[];
};

type ChatSession = {
  session_id: string;
  started_at: string;
  message_count: number;
  preview: string;
};

type UniversityRecommendation = {
  university_id: number;
  name?: string;
  category: string;
  fit_reason: string;
  risk?: string;
};

function CounsellorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI Counsellor. I understand your profile, goals, and current stage.\n\nI can:\n• Analyze your profile strengths and gaps\n• Recommend universities (Dream/Target/Safe)\n• Shortlist and lock universities for you\n• Create actionable tasks\n\n**Try asking:** \"What universities fit my profile?\" or \"What should I do next?\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(null);
  const [recommendations, setRecommendations] = useState<UniversityRecommendation[]>([]);
  const [pendingUniversityPrompt, setPendingUniversityPrompt] = useState<string | null>(null);

  // Chat history state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setVoiceSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((result: any) => result[0].transcript)
            .join("");
          setInput(transcript);

          if (event.results[event.results.length - 1].isFinal) {
            setIsListening(false);
          }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  // Text-to-speech
  const speak = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/\*\*/g, "").replace(/\*/g, "")
      .replace(/#{1,6}\s/g, "").replace(/```[\s\S]*?```/g, "")
      .replace(/---/g, "").replace(/•/g, "")
      .replace(/\n\n/g, ". ").replace(/\n/g, ". ");

    const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 500));
    utterance.rate = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Load profile and chat sessions
  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/login?next=/counsellor");
      return;
    }

    async function loadData() {
      try {
        const [profileRes, sessionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/chat/sessions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfileSummary({
            current_stage: data.current_stage,
            field_of_study: data.field_of_study,
            preferred_countries: data.preferred_countries,
          });
        }

        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setSessions(data.sessions || []);
        }
      } catch {
        // Ignore
      }
    }
    loadData();

    // Generate new session ID
    setCurrentSessionId(crypto.randomUUID().substring(0, 8));
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load a specific chat session
  async function loadSession(sessionId: string) {
    const token = window.localStorage.getItem("token");
    if (!token) return;

    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/history?session_id=${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const loadedMessages: Message[] = data.map((m: { role: string; content: string; created_at: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.created_at),
        }));
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
        setShowHistory(false);
      }
    } catch {
      setError("Failed to load chat history");
    } finally {
      setHistoryLoading(false);
    }
  }

  // Start new conversation
  function startNewChat() {
    setMessages([{
      role: "assistant",
      content: "👋 Starting a new conversation! How can I help you today?",
      timestamp: new Date(),
    }]);
    setCurrentSessionId(crypto.randomUUID().substring(0, 8));
    setShowHistory(false);
  }

  // Delete a session
  async function deleteSession(sessionId: string) {
    const token = window.localStorage.getItem("token");
    if (!token) return;

    await fetch(`${API_BASE_URL}/chat/session/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
  }

  // Check URL params for university overview request
  useEffect(() => {
    const universityName = searchParams.get("university");
    const universityId = searchParams.get("id");
    if (universityName && currentSessionId && !loading && !pendingUniversityPrompt) {
      const prompt = `Tell me about ${universityName}. Give me a comprehensive overview including: what makes it special, typical admission requirements, campus culture, and whether it's a good fit for my profile. Be specific and helpful.`;
      setPendingUniversityPrompt(prompt);
    }
  }, [searchParams, currentSessionId, loading, pendingUniversityPrompt]);

  // Send pending university prompt automatically
  useEffect(() => {
    if (pendingUniversityPrompt && currentSessionId && !loading) {
      const sendPendingMessage = async () => {
        const token = window.localStorage.getItem("token");
        if (!token) return;

        const userMessage: Message = {
          role: "user",
          content: pendingUniversityPrompt,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setPendingUniversityPrompt(null);
        setLoading(true);
        setError(null);

        try {
          // Save user message
          await fetch(`${API_BASE_URL}/chat/message?session_id=${currentSessionId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ role: "user", content: userMessage.content }),
          });

          // Get AI response
          const res = await fetch(`${API_BASE_URL}/counsellor`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ role: "user", content: userMessage.content }),
          });

          if (!res.ok) throw new Error(await res.text() || "Counsellor request failed");

          const data = (await res.json()) as ResponsePayload;
          const assistantMessage = data.messages[0];

          if (assistantMessage) {
            setMessages((prev) => [...prev, { ...assistantMessage, timestamp: new Date() }]);
            speak(assistantMessage.content);

            // Save assistant message
            await fetch(`${API_BASE_URL}/chat/message?session_id=${currentSessionId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ role: "assistant", content: assistantMessage.content }),
            });
          }
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      };

      sendPendingMessage();
    }
  }, [pendingUniversityPrompt, currentSessionId, loading, speak]);


  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/login?next=/counsellor");
      return;
    }
    if (!input.trim()) return;

    stopSpeaking();

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);
    setRecommendations([]);

    try {
      // Save user message to history
      await fetch(`${API_BASE_URL}/chat/message?session_id=${currentSessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: "user", content: userMessage.content }),
      });

      const res = await fetch(`${API_BASE_URL}/counsellor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: "user", content: userMessage.content }),
      });

      if (!res.ok) throw new Error(await res.text() || "Counsellor request failed");

      const data = (await res.json()) as ResponsePayload;
      const assistantMessage = data.messages[0];

      if (assistantMessage) {
        setMessages((prev) => [...prev, { ...assistantMessage, timestamp: new Date() }]);
        speak(assistantMessage.content);

        // Save assistant message to history
        await fetch(`${API_BASE_URL}/chat/message?session_id=${currentSessionId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "assistant", content: assistantMessage.content }),
        });
      }

      // Extract recommendations
      const recs: UniversityRecommendation[] = [];
      for (const action of data.actions) {
        if (action.type === "recommend_university") {
          recs.push(action.payload as unknown as UniversityRecommendation);
        }
      }
      setRecommendations(recs);

      // Refresh sessions list
      const sessionsRes = await fetch(`${API_BASE_URL}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions || []);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const stageLabels: Record<string, string> = {
    building_profile: "🏗️ Building Profile",
    discovering_universities: "🔍 Discovering Universities",
    finalizing_universities: "📋 Finalizing Universities",
    preparing_applications: "📝 Preparing Applications",
  };

  const stageColors: Record<string, string> = {
    building_profile: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    discovering_universities: "bg-blue-500/20 text-blue-300 border-blue-400/40",
    finalizing_universities: "bg-purple-500/20 text-purple-300 border-purple-400/40",
    preparing_applications: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Chat History Sidebar */}
      <div className={`${showHistory ? "w-72" : "w-0"} overflow-hidden transition-all duration-300 flex-shrink-0`}>
        <div className="w-72 h-full rounded-xl border border-white/10 bg-slate-900/80 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-100">Chat History</h3>
            <button
              onClick={startNewChat}
              className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full hover:bg-indigo-400"
            >
              + New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No chat history yet</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.session_id}
                  className={`p-2 rounded-lg cursor-pointer transition group ${session.session_id === currentSessionId
                    ? "bg-indigo-500/20 border border-indigo-400/40"
                    : "bg-slate-800/50 hover:bg-slate-700/50"
                    }`}
                  onClick={() => loadSession(session.session_id)}
                >
                  <p className="text-xs text-slate-200 line-clamp-2">{session.preview}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">
                      {new Date(session.started_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.session_id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              title="Toggle chat history"
            >
              📜
            </button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  AI Counsellor
                </span>
                {voiceSupported && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                    🎙️ Voice
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {voiceSupported && (
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`rounded-full px-2 py-1 text-[10px] font-medium transition ${voiceEnabled
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "bg-slate-800 text-slate-400"
                  }`}
              >
                {voiceEnabled ? "🔊" : "🔇"}
              </button>
            )}
          </div>
        </div>

        {/* Context chips */}
        {profileSummary && (
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className={`rounded-full px-2 py-0.5 border ${stageColors[profileSummary.current_stage] || "bg-slate-800 text-slate-300"}`}>
              {stageLabels[profileSummary.current_stage] || profileSummary.current_stage}
            </span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">
              📚 {profileSummary.field_of_study}
            </span>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-gradient-to-b from-slate-950/80 to-slate-900/60 p-3">
          <div className="flex flex-col gap-3 text-sm">
            {historyLoading && (
              <div className="text-center py-4 text-slate-400">Loading history...</div>
            )}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs whitespace-pre-wrap break-words ${m.role === "user"
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white"
                    : "bg-slate-800/80 text-slate-100 border border-white/5"
                    }`}
                >
                  {m.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-white/10">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[8px]">
                        🤖
                      </span>
                      <span className="text-[10px] text-slate-400">AI Counsellor</span>
                      {isSpeaking && idx === messages.length - 1 && (
                        <button onClick={stopSpeaking} className="ml-auto text-[10px] text-indigo-400">
                          ⏹️
                        </button>
                      )}
                    </div>
                  )}
                  {m.content}
                </div>
              </div>
            ))}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-2 text-xs ${rec.category === "dream"
                      ? "border-purple-400/40 bg-purple-950/30"
                      : rec.category === "safe"
                        ? "border-emerald-400/40 bg-emerald-950/30"
                        : "border-blue-400/40 bg-blue-950/30"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-100">
                        {rec.name || `University #${rec.university_id}`}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${rec.category === "dream"
                        ? "bg-purple-500/30 text-purple-200"
                        : rec.category === "safe"
                          ? "bg-emerald-500/30 text-emerald-200"
                          : "bg-blue-500/30 text-blue-200"
                        }`}>
                        {rec.category.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[10px]">{rec.fit_reason}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 rounded-2xl px-3 py-2 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                    <span className="text-[10px] text-slate-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all text-sm ${isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
            >
              {isListening ? "⏹️" : "🎙️"}
            </button>
          )}

          <input
            className={`flex-1 rounded-full border bg-slate-950 px-4 py-2 text-sm text-slate-50 outline-none transition-all ${isListening ? "border-red-400" : "border-white/10 focus:border-indigo-400"
              }`}
            placeholder={isListening ? "Listening..." : "Ask me anything..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isListening}
          />

          <button
            type="submit"
            disabled={loading || isListening}
            className="flex-shrink-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60"
          >
            {loading ? "..." : "Send"}
          </button>
        </form>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2">⚠️ {error}</p>
        )}

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {[
            "What universities fit my profile?",
            "Analyze my profile gaps",
            "What should I do next?",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="rounded-full bg-slate-800/80 px-2 py-1 text-slate-300 hover:bg-slate-700 transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
export default function CounsellorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CounsellorContent />
    </Suspense>
  );
}
