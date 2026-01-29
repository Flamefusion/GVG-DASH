CREATE OR REPLACE TABLE `production-dashboard-482014.dashboard_data.rt_conversion_data`
( 
    vqc_inward_date DATE,
    serial_number STRING NOT NULL,
    vqc_status STRING,
    vqc_reason STRING,
    ft_inward_date DATE,
    ft_status STRING,
    ft_reason STRING,
    cs_comp_date DATE,
    cs_status STRING,
    cs_reason STRING,
    size STRING,
    sku STRING,
    ctpf_po STRING,
    air_mo STRING,
    last_updated_at DATETIME
);