import type { Metadata } from "next";
import { DM_Serif_Display, IBM_Plex_Mono, Manrope } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: "400",
});

const siteUrl = new URL("https://vioraa.tech");
const siteTitle = "Viora — Work together like you're in the same room";
const siteDescription = "A shared 2D spatial workspace where remote teams move together, talk by proximity, chat, and return to the same persistent room.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "Viora",
  title: {
    default: siteTitle,
    template: "%s · Viora",
  },
  description: siteDescription,
  keywords: ["spatial workspace", "remote teams", "virtual office", "2D workspace", "proximity chat", "team collaboration"],
  authors: [{ name: "Viora", url: siteUrl }],
  creator: "Viora",
  publisher: "Viora",
  category: "productivity",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/viora-mark.svg", type: "image/svg+xml" }],
    shortcut: "/viora-mark.svg",
    apple: "/viora-mark.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "Viora",
    locale: "en_US",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Viora spatial workspace for remote teams" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${ibmPlexMono.variable} ${dmSerif.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
