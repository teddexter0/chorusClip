import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ChorusClip - Loop Your Favorite Song Moments",
  description: "Create and share loops of your favorite parts of any YouTube song. Perfect for worship, study, and workouts.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}