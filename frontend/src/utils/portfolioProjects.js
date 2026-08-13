export const CLIENT_STATUS_LABELS = {
  planning: 'Planning',
  design: 'Design',
  development: 'Development',
  testing: 'Testing',
  completed: 'Completed',
};

export function mapClientStatusToPortfolio(status) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'planning':
      return 'Planned';
    case 'design':
    case 'development':
    case 'testing':
      return 'In Progress';
    default:
      return 'In Progress';
  }
}

function parseTechnologies(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function normalizePortfolioProject(project) {
  return {
    ...project,
    source: 'portfolio',
    title: project.title,
    technologies: parseTechnologies(project.technologies),
    detailPath: `/projects/${project.id}`,
  };
}

export function normalizeClientProject(project) {
  const image = project.hero_image || (project.screenshots?.[0] ?? null);
  return {
    ...project,
    source: 'client',
    title: project.name,
    image,
    technologies: parseTechnologies(project.tech_stack),
    status: mapClientStatusToPortfolio(project.status),
    statusLabel: CLIENT_STATUS_LABELS[project.status] || project.status_label || project.status,
    category: 'Client Work',
    github_url: project.repo_url || null,
    detailPath: `/projects/c/${project.id}`,
  };
}

export function normalizeClientProjectDetail(project) {
  return {
    ...normalizeClientProject(project),
    tags: [],
    screenshots: project.screenshots || [],
  };
}

export function mergePortfolioProjects(portfolio = [], clientPublic = []) {
  const portfolioItems = (Array.isArray(portfolio) ? portfolio : []).map(normalizePortfolioProject);
  const clientItems = (Array.isArray(clientPublic) ? clientPublic : []).map(normalizeClientProject);
  return [...portfolioItems, ...clientItems].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
}

export function filterPortfolioProjects(projects, filters = {}) {
  let result = projects;
  if (filters.status) {
    result = result.filter((project) => project.status === filters.status);
  }
  if (filters.category) {
    result = result.filter((project) => project.category === filters.category);
  }
  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter((project) => {
      const techText = (project.technologies || []).join(' ').toLowerCase();
      return (
        (project.title || '').toLowerCase().includes(query)
        || (project.description || '').toLowerCase().includes(query)
        || techText.includes(query)
      );
    });
  }
  return result;
}
