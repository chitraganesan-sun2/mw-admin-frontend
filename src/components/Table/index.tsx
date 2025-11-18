import { Table as AntTable } from "antd";
import { useEffect, useState } from "react";

interface TableProps {
  data: any;
  loading?: boolean;
  pagination?: any;
  onChange?: (pagination: any, filters?: any, sorter?: any) => void;
  columns?: any;
  handleSeeMoreDetails?: (id: string) => void;
  handleSeePost?: (id: string) => void;
  handleDelete?: (id: string) => void;
  rootClassName?: string;
}

const Table: React.FC<TableProps> = ({
  data,
  loading,
  pagination,
  onChange,
  columns,
  rootClassName,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={`w-full  h-full !font-poppins transition-opacity duration-500 ease-in-out overflow-hidden ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${rootClassName}`}
    >
      <AntTable
        className="!capitalize font-medium !font-poppins"
        dataSource={data}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          showQuickJumper: false,
        }}
        onChange={onChange}
        rowKey="id"
        showSorterTooltip={false}
        sticky
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default Table;
