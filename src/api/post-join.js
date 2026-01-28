async function postJoin(courseId, token) {
    const url = `${import.meta.env.VITE_API_URL}/courses/${courseId}/join/`

    const response = await fetch(url,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });

    if (!response.ok) {
        const fallbackError = `Error join circle`;

        const data = await response.json().catch(() => {
        throw new Error(fallbackError);
    });

    const errorMessage = data?.detail ?? fallbackError;
    throw new Error(errorMessage);
    }

    return await response.json();
}

export default postJoin;