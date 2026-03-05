import CreateRoomForm from "@/components/form/CreateRoomForm";

export default function Home() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen p-6 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0,transparent_50%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-4">
            trace<span className="text-zinc-600">.ly</span>
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
            Secure, real-time location sharing. Accessible only via your
            temporary link.
          </p>
        </div>

        <div className="w-full p-1 bg-white/5 border border-zinc-600 rounded-3xl shadow-2xl backdrop-blur-md">
          <div className="bg-zinc-950/80 rounded-[22px] p-6 sm:p-8">
            <CreateRoomForm />
          </div>
        </div>
      </div>
    </main>
  );
}
