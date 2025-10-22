'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Box, Button, Container, TextField, Typography, List, ListItem } from '@mui/material';
import styles from "./teacherCourses.module.css";

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const loadCourses = async () => {
    try {
      const data = await api('/api/courses/my'); // teacher-only endpoint
      setCourses(data.courses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const createCourse = async () => {
    try {
      await api('/api/courses', {
        method: 'POST',
        body: JSON.stringify({ title, description })
      });
      setTitle('');
      setDescription('');
      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const publishCourse = async (id: string) => {
    try {
      await api(`/api/courses/${id}/publish`, { method: 'PATCH' });
      loadCourses();
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
        <b>My Courses</b>
      </Typography>

      {/* Create Course */}
      <Box className={styles.form}>
        <TextField
          label="Course Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
        />
        <Button className={styles.button} onClick={createCourse}>
          Create Course
        </Button>
      </Box>

      {/* List Courses */}
      <List>
        {courses.map(course => (
          <ListItem key={course._id} className={styles.courseCard}>
            <Box>
              <div className={styles.courseTitle}>
                {course.title} {course.published ? '(Published)' : '(Draft)'}
              </div>
              <div className={styles.courseDescription}>
                {course.description}
              </div>
            </Box>
            {!course.published && (
              <Button
                className={styles.publishButton}
                onClick={() => publishCourse(course._id)}
              >
                Publish
              </Button>
            )}
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
