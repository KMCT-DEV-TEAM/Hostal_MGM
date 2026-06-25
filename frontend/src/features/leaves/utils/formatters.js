export const formatDate = (dateString) => {
    if (!dateString) return '-----';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
