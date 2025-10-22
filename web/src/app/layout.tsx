import type { Metadata } from "next";
import Script from "next/script"; // <-- 1. IMPORT SCRIPT
import Providers from "./providers";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "TeachAI Assistant",
  description: "Learning Management System powered by TeachAI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="app-container">
            <Header />
            <main className="app-main">{children}</main>
            <Footer />
          </div>
        </Providers>
        
        {/* 2. ADD RAZORPAY SCRIPT HERE */}
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
        />
      </body>
    </html>
  );
}