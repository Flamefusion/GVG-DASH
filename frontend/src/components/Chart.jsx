
import React, { useState } from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';

const ChartWrapper = styled.div`
  margin-top: 2rem;
  background-color: ${({ theme }) => theme.kpiCard};
  padding: 2rem;
  border-radius: 8px;
`;

const ToggleWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
`;

const ToggleButton = styled.button`
  background-color: ${({ theme, active }) => (active ? theme.header : theme.body)};
  color: ${({ theme, active }) => (active ? 'white' : theme.text)};
  border: 1px solid ${({ theme }) => theme.header};
  padding: 0.5rem 1rem;
  cursor: pointer;
  &:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  &:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
`;

const vqcData = [
  { name: 'SKU A', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'SKU B', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'SKU C', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'SKU D', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'SKU E', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'SKU F', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'SKU G', uv: 3490, pv: 4300, amt: 2100 },
];

const ftData = [
  { name: 'SKU A', uv: 2000, pv: 2400, amt: 2400 },
  { name: 'SKU B', uv: 1000, pv: 1398, amt: 2210 },
  { name: 'SKU C', uv: 5000, pv: 9800, amt: 2290 },
  { name: 'SKU D', uv: 1780, pv: 3908, amt: 2000 },
  { name: 'SKU E', uv: 2890, pv: 4800, amt: 2181 },
  { name: 'SKU F', uv: 3390, pv: 3800, amt: 2500 },
  { name: 'SKU G', uv: 490, pv: 4300, amt: 2100 },
];

const Chart = () => {
    const [activeChart, setActiveChart] = useState('vqc');

    const data = activeChart === 'vqc' ? vqcData : ftData;
    const title = activeChart === 'vqc' ? 'VQC WIP SKU WISE' : 'FT WIP SKU WISE';

    return (
        <ChartWrapper>
            <ToggleWrapper>
                <ToggleButton active={activeChart === 'vqc'} onClick={() => setActiveChart('vqc')}>
                    VQC WIP
                </ToggleButton>
                <ToggleButton active={activeChart === 'ft'} onClick={() => setActiveChart('ft')}>
                    FT WIP
                </ToggleButton>
            </ToggleWrapper>
            <h3 style={{ textAlign: 'center' }}>{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pv" stroke="#8884d8" name="PV" >
                        <Label
                            value="PV"
                            position="insideBottom"
                            dy={10}
                        />
                    </Line>
                    <Line type="monotone" dataKey="uv" stroke="#82ca9d" name="UV" >
                         <Label
                            value="UV"
                            position="insideBottom"
                            dy={10}
                        />
                    </Line>
                </LineChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};

export default Chart;
