import { Poppins } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import QueryProvider from "@/providers/QueryWrapper";
import { Suspense } from "react";
import PageLoader from "@/components/common/Loader/PageLoader";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Melody Wings Admin",
  description: "Melody Wings Admin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Suspense fallback={<PageLoader />}>
          <QueryProvider>{children}</QueryProvider>
        </Suspense>
      </body>
    </html>
  );
}
