import { motion } from "framer-motion";
import {
  Hand, Eye, Cpu, Volume2, Type, Scan, Mic, Accessibility,
  Brain, Monitor, Zap, Heart, ArrowRight, Sparkles, Network,
  Globe, Code2, Camera
} from "lucide-react";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

const pipeline = [
  { icon: Hand, label: "Hand Gesture", sub: "User performs sign" },
  { icon: Brain, label: "AI Recognition", sub: "MediaPipe + ML model" },
  { icon: Type, label: "Text Display", sub: "Gesture → readable text" },
  { icon: Volume2, label: "Voice Output", sub: "Text-to-Speech API" },
];

const gestures = [
  { emoji: "👋", label: "Hi" },
  { emoji: "👍", label: "Yes" },
  { emoji: "✋", label: "Stop" },
  { emoji: "🤟", label: "Love You" },
  { emoji: "🤙", label: "Call Me" },
];

const features = [
  { icon: Scan, text: "Real-time gesture detection" },
  { icon: Hand, text: "MediaPipe hand tracking" },
  { icon: Brain, text: "AI gesture recognition" },
  { icon: Volume2, text: "Text-to-speech output" },
  { icon: Accessibility, text: "Accessible communication tool" },
];

const techStack = [
  { icon: Code2, label: "Python" },
  { icon: Hand, label: "MediaPipe" },
  { icon: Cpu, label: "TensorFlow" },
  { icon: Camera, label: "OpenCV" },
  { icon: Mic, label: "Web Speech API" },
];

export default function Poster() {
  return (
    <div className="min-h-screen bg-[hsl(240,20%,4%)] pt-20 pb-16 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[hsl(270,85%,50%/0.06)] blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-[hsl(220,80%,50%/0.05)] blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-[hsl(260,70%,60%/0.04)] blur-[100px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(270,80%,70%) 1px, transparent 1px), linear-gradient(90deg, hsl(270,80%,70%) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6">
        {/* ===== TITLE SECTION ===== */}
        <motion.div {...fadeUp(0)} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(270,60%,50%/0.3)] bg-[hsl(270,60%,50%/0.08)] px-5 py-2 text-sm text-[hsl(270,80%,75%)] mb-6 font-mono">
            <Sparkles className="h-4 w-4" />
            College Tech Fest 2026
          </div>

          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[hsl(270,60%,50%/0.3)] bg-gradient-to-br from-[hsl(270,70%,50%/0.2)] to-[hsl(220,70%,50%/0.1)] shadow-[0_0_60px_hsl(270,80%,60%/0.2)]">
            <Hand className="h-10 w-10 text-[hsl(270,80%,75%)]" />
          </div>

          <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight font-display leading-tight">
            <span className="text-[hsl(0,0%,100%)]">Sign</span>
            <span className="bg-gradient-to-r from-[hsl(270,85%,65%)] via-[hsl(240,80%,65%)] to-[hsl(200,90%,65%)] bg-clip-text text-transparent">Speak</span>
          </h1>
          <p className="mt-2 text-xl sm:text-2xl font-medium text-[hsl(220,20%,70%)]">
            Real-Time Sign Language Gesture Translator
          </p>
          <div className="mt-5 mx-auto max-w-lg">
            <p className="text-lg italic text-[hsl(270,60%,75%)] border-l-2 border-[hsl(270,60%,50%/0.4)] pl-4">
              "Turning Hand Gestures into Voice and Text using AI"
            </p>
          </div>
        </motion.div>

        {/* ===== WORKFLOW PIPELINE ===== */}
        <motion.div {...fadeUp(0.15)} className="mb-14">
          <SectionTitle icon={Network} title="How It Works" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {pipeline.map((step, i) => (
              <div key={step.label} className="relative group">
                <div className="rounded-2xl border border-[hsl(270,40%,30%/0.5)] bg-[hsl(240,15%,8%/0.8)] p-5 text-center h-full backdrop-blur-sm hover:border-[hsl(270,60%,50%/0.5)] transition-colors">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(270,60%,50%/0.15)] to-[hsl(220,60%,50%/0.1)] border border-[hsl(270,50%,50%/0.2)]">
                    <step.icon className="h-7 w-7 text-[hsl(270,80%,75%)]" />
                  </div>
                  <p className="font-bold text-[hsl(0,0%,95%)] text-sm font-display">{step.label}</p>
                  <p className="text-xs text-[hsl(220,15%,55%)] mt-1">{step.sub}</p>
                </div>
                {i < pipeline.length - 1 && (
                  <ArrowRight className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(270,60%,50%/0.5)] z-10" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ===== GESTURE EXAMPLES ===== */}
        <motion.div {...fadeUp(0.25)} className="mb-14">
          <SectionTitle icon={Hand} title="Gesture Examples" />
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {gestures.map((g) => (
              <div
                key={g.label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[hsl(270,40%,30%/0.4)] bg-[hsl(240,15%,8%/0.6)] px-6 py-5 min-w-[100px] backdrop-blur-sm hover:border-[hsl(270,60%,50%/0.4)] hover:bg-[hsl(240,15%,10%/0.8)] transition-all"
              >
                <span className="text-4xl">{g.emoji}</span>
                <span className="text-sm font-semibold text-[hsl(0,0%,90%)] font-display">{g.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ===== FEATURES + TECH STACK (side by side) ===== */}
        <motion.div {...fadeUp(0.35)} className="grid md:grid-cols-2 gap-6 mb-14">
          {/* Features */}
          <div>
            <SectionTitle icon={Zap} title="Key Features" />
            <div className="mt-5 space-y-3">
              {features.map((f) => (
                <div
                  key={f.text}
                  className="flex items-center gap-3 rounded-xl border border-[hsl(270,40%,30%/0.3)] bg-[hsl(240,15%,8%/0.5)] px-4 py-3 backdrop-blur-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(270,60%,50%/0.12)]">
                    <f.icon className="h-4.5 w-4.5 text-[hsl(270,80%,75%)]" />
                  </div>
                  <span className="text-sm text-[hsl(220,15%,75%)]">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <SectionTitle icon={Code2} title="Technology Stack" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              {techStack.map((t) => (
                <div
                  key={t.label}
                  className="flex items-center gap-3 rounded-xl border border-[hsl(220,40%,30%/0.3)] bg-[hsl(240,15%,8%/0.5)] px-4 py-3.5 backdrop-blur-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(220,60%,50%/0.12)]">
                    <t.icon className="h-4.5 w-4.5 text-[hsl(220,80%,75%)]" />
                  </div>
                  <span className="text-sm font-medium text-[hsl(220,15%,75%)]">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ===== IMPACT SECTION ===== */}
        <motion.div {...fadeUp(0.45)} className="mb-14">
          <div className="rounded-2xl border border-[hsl(270,40%,30%/0.4)] bg-gradient-to-br from-[hsl(270,50%,15%/0.4)] to-[hsl(220,50%,12%/0.3)] p-8 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(270,60%,50%/0.15)] border border-[hsl(270,50%,50%/0.2)]">
              <Heart className="h-7 w-7 text-[hsl(320,70%,65%)]" />
            </div>
            <h3 className="text-2xl font-bold text-[hsl(0,0%,95%)] font-display mb-3">
              Why This Project Matters
            </h3>
            <p className="text-[hsl(220,15%,65%)] max-w-xl mx-auto leading-relaxed">
              This system helps bridge communication between hearing-impaired individuals
              and others by converting sign language gestures into spoken words — making
              conversations more inclusive and accessible for everyone.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(270,60%,50%/0.1)] border border-[hsl(270,50%,50%/0.2)] px-4 py-1.5 text-xs text-[hsl(270,70%,75%)] font-mono">
                <Globe className="h-3.5 w-3.5" /> Inclusive
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(220,60%,50%/0.1)] border border-[hsl(220,50%,50%/0.2)] px-4 py-1.5 text-xs text-[hsl(220,70%,75%)] font-mono">
                <Accessibility className="h-3.5 w-3.5" /> Accessible
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(200,60%,50%/0.1)] border border-[hsl(200,50%,50%/0.2)] px-4 py-1.5 text-xs text-[hsl(200,70%,75%)] font-mono">
                <Zap className="h-3.5 w-3.5" /> Real-time
              </span>
            </div>
          </div>
        </motion.div>

        {/* ===== FOOTER ===== */}
        <motion.div {...fadeUp(0.55)} className="text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-[hsl(270,40%,30%/0.3)] bg-[hsl(240,15%,8%/0.6)] px-6 py-3 backdrop-blur-sm">
            <img src="/logo.png" alt="SignSpeak" className="h-8 w-8 rounded-lg" />
            <span className="font-display font-bold text-[hsl(0,0%,90%)]">SignSpeak</span>
            <span className="text-xs text-[hsl(220,15%,50%)] font-mono">• AI-Powered</span>
          </div>
          <p className="mt-4 text-xs text-[hsl(220,15%,40%)] font-mono">
            All processing runs locally in the browser — no data leaves your device.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(270,60%,50%/0.15)] to-[hsl(220,60%,50%/0.1)] border border-[hsl(270,50%,50%/0.2)]">
        <Icon className="h-5 w-5 text-[hsl(270,80%,75%)]" />
      </div>
      <h2 className="text-2xl font-bold text-[hsl(0,0%,95%)] font-display">{title}</h2>
    </div>
  );
}
