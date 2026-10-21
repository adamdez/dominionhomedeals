// Only fixed field names leave the form. Values are inspected locally, never sent.
export const META_PROGRESS_FIELDS = [
  'full_name', 'phone', 'email', 'address', 'service_area', 'contact_permission',
] as const
export type MetaProgressField = (typeof META_PROGRESS_FIELDS)[number]

export function metaProgressField(name: string): MetaProgressField | null {
  return (META_PROGRESS_FIELDS as readonly string[]).includes(name) ? name as MetaProgressField : null
}

export function completedMetaField(name: string, value: string, valid: boolean, checked = false): MetaProgressField | null {
  const field = metaProgressField(name)
  if (!field || !valid) return null
  if (field === 'contact_permission') return checked ? field : null
  if (field === 'phone') return value.replace(/\D/g, '').length === 10 ? field : null
  if (field === 'full_name') return value.trim().length >= 2 ? field : null
  if (field === 'address') return value.trim().length >= 6 ? field : null
  return value.trim() ? field : null
}
