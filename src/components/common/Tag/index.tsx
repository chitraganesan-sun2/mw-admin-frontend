"use client";
import { Tag } from "antd";
import { BiX } from "react-icons/bi";

interface TagComponentProps {
  text: string | null;
  isClose?: boolean;
  onClose?: () => void;
  className?: string;
  icon?: any;
}

const TagComponent = ({
  text,
  isClose,
  onClose,
  className,
  icon,
}: TagComponentProps) => {
  return (
    <Tag
      closeIcon={false}
      onClose={isClose ? onClose : undefined}
      rootClassName={`${className}  font-poppins w-fit flex items-center gap-2 flex-row-reverse`}
      icon={
        isClose ? (
          <BiX
            onClick={onClose}
            className="text-black bg-white rounded-full active:scale-90 transition-all duration-300"
            size={14}
          />
        ) : undefined
      }
      className={`bg-background text-black border-background font-medium text-[0.8rem] capitalize rounded-full`}
    >
      {text} {icon ? icon : null}
    </Tag>
  );
};

export default TagComponent;
