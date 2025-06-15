
import { clsx } from "clsx";
import { Play, Search, Eye, Crosshair, Video, Rss, MonitorSpeaker } from "lucide-react";

const tools = [
  {
    id: "discovery",
    label: "Camera Discovery",
    icon: <Search size={20} />,
    desc: "Find IP cameras, RTSP endpoints, etc (Ingram, OpenCCTV, ipcam_search)",
  },
  {
    id: "scan",
    label: "CCTV Network Scan",
    icon: <Crosshair size={20} />,
    desc: "Scan for vulnerable CCTV (OpenCCTV)",
  },
  {
    id: "attack",
    label: "RTSP Attack",
    icon: <Rss size={20} />,
    desc: "Attempt RTSP brute-force/login (Cameradar, EyePwn)",
  },
  {
    id: "exploit",
    label: "Camera Exploitation",
    icon: <Eye size={20} />,
    desc: "Exploit known camera vulns (EyePwn, Ingram)",
  },
  {
    id: "shinobi",
    label: "Shinobi NVR",
    icon: <MonitorSpeaker size={20} />,
    desc: "Open-source CCTV/NVR platform configuration and monitoring",
  },
];

export default function CameraToolPanel({
  selectedTool,
  setSelectedTool,
  scanning,
  onToolRun,
}: {
  selectedTool: string;
  setSelectedTool: (id: string) => void;
  scanning: boolean;
  onToolRun: (tool: string) => void;
}) {
  return (
    <nav className="w-72 min-w-[180px] border-r border-sidebar-border bg-gradient-to-b from-[#1e1e1e]/95 to-[#232323]/96 px-0 py-6 flex flex-col gap-2 h-full shadow-lg">
      <h1 className="px-7 text-2xl font-bold mb-7 tracking-tight text-[#0084ff]">
        VideoXCCTV
      </h1>
      <ul className="flex-1 flex flex-col gap-2">
        {tools.map((tool) => (
          <li key={tool.id}>
            <button
              className={clsx(
                "flex w-full items-center gap-3 px-6 py-3 rounded-lg text-left hover:bg-sidebar-accent border border-transparent font-medium transition-colors",
                selectedTool === tool.id
                  ? "bg-[#232323] border-[#0084ff]"
                  : ""
              )}
              onClick={() => {
                setSelectedTool(tool.id);
              }}
              disabled={scanning}
              style={{ opacity: scanning && selectedTool !== tool.id ? 0.7 : 1 }}
            >
              <span className="inline-flex items-center justify-center rounded-full bg-[#1a8cff]/70 mr-2 p-1">
                {tool.icon}
              </span>
              <div>
                <div className="font-semibold">{tool.label}</div>
                <div className="text-xs text-muted-foreground">{tool.desc}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <div className="px-6 pb-4 mt-5">
        <button
          className={clsx(
            "rounded-lg px-4 py-3 w-full font-semibold bg-[#0084ff] hover:bg-[#0066cc] transition-colors shadow",
            scanning ? "opacity-60 cursor-not-allowed" : ""
          )}
          onClick={() => onToolRun(selectedTool)}
          disabled={scanning}
        >
          {scanning ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin mr-2">
                <Play size={20} />
              </span>
              Running...
            </span>
          ) : (
            "Run Tool"
          )}
        </button>
      </div>
      <div className="px-7 py-0 mt-auto text-xs text-muted-foreground">
        Integrates with: OpenCCTV, EyePwn, Ingram, Cameradar, IPCamSearch, Shinobi NVR (mock)
      </div>
    </nav>
  );
}
