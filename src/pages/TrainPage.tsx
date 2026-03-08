import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Save,
  Trash2,
  Plus,
  Loader2,
  Circle,
  Square,
  CheckCircle2,
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
import type { Landmark } from "@/lib/gestureClassifier";
import { toast } from "sonner";

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

export default function TrainPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLoading, isRunning, landmarks, error, start, stop } =
    useHandDetection();

  const [gestureName, setGestureName] = useState("");
  const [samples, setSamples] = useState<Landmark[][]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [savedGestures, setSavedGestures] = useState<StoredGesture[]>([]);
  const captureIntervalRef = useRef<number>(0);

  // Load saved gestures
  useEffect(() => {
    getAllGestures().then(setSavedGestures);
  }, []);

  const handleStart = useCallback(async () => {
    if (videoRef.current) await start(videoRef.current);
  }, [start]);

  const handleStop = useCallback(() => {
    stop();
    stopCapturing();
  }, [stop]);

  const startCapturing = useCallback(() => {
    if (!gestureName.trim()) {
      toast.error("Enter a gesture name first");
      return;
    }
    setIsCapturing(true);
    setSamples([]);
    toast.info("Hold your gesture steady — capturing samples...");
  }, [gestureName]);

  const stopCapturing = useCallback(() => {
    setIsCapturing(false);
    clearInterval(captureIntervalRef.current);
  }, []);

  // Capture landmarks while isCapturing
  useEffect(() => {
    if (!isCapturing || !isRunning) return;

    const interval = setInterval(() => {
      if (landmarks && landmarks.length > 0) {
        setSamples((prev) => {
          if (prev.length >= 5) {
            setIsCapturing(false);
            toast.success("Captured 5 samples! You can save now.");
            return prev;
          }
          return [...prev, [...landmarks[0]]];
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isCapturing, isRunning, landmarks]);

  const handleSave = useCallback(async () => {
    if (samples.length < 5) {
      toast.error("Need at least 5 samples. Keep capturing.");
      return;
    }
    const gesture: StoredGesture = {
      id: `custom_${Date.now()}`,
      name: gestureName.trim(),
      samples,
      createdAt: Date.now(),
    };
    await saveGesture(gesture);
    setSavedGestures(await getAllGestures());
    setSamples([]);
    setGestureName("");
    toast.success(`Gesture "${gesture.name}" saved!`);
  }, [samples, gestureName]);

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
              {isCapturing && (
                <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-destructive/90 px-3 py-1 backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-destructive-foreground animate-pulse" />
                  <span className="text-xs font-mono text-destructive-foreground">
                    REC {samples.length}/30
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

              {isRunning && (
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
                    />
                  </div>
                  {!isCapturing ? (
                    <Button
                      onClick={startCapturing}
                      disabled={!gestureName.trim()}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Circle className="mr-2 h-4 w-4" />
                      Record
                    </Button>
                  ) : (
                    <Button onClick={stopCapturing} variant="destructive">
                      <Square className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  )}
                </div>
              )}

              {samples.length > 0 && !isCapturing && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    {samples.length} samples captured
                  </div>
                  <Button onClick={handleSave} className="ml-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Save Gesture
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Saved gestures */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Plus className="h-3 w-3" />
                How to Train
              </h3>
              <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                <li>Start the camera</li>
                <li>Type a gesture name (e.g. "Water")</li>
                <li>Hold the gesture and press Record</li>
                <li>Keep the pose steady for ~6 seconds</li>
                <li>Save when 30 samples are captured</li>
                <li>Go to Detect page — your gesture works!</li>
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
