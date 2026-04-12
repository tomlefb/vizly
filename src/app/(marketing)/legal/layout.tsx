export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 lg:px-8 py-16 lg:py-24">
      {children}
    </main>
  )
}
