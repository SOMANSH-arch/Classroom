'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
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
  Chip
} from '@mui/material';
import styles from './assignments.module.css';

export default function StudentAssignmentsPage() {
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submittedAssignments, setSubmittedAssignments] = useState<string[]>([]);

  const loadEnrolled = async () => {
    try {
      const data = await api('/api/courses/enrolled');
      setEnrolledCourses(data.courses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAssignments = async (courseId: string) => {
    try {
      const data = await api(`/api/assignments/course/${courseId}`);
      setAssignments(data.assignments || []);
      const subs = await api(`/api/submissions/mine`);
      const submitted = (subs.submissions || [])
        .filter((s: any) => s.assignment?.course?._id === courseId)
        .map((s: any) => s.assignment?._id)
        .filter(Boolean);
      setSubmittedAssignments(submitted as string[]);
    } catch (err) {
      console.error(err);
    }
  };

  const submitAssignment = async (assignmentId: string) => {
    try {
      const formData = new FormData();
      formData.append('assignment', assignmentId);
      formData.append('content', content);
      if (file) formData.append('file', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/submissions`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!res.ok) throw new Error(await res.text());
      setContent('');
      setFile(null);
      alert('Submission saved!');
      setSubmittedAssignments(prev =>
        prev.includes(assignmentId) ? prev : [...prev, assignmentId]
      );
    } catch (err) {
      console.error(err);
      alert('Error submitting assignment');
    }
  };

  useEffect(() => { loadEnrolled(); }, []);

  return (
    <Container className={styles.container} maxWidth={false} disableGutters>
      <Typography variant="h4" component="h1" className={styles.title}><b>Assignments</b></Typography>

      {/* Course Selector */}
      <Box mb={3}>
        <Select
          value={selectedCourse}
          onChange={(e) => {
            const id = String(e.target.value);
            setSelectedCourse(id);
            if (id) loadAssignments(id);
          }}
          displayEmpty
          fullWidth
          className={styles.selector}
        >
          <MenuItem value="">Select a Course</MenuItem>
          {enrolledCourses.map(c => (
            <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Assignments List */}
      <List>
        {assignments.map(a => {
          const alreadySubmitted = submittedAssignments.includes(a._id);
          return (
            <ListItem key={a._id} className={styles.assignment}>
              <ListItemText
                primary={
                  <>
                    {a.title}
                    {alreadySubmitted && (
                      <Chip
                        label="Already Submitted"
                        color="success"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </>
                }
                secondary={`Due: ${a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}`}
              />
              {!alreadySubmitted && (
                <>
                  <TextField
                    label="Your Submission"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    multiline
                    fullWidth
                    className={styles.textarea}
                  />
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className={styles.fileInput}
                  />
                  <Button
                    variant="contained"
                    onClick={() => submitAssignment(a._id)}
                    className={styles.button}
                  >
                    Submit
                  </Button>
                </>
              )}
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
}
