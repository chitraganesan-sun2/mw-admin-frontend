"use client"

import DashBoardCard from "@/components/dashboard/Card";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";

type DashBoardCardType = {
  title: string;
  endpoint: string;
  chart: "area" | "donut";
}

const Dashboard = () => {
  const pathname = usePathname();
  const { setHeaderOptions } = useComponentStore();

  useEffect(() => {
    setHeaderOptions({
      title: "Dashboard",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions]);

  const cards: DashBoardCardType[] = [{
    title: "Total Volunteers",
    endpoint: "",
    chart: "area",
  }, {
    title: "Total Learners",
    endpoint: "",
    chart: "area",
  }, {
    title: "Total Class Hours",
    endpoint: "",
    chart: "area",
  }, {
    title: "Reports",
    endpoint: "",
    chart: "donut",
  }]

  return (
    <div className="w-full h-full p-10">
      <div className="grid grid-cols-2 gap-5 py-10">
        { cards.map(card => (
          <div className="col-span-1">
            <DashBoardCard {...card} />
          </div>
        )) }
      </div>
    </div>
  );
};

export default Dashboard;
