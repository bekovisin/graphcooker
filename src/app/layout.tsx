import type { Metadata } from "next";
import { Inter, Roboto, Montserrat, Outfit, Shantell_Sans } from "next/font/google";
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

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const shantellSans = Shantell_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-shantell",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://graphcooker.com"),
  title: {
    default: "GraphCooker — Cook Your Data Into Stunning Visualizations",
    template: "%s | GraphCooker",
  },
  description:
    "Turn raw spreadsheets into beautiful, interactive charts — bar, line, pie and more. No design skills needed. Free during beta with unlimited access to all premium features.",
  keywords: [
    "data visualization",
    "charts",
    "graphs",
    "bar chart",
    "line chart",
    "pie chart",
    "interactive charts",
    "dashboard",
    "free data visualization tool",
    "chart maker",
    "graph maker",
    "spreadsheet to chart",
    "data to chart",
    "export SVG PNG PDF",
    "GraphCooker",
  ],
  authors: [{ name: "GraphCooker Team" }],
  creator: "GraphCooker",
  publisher: "GraphCooker",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://graphcooker.com",
    siteName: "GraphCooker",
    title: "GraphCooker — Cook Your Data Into Stunning Visualizations",
    description:
      "Turn raw spreadsheets into beautiful, interactive charts. Free during beta with unlimited access.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GraphCooker — Data Visualization Made Easy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GraphCooker — Cook Your Data Into Stunning Visualizations",
    description:
      "Turn raw spreadsheets into beautiful, interactive charts. Free during beta.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/graphcooker-icon.svg",
  },
  alternates: {
    canonical: "https://graphcooker.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "GraphCooker",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Turn raw spreadsheets into beautiful, interactive charts — bar, line, pie and more. No design skills needed.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "Free during beta",
              },
              featureList: [
                "Beautiful Charts (Bar, Line, Pie)",
                "Customizable Color Palettes",
                "Pixel-Perfect SVG, PNG, PDF Export",
                "HTML Embed Export",
                "Template Library",
                "Folder Management",
                "Real-time Preview",
                "Bulk Export",
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${roboto.variable} ${montserrat.variable} ${outfit.variable} ${shantellSans.variable} font-sans antialiased`}>
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
