CREATE DATABASE IF NOT EXISTS consistency_db;
USE consistency_db;

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    goal TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    difficulty INT DEFAULT 1,
    estimated_minutes INT,
    schedule_type ENUM('one_time', 'daily', 'weekly') DEFAULT 'daily',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE task_schedules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT,
    day_of_week INT,
    time_of_day TIME,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE task_completions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT,
    user_id BIGINT,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INT,
    proof_url TEXT,
    status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_completed (user_id, completed_at)
);

CREATE TABLE streaks (
    user_id BIGINT PRIMARY KEY,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_completed_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_stats (
    user_id BIGINT PRIMARY KEY,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    coins INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    action_type VARCHAR(100),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
