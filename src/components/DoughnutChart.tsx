import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  title: string;
  labels: string[];
  data: number[];
  backgroundColor: string[];
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  title,
  labels,
  data,
  backgroundColor,
}) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
    },
    cutout: '70%',
  };

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div style={{ height: '300px' }}>
        <Doughnut options={options} data={chartData} />
      </div>
    </div>
  );
};
