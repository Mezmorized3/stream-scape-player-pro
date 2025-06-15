
import { useState } from "react";
import CameraToolPanel from "./CameraToolPanel";
import VideoPlayer from "./VideoPlayer";
import CameraList from "./CameraList";
import ToolStatusPanel from "./ToolStatusPanel";

// Generic shape for camera discovery result from backend (covers rtsp_url/address/url)
type BackendCamera = {
  name?: string;
  url?: string;
  address?: string;
  rtsp_url?: string;
  status?: "live" | "offline" | "unknown";
};

type CameraInfo = {
  name: string;
  url: string;
  status: "live" | "offline" | "unknown";
};

const defaultNetwork = "192.168.1.0/24";

const VideoPlayerDashboard = () => {
  const [selectedTool, setSelectedTool] = useState("discovery");
  const [scanning, setScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [playerUrl, setPlayerUrl] = useState<string>("");
  const [network, setNetwork] = useState(defaultNetwork);

  // Helper to add logs to tool status panel
  function appendLog(line: string) {
    setScanLogs((logs) => [...logs, line]);
  }

  // Maps backend discovered objects to CameraInfo for our frontend
  function parseDiscoveredCameras(back: BackendCamera[]): CameraInfo[] {
    if (!Array.isArray(back)) return [];
    // Heuristic, backend might use different fields
    return back
      .map((c, idx) => {
        // Try to extract valid URL
        let url = c.rtsp_url ?? c.url ?? c.address ?? "";
        if (!url) return null;
        // Try to add a name
        let name = c.name ?? c.rtsp_url ?? c.url ?? c.address ?? `Camera ${idx+1}`;
        return {
          name: typeof name === "string" ? name : `Camera ${idx+1}`,
          url,
          status: "live", // Assume live if found (backend has more info? could update)
        } as CameraInfo;
      })
      .filter((x): x is CameraInfo => Boolean(x));
  }

  // Run tool by endpoint. For POST, 'body' can be provided.
  async function runTool(path: string, method: "GET" | "POST" = "GET", body?: any) {
    setScanning(true);
    setScanLogs([]);
    appendLog(`> Running ${path}... (${network})`);
    try {
      const opts: RequestInit = method === "POST"
        ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
        : {};
      const query = method === "GET" && network ? `?network=${encodeURIComponent(network)}` : "";
      const response = await fetch(`http://localhost:5000/${path}${query}`, opts);
      const data = await response.json();
      if (data.error) {
        appendLog(`[ERROR] ${data.error}`);
        setCameras([]);
      } else if (Array.isArray(data)) {
        // Typical: result from scan/discover/cameradar
        setCameras(parseDiscoveredCameras(data));
        // Print them in logs
        data.forEach((item, i) => {
          appendLog(`Device ${i + 1}: ${item.rtsp_url ?? item.url ?? item.address ?? JSON.stringify(item)}`);
        });
      } else if ('results' in data && Array.isArray(data.results)) {
        // Result wrapped in a results field (just in case)
        setCameras(parseDiscoveredCameras(data.results));
        data.results.forEach((item, i) => {
          appendLog(`Device ${i + 1}: ${item.rtsp_url ?? item.url ?? item.address ?? JSON.stringify(item)}`);
        });
      } else {
        appendLog("Tool did not return a recognized devices list.");
      }
    } catch (err: any) {
      appendLog("[ERROR] " + (err?.message || err));
      setCameras([]);
    }
    setScanning(false);
  }

  // Main tool dispatch handler for sidebar/tools
  function handleRunTool() {
    switch (selectedTool) {
      case "discovery":
        runTool("discover");
        break;
      case "scan":
        runTool("scan");
        break;
      case "attack":
        // Cameradar RTSP attack (GET request)
        runTool("cameradar");
        break;
      case "exploit":
        {
          const target = window.prompt("Target RTSP/Camera URL or IP:");
          if (target) {
            runTool("exploit", "POST", { target });
          }
        }
        break;
      case "shinobi":
        // Shinobi configuration and scanning
        runTool("shinobi");
        break;
      default:
        appendLog("Unknown tool selected.");
        break;
    }
  }

  // Optional: Add extra button for the ipcam_search_protocol endpoint
  function handleSearchProtocol() {
    runTool("search-protocol");
  }

  // When user picks a camera in the list, set its URL for playback
  function handleCameraPick(url: string) {
    setPlayerUrl(url);
  }

  return (
    <div className="flex h-screen">
      {/* LEFT SIDEBAR - Tools and network input */}
      <nav className="w-72 min-w-[180px] border-r border-sidebar-border bg-gradient-to-b from-[#1e1e1e]/95 to-[#232323]/96 px-0 py-6 flex flex-col gap-2 h-full shadow-lg">
        <div className="px-7 mb-7">
          <pre className="text-2xl font-mono font-bold tracking-tight text-[#0084ff]">Imperial Scan</pre>
        </div>
        <div className="px-6 mb-2">
          <label className="block text-xs mb-1 text-[#a3a3a3]">Network/Subnet:</label>
          <input
            type="text"
            value={network}
            onChange={e => setNetwork(e.target.value)}
            className="w-full px-3 py-2 rounded bg-[#191f26] border border-[#30353a] text-white text-sm mb-2 outline-none"
            placeholder="192.168.1.0/24"
            disabled={scanning}
          />
        </div>
        <ul className="flex-1 flex flex-col gap-2">
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "discovery" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#2626a3]"}`}
              onClick={() => setSelectedTool("discovery")}
              disabled={scanning}
            >🔍 Camera Discovery</button>
          </li>
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "scan" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#226]"}`}
              onClick={() => setSelectedTool("scan")}
              disabled={scanning}
            >🛰️ CCTV Network Scan</button>
          </li>
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "attack" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#226]"}`}
              onClick={() => setSelectedTool("attack")}
              disabled={scanning}
            >🔑 RTSP Attack</button>
          </li>
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "exploit" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#226]"}`}
              onClick={() => setSelectedTool("exploit")}
              disabled={scanning}
            >💀 Camera Exploitation</button>
          </li>
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "shinobi" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#226]"}`}
              onClick={() => setSelectedTool("shinobi")}
              disabled={scanning}
            >📹 Shinobi NVR</button>
          </li>
        </ul>
        <div className="px-6 pb-2 mt-2 flex gap-2 flex-col">
          <button
            className={`rounded-lg px-4 py-3 w-full font-semibold bg-[#0084ff] hover:bg-[#0066cc] transition-colors shadow ${scanning ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={handleRunTool}
            disabled={scanning}
          >
            {scanning ? "Running..." : "Run Tool"}
          </button>
          <button
            className="rounded-lg px-4 py-2 w-full font-semibold bg-[#222] hover:bg-[#333] text-xs text-[#aad8ff] border border-[#2228] transition-colors"
            onClick={handleSearchProtocol}
            disabled={scanning}
            title="Use IPCam Search Protocol tool"
          >
            🔬 Search Protocol
          </button>
        </div>
        <div className="px-7 py-0 mt-auto text-xs text-muted-foreground">
          Integrates: OpenCCTV, EyePwn, Ingram, Cameradar, IPCamSearch, Shinobi NVR (via Flask server)
        </div>
      </nav>
      {/* MAIN DASHBOARD */}
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

