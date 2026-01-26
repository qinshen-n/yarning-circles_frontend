async function postMeeting(courseId, meetingData, token) {
    const url=  `${import.meta.env.VITE_API_URL}/courses/${courseId}/meetings/`
    
    const response = await fetch(url, {
        method: "POST",
        hearders: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`
        },
        body: JSON.stringify(meetingData)
    });
}

if (!response.ok) {
    const fallbackError = `Error creating meeting`;

    const data = await response.json().catch(() => {
        throw new fallbackError
    });

    const errorMessage = data?.detail ?? fallbackError;
    throw new Error(errorMessage);

return await response.json();
}

export default postMeeting;