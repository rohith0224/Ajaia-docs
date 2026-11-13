import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Ajaia Docs — a little space for big ideas",
  description: "Write, organize, and share your team’s work.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
