/**
 * Splits an array into chunks of a given size.
 * @param {Array} array 
 * @param {Number} size 
 * @returns {Array<Array>}
 */
export const chunkArray = (array, size = 500) => {
    if (!array || !array.length) return [];
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};
