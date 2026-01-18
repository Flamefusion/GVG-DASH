
import React, { useState, useEffect } from 'react';
import styled, { keyframes, useTheme } from 'styled-components';
import KpiCard from '../components/KpiCard';
import Modal from '../components/Modal';
import Chart from '../components/Chart';
import Filters from '../components/Filters';
import { FiArrowDownCircle, FiCheckCircle, FiGitPullRequest, FiXCircle, FiArchive, FiLoader } from 'react-icons/fi';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PageWrapper = styled.div`
  animation: ${fadeIn} 0.5s ease-in-out;
`;


const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1.5rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const HomePage = () => {
    const theme = useTheme();
    const [modal, setModal] = useState({ isOpen: false, data: null });
    const [filters, setFilters] = useState({ fromDate: '', toDate: '', size: 'all', sku: 'all' });

    const initialKpiData = [
        { title: 'Total Inward', value: 1250, icon: <FiArrowDownCircle />, color: theme.kpi.totalInward },
        { title: 'QC Accepted', value: 1100, icon: <FiCheckCircle />, color: theme.kpi.qcAccepted },
        { title: 'Testing Accepted', value: 1050, icon: <FiGitPullRequest />, color: theme.kpi.testingAccepted },
        { title: 'Total Rejected', value: 150, icon: <FiXCircle />, color: theme.kpi.totalRejected },
        { title: 'Moved to Inventory', value: 1000, icon: <FiArchive />, color: theme.kpi.movedToInventory },
        { title: 'Work in Progress', value: 50, icon: <FiLoader />, color: theme.kpi.workInProgress },
    ];
    
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
        <PageWrapper>
            <Filters filters={filters} setFilters={setFilters} />
            <KpiGrid>
                {kpiData.map((kpi, index) => (
                    <KpiCard
                        key={index}
                        title={kpi.title}
                        value={kpi.value}
                        icon={kpi.icon}
                        color={kpi.color}
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
        </PageWrapper>
    );
};

export default HomePage;

