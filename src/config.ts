export interface JetEmailPluginOptions {
  apiKey?: string;
}

export function jetEmailPlugin(options: JetEmailPluginOptions = {}) {
  return {
    id: "jetemail",
    version: "0.1.0",
    entrypoint: "@jetemail/emdash",
    options,
    format: "native" as const,
    adminEntry: "@jetemail/emdash/admin",
    adminPages: [
      { path: "/", label: "JetEmail", icon: "mail" },
    ],
    capabilities: ["email:provide", "network:fetch"],
    allowedHosts: ["api.jetemail.com"],
  };
}
