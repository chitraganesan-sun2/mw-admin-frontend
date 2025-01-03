import React from 'react';
import ReactApexChart from 'react-apexcharts';

const DonutChart: React.FC = () => {
    const data: number[] = [82, 46];
    const labels: string[] = ['Community', 'Resources'];

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'donut',
            toolbar: {
                show: false,
            },
        },
        labels: labels,
        legend: {
            show: true,
            position: 'right',
            fontSize: '14px',
            floating: false,
            offsetY: 80,
            offsetX: 0,
        },
        colors: ['#6366F1', '#10B981'],
        plotOptions: {
            pie: {
                donut: {
                    size: '25%',
                },
                expandOnClick: false,
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            width: 1,
        },
    };

    const series: number[] = data;

    return (
        <div className="max-w-[700px] max-h-[700px] flex-center">
            <ReactApexChart options={options} series={series} type="donut" height={300} />
        </div>
    );
};

export default DonutChart;