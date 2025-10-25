// web/src/app/teacher/submissions/SubmissionsClient.tsx
'use client';
import { useEffect, useState } from 'react';
import { api, API_BASE } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import {
    Box,
    Button,
    Container,
    MenuItem,
    Select,
    TextField,
    Typography,
    List,
    Divider,
    SelectChangeEvent,
    Link as MuiLink,
    CircularProgress
} from '@mui/material';
import styles from "./teacherSubmissions.module.css";

// Interface for grading state
interface GradingState {
    score: string;
    feedback: string;
}

// --- CHANGE: Export named function (not default) ---
export function SubmissionsClient() {
    const searchParams = useSearchParams();
    // Read parameters from the URL
    const initialCourseId = searchParams.get('courseId') || '';
    const initialAssignmentId = searchParams.get('assignmentId') || '';


    const [courses, setCourses] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState(initialCourseId);
    const [selectedAssignment, setSelectedAssignment] = useState(initialAssignmentId);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [gradingStates, setGradingStates] = useState<{ [key: string]: GradingState }>({});
    
    // Loading States
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);


    // --- 1. EFFECT: Load courses and set initial selection from URL ---
    useEffect(() => {
        const fetchInitialCourses = async () => {
             setLoadingCourses(true);
             try {
                 const data = await api('/api/courses/my');
                 const fetchedCourses = data.courses || [];
                 setCourses(fetchedCourses);

                 // Use initialCourseId if it's present and valid
                 if (initialCourseId && fetchedCourses.some((c:any) => c._id === initialCourseId)) {
                    // State is already initialized, but we confirm it here
                    setSelectedCourse(initialCourseId); 
                 } else if (initialCourseId) {
                    // Clear invalid URL ID
                    setSelectedCourse('');
                 }
             } catch (err) { console.error("Error loading initial courses:", err); }
             finally { setLoadingCourses(false); }
        };

        fetchInitialCourses();
    }, [initialCourseId]);


    // --- 2. EFFECT: Load assignments when selectedCourse changes (or is set by URL) ---
    useEffect(() => {
        const fetchAssignments = async () => {
            if (!selectedCourse) return;

            setLoadingAssignments(true);
            setAssignments([]);
            // submissions and gradingStates will be cleared by the next effect

            try {
                const data = await api(`/api/assignments/course/${selectedCourse}`);
                const fetchedAssignments = data.assignments || [];
                setAssignments(fetchedAssignments);

                // If assignmentId exists in URL, set it automatically
                 if (initialAssignmentId && fetchedAssignments.some((a:any) => a._id === initialAssignmentId)) {
                    setSelectedAssignment(initialAssignmentId);
                } else if (initialAssignmentId) {
                    // Clear invalid assignment ID if URL provided one
                    setSelectedAssignment('');
                }

            } catch (err) { console.error("Error loading assignments:", err); }
            finally { setLoadingAssignments(false); }
        };

        fetchAssignments();
    }, [selectedCourse, initialAssignmentId]); // Run when selectedCourse changes

    // --- 3. EFFECT: Load submissions when selectedAssignment changes (or is set by URL) ---
    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!selectedAssignment) return;

            setLoadingSubmissions(true);
            setSubmissions([]);
            setGradingStates({});

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

            } catch (err) { console.error("Error loading submissions:", err); }
             finally { setLoadingSubmissions(false); }
        };

        fetchSubmissions();
    }, [selectedAssignment]); // Run when selectedAssignment changes


    // --- Handlers for manual dropdown changes ---
    const handleCourseChange = (event: SelectChangeEvent<string>) => {
        const courseId = event.target.value;
        // Setting selectedCourse will trigger useEffect 2
        setSelectedCourse(courseId);
        // Reset lower selections manually to avoid useEffect run conflicts
        setSelectedAssignment('');
        setAssignments([]);
        setSubmissions([]);
        setGradingStates({});
    };

    const handleAssignmentChange = (event: SelectChangeEvent<string>) => {
         const assignmentId = event.target.value;
         // Setting selectedAssignment will trigger useEffect 3
         setSelectedAssignment(assignmentId);
         setSubmissions([]);
         setGradingStates({});
    };

    // Handle changes in score/feedback fields
    const handleGradeChange = (submissionId: string, field: 'score' | 'feedback', value: string) => {
        setGradingStates(prev => ({
            ...prev,
            [submissionId]: {
                ...(prev[submissionId] || { score: '', feedback: '' }),
                [field]: value
            }
        }));
    };


    // Save/Update grade for a specific submission
    const gradeSubmission = async (submissionId: string) => {
        const currentGradeState = gradingStates[submissionId];
        if (!currentGradeState) return;

        // Validate score
        const scoreValue = currentGradeState.score.trim() === '' ? null : Number(currentGradeState.score);
        if (currentGradeState.score.trim() !== '' && (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100)) {
            alert('Please enter a valid score between 0 and 100, or leave it blank.');
            return;
        }

        try {
            await api(`/api/submissions/${submissionId}/grade`, {
                method: 'PATCH',
                body: JSON.stringify({ score: scoreValue, feedback: currentGradeState.feedback }),
            });
            alert('Grade saved successfully!');
            
            // Update the main submissions state slightly to reflect save 
             setSubmissions(prevSubs => prevSubs.map(sub =>
                 sub._id === submissionId
                 ? { ...sub, score: scoreValue, feedback: currentGradeState.feedback }
                 : sub
             ));

        } catch (err) {
            console.error("Error saving grade:", err);
            alert('Error saving grade. Please try again.');
        }
    };

    return (
        <Container className={styles.page} maxWidth={false} disableGutters>
            <Typography className={styles.sectionTitle} variant="h4" sx={{ color: '#f39c12', mt: 4, mb: 2 }}>
                Grade Submissions
            </Typography>

            {/* Select Course */}
            <Box mb={2}>
                {loadingCourses ? <CircularProgress size={24} sx={{color: '#f39c12'}}/> : (
                    <Select
                        value={selectedCourse}
                        onChange={handleCourseChange}
                        displayEmpty fullWidth
                        // Disable if pre-selected from Hub
                        disabled={!!initialCourseId}
                        sx={{ color: '#eee', bgcolor: '#2d2d2d', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' }, '& .MuiSelect-icon': { color: '#aaa' } }}
                        MenuProps={{ PaperProps: { sx: { bgcolor: '#2d2d2d', color: '#eee' } } }}
                    >
                        <MenuItem value="" disabled>
                            {initialCourseId ? (courses.find(c => c._id === initialCourseId)?.title || 'Course Pre-Selected') : 'Select a Course'}
                        </MenuItem>
                        {courses.map(c => ( <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem> ))}
                    </Select>
                )}
                 {initialCourseId && <Typography variant="caption" sx={{ color: '#aaa', mt: 1, display: 'block' }}>Course pre-selected from the Management Hub.</Typography>}
            </Box>

            {/* Select Assignment */}
            {selectedCourse && (
                <Box mb={3}>
                    {loadingAssignments ? <CircularProgress size={24} sx={{color: '#f39c12'}}/> : (
                        <Select
                            value={selectedAssignment}
                            onChange={handleAssignmentChange}
                            displayEmpty fullWidth
                             // Disable if pre-selected from Hub
                            disabled={!!initialAssignmentId}
                            sx={{ color: '#eee', bgcolor: '#2d2d2d', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' }, '& .MuiSelect-icon': { color: '#aaa' } }}
                             MenuProps={{ PaperProps: { sx: { bgcolor: '#2d2d2d', color: '#eee' } } }}
                        >
                            <MenuItem value="" disabled>Select an Assignment</MenuItem>
                            {assignments.map(a => ( <MenuItem key={a._id} value={a._id}>{a.title}</MenuItem> ))}
                        </Select>
                    )}
                </Box>
            )}

            {/* Submissions List */}
            {loadingSubmissions && <Box sx={{display: 'flex', justifyContent: 'center'}}><CircularProgress sx={{color: '#f39c12'}}/></Box>}

            {!loadingSubmissions && selectedAssignment && (
                 <List>
                    {submissions.length === 0 && <Typography sx={{color: '#aaa', textAlign: 'center'}}>No submissions for this assignment yet.</Typography>}
                    {submissions.map((s) => {
                        const currentGradeState = gradingStates[s._id] || { score: '', feedback: '' };

                        return (
                            <Box key={s._id} className={styles.submissionCard} sx={{ bgcolor: '#2d2d2d', p: 3, borderRadius: 2, mb: 3 }}>
                                {/* --- Display Student Info --- */}
                                <Typography variant="h6" sx={{ color: '#eee' }}>
                                    {s.student?.name || 'Unknown Student'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                    {s.student?.email}
                                </Typography>
                                 <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 2 }}>
                                    Submitted: {new Date(s.createdAt).toLocaleString()}
                                </Typography>

                                {/* --- Display Submission Content & File --- */}
                                {s.content && ( /* ... */ )}
                                {s.file && s.file.url && (
                                    <Box mt={s.content ? 2 : 0} mb={2}>
                                        <Typography variant="subtitle1" sx={{ color: '#ccc', fontWeight: 'bold' }}>Uploaded File:</Typography>
                                         <MuiLink href={s.file.url} target="_blank" rel="noopener noreferrer" download={s.file.name || true} sx={{ color: '#f39c12', fontWeight: 'bold' }}>
                                            📄 {s.file.name || 'View File'}
                                        </MuiLink>
                                    </Box>
                                )}

                                {/* --- Grading Form --- */}
                                <Divider sx={{ my: 2, borderColor: '#444' }} />
                                <Typography variant="subtitle1" sx={{ color: '#ccc', fontWeight: 'bold', mb: 1 }}>Grade:</Typography>
                                <Box display="flex" flexDirection="column" gap={2}>
                                    <TextField
                                        label="Score (0-100)" type="number" value={currentGradeState.score} onChange={(e) => handleGradeChange(s._id, 'score', e.target.value)}
                                        InputProps={{ inputProps: { min: 0, max: 100 }, sx: { color: '#eee', bgcolor: '#3a3a3a' } }} InputLabelProps={{ sx: { color: '#aaa' } }} size="small"
                                    />
                                    <TextField
                                        label="Feedback" multiline rows={3} value={currentGradeState.feedback} onChange={(e) => handleGradeChange(s._id, 'feedback', e.target.value)}
                                        InputProps={{ sx: { color: '#eee', bgcolor: '#3a3a3a' } }} InputLabelProps={{ sx: { color: '#aaa' } }}
                                    />
                                    <Button onClick={() => gradeSubmission(s._id)} variant="contained" sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#e67e22' } }}>
                                        Save Grade
                                    </Button>
                                </Box>
                            </Box>
                        );
                    })}
                </List>
            )}
        </Container>
    );
}