'use client';
import { useEffect, useState, useRef } from 'react';
import { api, API_BASE } from '@/lib/api';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    MenuItem,
    Select,
    List,
    ListItem,
    ListItemText,
    Chip,
    CircularProgress,
    SelectChangeEvent
} from '@mui/material';
import Link from 'next/link';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import styles from "./teacherAssignments.module.css";

export default function TeacherAssignmentsPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const data = await api('/api/courses/my');
                setCourses(data.courses || []);
            } catch (err) { console.error("Error loading courses:", err); }
        };
        loadCourses();
    }, []);

    // --- CORRECTED loadAssignments FUNCTION ---
    const loadAssignments = async (courseId: string) => {
        if (!courseId) {
            setAssignments([]); // Clear if no course ID
            return;
        }
        console.log(`Loading assignments for course: ${courseId}`); // Debug log
        try {
            // Fetch assignments for the selected course
            const data = await api(`/api/assignments/course/${courseId}`);
            const fetchedAssignments = data.assignments || [];
            console.log("Fetched assignments:", fetchedAssignments); // Debug log

            // Set assignments with a placeholder count
             setAssignments(fetchedAssignments.map(a => ({ ...a, submissionCount: '?' })));


        } catch (err) {
            console.error("Error loading assignments:", err);
            setAssignments([]); // Clear on error
            // Optionally: alert('Failed to load assignments');
        }
    };
    // --- END CORRECTION ---

    const createAssignment = async () => {
        // ... (createAssignment logic remains the same)
        if (!selectedCourse || !title) { alert('Please select a course and enter a title.'); return; }
        setIsCreating(true);
        let uploadedFilePath = ''; let uploadedFileName = '';
        try {
            if (assignmentFile) {
                const formData = new FormData();
                formData.append('assignmentFile', assignmentFile);
                const uploadRes = await fetch(`${API_BASE}/api/assignments/upload`, { method: 'POST', body: formData, credentials: 'include' });
                if (!uploadRes.ok) { const errorData = await uploadRes.json(); throw new Error(errorData.message || 'File upload failed'); }
                const uploadData = await uploadRes.json();
                uploadedFilePath = uploadData.filePath; uploadedFileName = uploadData.fileName;
            }
            const assignmentData = {
                course: selectedCourse, title, instructions, dueDate: dueDate || null,
                file: { url: uploadedFilePath, name: uploadedFileName }
            };
            await api('/api/assignments', { method: 'POST', body: JSON.stringify(assignmentData) });
            alert('Assignment created successfully!');
            setTitle(''); setInstructions(''); setDueDate(''); setAssignmentFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadAssignments(selectedCourse); // Reload list
        } catch (err: any) { console.error("Error creating assignment:", err); alert(`Failed to create assignment: ${err.message}`);
        } finally { setIsCreating(false); }
    };

    const handleCourseChange = (event: SelectChangeEvent<string>) => {
        const courseId = event.target.value;
        setSelectedCourse(courseId);
        setAssignments([]); // Clear assignments when course changes
        if (courseId) {
            loadAssignments(courseId);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAssignmentFile(event.target.files?.[0] || null);
    };

    return (
        <Container className={styles.page} maxWidth={false} disableGutters>
            <Typography variant="h4" component="h1" className={styles.sectionTitle} sx={{ color: '#f39c12', mt: 4, mb: 3 }}>
                <b>Manage Assignments</b> {/* Changed Title Slightly */}
            </Typography>

            {/* Select Course */}
            <Box mb={4}>
                 <Select
                    value={selectedCourse}
                    onChange={handleCourseChange}
                    displayEmpty fullWidth
                    sx={{ color: '#eee', bgcolor: '#2d2d2d', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' }, '& .MuiSelect-icon': { color: '#aaa' } }}
                    MenuProps={{ PaperProps: { sx: { bgcolor: '#2d2d2d', color: '#eee' } } }}
                >
                    <MenuItem value="" disabled>Select a Course to View/Add Assignments</MenuItem> {/* Changed Text */}
                    {courses.map(c => ( <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem> ))}
                </Select>
            </Box>

            {/* Create Assignment Form */}
            {selectedCourse && (
                <Box className={styles.form} sx={{ bgcolor: '#2d2d2d', p: 3, borderRadius: 2, mb: 4 }}>
                    <Typography variant="h5" sx={{ color: '#eee', mb: 2 }}>Create New Assignment</Typography>
                    <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required sx={{ mb: 2 }} InputLabelProps={{ sx: { color: '#aaa' } }} InputProps={{ sx: { color: '#eee', bgcolor: '#3a3a3a'} }} />
                    <TextField label="Instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} multiline rows={4} fullWidth sx={{ mb: 2 }} InputLabelProps={{ sx: { color: '#aaa' } }} InputProps={{ sx: { color: '#eee', bgcolor: '#3a3a3a' } }} />
                    <TextField label="Due Date (Optional)" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true, sx: { color: '#aaa' } }} InputProps={{ sx: { color: '#eee', bgcolor: '#3a3a3a' } }} sx={{ mb: 2 }}/>
                     <Box sx={{ border: '1px dashed #666', borderRadius: 1, p: 2, textAlign: 'center', mb: 2 }}>
                        { /* ... File Input Button ... */ }
                        <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ color: '#ccc', borderColor: '#666' }}>
                             {assignmentFile ? `Selected: ${assignmentFile.name}` : 'Upload File (Optional)'}
                            <input type="file" hidden onChange={handleFileChange} ref={fileInputRef} />
                        </Button>
                         {assignmentFile && ( <Typography variant="caption" display="block" sx={{ color: '#aaa', mt: 1 }}> Max 10MB </Typography> )}
                    </Box>
                    <Button className={styles.button} onClick={createAssignment} disabled={isCreating} fullWidth sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#e67e22' } }}>
                        {isCreating ? <CircularProgress size={24} color="inherit"/> : 'Create Assignment'}
                    </Button>
                </Box>
            )}

            {/* List Assignments for Selected Course */}
            {selectedCourse && assignments.length > 0 && (
                <>
                    <Typography variant="h5" component="h2" sx={{ color: '#eee', mb: 2, mt: 4 }}>Assignments for Selected Course</Typography>
                    <List>
                        {assignments.map(a => (
                            <ListItem key={a._id} className={styles.assignmentCard} sx={{ bgcolor: '#2d2d2d', borderRadius: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <ListItemText
                                    primary={ <Typography sx={{ color: '#eee' }}>{a.title}</Typography> }
                                    secondary={`Due: ${a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}`}
                                     secondaryTypographyProps={{ sx: { color: '#aaa' } }}
                                />
                                {/* --- UPDATED CHIP --- */}
                                <Chip
                                    label={a.submissionCount === '?' ? 'View Submissions' : `${a.submissionCount || 0} submissions`}
                                    className={styles.subChip}
                                    size="small"
                                    component={Link} // Make chip a link
                                    href={`/teacher/submissions?courseId=${selectedCourse}&assignmentId=${a._id}`} // Link to submissions page, filtering by this assignment
                                    clickable // Make it look clickable
                                    sx={{ ml: 1, bgcolor: '#555', color: '#eee', '&:hover': { bgcolor: '#666' } }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
             {selectedCourse && assignments.length === 0 && !isCreating /* Don't show if creating */ && (
                 <Typography sx={{ color: '#aaa', textAlign: 'center', mt: 4 }}>No assignments created for this course yet.</Typography>
             )}

        </Container>
    );
}