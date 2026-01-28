import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useCourse from "../hooks/use-course";
import { useAuth } from "../hooks/use-auth";
import UpdateCourseForm from "../components/UpdateCourseForm";
import "./UpdateCoursePage.css";

function UpdateCoursePage () {
    const { id } = useParams();
    const navigate = useNavigate();
    const { auth } = useAuth();

    // 1. Fetch data
    const { course, isLoading, error } = useCourse(id);
    const [updateMessage, setUpdateMessage] = useState(null);

    // 2. Protect the route (Auth & Owner Check)
    useEffect(() => {
        if (!auth.token) {
            navigate("/login");
            return;
        }
        if (course && course.owner !== auth.username) {
            alert("You do not have permission to edit this course.");
            navigate(`/circles/${id}`);
        }
    }, [auth, course, navigate, id]);

    if (isLoading) return <p>Loading circle data...</p>
    if (error) return <p>Error loading course: {error.message}</p>;

    // Safety check befor rendering form
    if (!course) return <p>Course not found</p>

    return (
        <div className="form-page">
            <div className="form-card update-course-card">
                <h1>Edit Circle: {course.title}</h1>

                {updateMessage && 
                <p className="success-message" style={{textAlign:'center', color:'green', fontWeight:'bold'}}>
                    {updateMessage}
                </p>}
            
                <UpdateCourseForm
                    existingData={course}
                    setUpdateMessage={setUpdateMessage}
                />
            </div>
        </div>
    );
}

export default UpdateCoursePage;