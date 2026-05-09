import "./styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent.fun on 0G",
  description: "Launch, own, use, and trade AI agents powered by the full 0G stack.",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
