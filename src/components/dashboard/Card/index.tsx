import AreaChart from "../Charts/AreaChart";
import DonutChart from "../Charts/DonutChart";

type DashBoardCardProps = {
    title: string;
    endpoint: string;
    chart: "area" | "donut";
}

function DashBoardCard({ title, endpoint, chart }: DashBoardCardProps) {
  return (
    <div className="h-full w-full min-h-[300px] bg-white rounded-2xl p-7">
        <h6 className="uppercase font-medium text-sm text-[#4F4F4F] mb-3">{title}</h6>
        <span className="text-black text-4xl font-semibold">7,000</span>
        <div className="flex-center">
          { chart === "area" ? 
          <AreaChart />
          : 
          <DonutChart />
           }
        </div>
    </div>
  )
}

export default DashBoardCard