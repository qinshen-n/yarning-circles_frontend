async function deleteMeeting (meetingId, token) {
    const url = `${import.meta.env.VITE_API_URL}/meetings/${meetingId}/`

    const response = await fetch (url, {
        method: "DELETE",
        hearders: {
            "Authorization": `Token ${token}`
        }
    });

    if (!response.ok) {
        const fallbackError = `Error deleting meeting`;

        const data = await response.json().catch(() => {
            throw new Error(fallbackError);
        });

        const errorMessage = data?.detail ?? fallbackError;
        throw new Error(errorMessage);
    }
    // DELETE returns 204 No Content, so no JSON to parse
    return {success: true};
}

export default deleteMeeting;