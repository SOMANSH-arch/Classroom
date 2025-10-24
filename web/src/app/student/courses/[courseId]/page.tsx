'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, API_BASE } from '@/lib/api';
import { Box, Button, Container, Typography, List, ListItem, CircularProgress, Paper, Divider, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

export default function StudentCoursePage() {
    const params = useParams();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<any>(null);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only run if courseId is valid
        if (!courseId) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setCourse(null); // Clear previous data
        setAssignments([]);

        console.log(`useEffect triggered for courseId: ${courseId}`);

        const loadData = async () => {
            try {
                console.log("Starting API calls...");
                // Fetch course and assignments in parallel
                const [courseRes, assignRes] = await Promise.all([
                    api(`/api/courses/${courseId}/student-details`),
                    api(`/api/assignments/course/${courseId}`)
                ]);

                if (isMounted) {
                    console.log("API calls finished. Course data:", courseRes);
                    console.log("Assignment data:", assignRes);

                    const fetchedCourse = courseRes?.course || null;
                    const fetchedAssignments = assignRes?.assignments || [];

                    setCourse(fetchedCourse);
                    setAssignments(fetchedAssignments);

                    if (!fetchedCourse) {
                        console.warn("Course data received from API was null or undefined.");
                    }
                } else {
                    console.log("Component unmounted before API calls finished.");
                }

            } catch (err) {
                console.error("!!! Critical Error loading course data:", err);
                // Don't alert here, let the UI show "Not Found" or handle appropriately
                 if (isMounted) {
                    setCourse(null);
                    setAssignments([]);
                 }
            } finally {
                 if (isMounted) {
                    console.log("Setting loading to false.");
                    setLoading(false);
                 }
            }
        };

        loadData();

        // Cleanup function
        return () => {
            isMounted = false;
            console.log("Cleanup function ran.");
        };
    }, [courseId]);


    // --- Render Loading / Not Found ---
    if (loading) {
        console.log("Rendering: Loading State");
        return <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: '#f39c12' }} /></Container>;
    }
    if (!loading && !course) {
        console.log("Rendering: Not Found State");
        return <Container sx={{ py: 4 }}><Typography sx={{color: '#aaa', textAlign: 'center'}}>Course not found or you are not enrolled.</Typography></Container>;
    }

    // --- RENDER MAIN CONTENT (Lists UNCOMMENTED) ---
    console.log("Rendering: Main Content");
    return (
        <Container sx={{ py: 4 }} maxWidth="md">
            <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#f39c12' }}>
                <b>{course?.title}</b>
            </Typography>
            <Typography variant="body1" sx={{ color: '#ccc' }} gutterBottom>
                {course?.description}
            </Typography>

            <Divider sx={{ my: 4, borderColor: '#444' }} />

            {/* --- MATERIALS LIST (UNCOMMENTED) --- */}
            <Typography variant="h4" component="h2" gutterBottom sx={{ color: '#f39c12' }}>
                <b>Course Materials</b>
            </Typography>
            <List>
                {(course?.materials?.length ?? 0) === 0 && <Typography sx={{ color: '#aaa' }}>No materials posted yet.</Typography>}
                {course?.materials?.slice().reverse().map((material: any) => (
                    <ListItem key={material._id} sx={{ bgcolor: '#2d2d2d', mb: 2, borderRadius: 2, display: 'block' }}>
                        <Typography variant="h6" sx={{ color: '#eee' }}><b>{material.title}</b></Typography>
                        {material.description && (
                            <Typography variant="body2" sx={{ color: '#ccc', mt: 1, whiteSpace: 'pre-wrap' }}>
                            {material.description}
                            </Typography>
                        )}
                        {material.filePath && (
                            <MuiLink
                                href={material.filePath} // Use Cloudinary/S3 URL directly
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ display: 'block', mt: 1, color: '#f39c12', fontWeight: 'bold' }}
                            >
                                View File: {material.fileName || 'Download'}
                            </MuiLink>
                        )}
                         <Typography variant="caption" sx={{ color: '#888', mt: 1, display: 'block' }}>
                          Posted: {new Date(material.createdAt).toLocaleString()}
                        </Typography>
                    </ListItem>
                ))}
            </List>

            <Divider sx={{ my: 4, borderColor: '#444' }} />

            {/* --- ASSIGNMENTS LIST (UNCOMMENTED) --- */}
            <Typography variant="h4" component="h2" gutterBottom sx={{ color: '#f39c12' }}>
                <b>Assignments</b>
            </Typography>
            <List>
                {(assignments?.length ?? 0) === 0 && <Typography sx={{ color: '#aaa' }}>No assignments posted yet.</Typography>}
                {assignments.map((assignment) => (
                    <ListItem
                        key={assignment._id}
                        component={Link} // Use Next.js Link for routing
                        href={`/student/assignments/${assignment._id}`}
                        sx={{
                            bgcolor: '#2d2d2d', mb: 2, borderRadius: 2, display: 'flex',
                            justifyContent: 'space-between', cursor: 'pointer', textDecoration: 'none',
                            '&:hover': { bgcolor: '#3a3a3a' }
                        }}
                    >
                        <Box>
                            <Typography variant="h6" sx={{ color: '#eee' }}><b>{assignment.title}</b></Typography>
                            <Typography variant="body2" sx={{ color: '#aaa' }}>
                                Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                            </Typography>
                        </Box>
                        <Button variant="contained" sx={{ my: 'auto', bgcolor: '#f39c12', '&:hover': { bgcolor: '#e67e22' } }}>View</Button>
                    </ListItem>
                ))}
            </List>
        </Container>
    );
}