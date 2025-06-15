
import { useState } from "react";
import CameraToolPanel from "./CameraToolPanel";
import VideoPlayer from "./VideoPlayer";
import CameraList from "./CameraList";
import ToolStatusPanel from "./ToolStatusPanel";

type CameraInfo = {
  name: string;
  url: string;
  status: "live" | "offline" | "unknown";
};

const initialMockCameras: CameraInfo[] = [
  {
    name: "Office Lobby RTSP",
    url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    status: "live"
  },
  {
    name: "Parking Lot HLS",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    status: "live"
  },
  {
    name: "Warehouse (Down)",
    url: "",
    status: "offline"
  },
];

const VideoPlayerDashboard = () => {
  const [selectedTool, setSelectedTool] = useState("discovery");
  const [scanning, setScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [cameras, setCameras] = useState<CameraInfo[]>(initialMockCameras);
  const [playerUrl, setPlayerUrl] = useState<string>(initialMockCameras[0].url);

  // Simulate running a tool with mock logs and results
  function runTool(tool: string) {
    setScanning(true);
    setScanLogs([
      `> ${tool === "discovery" ? "Camera discovery" : tool} started...`,
    ]);
    // For demo, simulate 3 steps with setTimeout
    setTimeout(() => {
      setScanLogs((logs) => [
        ...logs,
        "> Scanning network 192.168.1.0/24...",
        "> [OpenCCTV] Found device: 192.168.1.10",
        "> [Ingram] Discovered camera RTSP: 192.168.1.20:554",
        "> [EyePwn] Exploit attempt: success",
        "> [Cameradar] Found RTSP stream: " +
          initialMockCameras[1].url,
        "> Done.",
      ]);
      setCameras([
        ...initialMockCameras,
        {
          name: "Newly Found (Sim)",
          url: initialMockCameras[1].url,
          status: "live",
        },
      ]);
      setScanning(false);
    }, 1500);
  }

  function handleCameraPick(url: string) {
    setPlayerUrl(url);
  }
  return (
    <div className="flex h-screen">
      <CameraToolPanel
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        scanning={scanning}
        onToolRun={runTool}
      />
      <main className="flex-1 flex flex-col px-0 py-2">
        <div className="flex flex-row h-[64vh] max-h-[700px] w-full gap-6">
          <section className="flex-1 rounded-2xl bg-gradient-to-br from-[#18181b]/70 to-[#232323]/90 shadow-2xl border border-[#222] flex flex-col p-0">
            <VideoPlayer url={playerUrl} />
          </section>
          <aside className="w-80 min-w-[280px] flex flex-col gap-2">
            <ToolStatusPanel logs={scanLogs} scanning={scanning} tool={selectedTool} />
          </aside>
        </div>
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-[#a5b4fc]">Discovered Cameras</h2>
          <CameraList cameras={cameras} onPick={handleCameraPick} />
        </div>
      </main>
    </div>
  );
};
export default VideoPlayerDashboard;
