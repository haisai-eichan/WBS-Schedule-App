export type WBSTask = {
    id: string;
    name: string;
    category: 'Planning' | 'Design' | 'Development' | 'QA' | 'Launch';
    status: 'Pending' | 'In Progress' | 'Review' | 'Done';
    assignee: 'Director' | 'Agency' | 'Client';
    startDate?: string;
    endDate?: string;
};

export const TEMPLATES = {
    WEBSITE: [
        { name: 'Kickoff Meeting', category: 'Planning', assignee: 'Director' },
        { name: 'Sitemap Creation', category: 'Planning', assignee: 'Director' },
        { name: 'Wireframes', category: 'Design', assignee: 'Agency' },
        { name: 'Design Mockups', category: 'Design', assignee: 'Agency' },
        { name: 'Client Review (Design)', category: 'Design', assignee: 'Client' },
        { name: 'Frontend Implementation', category: 'Development', assignee: 'Agency' },
        { name: 'CMS Integration', category: 'Development', assignee: 'Agency' },
        { name: 'Content Entry', category: 'Development', assignee: 'Client' },
        { name: 'QA Testing', category: 'QA', assignee: 'Agency' },
        { name: 'Final Review', category: 'QA', assignee: 'Client' },
        { name: 'Launch', category: 'Launch', assignee: 'Director' },
    ],
    LP: [
        { name: 'Concept Definition', category: 'Planning', assignee: 'Director' },
        { name: 'Copywriting', category: 'Planning', assignee: 'Agency' },
        { name: 'Design', category: 'Design', assignee: 'Agency' },
        { name: 'Coding', category: 'Development', assignee: 'Agency' },
        { name: 'Analytics Setup', category: 'Development', assignee: 'Director' },
        { name: 'Launch', category: 'Launch', assignee: 'Director' },
    ],
};

export function generateWBS(templateKey: keyof typeof TEMPLATES): WBSTask[] {
    const template = TEMPLATES[templateKey] || TEMPLATES.WEBSITE;
    return template.map((task, index) => ({
        id: crypto.randomUUID(),
        name: task.name,
        category: task.category as WBSTask['category'],
        status: 'Pending',
        assignee: task.assignee as WBSTask['assignee'],
    }));
}
