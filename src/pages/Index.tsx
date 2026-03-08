import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Scan, BookOpen, Zap, Eye, Volume2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Eye, title: "Real-Time Detection", desc: "MediaPipe AI detects hands at 30+ FPS" },
  { icon: Cpu, title: "On-Device AI", desc: "Runs entirely in your browser, no server needed" },
  { icon: Zap, title: "Instant Classification", desc: "21 hand landmarks analyzed per frame" },
  { icon: Volume2, title: "Voice Output", desc: "Speaks detected gestures using Web Speech API" },
];

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative flex flex-1 items-center justify-center pt-16">
        <div className="scanline absolute inset-0 pointer-events-none" />
        <div className="gradient-hero absolute inset-0 pointer-events-none" />
        <div className="container relative z-10 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 animate-pulse-glow">
              <span className="text-3xl">🤟</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight font-display sm:text-6xl lg:text-7xl">
              Sign<span className="text-gradient">Speak</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
              Real-time sign language translation powered by AI.
              Show a gesture → get instant text & voice.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link to="/detect">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary text-base px-8">
                  <Scan className="mr-2 h-5 w-5" />
                  Start Detecting
                </Button>
              </Link>
              <Link to="/gestures">
                <Button size="lg" variant="outline" className="border-border text-base px-8">
                  <BookOpen className="mr-2 h-5 w-5" />
                  View Gestures
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/50 py-16">
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold font-display text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container text-center text-xs text-muted-foreground font-mono">
          SignSpeak — AI-powered sign language translator. All processing runs locally in your browser.
        </div>
      </footer>
    </div>
  );
}
