import CreateCourseForm from "../components/CreateCourseForm";

function CreateCoursePage() {
    return (
        <div className="form-page">
            <div className="form-card create-course-card">
                <h1>Start A Circle</h1>
                <CreateCourseForm />
            </div>
        </div>
    );
}

export default CreateCoursePage;