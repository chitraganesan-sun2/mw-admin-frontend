import { Table as AntTable } from "antd";
import { useEffect, useState } from "react";

interface TableProps {
  data: any;
  loading?: boolean;
  pagination?: any;
  onChange?: (pagination: any, filters?: any, sorter?: any) => void;
  columns?: any;
  onRow?: (record: any, index?: number) => any;
  handleSeeMoreDetails?: (id: string) => void;
  handleSeePost?: (id: string) => void;
  handleDelete?: (id: string) => void;
  rootClassName?: string;
  rowKey?: string | ((record: any) => string);
}

// Different admin pages feed this table rows keyed by different id fields
// (volunteer_id, learner_id, report_id, ...). Fall through the common ones so
// antd always gets a stable, unique key and React stops warning.
const KEY_FIELDS = [
  "id", "key", "volunteer_id", "learner_id", "report_id", "reportId",
  "application_id", "donation_id", "link_id", "match_id", "comment_id",
  "post_id", "resource_id", "category_id", "docId",
];
const resolveRowKey = (record: any): string => {
  for (const f of KEY_FIELDS) {
    if (record?.[f] != null) return String(record[f]);
  }
  return JSON.stringify(record);
};

const Table: React.FC<TableProps> = ({
  data,
  loading,
  pagination,
  onChange,
  columns,
  onRow,
  rootClassName,
  rowKey,
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
          showQuickJumper: false,
          ...pagination,
        }}
        onChange={onChange}
        onRow={onRow}
        rowKey={rowKey ?? resolveRowKey}
        showSorterTooltip={false}
        sticky
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default Table;
