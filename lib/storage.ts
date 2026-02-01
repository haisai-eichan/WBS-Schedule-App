import { WBSTask } from './wbsTemplates';

export const STORAGE_KEY = 'wbs_projects';

export type Project = {
    id: string;
    name: string;
    clientName: string;
    template: string;
    createdAt: string;
    updatedAt?: string;
    tasks: WBSTask[];
    stakeholders: {
        director: string;
        agency: string;
        client: string;
    };

    // スケジュール関連
    startDate: string; // YYYY-MM-DD
    deliveryDate: string; // 納品日
    dueDate: string; // YYYY-MM-DD
    customHolidays?: string[]; // カスタム休業日
    hourlyRate?: number; // 時間単価 (基本)
    totalBudget?: number; // 総予算
    outsourcingCost?: number; // 外注費
    rateLowerLimit?: number; // 単価下限
    rateUpperLimit?: number; // 単価上限
};

/**
 * 既存データを新しいスキーマに移行
 */
function migrateProjectData(oldProject: any): Project {
    // 既存プロジェクトにスケジュールフィールドがない場合はデフォルト値を設定
    const today = new Date();
    const defaultStartDate = today.toISOString().split('T')[0];
    const defaultDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 60日後

    // タスクの移行
    const migratedTasks = (oldProject.tasks || []).map((task: any, index: number) => ({
        ...task,
        section: task.section || 'その他',
        estimate_days: task.estimate_days ?? 1,
        estimate_hours: task.estimate_hours ?? 0,
        overtime_days: task.overtime_days ?? 0,
        overtime_hours: task.overtime_hours ?? 0,
        isOutsourced: task.isOutsourced ?? false,
        schedule_type: task.schedule_type || 'AUTO',
        order_index: task.order_index ?? index,
        completed: task.completed ?? (task.status === 'Done'),
    }));

    return {
        ...oldProject,
        tasks: migratedTasks,
        startDate: oldProject.startDate || defaultStartDate,
        deliveryDate: oldProject.deliveryDate || oldProject.dueDate || defaultDate,
        dueDate: oldProject.dueDate || defaultDate,
        customHolidays: oldProject.customHolidays || [],
        hourlyRate: oldProject.hourlyRate || 8000,
        totalBudget: oldProject.totalBudget || 1000000, // デフォルト100万
        outsourcingCost: oldProject.outsourcingCost || 0,
        rateLowerLimit: oldProject.rateLowerLimit || 6000,
        rateUpperLimit: oldProject.rateUpperLimit || 10000,
    };
}

export function getProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    try {
        const projects = JSON.parse(data);
        return projects.map(migrateProjectData);
    } catch (error) {
        console.error('Failed to parse projects:', error);
        return [];
    }
}

export function saveProject(project: Project) {
    const projects = getProjects();
    projects.push(project);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function updateProject(updatedProject: Project) {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === updatedProject.id);
    if (index !== -1) {
        projects[index] = { ...updatedProject, updatedAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
}

export function getProjectById(id: string): Project | null {
    const projects = getProjects();
    return projects.find(p => p.id === id) || null;
}

export function deleteProject(id: string) {
    const projects = getProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

