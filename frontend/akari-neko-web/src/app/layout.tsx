import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import { OnlineUsersProvider } from "@/contexts/OnlineUsersContext";
import { MessageNotificationProvider } from "@/contexts/MessageNotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "AkariNeko",
  description: "Cute Japanese learning app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            <OnlineUsersProvider>
              <MessageNotificationProvider>{children}</MessageNotificationProvider>
            </OnlineUsersProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
