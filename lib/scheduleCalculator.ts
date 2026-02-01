/**
 * WBSスケジュール自動計算ロジック
 * タスクの依存関係と工数に基づいて日程を算出
 */

import { WBSTask } from './wbsTemplates';
import { addBusinessDaysAndHours, countBusinessDays, isBusinessDay } from './businessDays';

/**
 * スケジュール計算結果
 */
export type ScheduleValidation = {
    isValid: boolean;
    overrunDays?: number; // 納期超過日数
    remainingBusinessDays?: number; // 納期までの残営業日数
    totalRemainingHours?: number; // 残り総時間数
    message?: string;
};

/**
 * 全タスクのスケジュールを計算
 * @param tasks - タスクリスト (order_index順にソート済み)
 * @param projectStartDate - プロジェクト開始日
 * @param projectDueDate - 納品日
 * @param customHolidays - カスタム休業日
 * @param currentDate - 現在日時（残日数計算用）
 * @returns スケジュール計算済みのタスクリスト
 */
export function calculateSchedule(
    tasks: WBSTask[],
    projectStartDate: Date,
    projectDeliveryDate: Date,
    projectDueDate: Date,
    customHolidays: string[] = [],
    currentDate: Date = new Date()
): WBSTask[] {
    // order_index順にソート
    const sortedTasks = [...tasks].sort((a, b) => a.order_index - b.order_index);

    let currentTaskDate = new Date(projectStartDate);
    const calculatedTasks: WBSTask[] = [];

    for (const task of sortedTasks) {
        let taskStartDate: Date;
        let taskEndDate: Date;

        if (task.schedule_type === 'FIXED') {
            // FIXEDタスク: 指定日に固定
            if (task.startDate) {
                taskStartDate = new Date(task.startDate);
                // 開始日が決まっていても、終了日は工数に基づいて計算する
                const calculated = calculateTaskDates({ ...task, startDate: task.startDate }, taskStartDate, customHolidays);
                taskEndDate = calculated.endDate;
            } else {
                // FIXEDだが日付未設定の場合はAUTOと同じ扱い
                const dates = calculateTaskDates(task, currentTaskDate, customHolidays);
                taskStartDate = dates.startDate;
                taskEndDate = dates.endDate;
            }
        } else if (task.schedule_type === 'COORDINATION') {
            // COORDINATIONタスク: 候補日から最も早い日を選択、または自動計算
            if (task.date_candidates && task.date_candidates.length > 0) {
                const candidateDates = task.date_candidates
                    .map(d => new Date(d))
                    .filter(d => d >= currentTaskDate)
                    .sort((a, b) => a.getTime() - b.getTime());

                if (candidateDates.length > 0) {
                    taskStartDate = candidateDates[0];
                    taskEndDate = candidateDates[0];
                } else {
                    // 候補日が全て過去の場合は自動計算
                    const dates = calculateTaskDates(task, currentTaskDate, customHolidays);
                    taskStartDate = dates.startDate;
                    taskEndDate = dates.endDate;
                }
            } else {
                // 候補日未設定の場合は自動計算
                const dates = calculateTaskDates(task, currentTaskDate, customHolidays);
                taskStartDate = dates.startDate;
                taskEndDate = dates.endDate;
            }
        } else {
            // AUTOタスク: 前タスクから自動連結
            const dates = calculateTaskDates(task, currentTaskDate, customHolidays);
            taskStartDate = dates.startDate;
            taskEndDate = dates.endDate;
        }

        // 納品予定日までの残営業日数を計算（タスク終了日から）
        const countdown = countBusinessDays(taskEndDate, projectDeliveryDate, customHolidays);

        calculatedTasks.push({
            ...task,
            startDate: formatDate(taskStartDate),
            endDate: formatDate(taskEndDate),
            countdown_to_due: countdown,
        });

        // 次のタスクの開始日を更新
        currentTaskDate = addBusinessDaysAndHours(taskEndDate, 0, 1, customHolidays); // 翌営業日
    }

    return calculatedTasks;
}

/**
 * 個別タスクの日程を計算
 * @param task - タスク
 * @param previousTaskEndDate - 前タスクの終了日 (null の場合はプロジェクト開始日)
 * @param customHolidays - カスタム休業日
 * @returns 開始日と終了日
 */
export function calculateTaskDates(
    task: WBSTask,
    previousTaskEndDate: Date,
    customHolidays: string[] = []
): { startDate: Date; endDate: Date } {
    // 開始日は前タスクの翌営業日
    let startDate = new Date(previousTaskEndDate);

    // 開始日が営業日でない場合は次の営業日に調整
    while (!isBusinessDay(startDate, customHolidays)) {
        startDate.setDate(startDate.getDate() + 1);
    }

    // 終了日を計算
    const endDate = addBusinessDaysAndHours(
        startDate,
        task.estimate_days,
        task.estimate_hours,
        customHolidays
    );

    return { startDate, endDate };
}

/**
 * スケジュールの妥当性を検証
 * @param tasks - タスクリスト
 * @param dueDate - 納品日
 * @returns 検証結果
 */
export function validateSchedule(
    tasks: WBSTask[],
    deliveryDate: Date,
    dueDate: Date,
    customHolidays: string[] = [],
    currentDate: Date = new Date()
): ScheduleValidation {
    if (tasks.length === 0) {
        return { isValid: true };
    }

    // 最後のタスクの終了日を取得
    const lastTask = tasks.reduce((latest, task) => {
        if (!task.endDate) return latest;
        if (!latest.endDate) return task;
        return new Date(task.endDate) > new Date(latest.endDate) ? task : latest;
    }, tasks[0]);

    if (!lastTask.endDate) {
        return { isValid: false, message: 'タスクの終了日が設定されていません' };
    }

    // 時間をリセットして日付のみで比較
    const lastEndDate = new Date(lastTask.endDate);
    lastEndDate.setHours(0, 0, 0, 0);

    const normalizedDeliveryDate = new Date(deliveryDate);
    normalizedDeliveryDate.setHours(0, 0, 0, 0);

    const normalizedDueDate = new Date(dueDate);
    normalizedDueDate.setHours(0, 0, 0, 0);

    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    // 納期までの残営業日（ユーザーは納期を最終デッドラインと考える）
    const remainingBusinessDays = countBusinessDays(today, normalizedDueDate, customHolidays);
    const totalRemainingHours = remainingBusinessDays * 8;

    if (lastEndDate > normalizedDeliveryDate) {
        const overrunDays = Math.ceil((lastEndDate.getTime() - normalizedDeliveryDate.getTime()) / (1000 * 60 * 60 * 24));
        const formattedLastEndDate = formatDate(lastEndDate);
        return {
            isValid: false,
            overrunDays,
            remainingBusinessDays,
            totalRemainingHours,
            message: `納期まであと${remainingBusinessDays}営業日ですが、現在の計画では完了が${overrunDays}日遅れる見込みです (完了予定: ${formattedLastEndDate})`,
        };
    }

    return {
        isValid: true,
        remainingBusinessDays,
        totalRemainingHours,
        message: `納品予定は納期内です。納期まであと ${remainingBusinessDays} 営業日です`
    };
}

/**
 * プロジェクトの進捗率を計算
 */
export function calculateProgress(tasks: WBSTask[]): number {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => t.completed).length;
    return Math.round((completedTasks / tasks.length) * 100);
}

/**
 * プロジェクトの予算・コスト概算を計算
 */
export function calculateProjectFinancials(tasks: WBSTask[], hourlyRate: number, totalBudget?: number, baseOutsourcingCost: number = 0) {
    let estimatedHours = 0;
    let actualHours = 0;
    let totalActualCost = baseOutsourcingCost;

    tasks.forEach(task => {
        const estH = (task.estimate_days * 8) + task.estimate_hours;
        // 完了済みタスクは見積工数を実績として計上。未完了は0h。
        const actH = task.completed ? estH : 0;
        const overtH = ((task.overtime_days || 0) * 8) + (task.overtime_hours || 0);

        estimatedHours += estH;
        actualHours += (actH + overtH);

        totalActualCost += (actH + overtH) * hourlyRate;
    });

    const progress = calculateProgress(tasks);

    // 赤字リスクの予測
    let predictedTotalCost = totalActualCost;
    if (progress > 5 && progress < 100) {
        // (現在コスト - 固定外注費) / 進捗率 * 100 + 固定外注費
        // 簡易的に全コストを進捗率で割る
        predictedTotalCost = (totalActualCost / (progress / 100));
    }

    const isDeficitRisk = totalBudget ? predictedTotalCost > totalBudget : false;
    const isCurrentDeficit = totalBudget ? totalActualCost > totalBudget : false;

    // 予算から逆算した可能残作業時間
    const remainingBudget = totalBudget ? (totalBudget - totalActualCost) : 0;
    const affordableHours = hourlyRate > 0 ? Math.floor(remainingBudget / hourlyRate) : 0;

    return {
        estimatedCost: estimatedHours * hourlyRate + baseOutsourcingCost,
        actualCost: totalActualCost,
        estimatedHours,
        totalActualHours: actualHours,
        predictedTotalCost: Math.round(predictedTotalCost),
        isDeficitRisk,
        isCurrentDeficit,
        affordableHours,
        affordableDays: Math.floor(affordableHours / 8),
        affordableRemainingHours: affordableHours % 8
    };
}

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換
 */
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * タスクを並び替えた後にスケジュールを再計算
 * @param tasks - タスクリスト
 * @param fromIndex - 移動元のインデックス
 * @param toIndex - 移動先のインデックス
 * @param projectStartDate - プロジェクト開始日
 * @param projectDueDate - 納品日
 * @param customHolidays - カスタム休業日
 * @param currentDate - 現在日時
 * @returns 並び替え後のタスクリスト
 */
export function reorderAndRecalculate(
    tasks: WBSTask[],
    fromIndex: number,
    toIndex: number,
    projectStartDate: Date,
    projectDeliveryDate: Date,
    projectDueDate: Date,
    customHolidays: string[] = [],
    currentDate: Date = new Date()
): WBSTask[] {
    const reorderedTasks = [...tasks];
    const [movedTask] = reorderedTasks.splice(fromIndex, 1);
    reorderedTasks.splice(toIndex, 0, movedTask);

    // order_indexを再設定
    const tasksWithNewOrder = reorderedTasks.map((task, index) => ({
        ...task,
        order_index: index,
    }));

    // スケジュールを再計算
    return calculateSchedule(tasksWithNewOrder, projectStartDate, projectDeliveryDate, projectDueDate, customHolidays, currentDate);
}

/**
 * タスクを削除して order_index を再計算
 * @param tasks - タスクリスト
 * @param taskId - 削除するタスクのID
 * @param projectStartDate - プロジェクト開始日
 * @param projectDueDate - 納品日
 * @param customHolidays - カスタム休業日
 * @param currentDate - 現在日時
 * @returns 削除後のタスクリスト
 */
export function deleteTask(
    tasks: WBSTask[],
    taskId: string,
    projectStartDate: Date,
    projectDeliveryDate: Date,
    projectDueDate: Date,
    customHolidays: string[] = [],
    currentDate: Date = new Date()
): WBSTask[] {
    const filteredTasks = tasks.filter(t => t.id !== taskId);

    // order_indexを再設定
    const tasksWithNewOrder = filteredTasks.map((task, index) => ({
        ...task,
        order_index: index,
    }));

    // スケジュールを再計算
    return calculateSchedule(tasksWithNewOrder, projectStartDate, projectDeliveryDate, projectDueDate, customHolidays, currentDate);
}

/**
 * 同一セクション内でタスクを移動
 * @param tasks - タスクリスト
 * @param taskId - 移動するタスクのID
 * @param direction - 移動方向 ('up' | 'down')
 * @param projectStartDate - プロジェクト開始日
 * @param projectDueDate - 納品日
 * @param customHolidays - カスタム休業日
 * @param currentDate - 現在日時
 * @returns 移動後のタスクリスト
 */
export function moveTaskInSection(
    tasks: WBSTask[],
    taskId: string,
    direction: 'up' | 'down',
    projectStartDate: Date,
    projectDeliveryDate: Date,
    projectDueDate: Date,
    customHolidays: string[] = [],
    currentDate: Date = new Date()
): WBSTask[] {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return tasks;

    const task = tasks[taskIndex];
    const sectionTasks = tasks.filter(t => t.section === task.section);
    const sectionIndex = sectionTasks.findIndex(t => t.id === taskId);

    // 移動先のインデックスを計算
    let targetSectionIndex = sectionIndex;
    if (direction === 'up' && sectionIndex > 0) {
        targetSectionIndex = sectionIndex - 1;
    } else if (direction === 'down' && sectionIndex < sectionTasks.length - 1) {
        targetSectionIndex = sectionIndex + 1;
    } else {
        return tasks; // 移動できない
    }

    // 全体のタスクリストでの移動先インデックスを計算
    const targetTask = sectionTasks[targetSectionIndex];
    const targetIndex = tasks.findIndex(t => t.id === targetTask.id);

    return reorderAndRecalculate(tasks, taskIndex, targetIndex, projectStartDate, projectDeliveryDate, projectDueDate, customHolidays, currentDate);
}
/**
 * セクション全体を移動
 * @param tasks - タスクリスト
 * @param sectionName - 移動するセクション名
 * @param direction - 移動方向 ('up' | 'down')
 * @param projectStartDate - プロジェクト開始日
 * @param projectDueDate - 納品日
 * @param customHolidays - カスタム休業日
 * @param currentDate - 現在日時
 * @returns 移動後のタスクリスト
 */
export function moveSection(
    tasks: WBSTask[],
    sectionName: string,
    direction: 'up' | 'down',
    projectStartDate: Date,
    projectDeliveryDate: Date,
    projectDueDate: Date,
    customHolidays: string[] = [],
    currentDate: Date = new Date()
): WBSTask[] {
    // セクションごとにタスクをグループ化した順序を維持
    const sections: string[] = [];
    tasks.forEach(t => {
        if (!sections.includes(t.section)) {
            sections.push(t.section);
        }
    });

    const currentIndex = sections.indexOf(sectionName);
    if (currentIndex === -1) return tasks;

    let targetIndex = currentIndex;
    if (direction === 'up' && currentIndex > 0) {
        targetIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < sections.length - 1) {
        targetIndex = currentIndex + 1;
    } else {
        return tasks;
    }

    // セクション名の順序を入れ替え
    const newSections = [...sections];
    const [movedSection] = newSections.splice(currentIndex, 1);
    newSections.splice(targetIndex, 0, movedSection);

    // 新しいセクション順序に基づいてタスクを並び替え
    const reorderedTasks: WBSTask[] = [];
    newSections.forEach(section => {
        const sectionTasks = tasks.filter(t => t.section === section);
        reorderedTasks.push(...sectionTasks);
    });

    // order_indexを再設定
    const tasksWithNewOrder = reorderedTasks.map((task, index) => ({
        ...task,
        order_index: index,
    }));

    // スケジュールを再計算
    return calculateSchedule(tasksWithNewOrder, projectStartDate, projectDeliveryDate, projectDueDate, customHolidays, currentDate);
}
