import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Smart Wallet Demo",
  description:
    "Email login, a smart wallet with EIP-7702, and gas paid by the app. Built on Alchemy Wallet APIs and Privy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
