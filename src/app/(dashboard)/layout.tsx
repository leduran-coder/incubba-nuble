import { auth } from "@/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const usuario = session?.user
    ? { nombre: session.user.name ?? "", rol: session.user.rol }
    : null;

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar usuario={usuario} />
      <main className="flex-1 p-6 md:p-8 max-w-[1400px] mx-auto w-full">{children}</main>
    </div>
  );
}
