import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Hand, Sparkles, Mic, MicOff, Play, RotateCcw } from "lucide-react";
import { SUPPORTED_GESTURES } from "@/lib/gestureClassifier";
import { getAllGestures, deleteGesture, type StoredGesture } from "@/lib/gestureStore";
import { saveVoice, getVoice, deleteVoice } from "@/lib/voiceStore";
import { getDisabledGestures, disableGesture, enableGesture } from "@/lib/disabledGestures";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

function VoiceRecordButton({ gestureName }: { gestureName: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasVoice, setHasVoice] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    getVoice(gestureName).then((v) => setHasVoice(!!v));
  }, [gestureName]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await saveVoice(gestureName, blob);
        stream.getTracks().forEach((t) => t.stop());
        setHasVoice(true);
        toast.success(`Voice recorded for "${gestureName}"`);
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  }, [gestureName]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const playVoice = useCallback(async () => {
    const v = await getVoice(gestureName);
    if (v) {
      const url = URL.createObjectURL(v.audioBlob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play();
    }
  }, [gestureName]);

  return (
    <div className="flex items-center gap-1 mt-2">
      {!isRecording ? (
        <Button
          size="sm"
          variant={hasVoice ? "secondary" : "outline"}
          onClick={startRecording}
          className="h-7 px-2 gap-1 text-xs"
        >
          <Mic className="h-3 w-3" />
          {hasVoice ? "Re-record" : "Record"}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          onClick={stopRecording}
          className="h-7 px-2 gap-1 text-xs"
        >
          <MicOff className="h-3 w-3 animate-pulse" />
          Stop
        </Button>
      )}
      {hasVoice && !isRecording && (
        <Button
          size="sm"
          variant="ghost"
          onClick={playVoice}
          className="h-7 w-7 p-0"
        >
          <Play className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export default function GestureLibrary() {
  const [customGestures, setCustomGestures] = useState<StoredGesture[]>([]);
  const [disabledNames, setDisabledNames] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "custom"; id: string; name: string } | { type: "builtin"; name: string } | null>(null);

  useEffect(() => {
    getAllGestures().then(setCustomGestures);
    setDisabledNames(getDisabledGestures());
  }, []);

  const activeBuiltIn = SUPPORTED_GESTURES.filter((g) => !disabledNames.includes(g.name));
  const disabledBuiltIn = SUPPORTED_GESTURES.filter((g) => disabledNames.includes(g.name));

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "custom") {
      await deleteGesture(deleteTarget.id);
      await deleteVoice(deleteTarget.name);
      setCustomGestures(await getAllGestures());
    } else {
      disableGesture(deleteTarget.name);
      await deleteVoice(deleteTarget.name);
      setDisabledNames(getDisabledGestures());
    }

    toast.success("Gesture removed from library.");
    setDeleteTarget(null);
  };

  const handleRestore = (name: string) => {
    enableGesture(name);
    setDisabledNames(getDisabledGestures());
    toast.success(`"${name}" restored to library.`);
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
            All supported gestures — built-in and custom trained. Record voice for any gesture.
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
              <AnimatePresence>
                {customGestures.map((g, i) => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative rounded-xl border border-accent/30 bg-accent/5 p-4 transition-colors hover:border-accent/50"
                  >
                    <div className="mb-2 text-2xl">{g.emoji || "🤟"}</div>
                    <h3 className="font-semibold text-foreground font-display">{g.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {g.samples.length} samples • Custom trained
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <VoiceRecordButton gestureName={g.name} />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 ml-auto text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget({ type: "custom", id: g.id, name: g.name })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Built-in gestures */}
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground">
            <Hand className="h-4 w-4" />
            Built-in Gestures ({activeBuiltIn.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {activeBuiltIn.map((g, i) => (
                <motion.div
                  key={g.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="mb-2 text-2xl">{g.emoji}</div>
                  <h3 className="font-semibold text-foreground font-display">{g.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{g.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <VoiceRecordButton gestureName={g.name} />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget({ type: "builtin", name: g.name })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Disabled gestures */}
        {disabledBuiltIn.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground">
              <RotateCcw className="h-4 w-4" />
              Disabled Gestures ({disabledBuiltIn.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {disabledBuiltIn.map((g, i) => (
                <motion.div
                  key={g.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-dashed border-muted bg-muted/10 p-4 opacity-60"
                >
                  <div className="mb-2 text-2xl grayscale">{g.emoji}</div>
                  <h3 className="font-semibold text-muted-foreground font-display">{g.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{g.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 px-2 gap-1 text-xs"
                    onClick={() => handleRestore(g.name)}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this gesture?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "builtin"
                ? `"${deleteTarget.name}" will be disabled and moved to the Disabled Gestures list. You can restore it later.`
                : `"${deleteTarget?.type === "custom" ? deleteTarget.name : ""}" and its samples will be permanently removed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
