async function postMilestone(courseId, milestoneData, token) {
    const url = `${import.meta.env.VITE_API_URL}/courses/${courseId}/milestones/`

    const response = await fetch(url, {
        method: "POST",
        hearders: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`
        },
        body: JSON.stringify(milestoneData)
    });

    if (!response.ok) {
        const fallbackError = `Error creating milestone`;

        const data = await response.json().catch(() => {
            throw new Error(fallbackError);
        });

        const errorMessage = data?.detail ?? fallbackError;
        throw new Error(errorMessage);
    }

    return await response.json();
}

export default postMilestone;