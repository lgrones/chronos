import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Chronos",
  description: "Method-style extensions for the Temporal API, in Day.js syntax.",
  // Served from https://lgrones.github.io/chronos/.
  base: "/chronos/",
  cleanUrls: true,
  // The plan is a design document for contributors, linked from the README.
  srcExclude: ["plan.md"],
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "API", link: "/api/query" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [{ text: "Getting started", link: "/guide/" }],
      },
      {
        text: "API",
        items: [
          { text: "Query", link: "/api/query" },
          { text: "Manipulate", link: "/api/manipulate" },
          { text: "Range", link: "/api/range" },
          { text: "Parse", link: "/api/parse" },
          { text: "Display", link: "/api/display" },
          { text: "Units and types", link: "/api/types" },
        ],
      },
    ],
    outline: [2, 3],
    search: { provider: "local" },
    socialLinks: [{ icon: "github", link: "https://github.com/lgrones/chronos" }],
    editLink: {
      pattern: "https://github.com/lgrones/chronos/edit/master/docs/:path",
    },
    footer: {
      message: "Released under the MIT licence.",
      copyright: "© Leah Grones",
    },
  },
});
