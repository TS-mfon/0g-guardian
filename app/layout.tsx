import "./styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "0G Guardian",
  description: "Modern agentic transaction safety built with 0G.",
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
