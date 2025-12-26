import { defineConfig } from "vitepress"

export default defineConfig({
  lang: "en-US",
  title: "ESLint Plugin for Effector",
  description: "Enforcing best practices for Effector",

  lastUpdated: true,

  head: [
    ["link", { rel: "icon", href: "/favicon.ico", sizes: "any" }],
    ["link", { rel: "icon", href: "/comet.svg", type: "image/svg+xml" }],
    ["link", { rel: "apple-touch-icon", href: "/apple-touch-icon.png" }],
    ["link", { rel: "manifest", href: "/manifest.webmanifest" }],
  ],

  appearance: "force-dark",

  themeConfig: {
    logo: "/comet.svg",
    footer: { message: "Released under the MIT License" },

    socialLinks: [
      { icon: "github", link: "https://github.com/effector/eslint-plugin" },
      { icon: "telegram", link: "https://t.me/effector_ru" },
    ],

    nav: [
      { text: "Presets", link: "/presets/", activeMatch: "^/presets/" },
      { text: "Rules", link: "/rules/", activeMatch: "^/rules/" },
      { text: "Changelog", link: "/changelog" },
      { text: "effector.dev", link: "https://effector.dev" },
    ],

    sidebar: [],
  },
})
