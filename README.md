# @jetemail/emdash-plugin

JetEmail email provider plugin for [EmDash CMS](https://github.com/emdash-cms/emdash).

Delivers transactional emails — authentication, notifications, form submissions, and more — through the [JetEmail API](https://jetemail.com).

## Prerequisites

- An [EmDash](https://github.com/emdash-cms/emdash) site
- A [JetEmail](https://jetemail.com) account with a verified domain
- A transactional API key (get one from the [JetEmail dashboard](https://dash.jetemail.com) under **Outbound > Keys**)

## Installation

```bash
npm install @jetemail/emdash-plugin
```

## Setup

### 1. Add the plugin to your Astro config

```js
// astro.config.mjs
import { jetEmailPlugin } from "@jetemail/emdash-plugin/config";

export default defineConfig({
  integrations: [
    emdash({
      plugins: [jetEmailPlugin()],
      // ...other config
    }),
  ],
});
```

You can optionally pass your API key at config time:

```js
jetEmailPlugin({
  apiKey: process.env.JETEMAIL_API_KEY,
})
```

### 2. Configure via the admin panel

Navigate to **Plugins > JetEmail** in the EmDash admin panel and enter:

| Setting | Description |
|---------|-------------|
| **API Key** | Your JetEmail transactional API key (starts with `transactional_`). |
| **From Address** | The sender email address. Must be on a domain verified in your JetEmail account. |
| **From Name** | Display name shown to recipients (optional). |

### 3. Send a test email

Use the **Send Test Email** section on the plugin page to verify your configuration.

## How it works

This plugin registers as an EmDash email provider using the `email:deliver` exclusive hook. When any part of EmDash sends an email — the auth system (magic links, password resets), the forms plugin, or any other plugin calling `ctx.email.send()` — JetEmail delivers it.

### Capabilities

| Capability | Purpose |
|---|---|
| `email:provide` | Registers the `email:deliver` hook so EmDash routes all outgoing email through JetEmail |
| `network:fetch` | Allows HTTP requests to `api.jetemail.com` (restricted by `allowedHosts`) |

### Plugin routes

| Route | Description |
|---|---|
| `settings/get` | Returns current plugin settings |
| `settings/save` | Saves plugin settings |
| `status` | Returns whether the plugin is configured |
| `test` | Sends a test email |

## Support

If you need help, visit our [support center](https://support.jetemail.com).

## License

[MIT](LICENSE)
