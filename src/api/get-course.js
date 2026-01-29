async function getCourse(courseId, token) { 
    const url = `${import.meta.env.VITE_API_URL}/courses/${courseId}/`;
    
    const headers = {
        "Content-Type": "application/json",
    };
    
    if (token) {
        headers["Authorization"] = `Token ${token}`;
    }
    
    const response = await fetch(url, { 
        method: "GET",
        headers: headers 
    });

    if (!response.ok) {
        const fallbackError = `Error fetching course with id ${courseId}`;

        const data = await response.json().catch(() => {
            throw new Error(fallbackError);
        });

        const errorMessage = data?.detail ?? fallbackError;
        throw new Error(errorMessage);
    }

    return await response.json();
}

export default getCourse;