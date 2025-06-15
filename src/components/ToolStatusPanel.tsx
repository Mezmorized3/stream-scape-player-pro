
import { Loader2 } from "lucide-react";

export default function ToolStatusPanel({
  logs,
  scanning,
  tool,
}: {
  logs: string[];
  scanning: boolean;
  tool: string;
}) {
  const toolLabel = {
    discovery: "Camera Discovery",
    scan: "CCTV Network Scan",
    attack: "RTSP Attack",
    exploit: "Camera Exploitation",
    shinobi: "Shinobi NVR",
    xray: "X-Ray Scan",
  }[tool] || "Unknown";
  return (
    <section className="w-full rounded-lg bg-[#181a20]/95 border border-[#23272f] p-4 shadow-inner flex-1 overflow-auto flex flex-col min-h-0">
      <div className="flex items-center gap-3 mb-3">
        {scanning ? <Loader2 className="animate-spin text-[#0084ff]" /> : null}
        <div className="font-bold text-base">{toolLabel} Logs</div>
      </div>
      <pre className="text-xs text-[#aad8ff] flex-1 overflow-y-auto">
        {logs.length === 0
          ? "// Output will appear here when you run a tool."
          : logs.join("\n")}
      </pre>
      {scanning && (
        <div className="text-xs text-[#0084ff] mt-2 italic">
          Running {toolLabel}...
        </div>
      )}
    </section>
  );
}
