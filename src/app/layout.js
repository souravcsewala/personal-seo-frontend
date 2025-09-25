import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "../context/AppContext";
import { ReduxProvider } from "../redux/provider";
import AuthBootstrap from "../components/AuthBootstrap";
import { buildMeta } from "../utils/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = buildMeta({});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <AppProvider>
            <AuthBootstrap />
            {children}
          </AppProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
