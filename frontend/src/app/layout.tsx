import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FloodShield | AI-Powered Flood Decision Intelligence",
  description: "Advanced Flood Simulation and Recommendation System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50 text-slate-900">{children}</body>
    </html>
  );
}
