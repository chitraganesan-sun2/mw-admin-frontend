import type { Config } from "tailwindcss";

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
        primary: "#09BAEE",
        background: "#F4F7FB",
        dark: "#1E1E1E",
        stroke: "#E0E0E0",
        success: {
          DEFAULT: "#15803D", // green-700: 5.0:1 on white (#22C55E was 2.3:1, fails WCAG AA)
          light: "#DCFCE7",
        },
        gray: {
          light: "#808080",
          medium: "#4F4F4F",
        },
        error: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
        },
        warning: {
          DEFAULT: "#A16207", // yellow-700: 4.9:1 on white (#CA8A04 was 2.9:1)
          light: "#FEF3C7",
        },
        learner: {
          background: "#DFF5FF",
          text: "#09baee",
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
