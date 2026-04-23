import type { ReactNode } from "react";

import { LanguageProvider } from "../i18n";
import "../styles/global.css";
import { WalletProvider } from "../wallet/provider";

export const metadata = {
  title: "Escape from Delta",
  description: "On-chain PVE extraction raid demo"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <WalletProvider>{children}</WalletProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
