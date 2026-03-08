import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Sparkles, Mic, MicOff, Play, Pencil } from "lucide-react";
import { getAllGestures, deleteGesture, saveGesture, type StoredGesture } from "@/lib/gestureStore";
import { saveVoice, getVoice, deleteVoice } from "@/lib/voiceStore";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const EMOJI_OPTIONS = [
  "👋", "✋", "🤚", "🖐️", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎",
  "✊", "👊", "🤛", "🤜", "👏", "🙌", "🤝", "🙏", "💪", "🖖", "🫰", "🫵", "🫱", "🫲",
  "🫶", "👌", "🤏", "🤌", "🖕", "🫳", "🫴", "🤲", "🫷", "🫸",
  "❤️", "⭐", "🔥", "💯", "✅", "❌", "⚡", "🎯", "🎉", "💡",
];

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

function EmojiPicker({ currentEmoji, onSelect }: { currentEmoji: string; onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="group/emoji relative text-2xl mb-2 cursor-pointer hover:scale-110 transition-transform" title="Click to change emoji">
          {currentEmoji || "👋"}
          <span className="absolute -bottom-1 -right-1 bg-accent/80 rounded-full p-0.5 ring-1 ring-accent">
            <Pencil className="h-2.5 w-2.5 text-accent-foreground" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <p className="text-xs text-muted-foreground mb-2 font-mono">Choose emoji</p>
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); setOpen(false); }}
              className={`text-lg p-1 rounded hover:bg-accent/20 transition-colors ${emoji === currentEmoji ? "bg-accent/30 ring-1 ring-accent" : ""}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function GestureLibrary() {
  const navigate = useNavigate();
  const [customGestures, setCustomGestures] = useState<StoredGesture[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const refreshLibrary = useCallback(async () => {
    setCustomGestures(await getAllGestures());
  }, []);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const handleEmojiChange = useCallback(async (gesture: StoredGesture, newEmoji: string) => {
    await saveGesture({ ...gesture, emoji: newEmoji });
    await refreshLibrary();
    toast.success(`Emoji updated for "${gesture.name}"`);
  }, [refreshLibrary]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteGesture(deleteTarget.id);
    await deleteVoice(deleteTarget.name);
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
            Your trained gestures. Train new gestures from the Training page.
          </p>
        </div>

        {customGestures.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No gestures yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Go to the Training page to teach your first gesture.
            </p>
            <Button className="mt-4" onClick={() => navigate("/train")}>
              Train a Gesture
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              Your Gestures ({customGestures.length})
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
                    <EmojiPicker currentEmoji={g.emoji || "👋"} onSelect={(emoji) => handleEmojiChange(g, emoji)} />
                    <h3 className="font-semibold text-foreground font-display">{g.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Both hands • {g.samples.length} sample{g.samples.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <VoiceRecordButton gestureName={g.name} />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 ml-auto text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget({ id: g.id, name: g.name })}
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
      </motion.div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this gesture?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" and its samples will be permanently removed.
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
