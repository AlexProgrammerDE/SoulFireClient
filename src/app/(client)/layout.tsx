"use client";

import {ReactNode} from "react";

export default function ClientLayout({
                                         children,
                                     }: Readonly<{
    children: ReactNode;
}>) {
    return (
        <>
            {children}
        </>
    );
}
