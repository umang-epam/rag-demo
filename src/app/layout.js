import { Geist, Geist_Mono } from "next/font/google";
import "@epam/uui-components/styles.css";
import "@epam/promo/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { UuiProvider } from "./UuiProvider";

export const metadata = {
  title: "RAG Demo",
  description: "RAG vs No-RAG Demo Application",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="uui-theme-promo min-h-full flex flex-col bg-[#060606] text-zinc-100 antialiased">
        <UuiProvider>{children}</UuiProvider>
      </body>
    </html>
  );
}
