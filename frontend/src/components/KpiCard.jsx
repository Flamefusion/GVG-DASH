
import React from 'react';
import styled from 'styled-components';

const CardWrapper = styled.div`
  background-color: ${props => props.color};
  border-radius: 8px;
  padding: 1.5rem;
  color: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  display: flex;
  align-items: center;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const IconWrapper = styled.div`
    font-size: 3rem;
    margin-right: 1.5rem;
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const Value = styled.p`
  margin: 0.25rem 0 0;
  font-size: 2.25rem;
  font-weight: 700;
`;

const KpiCard = ({ title, value, icon, onClick, color }) => {
    return (
        <CardWrapper onClick={onClick} color={color}>
            <IconWrapper>
                {icon}
            </IconWrapper>
            <ContentWrapper>
                <Title>{title}</Title>
                <Value>{value}</Value>
            </ContentWrapper>
        </CardWrapper>
    );
};

export default KpiCard;
