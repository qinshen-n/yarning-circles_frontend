async function getCourses(token) {
    const url = `${import.meta.env.VITE_API_URL}/courses/`;  // Make sure trailing slash exists
    
    const headers = {
        "Content-Type": "application/json",
    };
    
    // Add auth token if available
    if (token) {
        headers["Authorization"] = `Token ${token}`;
    }
    
    const response = await fetch(url, { 
        method: "GET",
        headers: headers  
    });

    if (!response.ok) {
        const fallbackError = "Error fetching courses";

        const data = await response.json().catch(() => {
            throw new Error(fallbackError);
        });

        const errorMessage = data?.detail ?? fallbackError;
        throw new Error(errorMessage);
    }

    return await response.json();
}

export default getCourses;