import { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Save,
  Trash2,
  Loader2,
  Square,
  CheckCircle2,
  Mic,
  MicOff,
  Compass,
  AlertTriangle,
  ArrowUp,
  ArrowLeft,
  ArrowDown,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import {
  DIRECTIONS_ORDER,
  DIRECTION_INSTRUCTIONS,
  detectPalmDirection,
  type Direction,
} from "@/lib/palmOrientation";
import { toast } from "sonner";

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const REQUIRED_SAMPLES = 1;

const DIRECTION_ICONS: Record<Direction, React.ReactNode> = {
  NORTH: <ArrowUp className="h-5 w-5" />,
  WEST: <ArrowLeft className="h-5 w-5" />,
  SOUTH: <ArrowDown className="h-5 w-5" />,
  EAST: <ArrowRight className="h-5 w-5" />,
};

export default function TrainPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLoading, isRunning, landmarks, error, start, stop } =
    useHandDetection();

  const [gestureName, setGestureName] = useState("");
  const [samples, setSamples] = useState<Landmark[][]>([]);
  const [captureStep, setCaptureStep] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [directionWarning, setDirectionWarning] = useState<string | null>(null);
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
    setCaptureStep(0);
    setSamples([]);
    setReadyToSave(false);
    setVoiceBlob(null);
    setDirectionWarning(null);
  }, []);

  const currentDirection = DIRECTIONS_ORDER[captureStep] ?? "NORTH";

  const startCapturing = useCallback(() => {
    if (!gestureName.trim()) {
      toast.error("Enter a gesture name first");
      return;
    }
    resetCapture();
    setIsCapturing(true);
    setCaptureStep(0);
    toast.info(DIRECTION_INSTRUCTIONS["NORTH"]);
  }, [gestureName, resetCapture]);

  const captureSample = useCallback(() => {
    if (!landmarks || landmarks.length === 0) {
      toast.error("No hand detected. Show your hand to the camera.");
      return;
    }

    const lm = landmarks[0];
    const detected = detectPalmDirection(lm);
    const expected = DIRECTIONS_ORDER[captureStep];

    if (detected !== expected) {
      setDirectionWarning(
        `Wrong direction detected. Please rotate your hand toward ${expected}.`
      );
      return;
    }

    setDirectionWarning(null);
    const newSamples = [...samples, [...lm]];
    setSamples(newSamples);
    const nextStep = newSamples.length;
    setCaptureStep(nextStep);

    if (nextStep >= REQUIRED_SAMPLES) {
      setIsCapturing(false);
      setReadyToSave(true);
      toast.success(
        "Gesture successfully trained with 4 directional samples!"
      );
    } else {
      toast.success(
        `Sample ${nextStep}/${REQUIRED_SAMPLES} (${expected}) captured!`
      );
      toast.info(DIRECTION_INSTRUCTIONS[DIRECTIONS_ORDER[nextStep]]);
    }
  }, [landmarks, captureStep, samples]);

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
      toast.error(
        "Training incomplete. Please record all 4 directional samples."
      );
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
    toast.success(
      `Gesture "${gesture.name}" saved and added to Gesture Library successfully! 🎉`
    );
    // Redirect to gesture library
    setTimeout(() => navigate("/gestures"), 1200);
  }, [samples, gestureName, voiceBlob, navigate]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteGesture(id);
    setSavedGestures(await getAllGestures());
    toast.success("Gesture deleted");
  }, []);

  const progressPercent = (captureStep / REQUIRED_SAMPLES) * 100;

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
            Record gestures from 4 directions for accurate recognition
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
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

              {/* Large step instruction overlay during capture */}
              {isCapturing && (
                <div className="absolute top-0 left-0 right-0 bg-background/90 backdrop-blur-sm p-4 border-b border-primary/30 z-10">
                  <div className="text-center space-y-1">
                    <p className="text-lg font-bold font-display text-primary">
                      Sample {captureStep + 1} of {REQUIRED_SAMPLES}
                    </p>
                    <p className="text-sm text-foreground font-mono">
                      {DIRECTION_INSTRUCTIONS[currentDirection]}
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 mt-1">
                      {DIRECTION_ICONS[currentDirection]}
                      <span className="text-sm font-bold font-mono text-primary">
                        Expected Direction: {currentDirection}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Success overlay after each capture */}
              {isCapturing && captureStep > 0 && (
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <div className="rounded-lg bg-accent/90 backdrop-blur-sm px-3 py-2 text-center">
                    <span className="text-xs font-mono text-accent-foreground">
                      ✓ Sample {captureStep} recorded successfully — now show {currentDirection}
                    </span>
                  </div>
                </div>
              )}

              {/* Direction warning overlay */}
              <AnimatePresence>
                {directionWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-14 left-3 right-3 flex items-center gap-2 rounded-lg bg-destructive/90 px-3 py-2 backdrop-blur-sm"
                  >
                    <AlertTriangle className="h-4 w-4 text-destructive-foreground shrink-0" />
                    <span className="text-xs font-mono text-destructive-foreground">
                      {directionWarning}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
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
                      disabled={isCapturing}
                    />
                  </div>
                  {!isCapturing ? (
                    <Button
                      onClick={startCapturing}
                      disabled={!gestureName.trim()}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Start Training
                    </Button>
                  ) : (
                    <Button
                      onClick={captureSample}
                      size="lg"
                      className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-6"
                    >
                      {DIRECTION_ICONS[currentDirection]}
                      <span className="ml-2">
                        Capture Sample {captureStep + 1} ({currentDirection})
                      </span>
                    </Button>
                  )}
                </div>
              )}

              {/* Progress indicator */}
              <AnimatePresence>
                {isCapturing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span>
                        Sample {captureStep}/{REQUIRED_SAMPLES}
                      </span>
                      <span>Expected Direction: {currentDirection}</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    {/* Direction steps */}
                    <div className="flex gap-2">
                      {DIRECTIONS_ORDER.map((dir, i) => (
                        <div
                          key={dir}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-colors ${
                            i < captureStep
                              ? "bg-accent/20 text-accent"
                              : i === captureStep
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {i < captureStep ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            DIRECTION_ICONS[dir]
                          )}
                          {dir}
                        </div>
                      ))}
                    </div>
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
                        Gesture successfully trained with 4 directional samples!
                      </span>
                    </div>

                    {/* Direction summary */}
                    <div className="flex gap-2">
                      {DIRECTIONS_ORDER.map((dir) => (
                        <div
                          key={dir}
                          className="flex items-center gap-1 rounded-md bg-accent/20 px-2 py-1 text-xs font-mono text-accent"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {dir}
                        </div>
                      ))}
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
            {/* Training guide */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Directional Training Guide
              </h3>
              <ol className="space-y-3 text-xs text-muted-foreground">
                {DIRECTIONS_ORDER.map((dir, i) => (
                  <li
                    key={dir}
                    className={`flex items-start gap-2 rounded-lg p-2 transition-colors ${
                      isCapturing && captureStep === i
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : captureStep > i
                          ? "text-accent"
                          : ""
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
                      {captureStep > i ? "✓" : i + 1}
                    </span>
                    <div>
                      <span className="font-medium text-foreground">{dir}</span>
                      <p className="mt-0.5 text-muted-foreground">
                        {dir === "NORTH" && "Show gesture facing front"}
                        {dir === "WEST" && "Rotate hand to the left"}
                        {dir === "SOUTH" && "Point hand downward"}
                        {dir === "EAST" && "Rotate hand to the right"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Saved gestures */}
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
                          {g.samples.length} directional samples
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
