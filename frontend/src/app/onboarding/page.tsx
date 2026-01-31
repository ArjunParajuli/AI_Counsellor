"use client";

import { FormEvent, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { useConfetti } from "@/components/confetti";

type ExamStatus = "not_started" | "in_progress" | "completed";
type SopStatus = "not_started" | "draft" | "ready";
type OnboardingMode = "choice" | "manual" | "voice";

// Voice recognition types
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
}

type VoiceQuestion = {
  id: string;
  question: string;
  field: string;
  type: "text" | "number" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
};

const VOICE_QUESTIONS: VoiceQuestion[] = [
  {
    id: "1",
    question: "What is your current education level? For example, Bachelor's final year, or Master's completed.",
    field: "currentEducationLevel",
    type: "text",
    placeholder: "e.g., Bachelor's final year",
  },
  {
    id: "2",
    question: "What is your degree or major? For example, B.Tech in Computer Science.",
    field: "degreeMajor",
    type: "text",
    placeholder: "e.g., B.Tech in CSE",
  },
  {
    id: "3",
    question: "What year did you graduate or will you graduate?",
    field: "graduationYear",
    type: "number",
  },
  {
    id: "4",
    question: "What is your GPA or percentage? You can say 'skip' if you prefer not to share.",
    field: "gpa",
    type: "text",
    placeholder: "e.g., 8.2 or 85%",
  },
  {
    id: "5",
    question: "What degree are you planning to pursue? Bachelor's, Master's, MBA, or PhD?",
    field: "intendedDegree",
    type: "select",
    options: [
      { value: "bachelors", label: "Bachelor's" },
      { value: "masters", label: "Master's" },
      { value: "mba", label: "MBA" },
      { value: "phd", label: "PhD" },
    ],
  },
  {
    id: "6",
    question: "What field do you want to study? For example, Computer Science, Data Science, or Business.",
    field: "fieldOfStudy",
    type: "text",
    placeholder: "e.g., Computer Science",
  },
  {
    id: "7",
    question: "Which year are you targeting for admission? For example, 2025 or 2026.",
    field: "targetIntakeYear",
    type: "number",
  },
  {
    id: "8",
    question: "Which countries are you interested in studying? You can mention multiple countries.",
    field: "preferredCountries",
    type: "text",
    placeholder: "e.g., USA, Canada, UK",
  },
  {
    id: "9",
    question: "What is your annual budget in US dollars? For example, 25000 or 50000.",
    field: "budgetPerYear",
    type: "number",
  },
  {
    id: "10",
    question: "How do you plan to fund your education? Self-funded, scholarship-dependent, or loan-dependent?",
    field: "fundingPlan",
    type: "select",
    options: [
      { value: "self-funded", label: "Self-funded" },
      { value: "scholarship-dependent", label: "Scholarship-dependent" },
      { value: "loan-dependent", label: "Loan-dependent" },
    ],
  },
  {
    id: "11",
    question: "What is your IELTS or TOEFL status? Not started, in progress, or completed?",
    field: "ieltsToeflStatus",
    type: "select",
    options: [
      { value: "not_started", label: "Not started" },
      { value: "in_progress", label: "In progress" },
      { value: "completed", label: "Completed" },
    ],
  },
  {
    id: "12",
    question: "What is your GRE or GMAT status? Not started, in progress, or completed?",
    field: "greGmatStatus",
    type: "select",
    options: [
      { value: "not_started", label: "Not started" },
      { value: "in_progress", label: "In progress" },
      { value: "completed", label: "Completed" },
    ],
  },
  {
    id: "13",
    question: "What is your Statement of Purpose status? Not started, draft, or ready?",
    field: "sopStatus",
    type: "select",
    options: [
      { value: "not_started", label: "Not started" },
      { value: "draft", label: "Draft" },
      { value: "ready", label: "Ready" },
    ],
  },
];

const STEPS = [
  { id: 1, title: "Academic Background", icon: "🎓", fields: ["currentEducationLevel", "degreeMajor", "graduationYear", "gpa"] },
  { id: 2, title: "Study Goals", icon: "🎯", fields: ["intendedDegree", "fieldOfStudy", "targetIntakeYear", "preferredCountries"] },
  { id: 3, title: "Budget & Funding", icon: "💰", fields: ["budgetPerYear", "fundingPlan"] },
  { id: 4, title: "Exam Readiness", icon: "📝", fields: ["ieltsToeflStatus", "greGmatStatus", "sopStatus"] },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { fire: fireConfetti } = useConfetti();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<OnboardingMode>("choice");
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Form state
  const [currentEducationLevel, setCurrentEducationLevel] = useState("");
  const [degreeMajor, setDegreeMajor] = useState("");
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear());
  const [gpa, setGpa] = useState("");
  const [intendedDegree, setIntendedDegree] = useState("masters");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [targetIntakeYear, setTargetIntakeYear] = useState(new Date().getFullYear() + 1);
  const [preferredCountries, setPreferredCountries] = useState<string>("Canada,United States");
  const [budgetPerYear, setBudgetPerYear] = useState(25000);
  const [fundingPlan, setFundingPlan] = useState("self-funded");
  const [ieltsToeflStatus, setIeltsToeflStatus] = useState<ExamStatus>("not_started");
  const [greGmatStatus, setGreGmatStatus] = useState<ExamStatus>("not_started");
  const [sopStatus, setSopStatus] = useState<SopStatus>("not_started");

  // Voice mode state
  const [voiceQuestionIndex, setVoiceQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const formState: Record<string, string | number> = {
    currentEducationLevel,
    degreeMajor,
    graduationYear,
    gpa,
    intendedDegree,
    fieldOfStudy,
    targetIntakeYear,
    preferredCountries,
    budgetPerYear,
    fundingPlan,
    ieltsToeflStatus,
    greGmatStatus,
    sopStatus,
  };

  const setFormField = useCallback((field: string, value: string | number) => {
    switch (field) {
      case "currentEducationLevel": setCurrentEducationLevel(String(value)); break;
      case "degreeMajor": setDegreeMajor(String(value)); break;
      case "graduationYear": setGraduationYear(Number(value)); break;
      case "gpa": setGpa(String(value)); break;
      case "intendedDegree": setIntendedDegree(String(value)); break;
      case "fieldOfStudy": setFieldOfStudy(String(value)); break;
      case "targetIntakeYear": setTargetIntakeYear(Number(value)); break;
      case "preferredCountries": setPreferredCountries(String(value)); break;
      case "budgetPerYear": setBudgetPerYear(Number(value)); break;
      case "fundingPlan": setFundingPlan(String(value)); break;
      case "ieltsToeflStatus": setIeltsToeflStatus(value as ExamStatus); break;
      case "greGmatStatus": setGreGmatStatus(value as ExamStatus); break;
      case "sopStatus": setSopStatus(value as SopStatus); break;
    }
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/login?next=/onboarding");
      return;
    }

    async function loadProfile() {
      try {
        const res = await fetch(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentEducationLevel(data.current_education_level || "");
          setDegreeMajor(data.degree_major || "");
          setGraduationYear(data.graduation_year || new Date().getFullYear());
          setGpa(data.gpa ?? "");
          setIntendedDegree(data.intended_degree || "masters");
          setFieldOfStudy(data.field_of_study || "");
          setTargetIntakeYear(data.target_intake_year || new Date().getFullYear() + 1);
          setPreferredCountries(data.preferred_countries?.join(",") || "");
          setBudgetPerYear(data.budget_per_year || 25000);
          setFundingPlan(data.funding_plan || "self-funded");
          setIeltsToeflStatus(data.ielts_toefl_status || "not_started");
          setGreGmatStatus(data.gre_gmat_status || "not_started");
          setSopStatus(data.sop_status || "not_started");
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) {
        resolve();
        return;
      }
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      synthRef.current.speak(utterance);
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = (window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
    };

    recognition.onerror = (event: { error: string }) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setVoiceTranscript("");
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const processVoiceAnswer = useCallback((transcript: string) => {
    const question = VOICE_QUESTIONS[voiceQuestionIndex];
    if (!question) return;

    let value: string | number = transcript;

    // Handle "skip" for optional fields
    if (transcript.toLowerCase().includes("skip")) {
      value = "";
    } else if (question.type === "number") {
      const num = parseInt(transcript.replace(/[^\d]/g, ""));
      value = isNaN(num) ? 0 : num;
    } else if (question.type === "select" && question.options) {
      const lower = transcript.toLowerCase();
      const match = question.options.find(
        (opt) => lower.includes(opt.label.toLowerCase()) || lower.includes(opt.value.toLowerCase())
      );
      value = match?.value || question.options[0].value;
    }

    setFormField(question.field, value);
  }, [voiceQuestionIndex, setFormField]);

  const askNextQuestion = useCallback(async () => {
    if (voiceQuestionIndex >= VOICE_QUESTIONS.length) {
      await speak("Great! I've collected all your information. Let me save your profile.");
      await handleSubmit();
      return;
    }

    const question = VOICE_QUESTIONS[voiceQuestionIndex];
    await speak(question.question);

    // Small delay before starting to listen
    setTimeout(() => {
      startListening();
    }, 500);
  }, [voiceQuestionIndex, speak, startListening]);

  const confirmVoiceAnswer = useCallback(async () => {
    processVoiceAnswer(voiceTranscript);
    setVoiceTranscript("");
    setVoiceQuestionIndex((prev) => prev + 1);
  }, [voiceTranscript, processVoiceAnswer]);

  // Auto-ask next question when index changes
  useEffect(() => {
    if (mode === "voice" && voiceQuestionIndex > 0 && voiceQuestionIndex < VOICE_QUESTIONS.length) {
      askNextQuestion();
    }
  }, [voiceQuestionIndex, mode]);

  async function handleSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setSaving(true);
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/login?next=/onboarding");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_education_level: currentEducationLevel,
          degree_major: degreeMajor,
          graduation_year: graduationYear,
          gpa: gpa ? Number(gpa) : null,
          intended_degree: intendedDegree,
          field_of_study: fieldOfStudy,
          target_intake_year: targetIntakeYear,
          preferred_countries: preferredCountries
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          budget_per_year: budgetPerYear,
          funding_plan: fundingPlan,
          ielts_toefl_status: ieltsToeflStatus,
          gre_gmat_status: greGmatStatus,
          sop_status: sopStatus,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save profile");
      }
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const isStepComplete = (stepId: number) => {
    const step = STEPS.find((s) => s.id === stepId);
    if (!step) return false;
    return step.fields.every((field) => {
      const value = formState[field];
      if (field === "gpa") return true; // Optional
      return value !== "" && value !== 0;
    });
  };

  const canProceedToNextStep = () => isStepComplete(currentStep);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Mode Selection Screen
  if (mode === "choice") {
    return (
      <section className="mx-auto max-w-3xl py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-6">
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            Let&apos;s Get to Know You
          </h1>
          <p className="text-slate-300 max-w-lg mx-auto">
            Your answers power all AI recommendations, university suggestions, and personalized to-dos.
            Choose how you&apos;d like to complete your profile.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Manual Form Option */}
          <button
            onClick={() => setMode("manual")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-left transition-all hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-[1.02]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition"></div>
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-5">
                <span className="text-3xl">📝</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Step-by-Step Form</h2>
              <p className="text-sm text-slate-400 mb-4">
                Fill out a guided form with 4 easy steps. Navigate at your own pace.
              </p>
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
                <span>Start typing</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Voice Mode Option */}
          <button
            onClick={() => {
              setMode("voice");
              setVoiceQuestionIndex(0);
              setTimeout(() => askNextQuestion(), 500);
            }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-left transition-all hover:border-purple-400/50 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition"></div>
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-5">
                <span className="text-3xl">🎙️</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Voice Conversation</h2>
              <p className="text-sm text-slate-400 mb-4">
                Answer questions using your voice. Quick, hands-free, and conversational.
              </p>
              <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
                <span>Start talking</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          You can switch between modes anytime during the process
        </p>
      </section>
    );
  }

  // Voice Mode
  if (mode === "voice") {
    const currentQuestion = VOICE_QUESTIONS[voiceQuestionIndex];
    const progress = ((voiceQuestionIndex) / VOICE_QUESTIONS.length) * 100;

    return (
      <section className="mx-auto max-w-2xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              stopSpeaking();
              stopListening();
              setMode("choice");
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back</span>
          </button>
          <button
            onClick={() => {
              stopSpeaking();
              stopListening();
              setMode("manual");
            }}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Switch to Form →
          </button>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Question {voiceQuestionIndex + 1} of {VOICE_QUESTIONS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Voice Interface */}
        <div className="text-center py-8">
          {/* Speaking/Listening Indicator */}
          <div className={`relative w-32 h-32 mx-auto mb-8 ${isSpeaking || isListening ? "animate-pulse" : ""}`}>
            <div className={`absolute inset-0 rounded-full ${isSpeaking ? "bg-purple-500/30" : isListening ? "bg-pink-500/30" : "bg-slate-800/50"
              } blur-2xl`}></div>
            <div className={`relative w-full h-full rounded-full flex items-center justify-center border-4 ${isSpeaking ? "border-purple-500 bg-purple-500/20" :
              isListening ? "border-pink-500 bg-pink-500/20 animate-pulse" :
                "border-slate-600 bg-slate-800"
              }`}>
              <span className="text-5xl">
                {isSpeaking ? "🗣️" : isListening ? "🎤" : "💬"}
              </span>
            </div>
          </div>

          {/* Status */}
          <p className="text-sm text-slate-400 mb-4">
            {isSpeaking ? "AI is speaking..." : isListening ? "Listening to you..." : "Ready for your answer"}
          </p>

          {/* Current Question */}
          {currentQuestion && (
            <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 mb-6">
              <p className="text-lg text-white">{currentQuestion.question}</p>
            </div>
          )}

          {/* Transcript */}
          {voiceTranscript && (
            <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-xl p-4 mb-6">
              <p className="text-xs text-indigo-400 mb-1">I heard:</p>
              <p className="text-white font-medium">&quot;{voiceTranscript}&quot;</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isListening && !isSpeaking && voiceTranscript && (
              <>
                <button
                  onClick={() => {
                    setVoiceTranscript("");
                    startListening();
                  }}
                  className="px-4 py-2 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
                >
                  🔄 Try Again
                </button>
                <button
                  onClick={confirmVoiceAnswer}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition"
                >
                  ✓ Confirm & Next
                </button>
              </>
            )}

            {!isListening && !isSpeaking && !voiceTranscript && voiceQuestionIndex < VOICE_QUESTIONS.length && (
              <button
                onClick={startListening}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition flex items-center gap-2"
              >
                <span className="text-xl">🎤</span>
                Start Speaking
              </button>
            )}

            {isListening && (
              <button
                onClick={stopListening}
                className="px-8 py-3 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-500 transition animate-pulse"
              >
                ⬛ Stop Listening
              </button>
            )}
          </div>

          {/* Skip Option */}
          {currentQuestion && !isListening && !isSpeaking && (
            <button
              onClick={() => {
                setVoiceTranscript("");
                setVoiceQuestionIndex((prev) => prev + 1);
              }}
              className="mt-6 text-sm text-slate-500 hover:text-slate-300 transition"
            >
              Skip this question →
            </button>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3 mt-4 text-center">
            ⚠️ {error}
          </p>
        )}
      </section>
    );
  }

  // Manual Step-by-Step Form Mode
  return (
    <section className="mx-auto max-w-3xl py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setMode("choice")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back</span>
        </button>
        <button
          onClick={() => setMode("voice")}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          🎙️ Switch to Voice
        </button>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => {
            const isComplete = isStepComplete(step.id);
            const isActive = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => {
                    // Fire confetti when clicking on a completed step
                    if (isComplete && !isActive) {
                      fireConfetti("stars");
                    }
                    setCurrentStep(step.id);
                  }}
                  className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${isActive
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40 scale-110 ring-4 ring-indigo-500/30"
                      : isComplete
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500"
                    }`}
                >
                  {isComplete && !isActive ? (
                    <span className="text-xl font-bold">✓</span>
                  ) : (
                    <span className="text-xl">{step.icon}</span>
                  )}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 animate-ping opacity-20" />
                  )}
                  {isComplete && !isActive && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center text-[10px] shadow-lg">
                      ✨
                    </span>
                  )}
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 md:w-20 h-1.5 mx-2 rounded-full transition-all duration-500 ${isComplete
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/30"
                      : "bg-slate-200 dark:bg-slate-700"
                    }`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs">
          {STEPS.map((step) => (
            <span
              key={step.id}
              className={`font-medium transition-colors ${currentStep === step.id
                  ? "text-indigo-600 dark:text-indigo-400"
                  : isStepComplete(step.id)
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Step 1: Academic Background */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                <span className="text-2xl">🎓</span> Academic Background
              </h2>
              <p className="text-sm text-slate-400 mb-6">Tell us about your current education</p>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Current Education Level <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                    value={currentEducationLevel}
                    onChange={(e) => setCurrentEducationLevel(e.target.value)}
                    placeholder="e.g., Bachelor's final year"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Degree / Major <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                    value={degreeMajor}
                    onChange={(e) => setDegreeMajor(e.target.value)}
                    placeholder="e.g., B.Tech in CSE"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Graduation Year <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    GPA / Percentage <span className="text-slate-500 text-xs">(optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="e.g., 8.2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Study Goals */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                <span className="text-2xl">🎯</span> Study Goals
              </h2>
              <p className="text-sm text-slate-400 mb-6">What are you planning to study abroad?</p>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Intended Degree <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                    value={intendedDegree}
                    onChange={(e) => setIntendedDegree(e.target.value)}
                  >
                    <option value="bachelors">Bachelor&apos;s</option>
                    <option value="masters">Master&apos;s</option>
                    <option value="mba">MBA</option>
                    <option value="phd">PhD</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Field of Study <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Target Intake Year <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                    value={targetIntakeYear}
                    onChange={(e) => setTargetIntakeYear(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Preferred Countries <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                    value={preferredCountries}
                    onChange={(e) => setPreferredCountries(e.target.value)}
                    placeholder="e.g., USA, Canada, UK"
                    required
                  />
                  <p className="text-xs text-slate-500">Separate multiple countries with commas</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Budget */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                <span className="text-2xl">💰</span> Budget & Funding
              </h2>
              <p className="text-sm text-slate-400 mb-6">How will you finance your education?</p>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Annual Budget (USD) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/50 pl-8 pr-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                      value={budgetPerYear}
                      onChange={(e) => setBudgetPerYear(Number(e.target.value))}
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500">Including tuition and living expenses</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Funding Plan <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                    value={fundingPlan}
                    onChange={(e) => setFundingPlan(e.target.value)}
                  >
                    <option value="self-funded">💵 Self-funded</option>
                    <option value="scholarship-dependent">🎓 Scholarship-dependent</option>
                    <option value="loan-dependent">🏦 Loan-dependent</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Exams */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                <span className="text-2xl">📝</span> Exam Readiness
              </h2>
              <p className="text-sm text-slate-400 mb-6">Where are you in your test preparation?</p>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    IELTS / TOEFL
                  </label>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                    value={ieltsToeflStatus}
                    onChange={(e) => setIeltsToeflStatus(e.target.value as ExamStatus)}
                  >
                    <option value="not_started">⏳ Not started</option>
                    <option value="in_progress">📖 In progress</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    GRE / GMAT
                  </label>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                    value={greGmatStatus}
                    onChange={(e) => setGreGmatStatus(e.target.value as ExamStatus)}
                  >
                    <option value="not_started">⏳ Not started</option>
                    <option value="in_progress">📖 In progress</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Statement of Purpose
                  </label>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                    value={sopStatus}
                    onChange={(e) => setSopStatus(e.target.value as SopStatus)}
                  >
                    <option value="not_started">⏳ Not started</option>
                    <option value="draft">📝 Draft</option>
                    <option value="ready">✅ Ready</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-xl p-3 mt-4">
            ⚠️ {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-6 py-2.5 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={!canProceedToNextStep()}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next Step →
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving || !isStepComplete(4)}
              className="px-8 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-40"
            >
              {saving ? "Saving..." : "Complete Setup ✓"}
            </button>
          )}
        </div>
      </form>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </section>
  );
}
