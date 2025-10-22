'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Box, Button, Container, TextField, Typography, List, ListItem } from '@mui/material';
import styles from "./teacherCourses.module.css";
import { useRouter } from 'next/navigation'; // <-- 1. IMPORT useRouter

// Helper function
const formatPrice = (priceInPaise: number) => {
  if (priceInPaise == null || priceInPaise === 0) return "Free";
  const priceInRupees = (priceInPaise / 100).toFixed(2);
  return `₹${priceInRupees}`;
};

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const router = useRouter(); // <-- 2. INITIALIZE useRouter

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
      const priceInPaise = Math.round(parseFloat(price) * 100);
      
      if (isNaN(priceInPaise) || priceInPaise < 0) {
         alert('Please enter a valid price (0 or more).');
         return;
      }

      await api('/api/courses', {
        method: 'POST',
        body: JSON.stringify({ 
          title, 
          description, 
          price: priceInPaise
        })
      });
      
      setTitle('');
      setDescription('');
      setPrice('');
      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const publishCourse = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // <-- Stop the click from navigating
    try {
      await api(`/api/courses/${id}/publish`, { method: 'PATCH' });
      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  // 3. --- ADDED NAVIGATION FUNCTION ---
  const handleCourseClick = (courseId: string) => {
    router.push(`/teacher/courses/${courseId}`);
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
        <TextField
          label="Price (in ₹)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g., 100.00 (Enter 0 for free)"
        />
        <Button className={styles.button} onClick={createCourse}>
          Create Course
        </Button>
      </Box>

      {/* List Courses */}
      <List>
        {courses.map(course => (
          // 4. --- ADDED onClick HANDLER TO ListItem ---
          <ListItem 
            key={course._id} 
            className={styles.courseCardClickable} // Using a new style
            onClick={() => handleCourseClick(course._id)}
          >
            <Box>
              <div className={styles.courseTitle}>
                {course.title} {course.published ? '(Published)' : '(Draft)'}
              </div>
              <div className={styles.courseDescription}>
                {course.description}
              </div>
            </Box>
            
            <Box style={{ textAlign: 'right', marginLeft: 'auto', flexShrink: 0 }}>
              <Typography variant="h6" component="div">
                {formatPrice(course.price)}
              </Typography>
              {!course.published && (
                <Button
                  className={styles.publishButton}
                  onClick={(e) => publishCourse(e, course._id)} // Pass 'e'
                >
                  Publish
                </Button>
              )}
            </Box>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}