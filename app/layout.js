import "./globals.css";
export const metadata = { title: "AI Pulse", description: "Daily AI tech digest" };
export default function Layout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
