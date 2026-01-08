import { AppShell } from "@/components/shell/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell mode="demo">{children}</AppShell>;
}
