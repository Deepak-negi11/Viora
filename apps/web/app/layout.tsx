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

export const metadata: Metadata = {
  applicationName: "Viora",
  title: {
    default: "Viora — Work together. Feel present.",
    template: "%s · Viora",
  },
  description: "A spatial workspace where remote teams can walk, meet, chat, and talk naturally.",
  icons: {
    icon: [{ url: "/viora-mark.svg", type: "image/svg+xml" }],
    shortcut: "/viora-mark.svg",
    apple: "/viora-mark.svg",
  },
  openGraph: {
    title: "Viora — Work together. Feel present.",
    description: "A spatial workspace where remote teams can walk, meet, chat, and talk naturally.",
    type: "website",
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
