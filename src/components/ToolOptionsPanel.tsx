import React from 'react';

interface ToolOptionsPanelProps {
  selectedTool: string;
  exploitTarget: string;
  setExploitTarget: (target: string) => void;
  shodanKey: string;
  setShodanKey: (key: string) => void;
  scanning: boolean;
  searchViewerQuery: string;
  setSearchViewerQuery: (query: string) => void;
  hostnames: string;
  setHostnames: (hostnames: string) => void;
  censysId: string;
  setCensysId: (id: string) => void;
  censysSecret: string;
  setCensysSecret: (secret: string) => void;
}

const ExploitOptions = ({ exploitTarget, setExploitTarget, scanning }: Omit<ToolOptionsPanelProps, 'selectedTool' | 'shodanKey' | 'setShodanKey' | 'searchViewerQuery' | 'setSearchViewerQuery' | 'hostnames' | 'setHostnames' | 'censysId' | 'setCensysId' | 'censysSecret' | 'setCensysSecret'>) => {
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

const SearchViewerOptions = ({ searchViewerQuery, setSearchViewerQuery, scanning }: Pick<ToolOptionsPanelProps, 'searchViewerQuery' | 'setSearchViewerQuery' | 'scanning'>) => {
  return (
    <div>
      <h3 className="font-semibold text-base mb-2">Search Viewer Options</h3>
      <label htmlFor="search-viewer-query" className="block text-xs mb-1 text-[#a3a3a3]">
        Search Query:
      </label>
      <input
        id="search-viewer-query"
        type="text"
        value={searchViewerQuery}
        onChange={(e) => setSearchViewerQuery(e.target.value)}
        className="w-full px-3 py-2 rounded bg-[#191f26] border border-[#30353a] text-white text-sm mb-2 outline-none"
        placeholder="e.g., 'CCTV vulnerabilities'"
        disabled={scanning}
      />
    </div>
  );
};

const DDNSOptions = ({
  hostnames,
  setHostnames,
  shodanKey,
  setShodanKey,
  censysId,
  setCensysId,
  censysSecret,
  setCensysSecret,
  scanning,
}: Pick<
  ToolOptionsPanelProps,
  | "hostnames"
  | "setHostnames"
  | "shodanKey"
  | "setShodanKey"
  | "censysId"
  | "setCensysId"
  | "censysSecret"
  | "setCensysSecret"
  | "scanning"
>) => {
  return (
    <div>
      <h3 className="font-semibold text-base mb-2">DDNS Scan Options</h3>
      <label
        htmlFor="hostnames"
        className="block text-xs mb-1 text-[#a3a3a3]"
      >
        Hostnames (one per line):
      </label>
      <textarea
        id="hostnames"
        value={hostnames}
        onChange={(e) => setHostnames(e.target.value)}
        className="w-full px-3 py-2 rounded bg-[#191f26] border border-[#30353a] text-white text-sm mb-2 outline-none h-24 resize-y"
        placeholder="example.ddns.net&#10;another.ddns.org"
        disabled={scanning}
      />

      <label
        htmlFor="shodan-key-ddns"
        className="block text-xs mb-1 text-[#a3a3a3]"
      >
        Shodan API Key (optional):
      </label>
      <input
        id="shodan-key-ddns"
        type="password"
        value={shodanKey}
        onChange={(e) => setShodanKey(e.target.value)}
        className="w-full px-3 py-2 rounded bg-[#191f26] border border-[#30353a] text-white text-sm mb-2 outline-none"
        placeholder="Shodan API Key"
        disabled={scanning}
      />

      <label
        htmlFor="censys-id"
        className="block text-xs mb-1 text-[#a3a3a3]"
      >
        Censys ID (optional):
      </label>
      <input
        id="censys-id"
        type="password"
        value={censysId}
        onChange={(e) => setCensysId(e.target.value)}
        className="w-full px-3 py-2 rounded bg-[#191f26] border border-[#30353a] text-white text-sm mb-2 outline-none"
        placeholder="Censys ID"
        disabled={scanning}
      />
      <label
        htmlFor="censys-secret"
        className="block text-xs mb-1 text-[#a3a3a3]"
      >
        Censys Secret (optional):
      </label>
      <input
        id="censys-secret"
        type="password"
        value={censysSecret}
        onChange={(e) => setCensysSecret(e.target.value)}
        className="w-full px-3 py-2 rounded bg-[#191f26] border border-[#30353a] text-white text-sm mb-2 outline-none"
        placeholder="Censys Secret"
        disabled={scanning}
      />
      <p className="text-xs text-muted-foreground">
        API Keys are optional and saved in your browser's local storage.
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
  searchViewerQuery,
  setSearchViewerQuery,
  hostnames,
  setHostnames,
  censysId,
  setCensysId,
  censysSecret,
  setCensysSecret,
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
      case 'search_viewer':
        return (
          <SearchViewerOptions
            searchViewerQuery={searchViewerQuery}
            setSearchViewerQuery={setSearchViewerQuery}
            scanning={scanning}
          />
        );
      case 'ddns_scan':
        return (
          <DDNSOptions
            hostnames={hostnames}
            setHostnames={setHostnames}
            shodanKey={shodanKey}
            setShodanKey={setShodanKey}
            censysId={censysId}
            setCensysId={setCensysId}
            censysSecret={censysSecret}
            setCensysSecret={setCensysSecret}
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
