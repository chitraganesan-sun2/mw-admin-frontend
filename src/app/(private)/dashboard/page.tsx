"use client"

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";

const Dashboard = () => {
  const pathname = usePathname();
  const { setHeaderOptions } = useComponentStore();

  useEffect(() => {
    setHeaderOptions({
      title: "Dashboard",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions]);

  return (
    <div className="w-full h-full">
      <h1>Dashboard</h1>
    </div>
  );
};

export default Dashboard;
