import styles from './StatusBadge.module.css';

const COLORS = {
    '未着手': 'gray',
    '着手中': 'blue',
    '確認中': 'orange',
    '完了': 'green',
};

const LABEL_MAP: Record<string, string> = {
    'Pending': '未着手',
    'In Progress': '着手中',
    'Review': '確認中',
    'Done': '完了',
};

export default function StatusBadge({ status }: { status: string }) {
    const label = LABEL_MAP[status] || status;
    const color = COLORS[label as keyof typeof COLORS] || 'gray';
    return (
        <span className={`${styles.badge} ${styles[color]}`}>
            {label}
        </span>
    );
}
