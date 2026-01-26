const ENROLLMENT_KEY_PREFIX = 'enrolled_course_';

// Check if a user is enrolled in a circle
export function isEnrolled(courseId, username) {
    if (!courseId || !username) return false;
    const key = `${ENROLLMENT_KEY_PREFIX}${courseId}`;
    const data = localStorage.getItem(key);
    if (!data) return false;
    try {
        const enrolled = JSON.parse(data);
        return Array.isArray(enrolled) && enrolled.includes(username);
    } catch {
        return false;
    }
}

// Enroll a user in a circle
export function enroll(courseId, username, maxStudents = null) {
    if (!courseId || !username) {
        return { ok: false, reason: 'missing_params' };
    }

    const key = `${ENROLLMENT_KEY_PREFIX}${courseId}`;
    const data = localStorage.getItem(key);
    let enrolled = [];

    try {
        if (data) enrolled = JSON.parse(data);
        if (!Array.isArray(enrolled)) enrolled = [];
    } catch {
        enrolled = [];
    }

    // Check if already enrolled
    if (enrolled.includes(username)) {
        return { ok: false, reason: 'already_enrolled' };
    }

    // Check capacity
    if (maxStudents && enrolled.length >= maxStudents) {
        return { ok: false, reason: 'full' };
    }

    enrolled.push(username);
    localStorage.setItem(key, JSON.stringify(enrolled));
    return { ok: true };
}

// Check if a circle is full
export function isFull(courseId, maxStudents) {
    if (!maxStudents || maxStudents <= 0) return false;
    const count = getCount(courseId);
    return count >= maxStudents;
}

// Get count of enrolled users
export function getCount(courseId) {
    if (!courseId) return 0;
    const key = `${ENROLLMENT_KEY_PREFIX}${courseId}`;
    const data = localStorage.getItem(key);
    if (!data) return 0;
    try {
        const enrolled = JSON.parse(data);
        return Array.isArray(enrolled) ? enrolled.length : 0;
    } catch {
        return 0;
    }
}

// Get list of enrolled usernames for a specific circle
export function getEnrolledUsers(courseId) {
    if (!courseId) return [];
    const key = `${ENROLLMENT_KEY_PREFIX}${courseId}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    try {
        const enrolled = JSON.parse(data);
        return Array.isArray(enrolled) ? enrolled : [];
    } catch {
        return [];
    }
}

// Used by UserPage.jsx
export function getCoursesForUser(username) {
    if (!username) return [];
    const enrolledCourseIds = [];

    // LocalStorage isn't a database, so we must iterate keys to find matches
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Only look at enrollment keys
        if (key.startsWith(ENROLLMENT_KEY_PREFIX)) {
            try {
                const users = JSON.parse(localStorage.getItem(key));
                // If this user is in the list, add the Course ID
                if (Array.isArray(users) && users.includes(username)) {
                    const courseId = key.replace(ENROLLMENT_KEY_PREFIX, '');
                    enrolledCourseIds.push(courseId);
                }
            } catch (e) {
                console.error("Error parsing enrollment data", e);
            }
        }
    }
    return enrolledCourseIds;
}