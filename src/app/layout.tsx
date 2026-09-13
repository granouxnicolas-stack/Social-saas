import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social SaaS",
  description: "Gestion et programmation des publications sociales pour TPE et commerces.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
