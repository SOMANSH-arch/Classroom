'use client';
import { useEffect, useState, useRef } from 'react';
import { api, API_BASE } from '@/lib/api';
import {
    Box, Button, Container, TextField, Typography, MenuItem, Select,
    List, ListItem, ListItemText, Chip, CircularProgress, SelectChangeEvent
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import styles from "./teacherAssignments.module.css";

export default function TeacherAssignmentsPage() {
    const searchParams = useSearchParams();
    const initialCourseId = searchParams.get('courseId') || ''; // Read courseId from URL

    const [courses, setCourses] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState(initialCourseId); // Use URL param as initial state
    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false); // New flag

    // Load courses and initial assignments
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const data = await api('/api/courses/my');
                setCourses(data.courses || []);

                if (initialCourseId) {
                    // Check if the URL course ID is valid before loading assignments
                    if (data.courses?.some((c:any) => c._id === initialCourseId)) {
                        await loadAssignments(initialCourseId, true);
                    } else {
                        // Clear invalid ID if it was in the URL but not in the course list
                        setSelectedCourse(''); 
                    }
                }
            } catch (err) { console.error("Error loading courses:", err); }
            finally { setInitialLoadComplete(true); } // Data fetched, allow rendering
        };
        loadInitialData();
    }, [initialCourseId]);

    const loadAssignments = async (courseId: string, skipLoadingState = false) => {
        if (!courseId) {
            setAssignments([]);
            return;
        }
        if (!skipLoadingState) setLoadingAssignments(true);
        
        try {
            const data = await api(`/api/assignments/course/${courseId}`);
            const fetchedAssignments = data.assignments || [];

            // Set assignments with a placeholder count
            setAssignments(fetchedAssignments.map(a => ({ ...a, submissionCount: '?' }))); 

        } catch (err) {
            console.error("Error loading assignments:", err);
            setAssignments([]);
        } finally {
            setLoadingAssignments(false);
        }
    };

    const createAssignment = async () => {
        // --- CRITICAL FIX: Use selectedCourse for the new assignment ---
        const courseToUse = selectedCourse;
        if (!courseToUse || !title) {
            alert('Please select a course and enter a title.');
            return;
        }
        // --- END CRITICAL FIX ---
        
        setIsCreating(true);
        let uploadedFilePath = '';
        let uploadedFileName = '';

        try {
            // --- Step 1: Upload file if selected ---
            if (assignmentFile) {
                // ... file upload logic ...
                 const formData = new FormData();
                formData.append('assignmentFile', assignmentFile);
                const uploadRes = await fetch(`${API_BASE}/api/assignments/upload`, { method: 'POST', body: formData, credentials: 'include' });
                if (!uploadRes.ok) { const errorData = await uploadRes.json(); throw new Error(errorData.message || 'File upload failed'); }
                const uploadData = await uploadRes.json();
                uploadedFilePath = uploadData.filePath; uploadedFileName = uploadData.fileName;
            }

            // --- Step 2: Create assignment with metadata ---
            const assignmentData = {
                course: courseToUse, // <-- USES THE SELECTED COURSE ID
                title,
                instructions,
                dueDate: dueDate || null,
                file: {
                    url: uploadedFilePath,
                    name: uploadedFileName,
                }
            };

            await api('/api/assignments', {
                method: 'POST',
                body: JSON.stringify(assignmentData),
            });

            // --- Success ---
            alert('Assignment created successfully!');
            setTitle(''); setInstructions(''); setDueDate(''); setAssignmentFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadAssignments(courseToUse); // Reload list for the selected course

        } catch (err: any) {
            console.error("Error creating assignment:", err);
            alert(`Failed to create assignment: ${err.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    // Handle course selection change (Manual dropdown selection)
    const handleCourseChange = (event: SelectChangeEvent<string>) => {
        const courseId = event.target.value;
        setSelectedCourse(courseId); // Set state
        loadAssignments(courseId); // Load assignments for new selection
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... */ }; // Keep this

    // Show initial loading for all courses
    if (!initialLoadComplete) {
         return <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress sx={{ color: '#f39c12' }} /></Container>;
    }


    return (
        <Container className={styles.page} maxWidth={false} disableGutters>
            <Typography variant="h4" component="h1" className={styles.sectionTitle} sx={{ color: '#f39c12', mt: 4, mb: 3 }}>
                <b>Manage Assignments</b>
            </Typography>

            {/* Select Course */}
            <Box mb={4}>
                <Select
                    value={selectedCourse}
                    onChange={handleCourseChange}
                    displayEmpty fullWidth
                    // Disable selector ONLY if ID came from the URL and is valid
                    disabled={!!initialCourseId && courses.some(c => c._id === initialCourseId)} 
                    sx={{ /* Styles */ }} MenuProps={{ /* Styles */ }}
                >
                    <MenuItem value="" disabled>{initialCourseId ? 'Viewing Pre-Selected Course' : 'Select a Course'}</MenuItem>
                    {courses.map(c => ( <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem> ))}
                </Select>
                {initialCourseId && selectedCourse && <Typography variant="caption" sx={{ color: '#e67e22', mt: 1, display: 'block' }}>Viewing assignments for the selected course.</Typography>}
            </Box>

            {/* Loading Assignment Spinner */}
            {loadingAssignments && <Box sx={{display: 'flex', justifyContent: 'center'}}><CircularProgress sx={{color: '#f39c12'}}/></Box>}


            {/* Create Assignment Form */}
            {selectedCourse && !loadingAssignments && (
                <Box className={styles.form} sx={{ bgcolor: '#2d2d2d', p: 3, borderRadius: 2, mb: 4 }}>
                    <Typography variant="h5" sx={{ color: '#f39c12', mb: 2 }}>Create New Assignment</Typography>
                    <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required sx={{ mb: 2 }} InputLabelProps={{ sx: { color: '#aaa' } }} InputProps={{ sx: { color: '#eee', bgcolor: '#3a3a3a'} }} />
                    <TextField label="Instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} multiline rows={4} fullWidth sx={{ mb: 2 }} InputLabelProps={{ sx: { color: '#aaa' } }} InputProps={{ sx: { color: '#eee', bgcolor: '#3a3a3a' } }} />
                    <TextField label="Due Date (Optional)" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true, sx: { color: '#aaa' } }} InputProps={{ sx: { color: '#eee', bgcolor: '#3a3a3a' } }} sx={{ mb: 2 }}/>
                     <Box sx={{ border: '1px dashed #666', borderRadius: 1, p: 2, textAlign: 'center', mb: 2 }}>
                        <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ color: '#ccc', borderColor: '#666' }}>
                             {assignmentFile ? `Selected: ${assignmentFile.name}` : 'Upload File (Optional)'}
                            <input type="file" hidden onChange={handleFileChange} ref={fileInputRef} />
                        </Button>
                         {assignmentFile && ( <Typography variant="caption" display="block" sx={{ color: '#aaa', mt: 1 }}> Max 10MB </Typography> )}
                    </Box>
                    <Button onClick={createAssignment} disabled={isCreating} fullWidth sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#e67e22' } }}>
                        {isCreating ? <CircularProgress size={24} color="inherit"/> : 'Create Assignment'}
                    </Button>
                </Box>
            )}

            {/* List Assignments for Selected Course */}
            {selectedCourse && assignments.length > 0 && !loadingAssignments && (
                <>
                    <Typography variant="h5" component="h2" sx={{ color: '#f39c12', mb: 2, mt: 4 }}>Assignments for Selected Course</Typography>
                    <List>
                        {assignments.map(a => (
                            <ListItem key={a._id} className={styles.assignmentCard} sx={{ bgcolor: '#2d2d2d', borderRadius: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <ListItemText
                                    primary={ <Typography sx={{ color: '#f39c12' }}>{a.title}</Typography> }
                                    secondary={`Due: ${a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}`}
                                     secondaryTypographyProps={{ sx: { color: '#aaa' } }}
                                />
                                <Chip
                                    label={a.submissionCount === '?' ? 'View Submissions' : `${a.submissionCount || 0} submissions`}
                                    size="small"
                                    component={Link}
                                    href={`/teacher/submissions?courseId=${selectedCourse}&assignmentId=${a._id}`}
                                    clickable
                                    sx={{ ml: 1, bgcolor: '#555', color: '#eee', '&:hover': { bgcolor: '#f39c12' } }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
             {selectedCourse && assignments.length === 0 && !loadingAssignments && (
                 <Typography sx={{ color: '#e67e22', textAlign: 'center', mt: 4 }}>No assignments created for this course yet.</Typography>
             )}

        </Container>
    );
}