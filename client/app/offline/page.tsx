export default function OfflinePage() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white px-6 text-center"
      style={{
        backgroundColor: "#09090b",
        color: "#ffffff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        className="w-16 h-16 bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center rounded-none mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)] opacity-50 grayscale"
        style={{
          width: "64px",
          height: "64px",
          backgroundColor: "#18181b",
          border: "1px dashed #3f3f46",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          opacity: 0.5,
          filter: "grayscale(100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="trace.ly"
          style={{ width: "40px", height: "40px" }}
        />
      </div>

      <h1
        className="text-3xl font-extrabold tracking-tight mb-2 text-zinc-300"
        style={{
          fontSize: "1.875rem",
          fontWeight: 800,
          letterSpacing: "-0.025em",
          marginBottom: "8px",
          color: "#d4d4d8",
        }}
      >
        System Offline
      </h1>

      <p
        className="text-sm text-zinc-500 font-medium max-w-sm mb-8"
        style={{
          fontSize: "0.875rem",
          color: "#71717a",
          maxWidth: "24rem",
          marginBottom: "32px",
          lineHeight: 1.5,
        }}
      >
        Encrypted connection lost. Real-time tracking and map services are
        suspended until network is restored.
      </p>

      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        className="px-6 py-3 bg-white text-black font-bold text-sm rounded-none hover:bg-zinc-200 transition-colors border border-dashed border-zinc-300 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        style={{
          padding: "12px 24px",
          backgroundColor: "#ffffff",
          color: "#000000",
          fontWeight: "bold",
          fontSize: "0.875rem",
          textDecoration: "none",
          border: "1px dashed #d4d4d8",
          boxShadow: "0 0 15px rgba(255,255,255,0.1)",
        }}
      >
        Re-establish Connection
      </a>
    </div>
  );
}
