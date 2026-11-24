import type { Config } from "tailwindcss";
import { BRAND, BRAND_INK, BRAND_TINT, CANVAS, INK, INK_2, INK_3, LINE, LINE_SOFT, TABLE_HEAD, TONES } from "./src/theme/tokens";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/**/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/constants/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      background: {
          DEFAULT: "var(--background-color)",
          input: "var(--input-background)",
          secondary: "var(--background-secondary-color)",
      },
      colors: {
        // One source of truth: src/theme/tokens.ts (also feeds the antd theme and globals.css variables).
        primary: BRAND,
        brand: { DEFAULT: BRAND, tint: BRAND_TINT, ink: BRAND_INK },
        ink: { DEFAULT: INK, 2: INK_2, 3: INK_3 },
        background: CANVAS,
        dark: "#1E1E1E",
        stroke: LINE,
        "line-soft": LINE_SOFT,
        "table-head": TABLE_HEAD,
        success: {
          DEFAULT: TONES.success.fg, // 4.6:1 on its tint, 5.0:1 on white
          light: TONES.success.bg,
        },
        gray: {
          // Was #808080 (3.95:1, fails AA). Used for meta text, captions and the sidebar group labels.
          light: INK_3,
          medium: INK_2,
        },
        error: {
          DEFAULT: TONES.danger.fg, // was #DC2626, only ~4.0:1 on its #FEE2E2 tint
          light: TONES.danger.bg,
        },
        warning: {
          DEFAULT: TONES.warning.fg, // was #A16207, 4.4:1 on its #FEF3C7 tint (fails AA)
          light: TONES.warning.bg,
        },
        info: { DEFAULT: TONES.info.fg, light: TONES.info.bg },
        learner: {
          background: "#DFF5FF",
          text: BRAND_INK,
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      fontWeight: {
          light: "var(--font-light)",
          regular: "var(--font-regular)",
          medium: "var(--font-medium)",
          semibold: "var(--font-semibold)",
          bold: "var(--font-bold)",
      },
    },
  },
  plugins: [],
};
export default config;
