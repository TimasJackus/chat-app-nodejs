export const nullMissingRows = (ids: string[], list: { id: string }[]) => {
    return ids.map((id: string) => list.find(item => item.id === id) || null)
};