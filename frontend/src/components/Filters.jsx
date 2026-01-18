
import React from 'react';
import styled from 'styled-components';

const FiltersWrapper = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.chartBorder};
  background-color: ${({ theme }) => theme.body};
  color: ${({ theme }) => theme.text};
`;

const Filters = ({ filters, setFilters }) => {
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <FiltersWrapper>
            <Select name="date" value={filters.date} onChange={handleFilterChange}>
                <option value="all">All Dates</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
            </Select>
            <Select name="size" value={filters.size} onChange={handleFilterChange}>
                <option value="all">All Sizes</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
            </Select>
            <Select name="sku" value={filters.sku} onChange={handleFilterChange}>
                <option value="all">All SKUs</option>
                <option value="SKU-A">SKU-A</option>
                <option value="SKU-B">SKU-B</option>
                <option value="SKU-C">SKU-C</option>
            </Select>
        </FiltersWrapper>
    );
};

export default Filters;
