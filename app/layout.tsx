import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TanstackProvider from "../providers/TanstackProvider"; 
import { ClerkProvider, SignIn, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Econoeasy - Gestor de Gastos",
  icons: {
    icon: "/Econoeasy.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-br">
        <body className={inter.className}>
           {/* SE NÃO ESTIVER LOGADO: Mostra tela de Login no meio da tela */}
           <SignedOut>
             <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <SignIn routing="hash" />
             </div>
           </SignedOut>

           {/* SE ESTIVER LOGADO: Mostra o App + Botão de Perfil */}
           <SignedIn>
              <TanstackProvider>
                {/* Barra de Topo Fixa com o Botão de Sair */}
                <header className="fixed top-0 right-0 p-4 z-50">
                    <UserButton />
                </header>
                
                {children}
              </TanstackProvider>
           </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}