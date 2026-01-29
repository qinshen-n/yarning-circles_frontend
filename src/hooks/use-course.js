import { useState, useEffect } from "react";
import getCourse from "../api/get-course";
import { useAuth } from "./use-auth";

export default function useCourse(courseId) {
    const { auth } = useAuth();
    const [course, setCourse] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState();

    useEffect(() => {
    getCourse(courseId, auth?.token)
        .then((course) => {
            console.log("Fetched course:", course);
            setCourse(course);
            setIsLoading(false);
        })
        .catch((error) => {
            setError(error);
            setIsLoading(false);
        });

    // Add auth?.token to dependency array
    }, [courseId, auth?.token]);

    return { course, isLoading, error };
}