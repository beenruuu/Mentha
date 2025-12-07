import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex bg-background text-foreground">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 bg-background">
        <div className="mb-12">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/mentha.svg"
              alt="Mentha"
              width={32}
              height={32}
              className="text-mentha"
            />
            <span className="text-xl font-bold">Mentha</span>
          </Link>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md space-y-8">
            {children}
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block w-1/2 relative bg-muted">
        <Image
          src="/mentha-preview.png"
          alt="Preview"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}
