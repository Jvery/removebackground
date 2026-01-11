export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
          removebackground
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Remove backgrounds instantly — 100% in your browser
        </p>
        
        {/* Upload zone will be implemented here */}
        <div className="border-2 border-dashed border-muted-foreground/30 rounded-2xl p-12 hover:border-primary/50 transition-colors cursor-pointer">
          <p className="text-muted-foreground">
            Drop an image here, paste from clipboard, or click to upload
          </p>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          🔒 Your images never leave your device
        </p>
      </div>
    </main>
  )
}
