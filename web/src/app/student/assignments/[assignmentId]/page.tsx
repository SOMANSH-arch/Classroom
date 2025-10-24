'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, API_BASE } from '@/lib/api';
// Import necessary MUI components, including MuiLink
import { Box, Button, Container, Typography, CircularProgress, Paper, Alert, Divider, TextField, Link as MuiLink } from '@mui/material';
import Link from 'next/link'; // <-- IMPORT NEXT.JS LINK HERE

export default function AssignmentPage() {
    const params = useParams();
    const assignmentId = params.assignmentId as string;

    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // --- AI Hint State ---
    const [hint, setHint] = useState('');
    const [hintLoading, setHintLoading] = useState(false);

    // --- Submission State ---
    const [submissionContent, setSubmissionContent] = useState('');
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState<boolean | null>(null); // null = checking

    // --- Fetch Assignment & Submission Status ---
    useEffect(() => {
        if (!assignmentId) {
            setLoading(false);
            setHasSubmitted(false);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setHasSubmitted(null); // Reset submission status while loading

        const loadData = async () => {
            try {
                console.log(`AssignmentPage: Fetching data for assignment ${assignmentId}`);
                // Fetch assignment details
                const assignDataPromise = api(`/api/assignments/${assignmentId}`);
                // Fetch student's submissions to check status
                const subsDataPromise = api('/api/submissions/mine');

                const [assignData, subsData] = await Promise.all([assignDataPromise, subsDataPromise]);

                if (isMounted) {
                    const fetchedAssignment = assignData.assignment;
                    setAssignment(fetchedAssignment);

                    const allSubmissions = subsData.submissions || [];
                    const alreadySubmitted = allSubmissions.some(
                        (sub: any) => sub.assignment?._id === assignmentId
                    );
                    setHasSubmitted(alreadySubmitted);
                    console.log(`AssignmentPage: Fetched data. Has submitted: ${alreadySubmitted}`);
                }

            } catch (err) {
                console.error("AssignmentPage: Error loading data:", err);
                if (isMounted) {
                    // Don't alert here, let the UI handle it
                    setAssignment(null);
                    setHasSubmitted(false); // Default to false on error
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        loadData();

        return () => { isMounted = false; }; // Cleanup
    }, [assignmentId]);

    // --- Get AI Hint ---
    const getHint = async () => {
        setHintLoading(true);
        setHint('');
        try {
            const data = await api(`/api/ai/hint/${assignmentId}`, { method: 'POST' });
            setHint(data.ai.hint);
        } catch (err) { console.error(err); alert('Failed to get hint from AI.');
        } finally { setHintLoading(false); }
    };

    // --- Handle File Selection ---
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSubmissionFile(event.target.files?.[0] || null);
    };

    // --- Handle Submission ---
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);

        if (!submissionFile && (!submissionContent || submissionContent.trim() === '')) {
            alert('Submission requires a file or text content.');
            setIsSubmitting(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('assignmentId', assignmentId);
            formData.append('content', submissionContent || '');
            if (submissionFile) {
                formData.append('submissionFile', submissionFile);
            }

            const res = await fetch(`${API_BASE}/api/submissions`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            if (!res.ok) {
                let errorMsg = 'Submission failed';
                try { const errorData = await res.json(); errorMsg = errorData.message || errorMsg; } catch (e) { errorMsg = `Submission failed: ${res.statusText}`; }
                throw new Error(errorMsg);
            }

            alert('Submission successful!');
            setHasSubmitted(true); // Update UI to show submitted status
            // Clear form after successful submission
            setSubmissionContent('');
            setSubmissionFile(null);
            const fileInput = document.getElementById('submissionFile') as HTMLInputElement;
             if (fileInput) fileInput.value = '';


        } catch (err: any) {
            console.error("Submission Error:", err);
            alert(`Error submitting assignment: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Render Loading / Not Found ---
    if (loading || hasSubmitted === null) {
        return <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: '#f39c12' }} /></Container>;
    }
    if (!assignment) {
        return <Container sx={{ py: 4 }}><Typography sx={{color: '#aaa', textAlign: 'center'}}>Assignment not found.</Typography></Container>;
    }

    // --- Render Page ---
    return (
        <Container sx={{ py: 4 }} maxWidth="md">
            {/* --- Assignment Details --- */}
            <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#f39c12' }}>
                <b>{assignment.title}</b>
            </Typography>
            <Typography variant="body1" sx={{ color: '#ccc', mb: 2 }}>
                Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'No due date'}
            </Typography>

            <Paper sx={{ p: 4, bgcolor: '#2d2d2d', borderRadius: 2, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#eee' }}>Instructions</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap', color: '#eee', mb: (assignment.file && assignment.file.url) ? 2 : 0 }}>
                    {assignment.instructions || "No instructions provided."}
                </Typography>

                {/* Display attached assignment file link */}
                {assignment.file && assignment.file.url && (
                  <Box mt={3} pt={2} borderTop="1px solid #444">
                     <Typography variant="body1" sx={{ color: '#ccc', fontWeight: 'bold' }}>Attached File:</Typography>
                     <MuiLink
                        href={assignment.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={assignment.file.name || true}
                        sx={{ display: 'inline-block', mt: 1, color: '#f39c12', fontWeight: 'bold' }}
                      >
                        📄 {assignment.file.name || 'Download File'}
                      </MuiLink>
                  </Box>
                )}
            </Paper>

            {/* --- AI Hint Button & Display --- */}
             <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Button
                    variant="contained"
                    onClick={getHint}
                    disabled={hintLoading}
                    sx={{
                        bgcolor: '#f39c12', color: 'white', fontWeight: 'bold', py: 1.5, px: 4,
                        '&:hover': { bgcolor: '#e67e22', },
                        '&.Mui-disabled': { background: '#555', color: '#888' }
                    }}
                >
                    {hintLoading ? <CircularProgress size={24} color="inherit" /> : 'Stuck? Get a Hint'}
                </Button>
            </Box>
            {hint && ( <Alert severity="info" sx={{ whiteSpace: 'pre-wrap', bgcolor: '#2d2d2d', color: '#eee', border: '1px solid #444', '.MuiAlert-icon': { color: '#eee' }, mb:4 }}> <b>AI Helper:</b> {hint} </Alert> )}


            <Divider sx={{ my: 4, borderColor: '#444' }} />

            {/* --- Submission Section --- */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#eee' }}>
                Your Submission
            </Typography>

            {hasSubmitted ? (
                <Alert severity="success" sx={{ bgcolor: '#2e7d32', color: 'white' }}>
                    You have already submitted this assignment. View your submission <Link href="/student/submissions" passHref><MuiLink sx={{ color: 'white', fontWeight: 'bold'}}>here</MuiLink></Link>.
                </Alert>
            ) : (
                // --- Submission Form ---
                <Box component="form" onSubmit={handleSubmit} sx={{ bgcolor: '#2d2d2d', p: 3, borderRadius: 2 }}>
                    <TextField
                        label="Type your answer here (Optional if uploading file)"
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        multiline
                        rows={5}
                        fullWidth
                        sx={{ mb: 2 }}
                        InputLabelProps={{ sx: { color: '#aaa' } }}
                        InputProps={{ sx: { color: '#eee', bgcolor: '#3a3a3a' } }}
                    />
                    <Box sx={{ mb: 2 }}>
                        <input
                            type="file"
                            name="submissionFile" // Name must match backend
                            id="submissionFile" // ID for label association (optional)
                            onChange={handleFileChange}
                            // Add 'accept' attribute for allowed types if needed
                            // accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                            style={{ color: '#aaa' }}
                        />
                         {submissionFile && <Typography variant="caption" sx={{ ml: 1, color: '#aaa' }}>Selected: {submissionFile.name}</Typography>}
                    </Box>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting || (!submissionContent.trim() && !submissionFile)}
                        sx={{ // Theme button styling
                            bgcolor: '#f39c12',
                            '&:hover': { bgcolor: '#e67e22' },
                            '&.Mui-disabled': { background: '#555', color: '#888' }
                        }}
                    >
                        {isSubmitting ? <CircularProgress size={24} color="inherit"/> : 'Submit Assignment'}
                    </Button>
                </Box>
            )}
        </Container>
    );
}