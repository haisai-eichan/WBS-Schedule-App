/**
 * WBSタスクとテンプレートのヘルパー関数
 */

import { WBSTask, ScheduleType } from './wbsTemplates';

/**
 * 新しいタスクを作成
 * @param section - セクション名
 * @param orderIndex - 順序インデックス
 * @returns 新しいタスク
 */
export function createNewTask(section: string, orderIndex: number): WBSTask {
    return {
        id: crypto.randomUUID(),
        name: '新しいタスク',
        section: section,
        category: 'Planning',
        status: 'Pending',
        assignee: 'Director',
        estimate_days: 1,
        estimate_hours: 0,
        schedule_type: 'AUTO' as ScheduleType,
        order_index: orderIndex,
    };
}

/**
 * 既存のセクション名リストから新しいセクション名を生成
 * @param existingSections - 既存のセクション名リスト
 * @returns 新しいセクション名
 */
export function createNewSectionName(existingSections: string[]): string {
    let counter = 1;
    let newName = `新しいセクション ${counter}`;

    while (existingSections.includes(newName)) {
        counter++;
        newName = `新しいセクション ${counter}`;
    }

    return newName;
}
