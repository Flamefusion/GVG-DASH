
import React from 'react';
import styled from 'styled-components';
import { CgSun } from "react-icons/cg";
import { HiMoon } from "react-icons/hi";

const HeaderWrapper = styled.header`
  background-color: ${({ theme }) => theme.header};
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
`;

const ToggleButton = styled.button`
    cursor: pointer;
    height: 40px;
    width: 40px;   
    border-radius: 50%;
    border: none;
    background-color: ${props => props.theme.toggleBorder};
    color: ${props => props.theme.text};
    &:focus {
        outline: none;
    }
    transition: all .5s ease;
`;

const Header = ({ theme, toggleTheme }) => {
    const icon = theme === 'light' ? <HiMoon size={30} /> : <CgSun size={30} />;
    return (
        <HeaderWrapper>
            <Title>FQC DASHBOARD</Title>
            <ToggleButton onClick={toggleTheme}>
                {icon}
            </ToggleButton>
        </HeaderWrapper>
    );
};

export default Header;
