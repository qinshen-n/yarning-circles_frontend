async function postRSVP(meetingId, status, token) {
    const url = `${import.meta.env.VITE_API_URL}/meetings/${meetingId}/rsvp/`

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`
        },
        body: JSON.stringify({ status })
    });

    if (!response.ok) {
        const fallbackError = `Error submitting RSVP`;

        const data = await response.json().catch(() => {
            throw new Error(fallbackError)
        });

        const errorMessage = data?.detail ?? fallbackError;
        throw new Error(errorMessage);
    }

    return await response.json();
}

export default postRSVP;