import React from 'react';

const ItemCard = ({ name, unit, amount, created_at, expire_date, label }) => {
    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <span style={styles.label}>{label}</span>
                <h2 style={styles.name}>{name}</h2>
            </div>
            <div style={styles.info}>
                <span>This is creatd_by ai</span>
                <div>
                    <strong>數量：</strong>{amount} {unit}
                </div>
                <div>
                    <strong>建立日期：</strong>{created_at}
                </div>
                <div>
                    <strong>到期日：</strong>{expire_date}
                </div>
            </div>
        </div>
    );
};

const styles = {
    card: {
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        margin: '12px 0',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        maxWidth: '350px'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px'
    },
    label: {
        background: '#1976d2',
        color: '#fff',
        borderRadius: '4px',
        padding: '2px 8px',
        fontSize: '12px',
        marginRight: '10px'
    },
    name: {
        margin: 0,
        fontSize: '20px'
    },
    info: {
        fontSize: '15px',
        color: '#333'
    }
};

export default ItemCard;