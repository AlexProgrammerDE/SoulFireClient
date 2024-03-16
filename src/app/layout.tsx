import type {Metadata, Viewport} from "next";
import {Inter as FontSans} from "next/font/google";
import "./globals.css";
import {cn} from "@/lib/utils";
import {ReactNode} from "react";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

// noinspection JSUnusedGlobalSymbols
export const metadata: Metadata = {
    metadataBase: new URL("https://app.soulfiremc.com"),
    title: {
        default: "SoulFire",
        template: "%s | SoulFire",
    },
    description: "Frontend client for SoulFire.",
    applicationName: "SoulFire",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://app.soulfiremc.com",
    },
    formatDetection: {
        telephone: false,
        date: false,
        address: false,
        email: false,
        url: false,
    },
    icons: {
        icon: "/favicon.ico",
    },
    manifest: "/manifest.json",
};

// noinspection JSUnusedGlobalSymbols
export const viewport: Viewport = {
    themeColor: "#3289BF",
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body
            className={cn(
                "min-h-screen bg-background font-sans antialiased",
                fontSans.variable
            )}>
        {children}
        </body>
        </html>
    );
}
