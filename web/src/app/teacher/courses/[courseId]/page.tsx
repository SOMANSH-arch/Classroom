'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Box, Button, Container, TextField, Typography, CircularProgress, List, ListItem, Divider } from '@mui/material';
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
  
  // --- 1. STATE FOR NEW MATERIAL ---
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [postingMaterial, setPostingMaterial] = useState(false);

  // Helper to load course
  const loadCourse = async () => {
    try {
      setLoading(true);
      const data = await api(`/api/courses/${courseId}/my`);
      const courseData = data.course;
      setCourse(courseData);
      
      setTitle(courseData.title);
      setDescription(courseData.description || '');
      setPrice((courseData.price / 100).toFixed(2));
    } catch (err) {
      console.error(err);
      alert('Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Fetch the course details when the page loads
  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  // 2. Handle the "Update Course" button click
  const handleUpdate = async () => {
    try {
      setSaving(true);
      const priceInPaise = Math.round(parseFloat(price) * 100);

      if (isNaN(priceInPaise) || priceInPaise < 0) {
        alert('Please enter a valid price (0 or more).');
        setSaving(false);
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

  // --- 2. FUNCTION TO POST NEW MATERIAL ---
  const handlePostMaterial = async () => {
    if (!materialTitle) {
      alert('Please enter a title for the material.');
      return;
    }
    
    try {
      setPostingMaterial(true);
      const body = JSON.stringify({
        title: materialTitle,
        description: materialDescription,
      });

      const data = await api(`/api/courses/${courseId}/materials`, {
        method: 'POST',
        body: body,
      });
      
      alert('Material posted! Students will be notified.');
      setCourse(data.course); // Refresh course data to show new material
      setMaterialTitle('');
      setMaterialDescription('');

    } catch (err) {
      console.error(err);
      alert('Failed to post material.');
    } finally {
      setPostingMaterial(false);
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

  // 3. Render the page
  return (
    <Container className={styles.page} maxWidth="md" disableGutters>
      {/* --- EDIT COURSE FORM --- */}
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
          onChange={(e) => setPrice(e.g.target.value)}
          placeholder="e.g., 100.00 (Enter 0 for free)"
          fullWidth
        />
        <Button 
          className={styles.button} 
          onClick={handleUpdate} 
          disabled={saving}
          fullWidth
        >
          {saving ? <CircularProgress size={24} /> : 'Save Course Details'}
        </Button>
      </Box>

      <Divider sx={{ my: 6, borderColor: '#444' }} />

      {/* --- 4. POST NEW MATERIAL FORM --- */}
      <Typography variant="h4" component="h1" className={styles.sectionTitle} mb={3}>
        Post New Material
      </Typography>
      <Box className={styles.form}>
        <TextField
          label="Material Title (e.g., 'Week 1 Notes' or 'Announcement')"
          value={materialTitle}
          onChange={(e) => setMaterialTitle(e.target.value)}
          fullWidth
        />
        <TextField
          label="Description (Can include text or links)"
          value={materialDescription}
          onChange={(e) => setMaterialDescription(e.target.value)}
          multiline
          rows={4}
          fullWidth
        />
        <Button 
          className={styles.button} 
          onClick={handlePostMaterial} 
          disabled={postingMaterial}
          fullWidth
        >
          {postingMaterial ? <CircularProgress size={24} /> : 'Post Material & Notify Students'}
        </Button>
      </Box>

      {/* --- 5. LIST OF EXISTING MATERIALS --- */}
      <Typography variant="h5" component="h1" className={styles.sectionTitle} mt={6} mb={3}>
        Posted Materials
      </Typography>
      <List>
        {course.materials.length === 0 && (
          <Typography>No materials posted yet.</Typography>
        )}
        {course.materials.slice().reverse().map((material: any) => ( // .slice().reverse() shows newest first
          <ListItem key={material._id} sx={{ bgcolor: '#2d2d2d', mb: 2, borderRadius: 2, display: 'block' }}>
            <Typography variant="h6"><b>{material.title}</b></Typography>
            <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
              {material.description}
            </Typography>
            <Typography variant="caption" sx={{ color: '#888', mt: 1, display: 'block' }}>
              Posted: {new Date(material.createdAt).toLocaleString()}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}