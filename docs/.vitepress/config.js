export default {
  lang: "en-US",
  title: "ESLint plugin for Effector",
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", href: "/favicon.ico", sizes: "any" }],
    ["link", { rel: "icon", href: "/comet.svg", type: "image/svg+xml" }],
    ["link", { rel: "apple-touch-icon", href: "/apple-touch-icon.png" }],
    ["link", { rel: "manifest", href: "/manifest.webmanifest" }],
  ],
  themeConfig: {
    siteTitle: "ESLint plugin for Effector",
    logo: "/comet.svg",
    footer: {
      message: "Released under the MIT License.",
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/effector/eslint-plugin" },
      { icon: "twitter", link: "https://twitter.com/effectorjs" },
    ],
    // algolia: {
    //   appId: 'kkk',
    //   apiKey: 'lll',
    //   indexName: 'eslint-plugin-effector',
    // },
    editLink: {
      pattern:
        "https://github.com/effector/eslint-plugin/edit/master/docs/:path",
    },
    nav: [
      {
        text: "Presets",
        link: "/presets/",
        activeMatch: "^/presets/",
      },
      {
        text: "Rules",
        link: "/rules/",
        activeMatch: "^/rules/",
      },
      {
        text: "More",
        items: [
          {
            text: "Changelog",
            link: "/changelog",
          },
          {
            text: "Effector",
            link: "https://effector.dev",
          },
        ],
      },
    ],
    sidebar: {},
  },
};
