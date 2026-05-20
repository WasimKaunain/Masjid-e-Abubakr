"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() 
  {
    const router = useRouter();

    async function logout() 
      {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }

    return ( <button className="pill-button pill-button--danger" onClick={logout}> Logout </button> );
  }
