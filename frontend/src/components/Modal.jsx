
import React from 'react';
import styled from 'styled-components';
import Papa from 'papaparse';

const ModalWrapper = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ModalContent = styled.div`
    background-color: ${({ theme }) => theme.body};
    color: ${({ theme }) => theme.text};
    padding: 2rem;
    border-radius: 8px;
    width: 80%;
    max-width: 800px;
    position: relative;
`;

const CloseButton = styled.span`
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.5rem;
    cursor: pointer;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    th, td {
        border: 1px solid ${({ theme }) => theme.chartBorder};
        padding: 0.5rem;
        text-align: left;
    }
`;

const DownloadButton = styled.button`
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: ${({ theme }) => theme.header};
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
`;

const Modal = ({ isOpen, data, onClose }) => {
    if (!isOpen) return null;

    const handleDownload = () => {
        const csv = Papa.unparse(data.rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `${data.title.replace(/\s+/g, '_').toLowerCase()}_data.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <ModalWrapper>
            <ModalContent>
                <CloseButton onClick={onClose}>&times;</CloseButton>
                <h2>{data.title}</h2>
                <Table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>SKU</th>
                            <th>Size</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.slice(0, 100).map(row => (
                            <tr key={row.id}>
                                <td>{row.id}</td>
                                <td>{row.sku}</td>
                                <td>{row.size}</td>
                                <td>{row.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <DownloadButton onClick={handleDownload}>Download CSV</DownloadButton>
            </ModalContent>
        </ModalWrapper>
    );
};

export default Modal;
