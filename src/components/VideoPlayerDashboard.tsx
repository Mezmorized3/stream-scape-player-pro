import { useState, useEffect } from "react";
import VideoPlayer from "./VideoPlayer";
import CameraList from "./CameraList";
import ToolStatusPanel from "./ToolStatusPanel";
import ToolOptionsPanel from "./ToolOptionsPanel";

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

const countries = [
  { name: "Georgia", code: "GE" },
  { name: "Romania", code: "RO" },
  { name: "Ukraine", code: "UA" },
  { name: "Russia", code: "RU" },
  { name: "United States", code: "US" },
  { name: "Israel", code: "IL" },
  { name: "Palestine", code: "PS" },
  { name: "Syria", code: "SY" },
  { name: "Iran", code: "IR" },
  { name: "Lebanon", code: "LB" },
];

const VideoPlayerDashboard = () => {
  const [selectedTool, setSelectedTool] = useState("discovery");
  const [scanning, setScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [playerUrl, setPlayerUrl] = useState<string>("");
  const [network, setNetwork] = useState(defaultNetwork);
  const [country, setCountry] = useState("");
  const [exploitTarget, setExploitTarget] = useState<string>("");
  const [shodanKey, setShodanKey] = useState(
    () => localStorage.getItem("shodanKey") || ""
  );
  const [searchViewerQuery, setSearchViewerQuery] = useState("");
  const [searchViewerHtml, setSearchViewerHtml] = useState<string | null>(null);
  const [hostnames, setHostnames] = useState("");
  const [censysId, setCensysId] = useState(
    () => localStorage.getItem("censysId") || ""
  );
  const [censysSecret, setCensysSecret] = useState(
    () => localStorage.getItem("censysSecret") || ""
  );

  useEffect(() => {
    if (shodanKey) {
      localStorage.setItem("shodanKey", shodanKey);
    } else {
      localStorage.removeItem("shodanKey");
    }
  }, [shodanKey]);

  useEffect(() => {
    if (censysId) {
      localStorage.setItem("censysId", censysId);
    } else {
      localStorage.removeItem("censysId");
    }
    if (censysSecret) {
      localStorage.setItem("censysSecret", censysSecret);
    } else {
      localStorage.removeItem("censysSecret");
    }
  }, [censysId, censysSecret]);

  // Helper to add logs to tool status panel
  function appendLog(line: string) {
    setScanLogs((logs) => [...logs, line]);
  }

  const handleSelectTool = (tool: string) => {
    setSelectedTool(tool);
    setSearchViewerHtml(null); // Clear search viewer results
    setCameras([]); // Clear camera list
    setPlayerUrl(""); // Clear video player
  };

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
  async function runTool(
    path: string,
    method: "GET" | "POST" = "GET",
    body?: any
  ) {
    setScanning(true);
    setScanLogs([]);
    const toolName = {
      discovery: "Camera Discovery",
      scan: "CCTV Network Scan",
      attack: "RTSP Attack",
      exploit: "Camera Exploitation",
      shinobi: "Shinobi NVR",
      xray: "X-Ray Scan",
      kamerka: "Kamerka Scan",
      'search-viewer': "Search Viewer",
      'cameradar': "RTSP Attack",
      'search-protocol': "IPCam Search Protocol",
      'ddns-scan': "DDNS Scan"
    }[path] || path;

    let logTarget;
    if (path === 'exploit') {
      logTarget = body?.target;
    } else if (path === 'search-viewer') {
      logTarget = body?.query;
    } else if (path === 'ddns-scan') {
      logTarget = 'from hostnames list';
    } else {
      logTarget = country ? `country ${country}` : network;
    }

    appendLog(`> Running ${toolName}... (${logTarget || ''})`);

    try {
      const opts: RequestInit =
        method === "POST"
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {};

      let query = "";
      if (method === "GET") {
        const params = new URLSearchParams();
        if (country) {
          params.set("country", country);
        } else if (network) {
          params.set("network", encodeURIComponent(network));
        }

        // Specific tool params
        if (path === "kamerka") {
          if (shodanKey) {
            params.set("shodan_key", shodanKey);
          } else {
            appendLog("[ERROR] Shodan API Key is required for Kamerka.");
            setScanning(false);
            return;
          }
        } else if (path === "search-viewer") {
          if (body?.query) {
            params.set("query", body.query);
          } else {
            appendLog("[ERROR] Search query is required for Search Viewer.");
            setScanning(false);
            return;
          }
        }

        const queryString = params.toString();
        if (queryString) {
          query = `?${queryString}`;
        }
      }

      const response = await fetch(
        `http://localhost:5000/${path}${query}`,
        opts
      );
      const data = await response.json();
      if (data.error) {
        appendLog(`[ERROR] ${data.error}`);
        setCameras([]);
      } else if (data.html_content) {
        setSearchViewerHtml(data.html_content);
        appendLog("Search Viewer graph generated successfully.");
        if (data.output) {
          data.output.split('\n').forEach((line: string) => appendLog(line));
        }
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
         if (data.output) { // Also show raw output if available
            appendLog('--- RAW OUTPUT ---');
            appendLog(typeof data.output === 'string' ? data.output : JSON.stringify(data.output, null, 2));
        }
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
      case "xray":
        runTool("xray");
        break;
      case "attack":
        // Cameradar RTSP attack (GET request)
        runTool("cameradar");
        break;
      case "exploit":
        {
          if (exploitTarget) {
            runTool("exploit", "POST", { target: exploitTarget });
          } else {
            appendLog("[ERROR] Please provide a target for the exploit tool.");
          }
        }
        break;
      case "kamerka":
        runTool("kamerka");
        break;
      case "shinobi":
        // Shinobi configuration and scanning
        runTool("shinobi");
        break;
      case "search_viewer":
        if (searchViewerQuery) {
          runTool("search-viewer", "GET", { query: searchViewerQuery });
        } else {
          appendLog("[ERROR] Please provide a query for the Search Viewer tool.");
        }
        break;
      case "ddns_scan":
        if (hostnames) {
          runTool("ddns-scan", "POST", { 
            hostnames,
            shodan_key: shodanKey || undefined,
            censys_id: censysId || undefined,
            censys_secret: censysSecret || undefined,
          });
        } else {
          appendLog("[ERROR] Please provide a list of hostnames for the DDNS Scan tool.");
        }
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
          <label className="block text-xs mb-1 text-[#a3a3a3]">Target Country:</label>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              if (e.target.value) {
                setNetwork("");
              }
            }}
            className="w-full px-3 py-2 rounded bg-[#191f26] border border-[#30353a] text-white text-sm mb-2 outline-none"
            disabled={scanning}
          >
            <option value="">-- Select Country --</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="px-6 mb-2">
          <label className="block text-xs mb-1 text-[#a3a3a3]">Network/Subnet (or):</label>
          <input
            type="text"
            value={network}
            onChange={e => {
              setNetwork(e.target.value);
              if (e.target.value) {
                setCountry('');
              }
            }}
            className="w-full px-3 py-2 rounded bg-[#191f26] border border-[#30353a] text-white text-sm mb-2 outline-none"
            placeholder="192.168.1.0/24"
            disabled={scanning || !!country}
          />
        </div>
        <ul className="flex-1 flex flex-col gap-2">
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "discovery" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#2626a3]"}`}
              onClick={() => handleSelectTool("discovery")}
              disabled={scanning}
            >🔍 Camera Discovery</button>
          </li>
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "scan" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#226]"}`}
              onClick={() => handleSelectTool("scan")}
              disabled={scanning}
            >🛰️ CCTV Network Scan</button>
          </li>
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "xray" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#226]"}`}
              onClick={() => handleSelectTool("xray")}
              disabled={scanning}
            >⚡️ X-Ray Scan</button>
          </li>
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "attack" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#226]"}`}
              onClick={() => handleSelectTool("attack")}
              disabled={scanning}
            >🔑 RTSP Attack</button>
          </li>
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "exploit" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#226]"}`}
              onClick={() => handleSelectTool("exploit")}
              disabled={scanning}
            >💀 Camera Exploitation</button>
          </li>
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "kamerka" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#226]"}`}
              onClick={() => handleSelectTool("kamerka")}
              disabled={scanning}
            >📸 Kamerka Scan</button>
          </li>
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "shinobi" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#226]"}`}
              onClick={() => handleSelectTool("shinobi")}
              disabled={scanning}
            >📹 Shinobi NVR</button>
          </li>
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "search_viewer" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#226]"}`}
              onClick={() => handleSelectTool("search_viewer")}
              disabled={scanning}
            >🔎 Search Viewer</button>
          </li>
          <li>
            <button
              className={`flex w-full items-center gap-2 px-6 py-3 rounded-lg text-left font-semibold transition-colors ${selectedTool === "ddns_scan" ? "bg-[#232323] border-[#0084ff] border" : "hover:bg-[#226]"}`}
              onClick={() => handleSelectTool("ddns_scan")}
              disabled={scanning}
            >📡 DDNS Scan</button>
          </li>
        </ul>
        <div className="px-6 pb-2 mt-2 flex gap-2 flex-col">
          <button
            className={`rounded-lg px-4 py-3 w-full font-semibold bg-[#0084ff] hover:bg-[#0066cc] transition-colors ${scanning ? "opacity-60 cursor-not-allowed" : ""}`}
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
            {selectedTool === 'search_viewer' && searchViewerHtml ? (
              <iframe
                srcDoc={searchViewerHtml}
                className="w-full h-full border-0 rounded-2xl"
                title="Search Viewer Result"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <VideoPlayer url={playerUrl} />
            )}
          </section>
          <aside className="w-80 min-w-[280px] flex flex-col gap-2">
            <ToolOptionsPanel
              selectedTool={selectedTool}
              exploitTarget={exploitTarget}
              setExploitTarget={setExploitTarget}
              shodanKey={shodanKey}
              setShodanKey={setShodanKey}
              scanning={scanning}
              searchViewerQuery={searchViewerQuery}
              setSearchViewerQuery={setSearchViewerQuery}
              hostnames={hostnames}
              setHostnames={setHostnames}
              censysId={censysId}
              setCensysId={setCensysId}
              censysSecret={censysSecret}
              setCensysSecret={setCensysSecret}
            />
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
