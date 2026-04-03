import { useState, useEffect, useCallback } from "react";
import type { PluginAdminExports } from "emdash";
import { apiFetch, parseApiResponse } from "emdash/plugin-utils";

const API = "/_emdash/api/plugins/jetemail";

function post(route: string, body?: unknown): Promise<Response> {
  return apiFetch(`${API}/${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

interface Settings {
  apiKey: string;
  fromAddress: string;
  fromName: string;
}

function JetEmailLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-1.5 -19 98.5 98.5"
      width={size}
      height={size}
    >
      <g fill="#247bb3" transform="translate(-3, -20)">
        <path d="M3.526,23.046v9.719h23.478l33.731,23.313l27.518-19.02v30.748H32.682v9.718h65.29V23.046H3.526z M60.735,44.262L44.1,32.765h33.271L60.735,44.262z" />
        <rect x="12.55" y="39.697" width="18.396" height="6.942" />
        <rect x="23.137" y="53.928" width="18.396" height="6.942" />
      </g>
    </svg>
  );
}

function JetEmailPage() {
  const [apiKey, setApiKey] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [fromName, setFromName] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    post("settings/get")
      .then((res) => parseApiResponse<Settings>(res))
      .then((data) => {
        setApiKey(data.apiKey);
        setFromAddress(data.fromAddress);
        setFromName(data.fromName);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const saveSettings = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await post("settings/save", { apiKey, fromAddress, fromName });
      setMessage({ type: "success", text: "Settings saved." });
    } catch (e) {
      setMessage({
        type: "error",
        text: `Failed to save: ${e instanceof Error ? e.message : "Unknown error"}`,
      });
    } finally {
      setSaving(false);
    }
  }, [apiKey, fromAddress, fromName]);

  const sendTestEmail = useCallback(async () => {
    if (!testEmail) return;
    setTesting(true);
    setMessage(null);
    try {
      await post("test", { to: testEmail });
      setMessage({ type: "success", text: "Test email sent! Check your inbox." });
    } catch (e) {
      setMessage({
        type: "error",
        text: `Test failed: ${e instanceof Error ? e.message : "Unknown error"}`,
      });
    } finally {
      setTesting(false);
    }
  }, [testEmail]);

  if (!loaded) return null;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 8,
        }}
      >
        <JetEmailLogo size={36} />
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>JetEmail</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted, #888)" }}>
            Transactional email delivery
          </p>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "var(--color-text-muted, #888)", marginBottom: 28, lineHeight: 1.5 }}>
        Connect your JetEmail account to send transactional emails from your site.
        Need help?{" "}
        <a
          href="https://support.jetemail.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#247bb3" }}
        >
          Visit our support center
        </a>
        .
      </p>

      {/* Settings Card */}
      <div
        style={{
          border: "1px solid var(--color-border, #e5e7eb)",
          borderRadius: 10,
          padding: "24px 24px 20px",
          marginBottom: 20,
          background: "var(--color-bg-card, #fff)",
        }}
      >
        <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>Credentials</h3>

        <Field label="API Key" htmlFor="je-apiKey">
          <input
            id="je-apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="transactional_..."
            style={inputStyle}
          />
          <Hint>
            Get your key from the{" "}
            <a href="https://app.jetemail.com" target="_blank" rel="noopener noreferrer" style={{ color: "#247bb3" }}>
              JetEmail dashboard
            </a>
            {" "}under Outbound &gt; Keys.
          </Hint>
        </Field>

        <Field label="From Address" htmlFor="je-from">
          <input
            id="je-from"
            type="email"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            placeholder="noreply@yourdomain.com"
            style={inputStyle}
          />
          <Hint>Must be on a verified domain in your JetEmail account.</Hint>
        </Field>

        <Field label="From Name" htmlFor="je-name" last>
          <input
            id="je-name"
            type="text"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="My Site"
            style={inputStyle}
          />
          <Hint>Optional display name shown to recipients.</Hint>
        </Field>

        <button
          onClick={saveSettings}
          disabled={saving || !apiKey}
          style={{
            ...btnPrimary,
            opacity: saving || !apiKey ? 0.5 : 1,
            cursor: saving || !apiKey ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Test Card */}
      <div
        style={{
          border: "1px solid var(--color-border, #e5e7eb)",
          borderRadius: 10,
          padding: "24px 24px 20px",
          marginBottom: 20,
          background: "var(--color-bg-card, #fff)",
        }}
      >
        <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600 }}>Send Test Email</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-text-muted, #888)" }}>
          Verify your configuration by sending a test message.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={sendTestEmail}
            disabled={testing || !testEmail || !apiKey}
            style={{
              ...btnSecondary,
              opacity: testing || !testEmail || !apiKey ? 0.5 : 1,
              cursor: testing || !testEmail || !apiKey ? "not-allowed" : "pointer",
            }}
          >
            {testing ? "Sending..." : "Send Test"}
          </button>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            background: message.type === "success" ? "#dcfce7" : "#fee2e2",
            color: message.type === "success" ? "#166534" : "#991b1b",
            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

/* ---- Shared styles & small components ---- */

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid var(--color-border, #d1d5db)",
  background: "var(--color-input-bg, #fff)",
  color: "var(--color-text, #333)",
  fontSize: 14,
  boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  padding: "8px 22px",
  borderRadius: 6,
  border: "none",
  background: "#247bb3",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
};

const btnSecondary: React.CSSProperties = {
  padding: "8px 20px",
  borderRadius: 6,
  border: "1px solid var(--color-border, #d1d5db)",
  background: "var(--color-bg, #fff)",
  color: "var(--color-text, #333)",
  fontWeight: 600,
  fontSize: 14,
  whiteSpace: "nowrap",
};

function Field({
  label,
  htmlFor,
  last,
  children,
}: {
  label: string;
  htmlFor: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: last ? 20 : 18 }}>
      <label
        htmlFor={htmlFor}
        style={{ display: "block", fontWeight: 600, marginBottom: 5, fontSize: 13 }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, color: "var(--color-text-muted, #999)", marginTop: 4, marginBottom: 0, lineHeight: 1.4 }}>
      {children}
    </p>
  );
}

export const pages: PluginAdminExports["pages"] = {
  "/": JetEmailPage,
  "/settings": JetEmailPage,
};
