'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Box, Button, Container, TextField, Typography, CircularProgress } from '@mui/material';
import styles from "../teacherCourses.module.css"; // We'll re-use the same styles

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Fetch the course details when the page loads
  useEffect(() => {
    if (courseId) {
      const loadCourse = async () => {
        try {
          setLoading(true);
          const data = await api(`/api/courses/${courseId}/my`);
          const courseData = data.course;
          setCourse(courseData);
          // Set form fields with existing data
          setTitle(courseData.title);
          setDescription(courseData.description || '');
          // Convert price from paise (1000) to rupees ("10.00")
          setPrice((courseData.price / 100).toFixed(2));
        } catch (err) {
          console.error(err);
          alert('Failed to load course details.');
        } finally {
          setLoading(false);
        }
      };
      loadCourse();
    }
  }, [courseId]);

  // 2. Handle the "Update" button click
  const handleUpdate = async () => {
    try {
      setSaving(true);
      // Convert price from rupees ("10.00") back to paise (1000)
      const priceInPaise = Math.round(parseFloat(price) * 100);

      if (isNaN(priceInPaise) || priceInPaise < 0) {
        alert('Please enter a valid price (0 or more).');
        return;
      }

      const body = JSON.stringify({
        title,
        description,
        price: priceInPaise
      });

      await api(`/api/courses/${courseId}`, {
        method: 'PUT',
        body: body,
      });

      alert('Course updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update course.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className={styles.page}>
        <CircularProgress />
      </Container>
    );
  }

  if (!course) {
    return (
      <Container className={styles.page}>
        <Typography variant="h5">Course not found.</Typography>
      </Container>
    );
  }

  // 3. Render the edit form
  return (
    <Container className={styles.page} maxWidth={false} disableGutters>
      <Typography variant="h4" component="h1" className={styles.sectionTitle} mt={4} mb={3}>
        Edit: <b>{course.title}</b>
      </Typography>

      <Box className={styles.form}>
        <TextField
          label="Course Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={4}
          fullWidth
        />
        <TextField
          label="Price (in ₹)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g., 100.00 (Enter 0 for free)"
          fullWidth
        />
        <Button 
          className={styles.button} 
          onClick={handleUpdate} 
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </Box>

      {/* You can add more sections here later, like "Manage Assignments" or "See Enrolled Students" */}
    </Container>
  );
}