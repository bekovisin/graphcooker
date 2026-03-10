import type { Metadata } from "next";
import { Inter, Roboto, Montserrat, Shantell_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

const shantellSans = Shantell_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-shantell",
});

export const metadata: Metadata = {
  title: "GraphCooker | Data Visualization",
  description: "Create beautiful data visualizations",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${roboto.variable} ${montserrat.variable} ${shantellSans.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fafafa',
              border: '1px solid #27272a',
              borderRadius: '10px',
              fontSize: '13px',
              padding: '12px 16px',
            },
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
