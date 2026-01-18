
import React from 'react';
import styled from 'styled-components';

const FiltersWrapper = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  align-items: center;
`;

const Select = styled.select`
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.chartBorder};
  background-color: ${({ theme }) => theme.body};
  color: ${({ theme }) => theme.text};
`;

const DatePickerWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;

const DateInput = styled.input`
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
            <DatePickerWrapper>
                <label htmlFor="fromDate">From:</label>
                <DateInput type="date" id="fromDate" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} />
                <label htmlFor="toDate">To:</label>
                <DateInput type="date" id="toDate" name="toDate" value={filters.toDate} onChange={handleFilterChange} />
            </DatePickerWrapper>
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

