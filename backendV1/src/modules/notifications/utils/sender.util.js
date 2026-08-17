export const buildSender = (user) => {
    console.log("Stub: buildSender called for user:", user?.id || user?._id);
    return { id: user?.id || user?._id, role: user?.role };
};
