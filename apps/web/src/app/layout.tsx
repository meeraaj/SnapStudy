import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
    title: "SnapStudy — Photo-Note Study Tracker",
    description:
        "Upload photos of your handwritten notes, track weighted progress, and visualise exam countdowns.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
