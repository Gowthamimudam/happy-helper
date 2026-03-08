import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Hand, Sparkles } from "lucide-react";
import { SUPPORTED_GESTURES } from "@/lib/gestureClassifier";
import { getAllGestures, deleteGesture, type StoredGesture } from "@/lib/gestureStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function GestureLibrary() {
  const [customGestures, setCustomGestures] = useState<StoredGesture[]>([]);

  useEffect(() => {
    getAllGestures().then(setCustomGestures);
  }, []);

  const handleDelete = async (id: string, name: string) => {
    await deleteGesture(id);
    setCustomGestures(await getAllGestures());
    toast.success(`"${name}" removed from library`);
  };

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
            All supported gestures — built-in and custom trained
          </p>
        </div>

        {/* Custom trained gestures */}
        {customGestures.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              Your Trained Gestures ({customGestures.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {customGestures.map((g, i) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative rounded-xl border border-accent/30 bg-accent/5 p-4 transition-colors hover:border-accent/50"
                >
                  <div className="mb-2 text-2xl">🤟</div>
                  <h3 className="font-semibold text-foreground font-display">{g.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {g.samples.length} samples • Custom trained
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    onClick={() => handleDelete(g.id, g.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Built-in gestures */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground">
            <Hand className="h-4 w-4" />
            Built-in Gestures ({SUPPORTED_GESTURES.length})
          </h2>
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
        </div>
      </motion.div>
    </div>
  );
}
