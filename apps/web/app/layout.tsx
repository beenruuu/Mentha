import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Next.js font optimization
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Dock } from "@/components/layout/Dock";
import { ProjectProvider } from "@/context/ProjectContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Mentha | AEO Intelligence Platform",
    description: "Advanced Answer Engine Optimization Dashboard",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <ProjectProvider>
                    <div className="container">
                        <Header />
                        <main>{children}</main>
                        <Dock />
                    </div>
                </ProjectProvider>
            </body>
        </html>
    );
}
