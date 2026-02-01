import { WBSTask, TEMPLATES, ScheduleType } from './wbsTemplates';

/**
 * Parses requirement text to generate a list of WBS tasks.
 * It uses simple heuristic rules to detect keywords and estimate page counts.
 */
export function generateTasksFromText(text: string): WBSTask[] {
    // 1. Determine Base Template
    // Check for "LP" or "Landing Page" to use LP template, otherwise default to WEB_SITE
    const isLP = /LP|ランディングページ|Landing Page/i.test(text);
    const baseTemplateKey = isLP ? 'LP' : 'WEB_SITE';
    const baseTasks = TEMPLATES[baseTemplateKey] || TEMPLATES.WEB_SITE;

    // 2. Clone Base Tasks (to avoid mutating the original template)
    let tasks: WBSTask[] = baseTasks.map((task, index) => ({
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

    // 3. Analyze Text for Features
    const lowerText = text.toLowerCase();

    // --- Page Count Detection ---
    // Look for patterns like "10 pages", "10ページ", "約10ページ"
    const pageCountMatch = text.match(/(\d+)\s*(ページ|page|pg)/i);
    const pageCount = pageCountMatch ? parseInt(pageCountMatch[1], 10) : 0;

    if (pageCount > 5) {
        // Significantly increase "Front Implementation" or similar 'Development' tasks
        tasks = tasks.map(t => {
            if (t.section === '実装' && t.category === 'Development' && t.name.includes('フロント実装')) {
                // heuristic: add 0.5 days per extra page above 5
                const extraDays = Math.ceil((pageCount - 5) * 0.5);
                return { ...t, estimate_days: t.estimate_days + extraDays };
            }
            if (t.section === 'デザイン' && t.category === 'Design' && t.name.includes('デザイン')) {
                // heuristic: add 0.3 days per extra page above 5
                const extraDays = Math.ceil((pageCount - 5) * 0.3);
                return { ...t, estimate_days: t.estimate_days + extraDays };
            }
            return t;
        });
    }

    // --- Feature: Contact Form ---
    const hasForm = /フォーム|contact|inquiry|お問い合わせ/i.test(text);
    if (hasForm) {
        // Check if form task already exists, if not add it (WEB_SITE template usually has it)
        const formExists = tasks.some(t => t.name.includes('フォーム'));
        if (!formExists) {
            tasks.splice(findInsertIndex(tasks, '実装'), 0, createSimpleTask('フォーム実装', '実装', 'Development', 'Agency', 1, 0));
        }
    }

    // --- Feature: CMS / News / Blog ---
    // If text mentions specific CMS features but used LP template, might need to add CMS tasks
    // Or if WEB_SITE, ensure they are present.
    const hasCMS = /CMS|WordPress|MovableType|ブログ|お知らせ/i.test(text);
    if (hasCMS && isLP) {
        // Add CMS tasks to LP if requested
        const implementationIndex = findInsertIndex(tasks, '実装');
        tasks.splice(implementationIndex, 0,
            createSimpleTask('CMS要件定義', 'CMS設計', 'Planning', 'Director', 0, 4),
            createSimpleTask('CMS実装', '実装', 'Development', 'Agency', 2, 0)
        );
    }

    // --- Feature: Login / Member Area ---
    const hasLogin = /ログイン|会員|マイページ|login|auth/i.test(text);
    if (hasLogin) {
        const implementationIndex = findInsertIndex(tasks, '実装');
        tasks.splice(implementationIndex, 0,
            createSimpleTask('会員機能要件定義', '要件定義', 'Planning', 'Director', 1, 0),
            createSimpleTask('ログイン/認証実装', '実装', 'Development', 'Agency', 3, 0),
            createSimpleTask('マイページ実装', '実装', 'Development', 'Agency', 3, 0)
        );
    }

    // Re-index order
    return tasks.map((t, i) => ({ ...t, order_index: i }));
}

// Helper to find roughly where to insert tasks in a section
function findInsertIndex(tasks: WBSTask[], sectionName: string): number {
    const idx = tasks.findIndex(t => t.section === sectionName);
    return idx >= 0 ? idx + 1 : tasks.length;
}

// Helper to create a task object
function createSimpleTask(name: string, section: string, category: WBSTask['category'], assignee: WBSTask['assignee'], days: number, hours: number): WBSTask {
    return {
        id: crypto.randomUUID(),
        name,
        section,
        category,
        status: 'Pending',
        assignee,
        estimate_days: days,
        estimate_hours: hours,
        schedule_type: 'AUTO',
        order_index: 0, // re-indexed later
        completed: false
    };
}
