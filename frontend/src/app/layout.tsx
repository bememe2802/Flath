import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import AppProvider from "@/src/app/app-provider";
import NavigationBar from "@/src/components/NavigationBar";
import { ThemeProvider } from "@/src/components/theme-provider";
import { serverApiRequest } from "@/src/lib/server-api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flath",
  description: "Flow where the paths goes",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialProfile = await serverApiRequest
    .myProfile({ requireAuth: false, redirectOnUnauthorized: false })
    .then((response) => response.result)
    .catch(() => null);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider initialProfile={initialProfile}>
            <NavigationBar />
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
