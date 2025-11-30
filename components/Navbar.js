import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
    return (
        <nav className={styles.nav}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    WBS<span className={styles.highlight}>Master</span>
                </Link>
                <div className={styles.links}>
                    <Link href="/" className={styles.link}>Dashboard</Link>
                    <Link href="/settings" className={styles.link}>Settings</Link>
                </div>
                <div className={styles.user}>
                    <div className={styles.avatar}>D</div>
                </div>
            </div>
        </nav>
    );
}
