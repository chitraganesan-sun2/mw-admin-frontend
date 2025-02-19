import React from "react";
import { Spin } from "antd";

const Loader = ({ size }: any) => {
    return (
        <div className="h-full w-full flex-center">
            <Spin size={size} className="custom-ant-spin" />
        </div>
    );
};

export default Loader;