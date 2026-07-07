/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#10192B",
        parchment: "#F5EDE0",
        "parchment-shade": "#EBE0CC",
        verified: "#1F7A5C",
        pending: "#D9A441",
        alert: "#C4503A",
        slate: "#6B7785",
        line: "#DCD2BC",
      },
      borderRadius: {
        card: "6px",
      },
    },
  },
  plugins: [],
};
