'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import Image from 'next/image';

// ──────────────────────────────────────────────
// Knowledge Base
// ──────────────────────────────────────────────

interface QAPair {
  keywords: string[];
  answer: string;
}

const KNOWLEDGE_BASE: QAPair[] = [
  // Admissions
  {
    keywords: ['apply', 'admission', 'admissions', 'enroll', 'enrollment', 'join', 'register', 'registration'],
    answer: '📋 **How to Apply:**\n\n1. Visit our Admissions page\n2. Fill out the online application form\n3. Submit required documents (transcripts, CNIC, photos)\n4. Pay the application fee\n5. Await your admission decision\n\n🗓️ Admissions typically open in **June (Fall)** and **December (Spring)**.\n\n➡️ [Visit Admissions Page](/admissions)',
  },
  {
    keywords: ['requirement', 'requirements', 'eligibility', 'criteria', 'qualify', 'marks', 'percentage'],
    answer: '📝 **Admission Requirements:**\n\n• **BS Programs:** Minimum 60% marks in intermediate (HSSC/A-Levels)\n• **MS Programs:** 16 years of education with minimum 2.5 CGPA\n• **PhD Programs:** MS/MPhil degree with minimum 3.0 CGPA\n• Valid CNIC/Passport\n• Entry test (conducted by HITEC or NTS)\n\nSpecific programs may have additional requirements.',
  },
  {
    keywords: ['deadline', 'last date', 'when', 'dates', 'open', 'close', 'start'],
    answer: '🗓️ **Key Dates:**\n\n• **Fall Admissions:** Applications open in June, classes start in September\n• **Spring Admissions:** Applications open in December, classes start in February\n• **Summer Semester:** Available for select programs (June–August)\n\nKeep an eye on our Admissions page for exact deadlines!',
  },
  // Programs
  {
    keywords: ['program', 'programs', 'course', 'courses', 'degree', 'degrees', 'offer', 'offered', 'department', 'departments'],
    answer: '🎓 **Programs Offered at HITEC University:**\n\n**Engineering:**\n• BS Electrical Engineering\n• BS Mechanical Engineering\n• BS Software Engineering\n• BS Computer Science\n\n**Management Sciences:**\n• BBA, MBA\n\n**Natural Sciences:**\n• BS Mathematics, BS Physics\n\n**Computing:**\n• BS Computer Science\n• BS Information Technology\n• BS Artificial Intelligence\n\nAll programs are HEC recognized. Visit our website for the full list!',
  },
  {
    keywords: ['fee', 'fees', 'tuition', 'cost', 'charges', 'price', 'expensive', 'affordable', 'scholarship'],
    answer: '💰 **Fee Structure:**\n\n• **BS Programs:** Approx. PKR 80,000 – 120,000 per semester\n• **MS Programs:** Approx. PKR 100,000 – 150,000 per semester\n• Payment methods: Bank, Easypaisa, JazzCash, Card\n\n🎯 **Scholarships Available:**\n• Need-based financial aid\n• Merit scholarships (3.5+ CGPA)\n• Kinship discount for siblings\n\nLog into the Student Portal to view your personalized fee details.',
  },
  {
    keywords: ['duration', 'years', 'long', 'semester', 'semesters', 'how long'],
    answer: '⏱️ **Program Durations:**\n\n• **BS Programs:** 4 years (8 semesters)\n• **MS Programs:** 1.5 – 2 years (3–4 semesters)\n• **PhD Programs:** 3 – 5 years\n• **Each semester:** Approximately 16–18 weeks\n\nSummer semesters are optional and shorter (8 weeks).',
  },
  // Attendance
  {
    keywords: ['attendance', 'absent', 'leave', 'present', 'attendance policy', 'shortage'],
    answer: '📊 **Attendance Policy:**\n\n• Minimum **75% attendance** is required in each course\n• Below 75% → student may be **debarred** from final exams\n• Leave applications must be submitted in advance\n• Medical leave requires a valid medical certificate\n\nYou can track your attendance in real-time through the Student Portal → Attendance section.',
  },
  // Campus & Location
  {
    keywords: ['location', 'where', 'address', 'campus', 'city', 'taxila', 'map', 'direction'],
    answer: '📍 **HITEC University Location:**\n\nHITEC University, Taxila Cantt\nPunjab, Pakistan 🇵🇰\n\n• Located in the historic city of **Taxila**\n• Approximately 35 km from Islamabad/Rawalpindi\n• Well-connected by Islamabad–Peshawar Motorway (M-1)\n• Beautiful green campus with modern facilities',
  },
  // Library
  {
    keywords: ['library', 'books', 'borrow', 'reading', 'study', 'library hours', 'book'],
    answer: '📚 **Library Information:**\n\n• **Hours:** Mon–Fri: 8:00 AM – 8:00 PM, Sat: 9:00 AM – 5:00 PM\n• **Collection:** 100,000+ books and journals\n• **Digital Resources:** Access to IEEE, Springer, and HEC digital library\n• **Borrowing:** Students can borrow up to 3 books for 14 days\n• **Fine:** PKR 20/day for overdue books\n\nManage your library account through the Student Portal → Library section.',
  },
  // Hostel
  {
    keywords: ['hostel', 'accommodation', 'dorm', 'dormitory', 'housing', 'stay', 'living'],
    answer: '🏠 **Hostel Facilities:**\n\n• Separate hostels for male and female students\n• Furnished rooms with Wi-Fi\n• Mess/dining facilities available\n• 24/7 security with CCTV\n• Common rooms and study areas\n• Laundry services\n\nHostel fees are separate from tuition. Contact the admin office for availability and rates.',
  },
  // Login & Portal
  {
    keywords: ['login', 'log in', 'sign in', 'portal', 'access', 'dashboard', 'account'],
    answer: '🔑 **Portal Access:**\n\nTo log in to your portal:\n1. Click **"Portal Login"** button in the navigation bar\n2. Enter your university email and password\n3. You\'ll be redirected to your role-specific dashboard\n\n➡️ [Go to Login Page](/login)\n\nNew students receive their credentials via email after admission confirmation.',
  },
  {
    keywords: ['password', 'forgot', 'reset', 'cant login', 'locked', 'can\'t login'],
    answer: '🔐 **Forgot Your Password?**\n\n1. Go to the Login page\n2. Click "Forgot Password"\n3. Enter your university email\n4. Check your inbox for a password reset link\n5. Create a new password\n\nIf you still can\'t access your account, contact IT support:\n📧 it.support@hitecuni.edu.pk',
  },
  {
    keywords: ['grades', 'grade', 'cgpa', 'gpa', 'sgpa', 'result', 'results', 'transcript', 'marks'],
    answer: '📊 **Checking Your Grades:**\n\nLog into the Student Portal to view:\n• **Current SGPA** (Semester GPA)\n• **Cumulative CGPA**\n• Course-wise marks breakdown\n• Official transcript (printable)\n\n➡️ Student Portal → Academics section\n\nGrades are typically updated within 2 weeks after final exams.',
  },
  // Contact
  {
    keywords: ['contact', 'phone', 'email', 'call', 'help', 'support', 'helpline', 'reach', 'office'],
    answer: '📞 **Contact Information:**\n\n**Admin Office:**\n• 📧 admin@hitecuni.edu.pk\n• 📞 +92-51-9314354\n\n**Admissions Office:**\n• 📧 admissions@hitecuni.edu.pk\n• 📞 +92-51-9314252\n\n**IT Support:**\n• 📧 it.support@hitecuni.edu.pk\n\n**Address:**\nHITEC University, Taxila Cantt, Punjab, Pakistan\n\n**Office Hours:** Mon–Fri, 8:00 AM – 4:00 PM',
  },
  // Transport
  {
    keywords: ['transport', 'bus', 'shuttle', 'travel', 'commute', 'pick', 'drop'],
    answer: '🚌 **Transport Service:**\n\n• University shuttle service available from Rawalpindi/Islamabad\n• Multiple pick-up points across the twin cities\n• Separate transport fee (per semester)\n• Bus schedule available at the transport office\n\nContact the transport department for routes and timings.',
  },
  // Greetings & Chitchat
  {
    keywords: ['hi', 'hello', 'hey', 'assalam', 'salam', 'good morning', 'good evening', 'good afternoon', 'yo', 'greetings'],
    answer: '👋 **Hello! Welcome to HITEC University!**\n\nI\'m HiSUP Assistant — your guide to everything about HITEC University. How can I help you today?\n\nYou can ask me about:\n• 📋 Admissions & Requirements\n• 🎓 Programs & Courses\n• 💰 Fees & Scholarships\n• 📚 Library & Campus\n• 🔑 Portal Login Help\n• 📞 Contact Information',
  },
  {
    keywords: ['how are you', 'how are u', 'how you doing', 'how r u', 'are you fine', 'are u fine', 'are you doing well'],
    answer: '🤖 I\'m doing great, thank you for asking! I\'m virtual, so I don\'t get tired or sleepy. \n\nHow is your day going? Let me know if you need help with admissions, programs, fees, or portal details! 😊',
  },
  {
    keywords: ['who are you', 'who r u', 'what is your name', 'whats your name', 'your name', 'what are you', 'identify'],
    answer: '🤖 I\'m the **HiSUP Assistant**, a smart virtual guide designed for the HITEC Smart University Portal (HiSUP).\n\nMy job is to help students and visitors find quick information about admissions, courses, schedules, fees, and campus services!',
  },
  {
    keywords: ['who created you', 'who made you', 'who built you', 'creator', 'developer', 'developers'],
    answer: '💻 I was built by the development team of the **HITEC Smart University Portal (HiSUP)** using React and Next.js to make university information more accessible to everyone!',
  },
  {
    keywords: ['joke', 'tell me a joke', 'funny', 'humor'],
    answer: '😄 Here is a student joke for you:\n\n**Professor:** "Why are you late for class?"\n**Student:** "Because of a sign on the road."\n**Professor:** "What sign?"\n**Student:** "It said: *School Ahead, Go Slow.*" 🚗🏫',
  },
  {
    keywords: ['thanks', 'thank you', 'thankyou', 'thank', 'shukriya', 'appreciate'],
    answer: '😊 You\'re welcome! If you have any more questions, feel free to ask. I\'m here to help!\n\nHave a great day! 🌟',
  },
  {
    keywords: ['bye', 'goodbye', 'see you', 'good bye', 'later'],
    answer: '👋 Goodbye! Thank you for visiting HITEC University Smart Portal. Feel free to come back anytime you need help!\n\nWishing you all the best! 🎓✨',
  },
  // HEC
  {
    keywords: ['hec', 'recognized', 'accredited', 'accreditation', 'ranking'],
    answer: '🏆 **HEC Recognition:**\n\n• HITEC University is **fully recognized by HEC** (Higher Education Commission of Pakistan)\n• All programs are HEC approved\n• Engineering programs accredited by **PEC** (Pakistan Engineering Council)\n• Computing programs accredited by **NCEAC**\n\nGraduates receive HEC-attested degrees valid nationally and internationally.',
  },
  // About
  {
    keywords: ['about', 'hitec', 'university', 'history', 'founded', 'established'],
    answer: '🏫 **About HITEC University:**\n\nHITEC University (Heavy Industries Taxila Education City) is a prestigious institution located in Taxila, Punjab, Pakistan.\n\n• **Established:** Under the patronage of Heavy Industries Taxila\n• **Focus:** Engineering, Technology, Management, and Sciences\n• **Campus:** Modern facilities with labs, library, sports complex\n• **Motto:** "In Truth I Triumph"\n\n➡️ [Learn More on About Page](/about)',
  },
  // Exam
  {
    keywords: ['exam', 'exams', 'examination', 'midterm', 'final', 'quiz', 'test'],
    answer: '📝 **Examination Information:**\n\n**Assessment Breakdown:**\n• Quizzes: 10–15%\n• Assignments: 10–15%\n• Midterm Exam: 25–30%\n• Final Exam: 40–50%\n\n**Exam Schedule:**\n• Midterms: 7th–8th week of semester\n• Finals: 16th–17th week\n• Retake exams available for eligible students\n\nCheck your exam schedule in the Student Portal → Academics section.',
  },
];

// Quick reply suggestions
const QUICK_REPLIES = [
  'How to apply?',
  'Fee structure',
  'Programs offered',
  'Library hours',
  'Contact info',
  'Attendance policy',
];

// ──────────────────────────────────────────────
// Message matching engine
// ──────────────────────────────────────────────

function findBestAnswer(query: string): string {
  const normalizedQuery = query.toLowerCase().trim();
  
  let bestMatch: QAPair | null = null;
  let bestScore = 0;

  for (const qa of KNOWLEDGE_BASE) {
    let score = 0;
    for (const keyword of qa.keywords) {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        // Longer keyword matches are more specific and valuable
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = qa;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.answer;
  }

  return '🤔 I\'m not sure about that. Here are some things I can help with:\n\n• **Admissions** — How to apply, requirements, deadlines\n• **Programs** — Degrees offered, duration\n• **Fees** — Tuition, scholarships, payment methods\n• **Library** — Hours, borrowing rules\n• **Campus** — Location, hostel, transport\n• **Portal** — Login help, grades, attendance\n• **Contact** — Phone, email, office hours\n\nTry asking about any of these topics!';
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  text: '👋 **Hi! I\'m the HiSUP Assistant.**\n\nI can help you with information about HITEC University — admissions, programs, fees, campus, library, and more!\n\nAsk me anything or tap a suggestion below to get started.',
  sender: 'bot',
  timestamp: new Date(),
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate typing delay
    setIsTyping(true);
    setTimeout(() => {
      const answer = findBestAnswer(messageText);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: answer,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 400); // 600-1000ms for realism
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simple markdown-like rendering for bold text and links
  const renderText = (text: string) => {
    const parts = text.split('\n');
    return parts.map((line, i) => {
      // Process bold and links
      let processed = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-500 hover:text-blue-600 underline font-semibold">$1</a>');
      
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: processed }} />
          {i < parts.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-16 w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-2xl overflow-hidden cursor-pointer"
            aria-label="Open chat"
          >
            <div className="relative w-full h-full p-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
              <Image src="/chatbot.png" alt="Chatbot avatar" fill className="object-cover rounded-full" />
            </div>
            {/* Pulse ring */}
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[560px] max-h-[calc(100vh-48px)] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">HiSUP Assistant</h3>
                  <p className="text-[11px] text-blue-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                    Online — Ask me anything
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50 dark:bg-slate-950">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    msg.sender === 'bot'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                      : 'bg-gradient-to-br from-slate-600 to-slate-700'
                  }`}>
                    {msg.sender === 'bot'
                      ? <Sparkles className="h-3.5 w-3.5 text-white" />
                      : <User className="h-3.5 w-3.5 text-white" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[80%] px-4 py-3 text-[13px] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl rounded-br-md shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-md shadow-sm border border-slate-100 dark:border-slate-700'
                  }`}>
                    {renderText(msg.text)}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies (show only if just welcome message) */}
            {messages.length <= 1 && !isTyping && (
              <div className="px-4 py-3 flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleSend(reply)}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question..."
                  className="flex-1 px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
