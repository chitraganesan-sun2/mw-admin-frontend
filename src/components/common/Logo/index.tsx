import { LogoIcon } from "@/assets/icons";
import { cn } from "@/utils/merge-class";

type LogoProps = {
  className?: string;
};

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2 rounded-lg", className)}>
      <LogoIcon />
      <h3 className="text-xl font-medium">
        MelodyWings<sup className="text-[0.65em] font-normal -top-[0.3em]">®</sup>
      </h3>
    </div>
  );
};

export default Logo;
