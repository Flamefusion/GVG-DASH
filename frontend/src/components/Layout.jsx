
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout = ({ theme, toggleTheme }) => {
    return (
        <div>
            <Header theme={theme} toggleTheme={toggleTheme} />
            <main style={{ padding: '2rem' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
