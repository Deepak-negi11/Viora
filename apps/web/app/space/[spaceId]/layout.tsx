import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace",
  description: "A private Viora workspace.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function SpaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
