import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TanstackProvider from "../providers/TanstackProvider"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Econoeasy - Gestor de Gastos",
  description: "Seu gerenciador financeiro inteligente",
  icons: {
    icon: "/Econoeasy.png",
    shortcut: "/Econoeasy.png",
    apple: "/Econoeasy.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <TanstackProvider>
          {children}
        </TanstackProvider>
      </body>
    </html>
  );
}