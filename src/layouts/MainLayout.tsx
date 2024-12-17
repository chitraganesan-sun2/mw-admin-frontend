"use client";

import Sidebar from "@/components/common/Sidebar";
import { FC, PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/merge-class";
import CommonHeader from "@/components/common/Header";

const MainLayout: FC<PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();

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
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
