import styles from './StatusBadge.module.css';

const COLORS = {
    'Pending': 'gray',
    'In Progress': 'blue',
    'Review': 'orange',
    'Done': 'green',
};

export default function StatusBadge({ status }: { status: string }) {
    const color = COLORS[status as keyof typeof COLORS] || 'gray';
    return (
        <span className={`${styles.badge} ${styles[color]}`}>
            {status}
        </span>
    );
}
