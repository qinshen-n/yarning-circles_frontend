import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import postCreateCourse from "../api/post-createcourse.js";
import postCreateImageURL from "../api/post-createimageurl.js";
import postMilestone from "../api/post-milestone.js";  // ← Use single file

import { useAuth } from "../hooks/use-auth.js";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import MilestoneBuilder from "./MilestoneBuilder";
import "./CreateCourseForm.css";
import axios from 'axios'; 

function CreateCourseForm() {
    const navigate = useNavigate();
    const { auth } = useAuth();

    // Simplified form state
    const [courseform, setCourseform] = useState({
        title: "",
        brief_description: "",
        course_content: "",
        category: "",
        difficulty_level: "beginner",
        duration_in_hours: "",
        max_students: "",
    });

    // Milestones state
    const [milestones, setMilestones] = useState([]);

    // File upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);

    // File type configuration
    const supportedTypes = {
        'image/jpeg': { extensions: '.jpg, .jpeg', maxSize: 15 * 1024 * 1024 },
        'image/png': { extensions: '.png', maxSize: 15 * 1024 * 1024 },
        'video/mp4': { extensions: '.mp4', maxSize: 500 * 1024 * 1024 },
        'video/quicktime': { extensions: '.mov', maxSize: 500 * 1024 * 1024 },
        'application/pdf': { extensions: '.pdf', maxSize: 50 * 1024 * 1024 }
    };

    // Initialize Tiptap editor
    const editor = useEditor({
        extensions: [StarterKit],
        content: '<p>Start typing here...</p>',
        onUpdate: ({ editor }) => {
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

    // File upload handlers
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const fileTypeConfig = supportedTypes[file.type];
        const maxSize = fileTypeConfig?.maxSize;
        const maxSizeMB = maxSize / (1024 * 1024);

        if (!fileTypeConfig) {
            setUploadStatus('Error: Unsupported file type. Please select JPEG, PNG, MP4, MOV, or PDF files.');
            return;
        } else if (file.size > maxSize) {
            setUploadStatus(`Error: File size too large. Maximum size for ${file.type} is ${maxSizeMB}MB.`);
            return;
        }
        
        setSelectedFile(file);
        setUploadStatus('');
        setUploadProgress(0);
    };

    const getPresignedUrl = async (file) => {
        try {
            const response = await postCreateImageURL({          
                file_name: file.name,
                file_type: file.type,
                file_size: file.size
            }, auth?.token);
            return response;
        } catch (error) {
            console.error('Error getting presigned URL:', error);
            throw new Error('Failed to get upload URL from server');
        }
    };

    const uploadToS3 = async (file, presignedData) => {
        const formData = new FormData();
        
        Object.keys(presignedData.fields).forEach(key => {
            formData.append(key, presignedData.fields[key]);
        });
        formData.append('file', file);

        try {
            await axios.post(presignedData.upload_url, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
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
            setUploadStatus('Getting upload URL...');
            const presignedData = await getPresignedUrl(selectedFile);

            setUploadStatus('Uploading file...');
            const fileKey = await uploadToS3(selectedFile, presignedData);

            setUploadStatus('Upload completed successfully!');
            setUploadProgress(100);
            
            const uploadedFile = {
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size,
                fileKey: fileKey,
                publicUrl: presignedData.public_url,
                uploadedAt: new Date().toISOString()
            };

            setUploadedFiles(prev => [uploadedFile, ...prev]);
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

    const handleClickChange = (event) => {
        const { id, value } = event.target;
        setCourseform(prev => ({ ...prev, [id]: value }));
    };

    const handleClickSubmit = async (event) => {
        event.preventDefault();
        setError(null);

        // Validation
        if (!courseform.title || !courseform.brief_description || !courseform.category) {
            setError("Title, description and category are required.");
            return;
        }

        // Validate milestones if any exist
        if (milestones.length > 0) {
            const hasEmptyTitle = milestones.some(m => !m.title.trim());
            if (hasEmptyTitle) {
                setError("All modules must have a title. Please fill in or remove empty modules.");
                return;
            }
        }

        setLoading(true);

        try {
            // Step 1: Create the circle
            const formData = new FormData();
            formData.append("title", courseform.title);
            formData.append("brief_description", courseform.brief_description);
            formData.append("course_content", courseform.course_content);
            formData.append("category", courseform.category);
            formData.append("difficulty_level", courseform.difficulty_level);
            
            if (courseform.duration_in_hours) {
                formData.append("duration_in_hours", Number(courseform.duration_in_hours));
            }
            if (courseform.max_students) {
                formData.append("max_students", Number(courseform.max_students));
            }
            
            // Auto-set fields
            formData.append("is_open", true);
            formData.append("status", "published");
            
            if (uploadedFiles.length > 0 && uploadedFiles[0].publicUrl) {
                formData.append("image", uploadedFiles[0].publicUrl);
            }

            const created = await postCreateCourse(formData, auth?.token);
            // Step 2: Create milestones if any (loop through each)
            if (milestones.length > 0) {
                try {
                    for (const milestone of milestones) {
                        const milestoneData = {
                            title: milestone.title,
                            // Always send description with content
                            description: milestone.description && milestone.description.trim() 
                                ? milestone.description.trim() 
                                : "No description provided",
                            order: milestone.order
                        };

                        await postMilestone(created.id, milestoneData, auth?.token);
                    }
                    console.log(`✅ Successfully created ${milestones.length} new milestone(s)`);
                } catch (milestoneError) {
                    console.error("Failed to create milestone:", milestoneError);
                    // Continue anyway - some milestones may have been created
                }
            }

            // Navigate to created circle
            navigate(`/circles/${created.id}`);

        } catch (err) {
            console.error(err);
            setError(err?.message || "Failed to create circle");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-page">
            <form className="create-course-form" onSubmit={handleClickSubmit}>
                
                {error && <div className="error-message">{error}</div>}

                {/* ═══ SECTION 1: CIRCLE BASICS ═══ */}
                <section className="form-section">
                    <div className="form-field">
                        <label htmlFor="title">Circle Name *</label>
                        <input
                            type="text"
                            id="title"
                            placeholder="What will you learn together?"
                            onChange={handleClickChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="brief_description">Brief Description *</label>
                        <textarea
                            id="brief_description"
                            placeholder="A short overview of what this circle is about (max 250 characters)"
                            maxLength={250}
                            onChange={handleClickChange}
                            rows="3"
                            required
                        />
                        <span className="char-count">{courseform.brief_description.length}/250</span>
                    </div>

                    <div className="form-field">
                        <label htmlFor="category">Category *</label>
                        <select id="category" onChange={handleClickChange} required>
                            <option value="">--Select a category--</option>
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
                </section>

                {/* ═══ SECTION 2: WHAT WE'LL LEARN ═══ */}
                <section className="form-section">
                    <h2 className="section-title">What We'll Learn Together</h2>
                    <p className="section-hint">
                        Share the detailed curriculum, goals, and what to expect. 
                        Use formatting to make it easy to read.
                    </p>

                    <div className="form-field">
                        <EditorContent editor={editor} className="tiptap" />
                    </div>
                </section>

                {/* ═══ SECTION 3: LEARNING MODULES ═══ */}
                <section className="form-section">
                    <h2 className="section-title">📚 Learning Modules (Optional)</h2>
                    <p className="section-hint">
                        Break down the learning journey into trackable modules. 
                        Members can check off modules as they progress through the circle.
                    </p>

                    <MilestoneBuilder 
                        milestones={milestones} 
                        setMilestones={setMilestones} 
                    />
                </section>

                {/* ═══ SECTION 4: CIRCLE SETTINGS ═══ */}
                <section className="form-section">
                    <h2 className="section-title">Circle Settings</h2>

                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="difficulty_level">Difficulty Level</label>
                            <select 
                                id="difficulty_level" 
                                onChange={handleClickChange} 
                                value={courseform.difficulty_level}
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label htmlFor="duration_in_hours">Estimated Duration (hours)</label>
                            <input
                                type="number"
                                id="duration_in_hours"
                                placeholder="e.g., 12"
                                onChange={handleClickChange}
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label htmlFor="max_students">Maximum Participants *</label>
                        <input
                            type="number"
                            id="max_students"
                            placeholder="How many people can join?"
                            onChange={handleClickChange}
                            min="1"
                            required
                        />
                    </div>
                </section>

                {/* ═══ SECTION 5: RESOURCES ═══ */}
                <section className="form-section">
                    <h2 className="section-title">📎 Resources</h2>
                    <p className="section-hint">
                        Upload images, videos, or PDFs to share with circle members.
                    </p>

                    <div className="file-uploader">
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
                                        style={{ width: `${uploadProgress}%` }}
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

                        {uploadedFiles.length > 0 && (
                            <div className="uploaded-files-preview">
                                <p className="upload-success">✓ File uploaded successfully</p>
                                <div className="uploaded-file-item">
                                    <span className="file-icon">{getFileTypeIcon(uploadedFiles[0].type)}</span>
                                    <div className="file-info">
                                        <div className="file-name">{uploadedFiles[0].name}</div>
                                        <a href={uploadedFiles[0].publicUrl} target="_blank" rel="noopener noreferrer" className="view-link">
                                            View uploaded file →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ═══ SUBMIT BUTTON ═══ */}
                <div className="form-actions">
                    <button type="submit" disabled={loading} className="primary-btn">
                        {loading ? "Creating Circle..." : "Start Circle"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateCourseForm;