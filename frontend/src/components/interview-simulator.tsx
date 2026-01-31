"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";

type InterviewType = "visa" | "admission";

type Message = {
    id: string;
    role: "interviewer" | "user" | "feedback";
    content: string;
    timestamp: Date;
};

type InterviewSession = {
    id: string;
    type: InterviewType;
    universityName: string;
    country: string;
    program: string;
    messages: Message[];
    score?: number;
    completed: boolean;
};

type InterviewSimulatorProps = {
    universityId: number;
    universityName: string;
    country: string;
    program: string;
    onClose?: () => void;
};

// Extend Window interface for SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition;
        webkitSpeechRecognition: typeof SpeechRecognition;
    }
}

export default function InterviewSimulator({
    universityName,
    country,
    program,
    onClose,
}: InterviewSimulatorProps) {
    const [interviewType, setInterviewType] = useState<InterviewType | null>(null);
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [questionNumber, setQuestionNumber] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice mode state
    const [voiceMode, setVoiceMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Check for voice support on mount
    useEffect(() => {
        const hasTTS = typeof window !== "undefined" && "speechSynthesis" in window;
        const hasSTT = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
        setVoiceSupported(hasTTS && hasSTT);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-scroll disabled - user controls scrolling manually

    const MAX_QUESTIONS = 5;

    const visaQuestions = [
        `Why do you want to study in ${country}?`,
        `Tell me about your academic background and why you chose ${program}.`,
        "How do you plan to fund your studies?",
        "What are your plans after completing your studies?",
        "Do you have any ties to your home country that will ensure your return?",
    ];

    const admissionQuestions = [
        `Why did you choose ${universityName} for your ${program} program?`,
        "Tell me about a challenging project you've worked on and what you learned.",
        "What are your short-term and long-term career goals?",
        "How do you handle failure or setbacks? Give an example.",
        "What unique qualities would you bring to our program?",
    ];

    // Text-to-Speech function
    const speakText = useCallback((text: string) => {
        if (!voiceMode || !("speechSynthesis" in window)) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Clean the text (remove markdown)
        const cleanText = text
            .replace(/\*\*/g, "")
            .replace(/\n/g, " ")
            .replace(/Question \d+\/\d+:/g, "Question:")
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Try to use a more natural voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google"))
            || voices.find(v => v.lang.startsWith("en"));
        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [voiceMode]);

    // Speech-to-Text functions
    const startListening = useCallback(() => {
        if (!voiceSupported) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        // Stop any ongoing speech
        window.speechSynthesis.cancel();
        setIsSpeaking(false);

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            let finalTranscript = "";
            let interimTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript = transcript;
                }
            }

            if (finalTranscript) {
                setInput(prev => prev + finalTranscript);
            } else if (interimTranscript) {
                // Show interim results in a way that doesn't overwrite final ones
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [voiceSupported]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    const startInterview = async (type: InterviewType) => {
        setInterviewType(type);
        setQuestionNumber(1);

        const firstQuestion = type === "visa" ? visaQuestions[0] : admissionQuestions[0];
        const welcomeText = `Welcome! This is a mock ${type === "visa" ? "visa" : "university admission"} interview for ${universityName}, ${country}. I'll ask you ${MAX_QUESTIONS} questions. Take your time to answer thoughtfully.\n\n**Question 1/${MAX_QUESTIONS}:** ${firstQuestion}`;

        const newSession: InterviewSession = {
            id: `session-${Date.now()}`,
            type,
            universityName,
            country,
            program,
            messages: [
                {
                    id: `msg-${Date.now()}`,
                    role: "interviewer",
                    content: welcomeText,
                    timestamp: new Date(),
                },
            ],
            completed: false,
        };

        setSession(newSession);

        // Speak the welcome message if voice mode is enabled
        if (voiceMode) {
            setTimeout(() => speakText(welcomeText), 500);
        }
    };

    const submitAnswer = async () => {
        if (!input.trim() || !session || loading) return;

        // Stop listening if active
        stopListening();

        setLoading(true);
        const userAnswer = input.trim();
        setInput("");

        // Add user's answer
        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: "user",
            content: userAnswer,
            timestamp: new Date(),
        };

        setSession((prev) => ({
            ...prev!,
            messages: [...prev!.messages, userMessage],
        }));

        try {
            const token = window.localStorage.getItem("token");

            // Get AI feedback on the answer
            const feedbackRes = await fetch(`${API_BASE_URL}/interview/feedback`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    interview_type: interviewType,
                    question_number: questionNumber,
                    question: interviewType === "visa"
                        ? visaQuestions[questionNumber - 1]
                        : admissionQuestions[questionNumber - 1],
                    answer: userAnswer,
                    university_name: universityName,
                    country: country,
                    program: program,
                }),
            });

            let feedbackContent = "Good answer! Let's continue.";
            if (feedbackRes.ok) {
                const data = await feedbackRes.json();
                feedbackContent = data.feedback;
            }

            // Add feedback
            const feedbackMessage: Message = {
                id: `msg-${Date.now()}-feedback`,
                role: "feedback",
                content: feedbackContent,
                timestamp: new Date(),
            };

            setSession((prev) => ({
                ...prev!,
                messages: [...prev!.messages, feedbackMessage],
            }));

            // Check if interview is complete
            if (questionNumber >= MAX_QUESTIONS) {
                // Get final score
                const scoreRes = await fetch(`${API_BASE_URL}/interview/score`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        interview_type: interviewType,
                        messages: session.messages.concat([userMessage, feedbackMessage]).map(m => ({
                            role: m.role,
                            content: m.content,
                        })),
                        university_name: universityName,
                        country: country,
                        program: program,
                    }),
                });

                let finalScore = 75;
                let finalFeedback = "Great job completing the interview!";
                if (scoreRes.ok) {
                    const scoreData = await scoreRes.json();
                    finalScore = scoreData.score;
                    finalFeedback = scoreData.summary;
                }

                const completionText = `🎉 **Interview Complete!**\n\n**Your Score: ${finalScore}/100**\n\n${finalFeedback}\n\nYou can practice again anytime to improve your skills!`;

                const completionMessage: Message = {
                    id: `msg-${Date.now()}-complete`,
                    role: "interviewer",
                    content: completionText,
                    timestamp: new Date(),
                };

                setSession((prev) => ({
                    ...prev!,
                    messages: [...prev!.messages, completionMessage],
                    score: finalScore,
                    completed: true,
                }));

                if (voiceMode) {
                    setTimeout(() => speakText(completionText), 500);
                }
            } else {
                // Ask next question
                const nextQuestionNum = questionNumber + 1;
                setQuestionNumber(nextQuestionNum);

                const nextQuestion = interviewType === "visa"
                    ? visaQuestions[nextQuestionNum - 1]
                    : admissionQuestions[nextQuestionNum - 1];

                const nextQuestionText = `**Question ${nextQuestionNum}/${MAX_QUESTIONS}:** ${nextQuestion}`;

                const nextQuestionMessage: Message = {
                    id: `msg-${Date.now()}-q`,
                    role: "interviewer",
                    content: nextQuestionText,
                    timestamp: new Date(),
                };

                setSession((prev) => ({
                    ...prev!,
                    messages: [...prev!.messages, nextQuestionMessage],
                }));

                if (voiceMode) {
                    setTimeout(() => speakText(nextQuestionText), 500);
                }
            }
        } catch (error) {
            console.error("Interview error:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetInterview = () => {
        stopListening();
        window.speechSynthesis?.cancel();
        setSession(null);
        setInterviewType(null);
        setQuestionNumber(0);
        setInput("");
        setIsSpeaking(false);
    };

    // Type selection screen
    if (!interviewType) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🎤</span>
                            <div>
                                <h2 className="text-xl font-bold">Mock Interview Simulator</h2>
                                <p className="text-violet-100 text-sm">
                                    {universityName} • {program}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Voice Mode Toggle */}
                            {voiceSupported && (
                                <button
                                    onClick={() => setVoiceMode(!voiceMode)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${voiceMode
                                        ? "bg-white text-violet-600"
                                        : "bg-white/20 text-white hover:bg-white/30"
                                        }`}
                                    title={voiceMode ? "Voice mode ON" : "Voice mode OFF"}
                                >
                                    {voiceMode ? "🔊" : "🔇"}
                                    <span className="hidden sm:inline">Voice {voiceMode ? "ON" : "OFF"}</span>
                                </button>
                            )}
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-lg transition"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-slate-600 dark:text-slate-300 text-center">
                        Practice your interview skills with AI-powered mock interviews. Choose the type of interview you want to prepare for:
                    </p>

                    {/* Voice Mode Info */}
                    {voiceMode && (
                        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 flex items-start gap-3">
                            <span className="text-2xl">🎙️</span>
                            <div>
                                <p className="text-violet-800 dark:text-violet-200 text-sm font-bold">Voice Mode Enabled</p>
                                <p className="text-violet-600 dark:text-violet-300 text-xs mt-1">
                                    Questions will be read aloud. Click the microphone button to record your answers.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Visa Interview */}
                        <button
                            onClick={() => startInterview("visa")}
                            className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-lg text-left"
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl text-white mb-4 group-hover:scale-110 transition-transform">
                                🛂
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
                                Visa Interview
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Practice common student visa interview questions for {country}.
                                Learn to articulate your plans and demonstrate ties to your home country.
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
                                <span>Start Practice</span>
                                <span>→</span>
                            </div>
                        </button>

                        {/* Admission Interview */}
                        <button
                            onClick={() => startInterview("admission")}
                            className="group p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-lg text-left"
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-2xl text-white mb-4 group-hover:scale-110 transition-transform">
                                🎓
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
                                Admission Interview
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Prepare for university admission interviews. Practice explaining your goals,
                                achievements, and why you're a great fit for {program}.
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm font-medium">
                                <span>Start Practice</span>
                                <span>→</span>
                            </div>
                        </button>
                    </div>

                    {/* Tips */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <p className="text-amber-800 dark:text-amber-200 text-sm flex items-start gap-2">
                            <span className="text-lg">💡</span>
                            <span>
                                <strong>Tip:</strong> Answer as you would in a real interview.
                                The AI will provide feedback on your responses to help you improve!
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Interview in progress
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm animate-fadeIn flex flex-col" style={{ maxHeight: "600px" }}>
            {/* Header */}
            <div className={`p-4 text-white ${interviewType === "visa" ? "bg-gradient-to-r from-blue-500 to-indigo-600" : "bg-gradient-to-r from-purple-500 to-violet-600"}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{interviewType === "visa" ? "🛂" : "🎓"}</span>
                        <div>
                            <h2 className="font-bold">
                                {interviewType === "visa" ? "Visa Interview" : "Admission Interview"}
                            </h2>
                            <p className="text-xs opacity-80">
                                {universityName} • Question {Math.min(questionNumber, MAX_QUESTIONS)}/{MAX_QUESTIONS}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Voice indicators */}
                        {voiceMode && (
                            <div className="flex items-center gap-1">
                                {isSpeaking && (
                                    <span className="px-2 py-1 rounded-full bg-white/20 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                                        🔊 Speaking
                                    </span>
                                )}
                            </div>
                        )}
                        {!session?.completed && (
                            <div className="flex gap-1">
                                {[...Array(MAX_QUESTIONS)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${i < questionNumber ? "bg-white" : "bg-white/30"
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                        <button
                            onClick={resetInterview}
                            className="p-2 hover:bg-white/20 rounded-lg transition text-sm"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: "400px" }}>
                {session?.messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                ? "bg-indigo-600 text-white"
                                : msg.role === "feedback"
                                    ? "bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                                }`}
                        >
                            {msg.role === "feedback" && (
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                                    <span>💬</span> Feedback
                                </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {!session?.completed ? (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                        {/* Microphone Button for Voice Mode */}
                        {voiceMode && voiceSupported && (
                            <button
                                onClick={toggleListening}
                                disabled={loading || isSpeaking}
                                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isListening
                                    ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={isListening ? "Stop recording" : "Start recording"}
                            >
                                {isListening ? (
                                    <span className="text-xl">⏹️</span>
                                ) : (
                                    <span className="text-xl">🎙️</span>
                                )}
                            </button>
                        )}
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    submitAnswer();
                                }
                            }}
                            placeholder={voiceMode ? "Speak or type your answer..." : "Type your answer... (Press Enter to submit)"}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            rows={2}
                            disabled={loading}
                        />
                        <button
                            onClick={submitAnswer}
                            disabled={!input.trim() || loading}
                            className="px-6 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            <span>Send</span>
                            <span>→</span>
                        </button>
                    </div>
                    {/* Recording indicator */}
                    {isListening && (
                        <div className="mt-2 flex items-center gap-2 text-red-500 text-xs font-medium animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Recording... Speak now. Click stop or send when done.
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                    <button
                        onClick={resetInterview}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
                    >
                        Practice Another Interview
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-6 py-3 border border-slate-200 dark:border-slate-600 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                            Close
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
