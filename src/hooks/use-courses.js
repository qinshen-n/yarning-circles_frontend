import { useState, useEffect } from "react";
import getCourses from "../api/get-courses";
import { useAuth } from "./use-auth"; 

export default function useCourses() {
    const { auth } = useAuth(); 
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState();

    useEffect(() => {
        getCourses(auth?.token)
            .then((courses) => {
                setCourses(courses);
                setIsLoading(false);
            })
            .catch((error) => {
                setError(error);
                setIsLoading(false);
            });
    }, [auth?.token]); 
    
    return { courses, isLoading, error };
}