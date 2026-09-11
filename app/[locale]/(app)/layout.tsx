import { AppShell } from "@/components/AppShell";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full">
      <WorkspaceProvider>
        <AppShell>{children}</AppShell>
      </WorkspaceProvider>
    </div>
  );
}
