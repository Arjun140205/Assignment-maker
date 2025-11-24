import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context/AppContext";
import { NotificationProvider } from "@/lib/context/NotificationContext";
import NotificationContainer from "@/components/Dashboard/NotificationContainer";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Handwritten Assignment Generator",
  description: "Transform your assignments into handwritten documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <NotificationProvider>
            <AppProvider>
              {children}
              <NotificationContainer />
            </AppProvider>
          </NotificationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
