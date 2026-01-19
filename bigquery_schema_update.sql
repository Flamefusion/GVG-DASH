CREATE OR REPLACE TABLE `production-dashboard-482014.dashboard_data.master_station_data`
(
    vqc_inward_date STRING,
    serial_number STRING NOT NULL,
    vqc_status STRING,
    vqc_reason STRING,
    ft_inward_date STRING,
    ft_status STRING,
    ft_reason STRING,
    cs_status STRING,
    cs_reason STRING,
    size STRING,
    sku STRING,
    ctpf_mo STRING,
    air_mo STRING,
    vendor STRING,
    last_updated_at DATETIME
);