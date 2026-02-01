export type ScheduleType = 'AUTO' | 'FIXED' | 'COORDINATION';

export type WBSTask = {
    id: string;
    name: string;
    section: string; // 大項目 (例: "素材準備", "デザイン")
    category: 'Planning' | 'Design' | 'Development' | 'QA' | 'Launch';
    status: 'Pending' | 'In Progress' | 'Review' | 'Done';
    assignee: string;

    // スケジュール関連
    estimate_days: number; // 予実管理用: 見積日数 (1d=8h)
    estimate_hours: number; // 見積時間 (0-7)
    overtime_days?: number; // 残業日数
    overtime_hours?: number; // 残業時間 (0-7)
    isOutsourced?: boolean; // 外注フラグ
    schedule_type: ScheduleType;
    order_index: number; // 並び順

    startDate?: string; // YYYY-MM-DD (算出結果)
    endDate?: string; // YYYY-MM-DD (算出結果)
    countdown_to_due?: number; // 納品日までの残営業日数

    completed: boolean; // 完了フラグ
    // 日程調整用
    date_candidates?: string[]; // 候補日 (COORDINATION用)
};

type TemplateTask = {
    name: string;
    section: string;
    category: WBSTask['category'];
    assignee: WBSTask['assignee'];
    estimate_days: number;
    estimate_hours: number;
    schedule_type: ScheduleType;
};

export const TEMPLATES = {
    WEB_SITE: [
        // 素材準備
        { name: '素材依頼リスト作成', section: '素材準備', category: 'Planning', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: '共有フォルダ・命名ルール設定', section: '素材準備', category: 'Planning', assignee: 'Director', estimate_days: 0, estimate_hours: 3, schedule_type: 'AUTO' },
        { name: '素材回収（ロゴ/画像/原稿/規約）', section: '素材準備', category: 'Planning', assignee: 'Client', estimate_days: 2, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: '不足素材の洗い出し・追加依頼', section: '素材準備', category: 'Planning', assignee: 'Director', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: '撮影/取材の候補日調整', section: '素材準備', category: 'Planning', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'COORDINATION' },
        { name: '撮影/取材実施', section: '素材準備', category: 'Planning', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'FIXED' },
        { name: '撮影素材整理', section: '素材準備', category: 'Planning', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },

        // CMS設計
        { name: 'コラム投稿タイプ要件定義', section: 'CMS設計', category: 'Planning', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: 'お知らせ投稿タイプ要件定義', section: 'CMS設計', category: 'Planning', assignee: 'Director', estimate_days: 0, estimate_hours: 3, schedule_type: 'AUTO' },
        { name: 'カテゴリ・タグ設計', section: 'CMS設計', category: 'Planning', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: 'SEO/OGP項目設計', section: 'CMS設計', category: 'Planning', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: '一覧・詳細表示仕様設計', section: 'CMS設計', category: 'Planning', assignee: 'Director', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },

        // デザイン
        { name: '共通UI設計', section: 'デザイン', category: 'Design', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: '主要ページデザイン', section: 'デザイン', category: 'Design', assignee: 'Agency', estimate_days: 2, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: 'コラム一覧・詳細デザイン', section: 'デザイン', category: 'Design', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: 'お知らせ一覧・詳細デザイン', section: 'デザイン', category: 'Design', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: 'デザインレビュー候補日調整', section: 'デザイン', category: 'Design', assignee: 'Director', estimate_days: 0, estimate_hours: 3, schedule_type: 'COORDINATION' },
        { name: 'デザインレビュー実施', section: 'デザイン', category: 'Design', assignee: 'Client', estimate_days: 0, estimate_hours: 4, schedule_type: 'FIXED' },
        { name: 'デザイン修正', section: 'デザイン', category: 'Design', assignee: 'Agency', estimate_days: 2, estimate_hours: 0, schedule_type: 'AUTO' },

        // 実装
        { name: 'フロント実装', section: '実装', category: 'Development', assignee: 'Agency', estimate_days: 5, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: 'フォーム実装', section: '実装', category: 'Development', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: 'コラム投稿タイプ実装', section: '実装', category: 'Development', assignee: 'Agency', estimate_days: 2, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: 'お知らせ投稿タイプ実装', section: '実装', category: 'Development', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: 'カテゴリ・タグ実装', section: '実装', category: 'Development', assignee: 'Agency', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: '一覧・詳細テンプレ実装', section: '実装', category: 'Development', assignee: 'Agency', estimate_days: 2, estimate_hours: 0, schedule_type: 'AUTO' },

        // 管理画面
        { name: '入力項目の説明文・例文設定', section: '管理画面', category: 'Development', assignee: 'Agency', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: '必須/任意の整理・入力補助', section: '管理画面', category: 'Development', assignee: 'Agency', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: '画像アップロードガイド設定', section: '管理画面', category: 'Development', assignee: 'Agency', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: 'プレビュー導線（下書き→確認→公開）', section: '管理画面', category: 'Development', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: 'クライアント向け簡易マニュアル作成', section: '管理画面', category: 'Development', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },

        // 初期コンテンツ
        { name: '初期コラム投稿作成（3本）', section: '初期コンテンツ', category: 'Development', assignee: 'Client', estimate_days: 1, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: '初期お知らせ投稿作成（3本）', section: '初期コンテンツ', category: 'Development', assignee: 'Client', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: '表示・リンク確認', section: '初期コンテンツ', category: 'QA', assignee: 'Agency', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },

        // 関係者調整
        { name: 'キックオフ日程調整', section: '関係者調整', category: 'Planning', assignee: 'Director', estimate_days: 0, estimate_hours: 3, schedule_type: 'COORDINATION' },
        { name: 'キックオフ実施', section: '関係者調整', category: 'Planning', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'FIXED' },
        { name: '中間確認会 日程調整', section: '関係者調整', category: 'QA', assignee: 'Director', estimate_days: 0, estimate_hours: 3, schedule_type: 'COORDINATION' },
        { name: '中間確認会 実施', section: '関係者調整', category: 'QA', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'FIXED' },

        // テスト・公開
        { name: '表示・動作テスト', section: 'テスト・公開', category: 'QA', assignee: 'Agency', estimate_days: 2, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: '修正対応', section: 'テスト・公開', category: 'QA', assignee: 'Agency', estimate_days: 2, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: '公開日程調整', section: 'テスト・公開', category: 'Launch', assignee: 'Director', estimate_days: 0, estimate_hours: 3, schedule_type: 'COORDINATION' },
        { name: 'GA4/タグ設定', section: 'テスト・公開', category: 'Launch', assignee: 'Director', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: 'DNS/SSL/サーバ設定', section: 'テスト・公開', category: 'Launch', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: '本番反映', section: 'テスト・公開', category: 'Launch', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'FIXED' },
        { name: '公開後チェック', section: 'テスト・公開', category: 'Launch', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: '運用レクチャー', section: 'テスト・公開', category: 'Launch', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
    ] as TemplateTask[],

    LP: [
        // 素材準備
        { name: '素材依頼リスト作成', section: '素材準備', category: 'Planning', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: '素材回収', section: '素材準備', category: 'Planning', assignee: 'Client', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: '不足素材の追加依頼', section: '素材準備', category: 'Planning', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: '撮影/取材 候補日調整', section: '素材準備', category: 'Planning', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'COORDINATION' },
        { name: '撮影/取材 実施', section: '素材準備', category: 'Planning', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'FIXED' },

        // 構成・コピー
        { name: '訴求整理', section: '構成・コピー', category: 'Planning', assignee: 'Director', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: 'ワイヤー作成', section: '構成・コピー', category: 'Planning', assignee: 'Agency', estimate_days: 1, estimate_hours: 4, schedule_type: 'AUTO' },
        { name: 'コピー作成・調整', section: '構成・コピー', category: 'Planning', assignee: 'Agency', estimate_days: 2, estimate_hours: 0, schedule_type: 'AUTO' },

        // デザイン
        { name: 'デザイン', section: 'デザイン', category: 'Design', assignee: 'Agency', estimate_days: 2, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: 'レビュー日程調整', section: 'デザイン', category: 'Design', assignee: 'Director', estimate_days: 0, estimate_hours: 3, schedule_type: 'COORDINATION' },
        { name: 'レビュー実施', section: 'デザイン', category: 'Design', assignee: 'Client', estimate_days: 0, estimate_hours: 4, schedule_type: 'FIXED' },
        { name: '修正', section: 'デザイン', category: 'Design', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },

        // 実装
        { name: 'コーディング', section: '実装', category: 'Development', assignee: 'Agency', estimate_days: 3, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: 'フォーム・計測設定', section: '実装', category: 'Development', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },
        { name: '表示確認・軽量化', section: '実装', category: 'Development', assignee: 'Agency', estimate_days: 1, estimate_hours: 0, schedule_type: 'AUTO' },

        // 公開
        { name: '公開日程調整', section: '公開', category: 'Launch', assignee: 'Director', estimate_days: 0, estimate_hours: 3, schedule_type: 'COORDINATION' },
        { name: '公開', section: '公開', category: 'Launch', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'FIXED' },
        { name: '公開後チェック', section: '公開', category: 'Launch', assignee: 'Director', estimate_days: 0, estimate_hours: 4, schedule_type: 'AUTO' },
    ] as TemplateTask[],
};

export function generateWBS(templateKey: keyof typeof TEMPLATES): WBSTask[] {
    const template = TEMPLATES[templateKey] || TEMPLATES.WEB_SITE;
    return template.map((task, index) => ({
        id: crypto.randomUUID(),
        name: task.name,
        section: task.section,
        category: task.category,
        status: 'Pending',
        assignee: task.assignee,
        estimate_days: task.estimate_days,
        estimate_hours: task.estimate_hours,
        schedule_type: task.schedule_type,
        order_index: index,
        completed: false,
    }));
}

