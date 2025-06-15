
import React from 'react';

interface ToolOptionsPanelProps {
  selectedTool: string;
  exploitTarget: string;
  setExploitTarget: (target: string) => void;
  shodanKey: string;
  setShodanKey: (key: string) => void;
  scanning: boolean;
}

const ExploitOptions = ({ exploitTarget, setExploitTarget, scanning }: Omit<ToolOptionsPanelProps, 'selectedTool' | 'shodanKey' | 'setShodanKey'>) => {
  return (
    <div>
      <h3 className="font-semibold text-base mb-2">Exploit Options</h3>
      <label htmlFor="exploit-target" className="block text-xs mb-1 text-[#a3a3a3]">
        Target RTSP/Camera URL or IP:
      </label>
      <input
        id="exploit-target"
        type="text"
        value={exploitTarget}
        onChange={(e) => setExploitTarget(e.target.value)}
        className="w-full px-3 py-2 rounded bg-[#191f26] border border-[#30353a] text-white text-sm mb-2 outline-none"
        placeholder="rtsp://..."
        disabled={scanning}
      />
    </div>
  );
};

const KamerkaOptions = ({ shodanKey, setShodanKey, scanning }: Pick<ToolOptionsPanelProps, 'shodanKey' | 'setShodanKey' | 'scanning'>) => {
  return (
    <div>
      <h3 className="font-semibold text-base mb-2">Kamerka Options</h3>
      <label htmlFor="shodan-key" className="block text-xs mb-1 text-[#a3a3a3]">
        Shodan API Key:
      </label>
      <input
        id="shodan-key"
        type="password"
        value={shodanKey}
        onChange={(e) => setShodanKey(e.target.value)}
        className="w-full px-3 py-2 rounded bg-[#191f26] border border-[#30353a] text-white text-sm mb-2 outline-none"
        placeholder="Shodan API Key"
        disabled={scanning}
      />
       <p className="text-xs text-muted-foreground">
        API Key is required and saved in your browser's local storage.
      </p>
    </div>
  );
};

export default function ToolOptionsPanel({
  selectedTool,
  exploitTarget,
  setExploitTarget,
  shodanKey,
  setShodanKey,
  scanning,
}: ToolOptionsPanelProps) {
  const renderToolOptions = () => {
    switch (selectedTool) {
      case 'exploit':
        return (
          <ExploitOptions
            exploitTarget={exploitTarget}
            setExploitTarget={setExploitTarget}
            scanning={scanning}
          />
        );
      case 'kamerka':
        return (
          <KamerkaOptions
            shodanKey={shodanKey}
            setShodanKey={setShodanKey}
            scanning={scanning}
          />
        );
      default:
        return (
          <div>
            <h3 className="font-semibold text-base mb-2">Tool Options</h3>
            <p className="text-xs text-muted-foreground">
              No specific options required for this tool. Target is based on Country or Network selection.
            </p>
          </div>
        );
    }
  };

  return (
    <section className="w-full rounded-lg bg-[#181a20]/95 border border-[#23272f] p-4 shadow-inner">
      {renderToolOptions()}
    </section>
  );
}
