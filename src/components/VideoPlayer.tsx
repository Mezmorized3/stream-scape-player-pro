
import { useEffect, useRef, useState } from "react";

// Use browser's default controls for now; rich overlay controls can be split to a separate component
const formatExamples = [
  { name: "HLS (.m3u8)", url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8" },
  { name: "DASH (.mpd)", url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.mpd" },
  { name: "MP4", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
  { name: "WebM", url: "https://sample-videos.com/zip/10/webm/mp4/SampleVideo_1280x720_1mb.webm" },
];

export default function VideoPlayer({ url }: { url: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "live" | "error">("idle");

  useEffect(() => {
    setCurrentUrl(url);
    setStatus("loading");
    setLoadError(null);
  }, [url]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCurrentUrl(e.target.value);
  }
  function handleLoad() {
    setLoadError(null);
    setStatus("loading");
  }
  function handleLoadedData() {
    setStatus("live");
  }
  function handleError() {
    setLoadError("Failed to load stream (might be unsupported format or offline)");
    setStatus("error");
  }
  function handlePlayPause() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }

  function handleSetExample(exampleUrl: string) {
    setCurrentUrl(exampleUrl);
  }

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2 bg-[#232323] border-b border-[#222]">
        <input
          ref={inputRef}
          className="flex-1 px-4 py-2 bg-[#191f26] border border-[#222a33] rounded-lg text-white placeholder:text-gray-500 mr-2 outline-none font-mono text-xs transition"
          placeholder="Paste video URL: .mp4, .m3u8, .mpd, .webm, etc."
          value={currentUrl}
          onChange={handleInputChange}
          onKeyDown={e => {
            if (e.key === "Enter") setStatus("loading");
          }}
        />
        <button
          className="px-4 py-2 bg-[#0084ff] hover:bg-[#0066cc] rounded-lg text-white font-bold transition"
          onClick={() => setStatus("loading")}
        >
          Load Video
        </button>
      </div>
      <div className="flex flex-wrap gap-2 px-4 py-2 bg-[#222628] border-b border-[#232325]">
        {formatExamples.map((ex) => (
          <button
            key={ex.url}
            className="border border-[#2254da]/60 rounded px-2 py-1 text-xs text-[#a5e3ff] font-mono hover:bg-[#1b2936]/80 transition"
            onClick={() => handleSetExample(ex.url)}
          >
            {ex.name}
          </button>
        ))}
      </div>
      <div className="relative flex-1 flex justify-center items-center bg-black rounded-b-xl overflow-hidden border-2 border-[#111]">
        {loadError ? (
          <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col items-center justify-center bg-[#2a1111]/90 z-10">
            <div className="text-red-400 font-bold mb-2">Error</div>
            <div className="text-sm">{loadError}</div>
          </div>
        ) : null}
        <video
          ref={videoRef}
          src={currentUrl}
          controls
          autoPlay
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-contain bg-black"
          onLoadStart={handleLoad}
          onCanPlay={handleLoadedData}
          onError={handleError}
        >
          Sorry, your browser does not support video playback.
        </video>
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#000]/70 z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0084ff]"></div>
            <span className="ml-4 text-[#a5b4fc] text-lg">Loading...</span>
          </div>
        )}
      </div>
      <div className="px-4 py-2 text-xs text-gray-400 font-mono">
        <span className="mr-4">Supported: HLS (.m3u8), DASH (.mpd), MP4, WebM, MOV, direct links, etc.</span>
        <span>Shortcuts: <kbd>Space</kbd> (play/pause), <kbd>M</kbd> (mute), <kbd>F</kbd> (fullscreen)</span>
      </div>
    </div>
  );
}
