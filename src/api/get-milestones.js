async function getMilestones(courseId,) {
    const url = `${import.meta.env.VITE_API_URL}/courses/${courseId}/milestones/`

    const response = await fetch(url, {
        method: "GET";
    });

    if (!response.ok) {
        const fallbackError = `Error deleting meeting`;

        const data = await response.json().catch(() => {
            throw new Error(fallbackError);
        });

        const errorMessage = data?.detail ?? fallbackError;
        throw new Error(errorMessage);
    }

    return response.json()
}

export default getMilestones;