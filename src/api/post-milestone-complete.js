async function postMilestoneComplete(milestoneId, token) {
    const url = `${import.meta.env.VITE_API_URL}/milestones/${milestoneId}/complete/`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type":  "application/json",
            "Authorization": `Token ${token}`
        },
        body: JSON.stringify({})
    });

    if (!response.ok) {
        const fallbackError = `Error toggling milestone completion`;

        const data = await response.json().catch(() => {
            throw new Error(fallbackError);
        });

        const errorMessage = data?.detail ?? fallbackError;
        throw new Error(errorMessage);
    }

    return await response.json();
}

export default postMilestoneComplete;