"use client";

import Sidebar from "@/components/common/Sidebar";
import { FC, PropsWithChildren, useEffect } from "react";
import CommonHeader from "@/components/common/Header";
import { usePathname, useRouter } from "next/navigation";
import { useStaff } from "@/hooks/useStaff";
import { canAccessPath } from "@/constants/access";

const MainLayout: FC<PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: staff } = useStaff();

  // Page guard from the server's view of this account (the edge middleware only has the token's
  // role claim). If the role changed or the URL was typed by hand, go to the access-denied page
  // instead of rendering a page whose APIs will 403. Not a security boundary - the APIs enforce it.
  const allowed = !staff || canAccessPath(pathname, staff.permissions);
  useEffect(() => {
    if (staff && !allowed) router.replace("/access-denied");
  }, [staff, allowed, router]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="grid grid-cols-12">
        <div className="col-span-2">
          <Sidebar />
        </div>
        <div className={"h-full bg-white col-span-10"}>
          <div className="h-[10vh] w-full">
            <CommonHeader />
          </div>
          <div
            className={
              "w-full bg-background rounded-tl-[50px] h-[90vh] overflow-y-auto"
            }
          >
            {allowed ? children : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
