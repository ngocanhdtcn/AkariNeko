import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import { OnlineUsersProvider } from "@/contexts/OnlineUsersContext";
import { MessageNotificationProvider } from "@/contexts/MessageNotificationContext";

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
    <html lang="vi">
      <body className="antialiased">
        <AuthProvider>
          <OnlineUsersProvider>
            <MessageNotificationProvider>{children}</MessageNotificationProvider>
          </OnlineUsersProvider>
        </AuthProvider>
      </body>
    </html>
  );
}