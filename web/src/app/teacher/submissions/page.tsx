
"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from 'react';
import { api, API_BASE } from '@/lib/api';
import {
    Box, Button, Container, MenuItem, Select, TextField, Typography, List, Divider,
    SelectChangeEvent, Link as MuiLink, CircularProgress
} from '@mui/material';
import { useSearchParams } from 'next/navigation'; // <-- 1. Import useSearchParams
import styles from "./teacherSubmissions.module.css";

interface GradingState { score: string; feedback: string; }

export default function TeacherSubmissionsPage() {
    const searchParams = useSearchParams(); // <-- 2. Get search params hook

    const [courses, setCourses] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedAssignment, setSelectedAssignment] = useState('');
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [gradingStates, setGradingStates] = useState<{ [key: string]: GradingState }>({});
    const [loadingCourses, setLoadingCourses] = useState(true); // Added loading state
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    // --- 3. useEffect to initialize from URL params ---
    useEffect(() => {
        const courseIdFromUrl = searchParams.get('courseId');
        const assignmentIdFromUrl = searchParams.get('assignmentId');

        // Load courses initially regardless of URL params
        const fetchInitialCourses = async () => {
             setLoadingCourses(true);
             try {
                 const data = await api('/api/courses/my');
                 setCourses(data.courses || []);
                 // If courseId exists in URL, set it
                 if (courseIdFromUrl && data.courses?.some((c:any) => c._id === courseIdFromUrl)) {
                    setSelectedCourse(courseIdFromUrl);
                    // Assignments will load via the next useEffect
                 }
             } catch (err) { console.error("Error loading initial courses:", err); }
             finally { setLoadingCourses(false); }
        };

        fetchInitialCourses();

        // We'll set selectedAssignment in the useEffect that loads assignments
        // To ensure assignments are loaded first

    }, [searchParams]); // Re-run if searchParams change (though usually only on initial load)

    // --- 4. useEffect to load assignments when selectedCourse changes ---
    useEffect(() => {
        const assignmentIdFromUrl = searchParams.get('assignmentId'); // Get again

        const fetchAssignments = async () => {
            if (!selectedCourse) return; // Don't fetch if no course selected

            setLoadingAssignments(true);
            setAssignments([]); // Clear previous
            setSubmissions([]);
            setGradingStates({});

            try {
                const data = await api(`/api/assignments/course/${selectedCourse}`);
                const fetchedAssignments = data.assignments || [];
                setAssignments(fetchedAssignments);

                // If assignmentId exists in URL and matches an assignment in this course, set it
                 if (assignmentIdFromUrl && fetchedAssignments.some((a:any) => a._id === assignmentIdFromUrl)) {
                    setSelectedAssignment(assignmentIdFromUrl);
                    // Submissions will load via the next useEffect
                }

            } catch (err) { console.error("Error loading assignments:", err); }
            finally { setLoadingAssignments(false); }
        };

        fetchAssignments();
    }, [selectedCourse, searchParams]); // Run when selectedCourse changes

    // --- 5. useEffect to load submissions when selectedAssignment changes ---
    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!selectedAssignment) return; // Don't fetch if no assignment selected

            setLoadingSubmissions(true);
            setSubmissions([]); // Clear previous
            setGradingStates({}); // Clear previous

            try {
                const data = await api(`/api/submissions/assignment/${selectedAssignment}`);
                const fetchedSubmissions = data.submissions || [];
                setSubmissions(fetchedSubmissions);

                // Initialize grading states
                const initialGradingStates: { [key: string]: GradingState } = {};
                fetchedSubmissions.forEach((sub: any) => {
                     initialGradingStates[sub._id] = {
                         score: sub.score !== undefined && sub.score !== null ? String(sub.score) : '',
                         feedback: sub.feedback || ''
                     };
                });
                setGradingStates(initialGradingStates);
                console.log("Fetched submissions automatically:", fetchedSubmissions);

            } catch (err) { console.error("Error loading submissions:", err); }
             finally { setLoadingSubmissions(false); }
        };

        fetchSubmissions();
    }, [selectedAssignment]); // Run when selectedAssignment changes


    // --- Handlers for manual dropdown changes ---
    const handleCourseChange = (event: SelectChangeEvent<string>) => {
        const courseId = event.target.value;
        // Setting selectedCourse will trigger the useEffect above to load assignments
        setSelectedCourse(courseId);
        // Reset lower selections
        setSelectedAssignment('');
        setAssignments([]);
        setSubmissions([]);
        setGradingStates({});
    };
    const handleAssignmentChange = (event: SelectChangeEvent<string>) => {
         const assignmentId = event.target.value;
         // Setting selectedAssignment will trigger the useEffect above to load submissions
         setSelectedAssignment(assignmentId);
         setSubmissions([]);
         setGradingStates({});
    };

    // --- Other functions (handleGradeChange, gradeSubmission) remain the same ---
     const handleGradeChange = (submissionId: string, field: 'score' | 'feedback', value: string) => { /* ... */ };
     const gradeSubmission = async (submissionId: string) => { /* ... */ };


    // --- RENDER ---
    return (
        <Container className={styles.page} maxWidth={false} disableGutters>
            <Typography className={styles.sectionTitle} variant="h4" sx={{ color: '#f39c12', mt: 4, mb: 2 }}>
                Grade Submissions
            </Typography>

            {/* Select Course */}
            <Box mb={2}>
                {loadingCourses ? <CircularProgress size={24} /> : (
                    <Select value={selectedCourse} onChange={handleCourseChange} displayEmpty fullWidth sx={{ /* Styles */ }}>
                        <MenuItem value="" disabled>Select a Course</MenuItem>
                        {courses.map(c => ( <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem> ))}
                    </Select>
                )}
            </Box>

            {/* Select Assignment */}
            {selectedCourse && (
                <Box mb={3}>
                    {loadingAssignments ? <CircularProgress size={24} /> : (
                        <Select value={selectedAssignment} onChange={handleAssignmentChange} displayEmpty fullWidth sx={{ /* Styles */ }}>
                            <MenuItem value="" disabled>Select an Assignment</MenuItem>
                            {assignments.map(a => ( <MenuItem key={a._id} value={a._id}>{a.title}</MenuItem> ))}
                        </Select>
                    )}
                </Box>
            )}

            {/* Loading Indicator for Submissions */}
            {loadingSubmissions && <Box sx={{display: 'flex', justifyContent: 'center'}}><CircularProgress sx={{color: '#f39c12'}}/></Box>}

            {/* Submissions List */}
            {!loadingSubmissions && selectedAssignment && (
                 <List>
                     {/* ... (Existing map logic to display submissions and grading form) ... */}
                     {submissions.length === 0 && <Typography sx={{color: '#aaa', textAlign: 'center'}}>No submissions for this assignment yet.</Typography>}
                     {submissions.map((s) => {
                         const currentGradeState = gradingStates[s._id] || { score: '', feedback: '' };
                         return (
                            <Box key={s._id} className={styles.submissionCard} sx={{ bgcolor: '#2d2d2d', p: 3, borderRadius: 2, mb: 3 }}>
                                {/* Display Student Info */}
                                <Typography variant="h6" sx={{ color: '#eee' }}>{s.student?.name || 'Unknown'}</Typography>
                                <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>{s.student?.email}</Typography>
                                <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 2 }}>Submitted: {new Date(s.createdAt).toLocaleString()}</Typography>

                                {/* Display Content */}
                                {s.content && ( <Box mt={1} mb={2}> {/* ... */} </Box> )}

                                {/* Display File */}
                                {s.file && s.file.url && ( <Box mt={s.content ? 2 : 0} mb={2}> {/* ... file link ... */} </Box> )}

                                {/* Grading Form */}
                                <Divider sx={{ my: 2, borderColor: '#444' }} />
                                <Typography variant="subtitle1" sx={{ color: '#ccc', fontWeight: 'bold', mb: 1 }}>Grade:</Typography>
                                <Box display="flex" flexDirection="column" gap={2}>
                                    <TextField label="Score (0-100)" type="number" value={currentGradeState.score} onChange={(e) => handleGradeChange(s._id, 'score', e.target.value)} InputProps={{ inputProps: { min: 0, max: 100 }, sx:{/*...*/} }} InputLabelProps={{ sx:{/*...*/} }} size="small" />
                                    <TextField label="Feedback" multiline rows={3} value={currentGradeState.feedback} onChange={(e) => handleGradeChange(s._id, 'feedback', e.target.value)} InputProps={{ sx:{/*...*/} }} InputLabelProps={{ sx:{/*...*/} }} />
                                    <Button className={styles.button} onClick={() => gradeSubmission(s._id)} variant="contained" sx={{ bgcolor: '#f39c12', /*...*/ }}> Save Grade </Button>
                                </Box>
                            </Box>
                         );
                     })}
                </List>
            )}
        </Container>
    );
} // Added missing closing brace and simplified some internal code for brevity