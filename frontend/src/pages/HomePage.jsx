
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import KpiCard from '../components/KpiCard';
import Modal from '../components/Modal';
import Chart from '../components/Chart';
import Filters from '../components/Filters';

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;
const initialKpiData = [
    { title: 'Total Inward', value: 1250 },
    { title: 'QC Accepted', value: 1100 },
    { title: 'Testing Accepted', value: 1050 },
    { title: 'Total Rejected', value: 150 },
    { title: 'Moved to Inventory', value: 1000 },
    { title: 'Work in Progress', value: 50 },
];

const HomePage = () => {
    const [modal, setModal] = useState({ isOpen: false, data: null });
    const [filters, setFilters] = useState({ date: 'all', size: 'all', sku: 'all' });
    const [kpiData, setKpiData] = useState(initialKpiData);

    useEffect(() => {
        // In a real app, you would fetch data here based on the filters
        // For now, we'll just simulate a data change
        const newKpiData = initialKpiData.map(kpi => ({
            ...kpi,
            value: Math.floor(Math.random() * 2000),
        }));
        setKpiData(newKpiData);
    }, [filters]);


    const openModal = (title) => {
        // In a real app, you would fetch data here based on the title and filters
        const dummyData = Array(100).fill(null).map((_, i) => ({
            id: i,
            sku: `SKU-${Math.floor(Math.random() * 100)}`,
            size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
            date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString(),
        }));
        setModal({ isOpen: true, data: {title, rows: dummyData} });
    };

    const closeModal = () => {
        setModal({ isOpen: false, data: null });
    };

    return (
        <div>
            <Filters filters={filters} setFilters={setFilters} />
            <KpiGrid>
                {kpiData.map((kpi, index) => (
                    <KpiCard
                        key={index}
                        title={kpi.title}
                        value={kpi.value}
                        onClick={() => openModal(kpi.title)}
                    />
                ))}
            </KpiGrid>

            <Modal
                isOpen={modal.isOpen}
                onClose={closeModal}
                data={modal.data}
            />

            <Chart />
        </div>
    );
};

export default HomePage;

