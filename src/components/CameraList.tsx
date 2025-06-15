
export default function CameraList({
  cameras,
  onPick,
}: {
  cameras: { name: string; url: string; status: "live" | "offline" | "unknown" }[];
  onPick: (url: string) => void;
}) {
  // If no cameras found, display a message
  if (cameras.length === 0) {
    return (
      <div className="text-gray-400 italic text-sm pl-2">
        No cameras discovered yet. Please run a tool.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-full">
      {cameras.map((cam, idx) => (
        <div
          key={idx}
          className="bg-[#1f2937]/90 border border-[#27272a] rounded-lg p-4 flex flex-col justify-between hover:border-[#0084ff] hover:shadow transition cursor-pointer"
          onClick={() => cam.url && onPick(cam.url)}
          style={{ opacity: cam.status !== "live" ? 0.6 : 1 }}
        >
          <div className="font-semibold text-base">{cam.name || "Unnamed Camera"}</div>
          <div className="text-xs text-gray-400 truncate mt-1">{cam.url ? cam.url : "No stream found"}</div>
          <div className="mt-2">
            <span
              className={
                cam.status === "live"
                  ? "inline-block px-3 py-1 text-xs rounded-full bg-green-600/70 text-white"
                  : "inline-block px-3 py-1 text-xs rounded-full bg-gray-700 text-gray-300"
              }
            >
              {cam.status === "live" ? "Live" : cam.status === "unknown" ? "Unknown" : "Offline"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
