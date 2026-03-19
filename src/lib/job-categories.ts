export const JOB_CATEGORIES = [
  { id: "frontend", label: "Frontend", group: "developer" },
  { id: "backend", label: "Backend", group: "developer" },
  { id: "devops", label: "DevOps/Infra", group: "developer" },
  { id: "data", label: "Data", group: "developer" },
  { id: "pm", label: "Product Management", group: "non-developer" },
  { id: "design", label: "Product Design", group: "non-developer" },
  { id: "pw", label: "Product Writing", group: "non-developer" },
  { id: "qa", label: "QA", group: "developer" },
  { id: "sales", label: "Sales", group: "non-developer" },
  { id: "cs", label: "Customer Success", group: "non-developer" },
  { id: "marketing", label: "Marketing", group: "non-developer" },
  { id: "operations", label: "Operations", group: "non-developer" },
  { id: "legal", label: "Legal", group: "non-developer" },
  { id: "security", label: "Security", group: "developer" },
  { id: "people", label: "People", group: "non-developer" },
  { id: "other", label: "\uAE30\uD0C0", group: "non-developer" },
] as const;

export type JobCategoryId = (typeof JOB_CATEGORIES)[number]["id"];

export type JobCategory = (typeof JOB_CATEGORIES)[number];

export function getCategoryById(
  id: string,
): JobCategory | undefined {
  return JOB_CATEGORIES.find((c) => c.id === id);
}

export function getCategoriesByGroup(
  group: "developer" | "non-developer",
): readonly JobCategory[] {
  return JOB_CATEGORIES.filter((c) => c.group === group);
}
