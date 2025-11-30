export const STORAGE_KEY = 'wbs_projects';

export type Project = {
    id: string;
    name: string;
    clientName: string;
    template: string;
    createdAt: string;
    tasks: any[];
    stakeholders: {
        director: string;
        agency: string;
        client: string;
    };
};

export function getProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
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
        projects[index] = updatedProject;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
}
