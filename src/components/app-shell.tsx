import { AppSidebar } from "./app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppSidebar />
      <main className="md:pl-60 pt-20 px-4 md:px-8 pb-16">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
