'use client';

import React, { useEffect, useRef } from 'react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    isOpen,
    title = '確認',
    message,
    onConfirm,
    onCancel
}: ConfirmModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Escキーで閉じる
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    // モーダル外クリックで閉じる
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal} ref={modalRef} role="dialog" aria-modal="true">
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <button
                        onClick={onCancel}
                        className={`${styles.btn} ${styles.btnCancel}`}
                        autoFocus
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`${styles.btn} ${styles.btnConfirm}`}
                    >
                        削除する
                    </button>
                </div>
            </div>
        </div>
    );
}
