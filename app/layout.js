import "./globals.css";

export const metadata = {
  title: "MyAIDaily · AI Engineering News & Research Wire",
  description:
    "Real-time engineering updates on new AI models, frameworks, MCP, KAG, RAG, and reasoning breakthroughs with zero token overhead.",
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
