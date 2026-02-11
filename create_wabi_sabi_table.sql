CREATE TABLE IF NOT EXISTS `production-dashboard-482014.dashboard_data.wabi_sabi_data` (
    inward_date DATE,
    serial_number STRING NOT NULL,
    size STRING,
    sku STRING,
    pcb STRING,
    mo_nmber STRING,
    ws_status STRING,
    ws_reason STRING,
    cs_comp_date DATETIME,
    cs_status STRING,
    cs_reason STRING,
    last_updated_time DATETIME
);