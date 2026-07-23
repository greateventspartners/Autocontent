export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-4 w-64 bg-white/5 rounded-lg mt-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl" />
            </div>
            <div className="h-8 w-20 bg-white/5 rounded-lg" />
            <div className="h-4 w-24 bg-white/5 rounded-lg mt-2" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="mb-6">
            <div className="h-5 w-40 bg-white/5 rounded-lg" />
            <div className="h-3 w-48 bg-white/5 rounded-lg mt-1" />
          </div>
          <div className="h-[280px] bg-white/[0.02] rounded-xl" />
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-6">
            <div className="h-5 w-32 bg-white/5 rounded-lg" />
          </div>
          <div className="h-[200px] bg-white/[0.02] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
