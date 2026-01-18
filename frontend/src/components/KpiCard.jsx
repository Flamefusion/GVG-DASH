
import React from 'react';
import styled from 'styled-components';

const CardWrapper = styled.div`
  background-color: ${({ theme }) => theme.kpiCard};
  border-radius: 8px;
  padding: 1.5rem;
  color: ${({ theme }) => theme.text};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
  }
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  text-transform: uppercase;
`;

const Value = styled.p`
  margin: 0.5rem 0 0;
  font-size: 2.5rem;
  font-weight: 700;
`;

const KpiCard = ({ title, value, onClick }) => {
    return (
        <CardWrapper onClick={onClick}>
            <Title>{title}</Title>
            <Value>{value}</Value>
        </CardWrapper>
    );
};

export default KpiCard;
