import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Scan, BookOpen, Zap, Eye, Volume2, Cpu, Hand, Type, Hash, GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Eye, title: "Real-Time Detection", desc: "MediaPipe AI detects hands at 30+ FPS with precision tracking" },
  { icon: Cpu, title: "On-Device AI", desc: "Runs entirely in your browser — no server, no data leaves your device" },
  { icon: Zap, title: "Instant Classification", desc: "21 hand landmarks analyzed per frame for accurate gesture matching" },
  { icon: Volume2, title: "Voice Output", desc: "Speaks detected gestures aloud using Web Speech API or custom recordings" },
];

const modes = [
  { path: "/detect", icon: Scan, title: "Gesture Detection", desc: "Detect your custom trained gestures in real-time", color: "primary" },
  { path: "/alphabet", icon: Type, title: "Alphabet Mode", desc: "Learn & detect ASL letters A-Z to form words", color: "accent" },
  { path: "/numbers", icon: Hash, title: "Numbers Mode", desc: "Train & detect number signs 0-9 to form numbers", color: "accent" },
  { path: "/train", icon: GraduationCap, title: "Train Gestures", desc: "Teach the AI your own custom hand signs", color: "primary" },
];

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative flex flex-1 items-center justify-center pt-16 overflow-hidden">
        <div className="scanline absolute inset-0 pointer-events-none" />
        <div className="gradient-hero absolute inset-0 pointer-events-none" />
        
        {/* Animated background particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary/10 blur-xl"
              style={{
                width: 100 + i * 40,
                height: 100 + i * 40,
                left: `${15 + i * 14}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        <div className="container relative z-10 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <motion.div 
              className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-lg shadow-primary/20"
              animate={{ 
                boxShadow: [
                  "0 10px 30px -10px hsl(var(--primary) / 0.2)",
                  "0 10px 40px -5px hsl(var(--primary) / 0.4)",
                  "0 10px 30px -10px hsl(var(--primary) / 0.2)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Hand className="h-10 w-10 text-primary" />
            </motion.div>

            <h1 className="text-5xl font-extrabold tracking-tight font-display sm:text-6xl lg:text-7xl">
              Sign<span className="text-gradient">Speak</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Real-time sign language translation powered by AI.
              Show a gesture → get instant text & voice feedback.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link to="/detect">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary text-base px-8 h-12">
                  <Scan className="mr-2 h-5 w-5" />
                  Start Detecting
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/train">
                <Button size="lg" variant="outline" className="border-border text-base px-8 h-12">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Train Gestures
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modes Section */}
      <section className="border-t border-border bg-card/30 py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold font-display flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Explore <span className="text-gradient">Modes</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Choose your learning path</p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {modes.map((m, i) => (
              <Link key={m.path} to={m.path}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 cursor-pointer h-full"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <m.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold font-display text-foreground text-lg">{m.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                  <div className="mt-4 flex items-center text-xs font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold font-display">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Powered by cutting-edge browser AI</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6 hover:border-accent/30 transition-colors"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold font-display text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card/50 py-16">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-3xl font-bold font-display">
              Ready to <span className="text-gradient">Communicate</span>?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Start by training a few gestures, then watch the AI recognize them instantly.
            </p>
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <Link to="/gestures">
                <Button variant="outline" size="lg" className="border-border h-12 px-8">
                  <BookOpen className="mr-2 h-5 w-5" />
                  View Gesture Library
                </Button>
              </Link>
              <Link to="/detect">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary h-12 px-8">
                  <Scan className="mr-2 h-5 w-5" />
                  Launch Detection
                </Button>
              </Link>
            </div>
          </motion.div>
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
