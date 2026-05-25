import { EmptyState } from "@/components/EmptyState";
import { FilterControlsPanel } from "@/components/FilterControlsPanel";
import { Toolbar } from "@/components/Toolbar";

export function AppShell() {
  return (
    <div className="h-full flex flex-col bg-ctp-crust">
      <Toolbar />
      <main className="flex-1 relative min-h-0">
        <EmptyState />
        <FilterControlsPanel />
      </main>
    </div>
  );
}
