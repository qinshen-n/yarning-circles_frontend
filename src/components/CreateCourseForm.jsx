import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import postCreateCourse from "../api/post-createcourse.js";
import postCreateImageURL from "../api/post-createimageurl.js";

import { useAuth } from "../hooks/use-auth.js";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import "./CreateCourseForm.css";
import axios from 'axios'; 

function CreateCourseForm() {
    const navigate = useNavigate();
    const { auth } = useAuth();

    const [courseform, setCourseform] = useState({
        title: "",
        brief_description: "",
        course_content: "",
        category: "",
        image: null,
        difficulty_level: "beginner",
        duration_in_hours: "",
        learning_objectives: "",
        enrollment_end: "",
        status: "published",
        max_students: "",
    });

    // This code is for file upload handling (using AWS S3 presigned URLs)
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);


    // we will list all file types with size limits
    const supportedTypes = {
    'image/jpeg': { extensions: '.jpg, .jpeg', maxSize: 15 * 1024 * 1024 }, // 15MB
    'image/png': { extensions: '.png', maxSize: 15 * 1024 * 1024 },         // 15MB
    'video/mp4': { extensions: '.mp4', maxSize: 500 * 1024 * 1024 },        // 500MB
    'video/quicktime': { extensions: '.mov', maxSize: 500 * 1024 * 1024 },  // 500MB
    'application/pdf': { extensions: '.pdf', maxSize: 50 * 1024 * 1024 }    // 50MB
    };


    //---------handle file selection and validation----------
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const fileTypeConfig = supportedTypes[file.type];
        const maxSize = fileTypeConfig.maxSize;
        const maxSizeMB = maxSize / (1024 * 1024);

        if (!fileTypeConfig) {
        setUploadStatus('Error: Unsupported file type. Please select JPEG, PNG, MP4, MOV, or PDF files.');
        } else if (file.size > maxSize) {
        setUploadStatus(`Error: File size too large. Maximum size for ${file.type} is ${maxSizeMB}MB.`);
        return;
        }
        setSelectedFile(file);
        setUploadStatus('');
        setUploadProgress(0);
    };
    //---------handle file selection and validation ends----------

    //---------handle file upload to S3 using presigned URL--------

    const getPresignedUrl = async (file) => {
                console.log('[Presign] payload:', {
            file_name: file.name,
            file_type: file.type,
            file_size: file.size
        });
        try {
            const response = await postCreateImageURL({          
                file_name: file.name,
                file_type: file.type,
                file_size: file.size
            }, auth?.token);
        // Log presigned fields
        const { upload_url, fields, file_key, public_url, expires_in } = response || {};
        console.log('[Presign] upload_url:', upload_url);
        console.log('[Presign] file_key:', file_key);
        console.log('[Presign] public_url:', public_url);
        console.log('[Presign] expires_in:', expires_in);

        // Individual S3 form fields
        console.log('[Presign] fields:', fields);
        console.log('[Presign] Content-Type:', fields?.['Content-Type']);
        console.log('[Presign] key:', fields?.key);
        console.log('[Presign] policy:', fields?.policy);
        console.log('[Presign] signature:', fields?.signature);
        console.log('[Presign] AWSAccessKeyId:', fields?.AWSAccessKeyId);            
            return response;
        } catch (error) {
            console.error('Error getting presigned URL:', error);
            if (error.response && error.response.data && error.response.data.error) {
                throw new Error(error.response.data.error);
        }
            throw new Error('Failed to get upload URL from server');
        }
    };

    const uploadToS3 = async (file, presignedData) => {
        const formData = new FormData();
    console.log('[S3Upload] about to POST with fields:', presignedData?.fields);
    console.log('[S3Upload] Content-Type:', presignedData?.fields?.['Content-Type']);
    console.log('[S3Upload] key:', presignedData?.fields?.key);
    console.log('[S3Upload] policy:', presignedData?.fields?.policy);
    console.log('[S3Upload] signature:', presignedData?.fields?.signature);
    console.log('[S3Upload] AWSAccessKeyId:', presignedData?.fields?.AWSAccessKeyId);

        // Add fields from presigned POST
        Object.keys(presignedData.fields).forEach(key => {
        formData.append(key, presignedData.fields[key]);
        });
        
        // Add the file last
        formData.append('file', file);

        try {
        await axios.post(presignedData.upload_url, formData, {
            headers: {
            'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
            },
        });
        
        return presignedData.file_key;
        } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload file to storage');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
        setUploadStatus('Please select a file first');
        return;
        }

        setIsUploading(true);
        setUploadStatus('Starting upload...');
        setUploadProgress(0);

        try {
        // Step 1: Get presigned URL
        setUploadStatus('Getting upload URL...');
        const presignedData = await getPresignedUrl(selectedFile);

        // Step 2: Upload to S3
        setUploadStatus('Uploading file...');
        const fileKey = await uploadToS3(selectedFile, presignedData);

        // Step 3: Success
        setUploadStatus('Upload completed successfully!');
        setUploadProgress(100);
        
        // Add to uploaded files list
        const uploadedFile = {
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
            fileKey: fileKey,
            publicUrl: presignedData.public_url, // Add public URL
            uploadedAt: new Date().toISOString()
        };
        console.log('[Upload] constructed uploadedFile:', uploadedFile);

        setUploadedFiles(prev => [uploadedFile, ...prev]);
        
        // Reset form
        setSelectedFile(null);
        document.getElementById('file-input').value = '';

        } catch (error) {
        setUploadStatus(`Upload failed: ${error.message}`);
        setUploadProgress(0);
        } finally {
        setIsUploading(false);
        }
    };    

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileTypeIcon = (type) => {
        if (type.startsWith('image/')) return '🖼️';
        if (type.startsWith('video/')) return '🎥';
        if (type === 'application/pdf') return '📄';
        return '📁';
    };

    // Initialize Tiptap editor
    const editor = useEditor({
        extensions: [StarterKit],
        content: '<p>Use your preferred word processing program to write your course and then paste it here! Add headings, bold/italic, lists, quotes, and code—your formatting will be saved.</p>',
        onUpdate: ({ editor }) => {
            // Update course_content whenever editor changes
            const html = editor.getHTML();
            setCourseform(prev => ({ ...prev, course_content: html }));
        },
    });

    useEffect(() => {
        if (!auth?.token) {
            navigate("/login");
        }
    }, [auth, navigate]);

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleClickChange = (event) => {
        const { id, value } = event.target;
        setCourseform(prev => ({ ...prev, [id]: value }));
    };

    const handleClickSubmit = async (event) => {
        event.preventDefault();
        setError(null);

        // basic validation
        if (!courseform.title || !courseform.brief_description || !courseform.category) {
            setError("Title, description and category are required.");
            return;
        }

        const formData = new FormData();
        formData.append("title", courseform.title);
        formData.append("brief_description", courseform.brief_description);
        formData.append("course_content", courseform.course_content);
        formData.append("category", courseform.category);
        if (courseform.max_students) formData.append("max_students", Number(courseform.max_students));
        formData.append("is_open", true);
        if (uploadedFiles.length > 0 && uploadedFiles[0].publicUrl) {
            formData.append("image", uploadedFiles[0].publicUrl);
        }
        // Extra fields
        formData.append("difficulty_level", courseform.difficulty_level);
        if (courseform.duration_in_hours) {
            formData.append("duration_in_hours", Number(courseform.duration_in_hours));
        }
        if (courseform.learning_objectives) {
            formData.append("learning_objectives", courseform.learning_objectives);
        }
        if (courseform.enrollment_end) {
            const dt = new Date(courseform.enrollment_end);
            const value = Number.isNaN(dt.getTime()) ? courseform.enrollment_end : dt.toISOString();
            formData.append("enrollment_end", value);
        }
        formData.append("status", courseform.status);
        setLoading(true);
        try {
            const created = await postCreateCourse(formData, auth?.token);
            // navigate to created course page or home
            navigate(`/circles/${created.id}`);
        } catch (err) {
            console.error(err);
            setError(err?.message || "Failed to create course");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="form-grid create-course-form" onSubmit={handleClickSubmit}>
            {error && <p style={{ color: "red" }}>Error: {error}</p>}
            {loading && <p>Creating course...</p>}

            <div className="form-field">
                <label htmlFor="title">Circle Name</label>
                <input
                    type="text"
                    id="title"
                    placeholder="Name your circle"
                    onChange={handleClickChange}
                    required
                />
            </div>

            <div className="form-field">
                <label htmlFor="brief_description">Brief description of circle</label>
                <input
                    type="text"
                    id="brief_description"
                    placeholder="Enter brief description of course, max 250 characters"
                    maxLength={250}
                    onChange={handleClickChange}
                    required
                />
            </div>

            <div className="form-field">
                <label htmlFor="category">Category</label>
                <select
                    id="category"
                    onChange={handleClickChange}
                    required
                >
                    <option value="">--Please choose an option--</option>
                    {/* existing options unchanged */}
                    <option value="science and technology">Science and Technology</option>
                    <option value="arts and crafts">Arts and Crafts</option>
                    <option value="reading and writing">Reading and Writing</option>
                    <option value="music and musical instruments">Music and Musical Instruments</option>
                    <option value="languages">Languages</option>
                    <option value="health and wellness">Health and Wellness</option>
                    <option value="business and finance">Business and Finance</option>
                    <option value="personal development">Personal Development</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div className="form-field">
                <label htmlFor="difficulty_level">Difficulty Level</label>
                <select id="difficulty_level" onChange={handleClickChange} value={courseform.difficulty_level}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>

            <div className="form-field">
                <label htmlFor="course_content">Circle Details</label>
                <EditorContent editor={editor} className="tiptap" />
            </div>

            <div className="form-field">
                <label htmlFor="learning_objectives">Learning Objectives</label>
                <textarea
                    id="learning_objectives"
                    placeholder="List key objectives for learners"
                    onChange={handleClickChange}
                    rows={4}
                />
            </div>

            <div className="form-field">
                <label htmlFor="max_students">Maximum Participants</label>
                <input
                    type="number"
                    id="max_students"
                    placeholder="Enter maximum number of students"
                    onChange={handleClickChange}
                    min="1"
                    required
                />
            </div>

            <div className="form-field">
                <label htmlFor="duration_in_hours">Duration (hours)</label>
                <input
                    type="number"
                    id="duration_in_hours"
                    placeholder="e.g., 12"
                    onChange={handleClickChange}
                    min="1"
                />
            </div>

            <div className="form-field">
                <label htmlFor="enrollment_end">Join Deadline</label>
                <input
                    type="datetime-local"
                    id="enrollment_end"
                    onChange={handleClickChange}
                />
            </div>

            <div className="form-field">
                <label htmlFor="status">Status</label>
                <select id="status" onChange={handleClickChange} value={courseform.status}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                </select>
            </div>


        <div className="file-uploader">
            <div className="upload-section">
                <h2>Upload Files to S3</h2>
                <p className="upload-description">
                Upload images, videos, and PDFs to S3 storage. 
                <br />Supported: JPEG/PNG (15MB max), MP4/MOV (500MB max), PDF (50MB max)
                </p>

                <div className="file-input-container">
                <input
                    id="file-input"
                    type="file"
                    accept="image/jpeg,image/png,video/mp4,video/quicktime,application/pdf"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="file-input"
                />
                <label htmlFor="file-input" className={`file-input-label ${isUploading ? 'disabled' : ''}`}>
                    Choose File
                </label>
                </div>

                {selectedFile && (
                <div className="selected-file">
                    <div className="file-info">
                    <span className="file-icon">{getFileTypeIcon(selectedFile.type)}</span>
                    <div className="file-details">
                        <strong>{selectedFile.name}</strong>
                        <div className="file-meta">
                        {selectedFile.type} • {formatFileSize(selectedFile.size)}
                        </div>
                    </div>
                    </div>
                    
                    <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className={`upload-button ${isUploading ? 'uploading' : ''}`}
                    >
                    {isUploading ? 'Uploading...' : 'Upload File'}
                    </button>
                </div>
                )}

                {uploadProgress > 0 && (
                <div className="progress-container">
                    <div className="progress-bar">
                    <div 
                        className="progress-fill" 
                    ></div>
                    </div>
                    <span className="progress-text">{uploadProgress}%</span>
                </div>
                )}

                {uploadStatus && (
                <div className={`status-message ${uploadStatus.startsWith('Error') || uploadStatus.includes('failed') ? 'error' : uploadStatus.includes('success') ? 'success' : 'info'}`}>
                    {uploadStatus}
                </div>
                )}
            </div>

            {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                <h3>Recently Uploaded Files</h3>
                <div className="files-list">
                    {uploadedFiles.map((file, index) => (
                    <div key={index} className="uploaded-file-item">
                        <span className="file-icon">{getFileTypeIcon(file.type)}</span>
                        <div className="file-info">
                        <div className="file-name">{file.name}</div>
                        <div className="file-meta">
                            {formatFileSize(file.size)} • Uploaded {new Date(file.uploadedAt).toLocaleString()}
                        </div>
                        {/* <div className="file-key">S3 Key: {file.fileKey}</div> */}
                        {file.publicUrl && (
                            <div className="file-url">
                            <a href={file.publicUrl} target="_blank" rel="noopener noreferrer" className="public-link">
                                🌐 View Public Link
                            </a>
                            </div>
                        )}
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            )}
            </div>

            <div className="form-actions">
                <button type="submit" disabled={loading} className="primary-btn">
                    {loading ? "Starting..." : "Start Circle"}
                </button>
            </div>

            {error && (
                <div className="error" role="alert">
                    {error}
                </div>
            )}
        </form>
    );
}

export default CreateCourseForm;