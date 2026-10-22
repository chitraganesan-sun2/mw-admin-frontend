"use client";

import Link from "next/link";
import Logo from "@/components/common/Logo";
import Button from "@/components/common/Button";
import { useStaff } from "@/hooks/useStaff";
import { safeHomePath } from "@/constants/access";

// Shown when a signed-in account opens a page its role may not use. The server decides what the
// account may use (useStaff -> /admin/auth/me); this page only explains and points back home.
export default function AccessDenied() {
  const { data: staff } = useStaff();
  const home = safeHomePath(staff?.home_path, staff?.role);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-white">
      <Link href={home}>
        <Logo />
      </Link>
      <div className="flex flex-col gap-2 max-w-md">
        <h1 className="text-3xl md:text-4xl font-medium">Access denied</h1>
        <p className="text-base md:text-lg text-gray-600">
          Your account doesn&apos;t have permission to open this page. If you think you should have access, please
          ask an admin.
        </p>
      </div>
      <Link href={home}>
        <Button title="Back to my dashboard" btnVariant="primary" />
      </Link>
    </div>
  );
}
