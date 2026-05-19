import "./globals.css";

export const metadata = {
  title: "Guru Screener",
  description: "Qullamaggie / Minervini / Stockbee Scanner",
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
