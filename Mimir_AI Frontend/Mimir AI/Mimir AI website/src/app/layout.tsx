import type { Metadata } from "next";
import { Inter, Calistoga} from 'next/font/google';
import "./globals.css";
import { twMerge } from "tailwind-merge";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: "--font-sans" });
const calistoga = Calistoga({
  subsets: ['latin'],
  variable: "--font-serif",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "MimirAi",
  description: "Created by Team Maverick",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
  <body className={twMerge(
    inter.variable,
    calistoga.variable,
    "bg-gradient-to-r from-gray-800 to-gray-900 text-white antialiased font-sans")}>

            <AuthProvider>
              {children}
            </AuthProvider>
      <Toaster position="top-center" />
      </body>
    </html>
  );
}
