CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    payment_id VARCHAR(100) UNIQUE,

    idempotency_key VARCHAR(255) UNIQUE,

    amount DECIMAL(10,2) NOT NULL,

    status ENUM(
        'PENDING',
        'PROCESSING',
        'SUCCESS',
        'FAILED'
    ) DEFAULT 'PENDING',

    retry_count INT DEFAULT 0,

    gateway_transaction_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);