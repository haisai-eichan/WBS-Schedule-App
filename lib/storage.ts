import { WBSTask } from './wbsTemplates';
import { supabase } from './supabase';

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
    const today = new Date();
    const defaultStartDate = today.toISOString().split('T')[0];
    const defaultDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 60日後

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
        totalBudget: oldProject.totalBudget || 1000000,
        outsourcingCost: oldProject.outsourcingCost || 0,
        rateLowerLimit: oldProject.rateLowerLimit || 6000,
        rateUpperLimit: oldProject.rateUpperLimit || 10000,
    };
}

// --- Async Functions ---

export async function fetchProjects(): Promise<Project[]> {
    // Supabase
    if (supabase) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Supabase fetch error:', error);
            return [];
        }
        return (data || []).map((row: any) => migrateProjectData(row.data));
    }

    // LocalStorage Fallback
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

export async function fetchProjectById(id: string): Promise<Project | null> {
    // Supabase
    if (supabase) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return migrateProjectData(data.data);
    }

    // LocalStorage Fallback
    const projects = await fetchProjects(); // Reuse local logic (it returns promise but logic is sync)
    return projects.find(p => p.id === id) || null;
}

export async function createProject(project: Project): Promise<void> {
    // Supabase
    if (supabase) {
        const { error } = await supabase
            .from('projects')
            .insert({
                id: project.id,
                name: project.name,
                data: project,
                created_at: project.createdAt,
                updated_at: new Date().toISOString()
            });

        if (error) console.error('Supabase create error:', error);
        return; // Return even on error
    }

    // LocalStorage Fallback
    const projects = await fetchProjects(); // Fetch existing
    projects.push(project);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export async function updateProject(updatedProject: Project): Promise<void> {
    const finalProject = { ...updatedProject, updatedAt: new Date().toISOString() };

    // Supabase
    if (supabase) {
        const { error } = await supabase
            .from('projects')
            .update({
                name: finalProject.name,
                data: finalProject,
                updated_at: finalProject.updatedAt
            })
            .eq('id', finalProject.id);

        if (error) console.error('Supabase update error:', error);
        return;
    }

    // LocalStorage Fallback
    const projects = await fetchProjects();
    const index = projects.findIndex(p => p.id === finalProject.id);
    if (index !== -1) {
        projects[index] = finalProject;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
}

export async function deleteProject(id: string): Promise<void> {
    // Supabase
    if (supabase) {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) console.error('Supabase delete error:', error);
        return;
    }

    // LocalStorage Fallback
    const projects = await fetchProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
