'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Box,
  Button,
  Container,
  MenuItem,
  Select,
  TextField,
  Typography,
  List,
  Divider
} from '@mui/material';
import styles from "./teacherSubmissions.module.css";

export default function TeacherSubmissionsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);

  const loadCourses = async () => {
    try {
      const data = await api('/api/courses/my');
      setCourses(data.courses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAssignments = async (courseId: string) => {
    try {
      const data = await api(`/api/assignments/course/${courseId}`);
      setAssignments(data.assignments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubmissions = async (assignmentId: string) => {
    try {
      const data = await api(`/api/submissions/assignment/${assignmentId}`);
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const gradeSubmission = async (submissionId: string, score: string, feedback: string) => {
    try {
      await api(`/api/submissions/${submissionId}/grade`, {
        method: 'PATCH',
        body: JSON.stringify({ score, feedback })
      });
      alert('Grade saved!');
      loadSubmissions(selectedAssignment);
    } catch (err) {
      console.error(err);
      alert('Error saving grade');
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <Container className={styles.page} maxWidth={false} disableGutters>
      <Typography className={styles.sectionTitle} variant="h4" mt={4} mb={2}>
        Grade Submissions
      </Typography>

      {/* Select Course */}
      <Box mb={2}>
        <Select
          value={selectedCourse}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedCourse(id);
            setSelectedAssignment('');
            setAssignments([]);
            setSubmissions([]);
            if (id) loadAssignments(id);
          }}
          displayEmpty
          fullWidth
        >
          <MenuItem value="">Select a Course</MenuItem>
          {courses.map(c => (
            <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Select Assignment */}
      {selectedCourse && (
        <Box mb={3}>
          <Select
            value={selectedAssignment}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedAssignment(id);
              setSubmissions([]);
              if (id) loadSubmissions(id);
            }}
            displayEmpty
            fullWidth
          >
            <MenuItem value="">Select an Assignment</MenuItem>
            {assignments.map(a => (
              <MenuItem key={a._id} value={a._id}>{a.title}</MenuItem>
            ))}
          </Select>
        </Box>
      )}

      {/* Submissions List */}
      <List>
        {submissions.map((s) => (
          <Box key={s._id} className={styles.submissionCard}>
            <Typography variant="h6">{s.student?.name || 'Unknown Student'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {s.student?.email}
            </Typography>

            {/* Content */}
            {s.content && (
              <Box mt={1} mb={1}>
                <Typography variant="subtitle1">Answer:</Typography>
                <Typography variant="body1">{s.content}</Typography>
              </Box>
            )}

            {/* Files */}
            {s.files?.length > 0 && (
              <Box mt={1} mb={1}>
                <Typography variant="subtitle1">Uploaded Files:</Typography>
                {s.files.map((f: any, idx: number) => (
                  <a
                    key={idx}
                    href={`${process.env.NEXT_PUBLIC_API_BASE}${f.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.fileLink}
                  >
                    📄 {f.name}
                  </a>
                ))}
              </Box>
            )}

            {/* Grade form */}
            <Divider sx={{ my: 2, borderColor: '#444' }} />
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Score"
                type="number"
                defaultValue={s.score || ''}
                onChange={(e) => (s.score = e.target.value)}
              />
              <TextField
                label="Feedback"
                multiline
                defaultValue={s.feedback || ''}
                onChange={(e) => (s.feedback = e.target.value)}
              />
              <Button
                className={styles.button}
                onClick={() => gradeSubmission(s._id, s.score, s.feedback)}
              >
                Save Grade
              </Button>
            </Box>
          </Box>
        ))}
      </List>
    </Container>
  );
}
