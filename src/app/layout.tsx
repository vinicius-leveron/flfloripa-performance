import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/shared/components/ui/sonner";

export const metadata: Metadata = {
  title: "FLFloripa Performance",
  description: "Plataforma de gestão de performance — Fundação Logosófica de Florianópolis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Pular para conteúdo
        </a>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
