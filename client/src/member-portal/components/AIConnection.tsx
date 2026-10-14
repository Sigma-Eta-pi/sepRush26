import { useEffect, useState } from "react";
import { Button } from "./ui";
import { Sk } from "@/components/DashboardSkeleton";
export default function AIConnection() {
  const [config, setConfig] = useState<{
    endpoint: string;
    local: boolean;
  } | null>(null);
  const [loaded, setLoaded] = useState(false),
    [copied, setCopied] = useState(false),
    [copyError, setCopyError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/mcp/config")
      .then(async response => (response.ok ? response.json() : null))
      .then(value => {
        if (alive) {
          if (value?.enabled) setConfig(value);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <section className="panel settings-aside">
      <h3>Connect your AI assistant</h3>
      <p>
        Ask about the class or update records from ChatGPT or Claude. Your
        assistant uses your chapter permissions.
      </p>
      {!loaded ? (
        <div role="status" aria-busy="true" aria-label="Checking connection setup">
          <Sk w={120} h={10} />
          <Sk h={40} style={{ borderRadius: 9 }} />
          <Sk w={170} h={36} style={{ borderRadius: 9 }} />
        </div>
      ) : !config ? (
        <small>Connection setup is not enabled on this website yet.</small>
      ) : (
        <>
          <label className="field">
            <span>MCP server URL</span>
            <input
              readOnly
              value={config.endpoint}
              onFocus={e => e.target.select()}
            />
          </label>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(config.endpoint);
                setCopied(true);
                setCopyError(false);
              } catch {
                setCopyError(true);
              }
            }}
          >
            {copied ? "Copied" : "Copy connection URL"}
          </Button>
          <p>
            Add this URL as a custom connector in your assistant, then sign in
            to SEP and choose whether it can make updates.
          </p>
          {copyError && (
            <small role="status">Select the URL above and copy it.</small>
          )}
          {config.local && (
            <small>
              Local testing only. Google login and a hosted website are needed
              before ChatGPT or Claude can connect remotely.
            </small>
          )}
        </>
      )}
    </section>
  );
}
