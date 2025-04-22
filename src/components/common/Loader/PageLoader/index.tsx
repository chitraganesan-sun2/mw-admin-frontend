import { Spin } from 'antd'
import React from 'react'

function PageLoader({ size = "large" }: { size?: any }) {
  return (
    <div className="h-[100vh] w-[100vw] flex-center">
        <Spin size={size} className="custom-ant-spin" />
    </div>
  )
}

export default PageLoader