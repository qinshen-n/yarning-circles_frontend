async function getMeetings(courseId) {
    const url = `${import.meta.env.VITE_API_URL}/courses/${courseId}/meetings/`;

    const response = await fetch(url, {
        method: "GET"
    });

    if (!response.ok) {
        const fallbackError = `Error fetching meetings`;

        const data = await response.json().catch(() => {
            throw new Error(fallbackError);
        });

        const errorMessage = data?.detail ?? fallbackError;
        throw new Error(errorMessage);
    }

    return await response.json();
}

export default getMeetings;