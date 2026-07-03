export default function DashboardLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-3" aria-busy>
      <div className="h-40 rounded-3xl bg-accent" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-2xl bg-accent" />
        <div className="h-20 rounded-2xl bg-accent" />
      </div>
      <div className="h-56 rounded-2xl bg-accent" />
      <div className="h-24 rounded-2xl bg-accent" />
    </div>
  );
}
