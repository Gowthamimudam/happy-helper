import { motion } from "framer-motion";
import { SUPPORTED_GESTURES } from "@/lib/gestureClassifier";

export default function GestureLibrary() {
  return (
    <div className="container pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold font-display">
            Gesture <span className="text-gradient">Library</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            All supported gestures and their hand positions
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPORTED_GESTURES.map((g, i) => (
            <motion.div
              key={g.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="mb-2 text-2xl">{g.emoji}</div>
              <h3 className="font-semibold text-foreground font-display">{g.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{g.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
