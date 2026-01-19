export const metadata = {
  title: 'AI Study Notes Generator',
  description: 'Generate structured study notes with Pydantic AI + OpenRouter',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
