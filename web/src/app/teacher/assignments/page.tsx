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
import Link from 'next/link';
import styles from "./teacherAssignments.module.css";

export default function TeacherAssignmentsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');

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
      const withCounts = await Promise.all(
        (data.assignments || []).map(async (a: any) => {
          const countData = await api(`/api/submissions/count/${a._id}`);
          return { ...a, submissionCount: countData.count || 0 };
        })
      );
      setAssignments(withCounts);
    } catch (err) {
      console.error(err);
    }
  };

  const createAssignment = async () => {
    try {
      await api('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({ course: selectedCourse, title, instructions, dueDate })
      });
      setTitle('');
      setInstructions('');
      setDueDate('');
      loadAssignments(selectedCourse);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <Container className={styles.page} maxWidth={false} disableGutters>
      <Typography variant="h4" component="h1" className={styles.sectionTitle} mt={4} mb={3}>
        <b>Assignments</b>
      </Typography>

      {/* Select Course */}
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
        >
          <MenuItem value="">Select a Course</MenuItem>
          {courses.map(c => (
            <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Create Assignment */}
      {selectedCourse && (
        <Box className={styles.form}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="Instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            multiline
          />
          <TextField
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button className={styles.button} onClick={createAssignment}>
            Create Assignment
          </Button>
        </Box>
      )}

      {/* List Assignments */}
      <List>
        {assignments.map(a => (
          <ListItem key={a._id} className={styles.assignmentCard}>
            <ListItemText
              primary={
                <>
                  {a.title}{' '}
                  <Chip
                    label={`${a.submissionCount || 0} submissions`}
                    className={styles.subChip}
                    size="small"
                    component={Link}
                    href={`/teacher/submissions?assignment=${a._id}`}
                    clickable
                    sx={{ ml: 1 }}
                  />
                </>
              }
              secondary={`Due: ${a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}`}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
