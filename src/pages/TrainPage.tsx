import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Save,
  Trash2,
  Loader2,
  Circle,
  Square,
  CheckCircle2,
  Mic,
  MicOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HandCanvas from "@/components/HandCanvas";
import { useHandDetection } from "@/hooks/useHandDetection";
import {
  type StoredGesture,
  getAllGestures,
  saveGesture,
  deleteGesture,
} from "@/lib/gestureStore";
import { saveVoice } from "@/lib/voiceStore";
import type { Landmark } from "@/lib/gestureClassifier";
import { toast } from "sonner";

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const REQUIRED_SAMPLES = 4;

export default function TrainPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLoading, isRunning, landmarks, error, start, stop } =
    useHandDetection();

  const [gestureName, setGestureName] = useState("");
  const [samples, setSamples] = useState<Landmark[][]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStep, setCaptureStep] = useState(0); // which sample we're on (0-based)
  const [waitingForNext, setWaitingForNext] = useState(false); // waiting for user to click next capture
  const [savedGestures, setSavedGestures] = useState<StoredGesture[]>([]);
  const [readyToSave, setReadyToSave] = useState(false);

  // Voice recording
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    getAllGestures().then(setSavedGestures);
  }, []);

  const handleStart = useCallback(async () => {
    if (videoRef.current) await start(videoRef.current);
  }, [start]);

  const handleStop = useCallback(() => {
    stop();
    resetCapture();
  }, [stop]);

  const resetCapture = useCallback(() => {
    setIsCapturing(false);
    setWaitingForNext(false);
    setCaptureStep(0);
    setSamples([]);
    setReadyToSave(false);
    setVoiceBlob(null);
  }, []);

  const startCapturing = useCallback(() => {
    if (!gestureName.trim()) {
      toast.error("Enter a gesture name first");
      return;
    }
    resetCapture();
    setIsCapturing(true);
    setCaptureStep(0);
    toast.info(`Hold gesture steady — capturing sample 1/${REQUIRED_SAMPLES}...`);
  }, [gestureName, resetCapture]);

  // Capture one sample then pause
  useEffect(() => {
    if (!isCapturing || waitingForNext || !isRunning) return;

    const timeout = setTimeout(() => {
      if (landmarks && landmarks.length > 0) {
        const newSamples = [...samples, [...landmarks[0]]];
        setSamples(newSamples);
        const step = newSamples.length;
        setCaptureStep(step);

        if (step >= REQUIRED_SAMPLES) {
          setIsCapturing(false);
          setReadyToSave(true);
          toast.success(`All ${REQUIRED_SAMPLES} samples captured! You can now record voice or save.`);
        } else {
          setWaitingForNext(true);
          toast.success(`Sample ${step}/${REQUIRED_SAMPLES} captured!`);
        }
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [isCapturing, waitingForNext, isRunning, landmarks, samples]);

  const captureNext = useCallback(() => {
    setWaitingForNext(false);
    toast.info(`Hold gesture steady — capturing sample ${captureStep + 1}/${REQUIRED_SAMPLES}...`);
  }, [captureStep]);

  // Voice recording
  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setVoiceBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        toast.success("Voice recorded! Click Save to finish.");
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingVoice(true);
    } catch {
      toast.error("Microphone access denied");
    }
  }, []);

  const stopVoiceRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecordingVoice(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (samples.length < REQUIRED_SAMPLES) {
      toast.error(`Need ${REQUIRED_SAMPLES} samples.`);
      return;
    }
    const gesture: StoredGesture = {
      id: `custom_${Date.now()}`,
      name: gestureName.trim(),
      samples,
      createdAt: Date.now(),
    };
    await saveGesture(gesture);
    if (voiceBlob) {
      await saveVoice(gestureName.trim(), voiceBlob);
    }
    setSavedGestures(await getAllGestures());
    setSamples([]);
    setGestureName("");
    setReadyToSave(false);
    setVoiceBlob(null);
    setCaptureStep(0);
    toast.success(`Gesture "${gesture.name}" saved and added to Gesture Library successfully! 🎉`);
  }, [samples, gestureName, voiceBlob]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteGesture(id);
    setSavedGestures(await getAllGestures());
    toast.success("Gesture deleted");
  }, []);

  return (
    <div className="container pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl"
      >
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold font-display">
            Train <span className="text-gradient">Custom Gestures</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Record your own gestures and teach the AI to recognize them
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Camera */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="relative aspect-[4/3] bg-muted">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ transform: "scaleX(-1)" }}
                playsInline
                muted
              />
              <HandCanvas
                landmarks={landmarks}
                width={VIDEO_WIDTH}
                height={VIDEO_HEIGHT}
              />
              {!isRunning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10">
                    {isLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <Camera className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {isLoading
                      ? "Loading AI model..."
                      : "Start camera to begin training"}
                  </p>
                </div>
              )}

              {/* Capture indicator */}
              {isCapturing && !waitingForNext && (
                <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-destructive/90 px-3 py-1 backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-destructive-foreground animate-pulse" />
                  <span className="text-xs font-mono text-destructive-foreground">
                    CAPTURING {captureStep + 1}/{REQUIRED_SAMPLES}
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="border-t border-border p-4 space-y-3">
              <div className="flex gap-3">
                {!isRunning ? (
                  <Button
                    onClick={handleStart}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? "Loading..." : "Start Camera"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStop}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                )}
              </div>

              {isRunning && !readyToSave && (
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      Gesture Name
                    </label>
                    <Input
                      value={gestureName}
                      onChange={(e) => setGestureName(e.target.value)}
                      placeholder='e.g. "Hello", "Thanks", "Water"'
                      className="bg-secondary border-border"
                      disabled={isCapturing || waitingForNext}
                    />
                  </div>
                  {!isCapturing && !waitingForNext ? (
                    <Button
                      onClick={startCapturing}
                      disabled={!gestureName.trim()}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Circle className="mr-2 h-4 w-4" />
                      Record
                    </Button>
                  ) : waitingForNext ? (
                    <Button onClick={captureNext} className="bg-accent text-accent-foreground hover:bg-accent/90">
                      <Circle className="mr-2 h-4 w-4" />
                      Capture Next ({captureStep + 1}/{REQUIRED_SAMPLES})
                    </Button>
                  ) : null}
                </div>
              )}

              {/* Sample progress */}
              <AnimatePresence>
                {captureStep > 0 && !readyToSave && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2"
                  >
                    {Array.from({ length: REQUIRED_SAMPLES }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full transition-colors ${
                          i < captureStep
                            ? "bg-accent"
                            : "bg-secondary"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-mono text-muted-foreground ml-2">
                      {captureStep}/{REQUIRED_SAMPLES}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ready to save */}
              <AnimatePresence>
                {readyToSave && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 rounded-xl border border-accent/30 bg-accent/5 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-accent">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">
                        All {REQUIRED_SAMPLES} samples captured for "{gestureName}"
                      </span>
                    </div>

                    {/* Voice recording */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        Record voice (optional):
                      </span>
                      {!isRecordingVoice ? (
                        <Button
                          size="sm"
                          variant={voiceBlob ? "secondary" : "outline"}
                          onClick={startVoiceRecording}
                          className="gap-1.5"
                        >
                          <Mic className="h-3.5 w-3.5" />
                          {voiceBlob ? "Re-record" : "Record Voice"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={stopVoiceRecording}
                          className="gap-1.5"
                        >
                          <MicOff className="h-3.5 w-3.5 animate-pulse" />
                          Stop Recording
                        </Button>
                      )}
                      {voiceBlob && !isRecordingVoice && (
                        <span className="text-xs text-accent">✓ Voice ready</span>
                      )}
                    </div>

                    <Button onClick={handleSave} className="w-full gap-2">
                      <Save className="h-4 w-4" />
                      Save Gesture to Library
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                How to Train
              </h3>
              <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                <li>Start the camera</li>
                <li>Type a gesture name (e.g. "Water")</li>
                <li>Hold the gesture and press Record</li>
                <li>After each capture, click "Capture Next"</li>
                <li>Repeat until all {REQUIRED_SAMPLES} samples are done</li>
                <li>Optionally record your voice for the gesture</li>
                <li>Click Save — it appears in your Library!</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Saved Gestures ({savedGestures.length})
              </h3>
              {savedGestures.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No custom gestures yet. Train one above!
                </p>
              ) : (
                <div className="space-y-2">
                  {savedGestures.map((g) => (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between rounded-lg bg-secondary p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {g.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {g.samples.length} samples
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(g.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
