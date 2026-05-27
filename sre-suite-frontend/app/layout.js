import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI SRE Suite - WeMakeDevs Hackathon",
  description: "Dual-Agent Site Reliability Engineering Suite with Incident Reincarnation and Auto-PostMortems.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-[#0B0F19] text-gray-100 antialiased">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Nav />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
