import { redirect } from "next/navigation";
import { getTreasurerSession } from "@/lib/auth";
import TreasurerLoginForm from "@/components/treasurer-login-form";

export default async function TreasurerLoginPage() 
  {
    if (await getTreasurerSession()) {redirect("/treasurer");}
  
    return (<main className="utility-shell"> <TreasurerLoginForm /> </main>);
  }
