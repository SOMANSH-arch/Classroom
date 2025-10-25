'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Box, Button, Container, TextField, Typography, CircularProgress, Divider, Alert } from '@mui/material';
import styles from "../teacherCourses.module.css";

export default function CourseManagementPage() {
    const params = useParams();
    const courseId = params.courseId as string;
    const router = useRouter(); 

    const [course, setCourse] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showEditForm, setShowEditForm] = useState(true); // Control visibility of the edit form

    // Helper to load course
    const loadCourse = async () => {
        try {
            setLoading(true);
            const data = await api(`/api/courses/${courseId}/my`);
            const courseData = data.course;
            setCourse(courseData);
            
            if (courseData) {
                setTitle(courseData.title);
                setDescription(courseData.description || '');
                setPrice((courseData.price / 100).toFixed(2));
            }
        } catch (err) {
            console.error(err);
            // Alert user that course failed to load
            alert('Failed to load course details. Check console for error.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            loadCourse();
        }
    }, [courseId]);

    const handleUpdate = async () => {
        try {
            setSaving(true);
            const priceInPaise = Math.round(parseFloat(price) * 100);
            if (isNaN(priceInPaise) || priceInPaise < 0) {
                alert('Please enter a valid price (0 or more).');
                setSaving(false); return;
            }
            const body = JSON.stringify({ title, description, price: priceInPaise });
            await api(`/api/courses/${courseId}`, { method: 'PUT', body: body });
            alert('Course updated successfully!');
            // After successful update, hide the form and show the updated details (optional)
            setShowEditForm(false);
        } catch (err) {
            console.error(err); alert('Failed to update course.');
        } finally {
            setSaving(false);
        }
    };

    // --- NAVIGATION HELPERS ---
    const navigateToAssignments = () => {
        router.push(`/teacher/assignments?courseId=${courseId}`);
    };

    const navigateToMaterials = () => {
        router.push(`/teacher/materials?courseId=${courseId}`);
    };
    // --- END NAVIGATION HELPERS ---


    if (loading) {
         return ( <Container className={styles.page} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}> <CircularProgress sx={{ color: '#f39c12' }}/> </Container> );
    }

    if (!course) {
         return ( <Container className={styles.page}><Typography variant="h5" sx={{color: '#aaa', textAlign: 'center', mt: 4}}>Course not found.</Typography></Container> );
    }

    return (
        <Container className={styles.page} maxWidth="md" disableGutters>
            {/* --- COURSE DASHBOARD HEADER --- */}
            <Typography variant="h3" component="h1" sx={{ color: '#f39c12', mt: 4, mb: 1 }}>
                <b>{course.title}</b>
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#aaa', mb: 4 }}>
                Management Hub for **{course.title}**
            </Typography>

            {/* --- 1. MANAGEMENT BUTTONS (THE HUB) --- */}
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} mb={4}>
                <Button variant="contained" onClick={() => setShowEditForm(!showEditForm)} sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#e67e22' } }}>
                    {showEditForm ? 'Hide Details' : 'Edit Course Details'}
                </Button>
                <Button variant="outlined" onClick={navigateToAssignments} sx={{ color: '#f39c12', borderColor: '#f39c12' }}>
                    Manage Assignments
                </Button>
                <Button variant="outlined" onClick={navigateToMaterials} sx={{ color: '#f39c12', borderColor: '#f39c12' }}>
                    Post Materials
                </Button>
            </Box>
            
            <Divider sx={{ my: 4, borderColor: '#444' }} />
            
            {/* --- 2. EDIT COURSE FORM (Conditionally Visible) --- */}
            {showEditForm && (
                <>
                    <Typography variant="h4" component="h1" sx={{ color: '#eee', mb: 3 }}>
                        Course Details
                    </Typography>
                    {/* Display publish status */}
                    <Alert severity={course.published ? "success" : "warning"} sx={{mb: 3, bgcolor: course.published ? '#2e7d32' : '#f57c00', color: 'white'}}>
                        Status: **{course.published ? 'Published' : 'Draft'}**
                    </Alert>
                    
                    <Box className={styles.form} sx={{ mb: 6, bgcolor: '#2d2d2d', p: 3, borderRadius: 2 }}>
                        <TextField label="Course Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth sx={{mb:2}} />
                        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={4} fullWidth sx={{mb:2}}/>
                        <TextField label="Price (in ₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 100.00 (Enter 0 for free)" fullWidth sx={{mb:2}}/>
                        <Button onClick={handleUpdate} disabled={saving} fullWidth sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#e67e22' } }}>
                            {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                        </Button>
                    </Box>
                    <Divider sx={{ my: 4, borderColor: '#444' }} />
                </>
            )}


            {/* --- 3. INSTRUCTIONS / PROMPT --- */}
            {!showEditForm && (
                 <Typography variant="h5" component="h1" sx={{ color: '#aaa', mt: 4, textAlign: 'center' }}>
                     Please use the buttons above to manage content and assignments for this course.
                 </Typography>
            )}

        </Container>
    );
}