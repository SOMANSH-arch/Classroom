'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Box, Button, Container, Typography, CircularProgress, Paper, Alert, Divider } from '@mui/material';

export default function AssignmentPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // --- AI Hint State ---
  const [hint, setHint] = useState('');
  const [hintLoading, setHintLoading] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      const loadAssignment = async () => {
        try {
          const data = await api(`/api/assignments/${assignmentId}`);
          setAssignment(data.assignment);
        } catch (err) {
          console.error(err);
          alert('Failed to load assignment.');
        } finally {
          setLoading(false);
        }
      };
      loadAssignment();
    }
  }, [assignmentId]);

  // 2. Function to call our new AI Hint route
  const getHint = async () => {
    setHintLoading(true);
    setHint('');
    try {
      const data = await api(`/api/ai/hint/${assignmentId}`, {
        method: 'POST',
      });
      setHint(data.ai.hint);
    } catch (err) {
      console.error(err);
      alert('Failed to get hint from AI.');
    } finally {
      setHintLoading(false);
    }
  };

  if (loading) {
    return <Container sx={{ py: 4 }}><CircularProgress /></Container>;
  }

  if (!assignment) {
    return <Container sx={{ py: 4 }}><Typography>Assignment not found.</Typography></Container>;
  }

  return (
    <Container sx={{ py: 4 }} maxWidth="md">
      {/* --- UPDATED MAIN HEADING --- */}
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#f39c12' }}>
        <b>{assignment.title}</b>
      </Typography>
      <Typography variant="body1" sx={{ color: '#ccc', mb: 2 }}>
        Due: {new Date(assignment.dueDate).toLocaleString()}
      </Typography>
      
      <Paper sx={{ p: 4, bgcolor: '#2d2d2d', borderRadius: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#eee' }}>Instructions</Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap', color: '#eee' }}>
          {assignment.instructions}
        </Typography>
      </Paper>

      {/* --- 3. THE UPDATED AI HINT BUTTON --- */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Button 
          variant="contained" 
          onClick={getHint} 
          disabled={hintLoading}
          sx={{ 
            // Use the solid orange theme color
            bgcolor: '#f39c12',
            color: 'white',
            fontWeight: 'bold',
            py: 1.5,
            px: 4,
            '&:hover': {
              bgcolor: '#e67e22', // A slightly darker orange for hover
            },
            '&.Mui-disabled': { // Style for when button is loading
              background: '#555',
              color: '#888'
            }
          }}
        >
          {hintLoading ? <CircularProgress size={24} color="inherit" /> : 'Stuck? Get a Hint'}
        </Button>
      </Box>

      {/* --- 4. THE UPDATED HINT DISPLAY --- */}
      {hint && (
        <Alert 
          severity="info" 
          sx={{ 
            whiteSpace: 'pre-wrap',
            bgcolor: '#2d2d2d',
            color: '#eee',
            border: '1px solid #444',
            '.MuiAlert-icon': {
              color: '#eee'
            }
          }}
        >
          <b>AI Helper:</b> {hint}
        </Alert>
      )}

      {/* We can add the Submission form here later */}
      <Divider sx={{ my: 4, borderColor: '#444' }} />
      <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#eee' }}>
        Your Submission
      </Typography>
      <Typography sx={{ color: '#aaa' }}>
        (Submission form will go here)
      </Typography>

    </Container>
  );
}