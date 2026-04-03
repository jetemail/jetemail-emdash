import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";

const JETEMAIL_API_URL = "https://api.jetemail.com/email";

export interface JetEmailPluginOptions {
  apiKey?: string;
}

export function jetEmailPlugin(
  options: JetEmailPluginOptions = {}
): PluginDescriptor<JetEmailPluginOptions> {
  return {
    id: "jetemail",
    version: "0.1.0",
    entrypoint: "@jetemail/emdash-plugin",
    options,
    format: "native",
    adminEntry: "@jetemail/emdash-plugin/admin",
    adminPages: [
      { path: "/", label: "JetEmail", icon: "mail" },
    ],
    capabilities: ["email:provide", "network:fetch"],
    allowedHosts: ["api.jetemail.com"],
  };
}

export function createPlugin() {
  return definePlugin({
    id: "jetemail",
    version: "0.1.0",
    capabilities: ["email:provide", "network:fetch"],
    allowedHosts: ["api.jetemail.com"],

    admin: {
      entry: "@jetemail/emdash-plugin/admin",
      pages: [
        { path: "/", label: "JetEmail", icon: "mail" },
      ],
    },

    hooks: {
      "plugin:activate": {
        handler: async (_event, ctx) => {
          const options = ctx.plugin as unknown as {
            options?: JetEmailPluginOptions;
          };
          if (options?.options?.apiKey) {
            await ctx.kv.set("settings:apiKey", options.options.apiKey);
          }
        },
      },

      "email:deliver": {
        exclusive: true,
        handler: async (event, ctx) => {
          const apiKey = await ctx.kv.get("settings:apiKey");
          if (!apiKey) {
            throw new Error(
              "JetEmail API key not configured. Set it in the JetEmail plugin settings."
            );
          }

          const { message } = event;

          const fromAddress = (await ctx.kv.get("settings:fromAddress")) || message.to;
          const fromName = await ctx.kv.get("settings:fromName");
          const from = fromName ? `${fromName} <${fromAddress}>` : (fromAddress as string);

          const body: Record<string, unknown> = {
            from,
            to: message.to,
            subject: message.subject,
            text: message.text,
          };

          if (message.html) {
            body.html = message.html;
          }

          const response = await ctx.http!.fetch(JETEMAIL_API_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
              `JetEmail API error (${response.status}): ${errorBody}`
            );
          }

          const result = await response.json();
          ctx.log.info("Email delivered via JetEmail", {
            messageId: result.id,
            to: message.to,
          });
        },
      },
    },

    routes: {
      admin: {
        handler: async () => {
          return { elements: [] };
        },
      },

      "settings/get": {
        handler: async (ctx) => {
          const apiKey = await ctx.kv.get("settings:apiKey");
          const fromAddress = await ctx.kv.get("settings:fromAddress");
          const fromName = await ctx.kv.get("settings:fromName");
          return {
            apiKey: apiKey ? "••••••••" + String(apiKey).slice(-8) : "",
            fromAddress: fromAddress ?? "",
            fromName: fromName ?? "",
          };
        },
      },

      "settings/save": {
        handler: async (ctx) => {
          const { apiKey, fromAddress, fromName } = ctx.input as {
            apiKey?: string;
            fromAddress?: string;
            fromName?: string;
          };
          if (apiKey && !apiKey.startsWith("••••")) {
            await ctx.kv.set("settings:apiKey", apiKey);
          }
          if (fromAddress !== undefined) await ctx.kv.set("settings:fromAddress", fromAddress);
          if (fromName !== undefined) await ctx.kv.set("settings:fromName", fromName);
          return { ok: true };
        },
      },

      status: {
        handler: async (ctx) => {
          const apiKey = await ctx.kv.get("settings:apiKey");
          return {
            configured: !!apiKey,
            provider: "JetEmail",
          };
        },
      },

      test: {
        handler: async (ctx) => {
          const { to } = ctx.input as { to: string };
          if (!to) throw new Error("Recipient address required");

          const apiKey = await ctx.kv.get("settings:apiKey");
          if (!apiKey) throw new Error("API key not configured");

          const fromAddress = (await ctx.kv.get("settings:fromAddress")) || to;
          const fromName = await ctx.kv.get("settings:fromName");
          const from = fromName ? `${fromName} <${fromAddress}>` : (fromAddress as string);

          const response = await ctx.http!.fetch(JETEMAIL_API_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from,
              to,
              subject: "JetEmail Test — EmDash",
              text: "This is a test email sent from your EmDash site via JetEmail.",
              html: "<p>This is a test email sent from your EmDash site via <strong>JetEmail</strong>.</p>",
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`JetEmail API error (${response.status}): ${errorBody}`);
          }

          return { ok: true };
        },
      },
    },
  });
}
