import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Hand, Sparkles, Mic, MicOff, Play } from "lucide-react";
import { SUPPORTED_GESTURES } from "@/lib/gestureClassifier";
import { getAllGestures, deleteGesture, type StoredGesture } from "@/lib/gestureStore";
import { saveVoice, getVoice, deleteVoice } from "@/lib/voiceStore";
import { getDisabledGestures, disableGesture, disableGestures } from "@/lib/disabledGestures";
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

type DeleteTarget =
  | { type: "custom"; id: string; name: string }
  | { type: "builtin"; name: string }
  | { type: "all_builtin" };

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
  const [deletedBuiltInNames, setDeletedBuiltInNames] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const refreshLibrary = useCallback(async () => {
    const [custom, deletedBuiltIns] = await Promise.all([
      getAllGestures(),
      getDisabledGestures(),
    ]);
    setCustomGestures(custom);
    setDeletedBuiltInNames(deletedBuiltIns);
  }, []);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const activeBuiltIn = SUPPORTED_GESTURES.filter((g) => !deletedBuiltInNames.includes(g.name));

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "custom") {
      await deleteGesture(deleteTarget.id);
      await deleteVoice(deleteTarget.name);
    } else if (deleteTarget.type === "builtin") {
      await disableGesture(deleteTarget.name);
      await deleteVoice(deleteTarget.name);
    } else {
      await disableGestures(SUPPORTED_GESTURES.map((g) => g.name));
      await Promise.all(SUPPORTED_GESTURES.map((g) => deleteVoice(g.name)));
    }

    await refreshLibrary();
    toast.success("Gesture removed from library.");
    setDeleteTarget(null);
  }, [deleteTarget, refreshLibrary]);

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
            All active gestures — custom and built-in. Deleted gestures stay deleted permanently.
          </p>
        </div>

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

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground">
              <Hand className="h-4 w-4" />
              Built-in Gestures ({activeBuiltIn.length})
            </h2>
            {activeBuiltIn.length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-2 text-xs"
                onClick={() => setDeleteTarget({ type: "all_builtin" })}
              >
                Delete All Built-ins
              </Button>
            )}
          </div>

          {activeBuiltIn.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              All built-in gestures are deleted from this library.
            </div>
          ) : (
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
          )}
        </div>
      </motion.div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this gesture?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "all_builtin"
                ? "All built-in gestures will be permanently removed from the library and detection."
                : deleteTarget?.type === "builtin"
                  ? `"${deleteTarget.name}" will be permanently removed from the library and detection.`
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
