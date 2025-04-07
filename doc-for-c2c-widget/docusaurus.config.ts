import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const simpleConfig = {
  title: "Documentation for C2C Widget",
  tagline: "This is the documentation for the C2C Widget.",

  ghUser: "signalwire",
  ghRepo: "temp-c2c-widget",

  url: "https://signalwire.github.io",
  baseUrl: "/temp-c2c-widget",
};

const config: Config = {
  title: simpleConfig.title,
  tagline: simpleConfig.tagline,
  favicon: "img/favicon.ico",

  url: simpleConfig.url,
  baseUrl: simpleConfig.baseUrl,

  organizationName: simpleConfig.ghUser,
  projectName: simpleConfig.ghRepo,

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "throw",

  trailingSlash: false,

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  markdown: {
    mermaid: true,
  },
  themes: ["@docusaurus/theme-mermaid"],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  stylesheets: [
    {
      href: "https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css",
      type: "text/css",
      integrity:
        "sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM",
      crossorigin: "anonymous",
    },
  ],

  // TODO: this part isn't automated yet.
  // For now, build the embed-widget, and copy
  // the built js to `/static` here,
  scripts: [
    {
      src: `${simpleConfig.baseUrl}/c2c-widget.js`,
      type: "text/javascript",
    },
  ],

  themeConfig: {
    image: "img/social-card.jpg",
    navbar: {
      title: simpleConfig.title,
      logo: {
        alt: `${simpleConfig.title} Logo`,
        src: "img/logo.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docSidebar",
          position: "left",
          label: "Docs",
        },
        {
          href: `https://github.com/${simpleConfig.ghUser}/${simpleConfig.ghRepo}`,
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "light",
      copyright: `Copyright © ${new Date().getFullYear()} ${
        simpleConfig.title
      }`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
