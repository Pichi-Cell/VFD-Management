-- Database Schema for VFD Management System
CREATE SCHEMA IF NOT EXISTS vfd;

-- Clients Table
CREATE TABLE IF NOT EXISTS vfd.clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VFD Models Table
CREATE TABLE IF NOT EXISTS vfd.vfd_models (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    power VARCHAR(50),
    input_voltage VARCHAR(50)
);

-- VFDs Table
CREATE TABLE IF NOT EXISTS vfd.vfds (
    id SERIAL PRIMARY KEY,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    internal_number VARCHAR(100),
    client_id INTEGER REFERENCES vfd.clients(id),
    model_id INTEGER REFERENCES vfd.vfd_models(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS vfd.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'technician',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repairs Table
CREATE TABLE IF NOT EXISTS vfd.repairs (
    id SERIAL PRIMARY KEY,
    vfd_id INTEGER REFERENCES vfd.vfds(id),
    technician_id INTEGER REFERENCES vfd.users(id),
    entry_date DATE DEFAULT CURRENT_DATE,
    type VARCHAR(50), -- 'Quote' or 'Approval'
    status VARCHAR(50) DEFAULT 'Received', -- 'Received', 'Testing', 'Disassembled', 'Cleaned', 'Measured', 'Diagnosed', 'Assembled', 'Finished'
    
    -- Entry Data
    age VARCHAR(50),
    run_hours INTEGER,
    connection_hours INTEGER,
    fault_history TEXT,
    reported_fault TEXT,
    
    -- Procedure Observations
    disassembly_obs TEXT,
    measurement_obs TEXT,
    testing_obs TEXT,
    
    -- Diagnosis & Conclusion
    final_conclusion TEXT,
    approval_date DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repair Images Table
CREATE TABLE IF NOT EXISTS vfd.repair_images (
    id SERIAL PRIMARY KEY,
    repair_id INTEGER REFERENCES vfd.repairs(id),
    step_name VARCHAR(50),
    file_path TEXT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Component States Table
CREATE TABLE IF NOT EXISTS vfd.component_states (
    id SERIAL PRIMARY KEY,
    repair_id INTEGER REFERENCES vfd.repairs(id),
    component_name VARCHAR(100) NOT NULL, -- 'Carcasa', 'Cooler', 'IGBT', etc.
    state VARCHAR(100),
    observations TEXT,
    proposed_solution TEXT
);
