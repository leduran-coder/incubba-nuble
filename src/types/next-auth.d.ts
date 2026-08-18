import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: "admin" | "evaluador";
    } & DefaultSession["user"];
  }

  interface User {
    rol?: "admin" | "evaluador";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rol?: "admin" | "evaluador";
  }
}
