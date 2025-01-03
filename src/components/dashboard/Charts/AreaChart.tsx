import React from 'react';
import ReactApexChart from 'react-apexcharts';

const AreaChart: React.FC = () => {
    const data: number[] = [1000, 1200, 1100, 1400, 1400, 2300, 2300];
    const labels: string[] = ['23 July', '24 July', '25 July', '26 July', '27 July', '28 July', '29 July'];

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'area',
            toolbar: { show: false },
        },
        stroke: {
            curve: 'smooth',
            width: 3,
        },
        xaxis: {
            categories: labels,
            labels: {
                show: false,
            },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { fontSize: '12px' },
            },
        },
        tooltip: {
            enabled: true,
            custom: ({ series, seriesIndex, dataPointIndex, w }: { 
                series: number[][]; 
                seriesIndex: number; 
                dataPointIndex: number; 
                w: any; 
            }) => {
                const value = series[seriesIndex][dataPointIndex];
                const date = w.config.xaxis.categories[dataPointIndex];
                return `
                  <div style="background-color: #fff; padding: 10px;">
                    <div>${date}</div>
                    <div>${value}</div>
                  </div>
                `;
            },
        },
        colors: ['#FF7A00'],
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'vertical',
                gradientToColors: ['#FF7A00'],
                stops: [0, 100],
                opacityFrom: 0.5,
                opacityTo: 0,
            },
        },
        dataLabels: { enabled: false },
    };

    const series: { name: string; data: number[] }[] = [
        {
            name: 'Value',
            data,
        },
    ];

    return (
        <div className='flex-center w-full h-full'>
            <div className='max-w-[700px] max-h-[700px]'>
                <ReactApexChart options={options} series={series} type="area" height={300} />
            </div>
        </div>
    );
};

export default AreaChart;