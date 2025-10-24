'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api, API_BASE } from '@/lib/api'; // Import API_BASE
import { Box, Button, Container, TextField, Typography, CircularProgress, List, ListItem, Divider, Link as MuiLink } from '@mui/material'; // Import MuiLink
import styles from "../teacherCourses.module.css";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [postingMaterial, setPostingMaterial] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to load course
  const loadCourse = async () => {
    try {
      setLoading(true);
      const data = await api(`/api/courses/${courseId}/my`);
      const courseData = data.course;
      setCourse(courseData);
      
      // Check if courseData exists before setting state
      if (courseData) {
        setTitle(courseData.title);
        setDescription(courseData.description || '');
        setPrice((courseData.price / 100).toFixed(2));
      } else {
        // Handle case where course data might be null/undefined from API
        alert('Could not load course data.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const handleUpdate = async () => {
     try {
      setSaving(true);
      const priceInPaise = Math.round(parseFloat(price) * 100);
      if (isNaN(priceInPaise) || priceInPaise < 0) {
        alert('Please enter a valid price (0 or more).');
        setSaving(false); return;
      }
      const body = JSON.stringify({ title, description, price: priceInPaise });
      await api(`/api/courses/${courseId}`, { method: 'PUT', body: body });
      alert('Course updated successfully!');
    } catch (err) {
      console.error(err); alert('Failed to update course.');
    } finally {
      setSaving(false);
    }
  };

  const handlePostMaterial = async () => {
    if (!materialTitle) {
      alert('Please enter a title for the material.');
      return;
    }
    
    setPostingMaterial(true);
    let uploadedFilePath = '';
    let uploadedFileName = '';

    try {
      if (materialFile) {
        const formData = new FormData();
        formData.append('materialFile', materialFile);

        const uploadRes = await fetch(`${API_BASE}/api/courses/${courseId}/materials/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        if (!uploadRes.ok) {
           const errorData = await uploadRes.json();
           throw new Error(errorData.message || 'File upload failed');
        }
        
        const uploadData = await uploadRes.json();
        uploadedFilePath = uploadData.filePath;
        uploadedFileName = uploadData.fileName;
      }

      const body = JSON.stringify({
        title: materialTitle,
        description: materialDescription,
        filePath: uploadedFilePath,
        fileName: uploadedFileName,
      });

      const data = await api(`/api/courses/${courseId}/materials`, {
        method: 'POST',
        body: body,
      });
      
      alert('Material posted! Students will be notified.');
      setCourse(data.course); // Refresh course data
      setMaterialTitle('');
      setMaterialDescription('');
      setMaterialFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err: any) {
      console.error(err);
      alert(`Failed to post material: ${err.message}`);
    } finally {
      setPostingMaterial(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setMaterialFile(event.target.files[0]);
    } else {
      setMaterialFile(null);
    }
  };

  // --- LOADING AND NOT FOUND STATES ---
  if (loading) {
     return (
       <Container className={styles.page} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
         <CircularProgress />
       </Container>
     );
  }

  // Check course *after* loading is false
  if (!course) {
     return (
       <Container className={styles.page}>
         <Typography variant="h5" sx={{color: '#aaa', textAlign: 'center', mt: 4}}>Course not found.</Typography>
       </Container>
     );
  }
  // --- END LOADING/NOT FOUND ---

  return (
    <Container className={styles.page} maxWidth="md" disableGutters>
      {/* --- EDIT COURSE FORM --- */}
      <Typography variant="h4" component="h1" className={styles.sectionTitle} mt={4} mb={3}>
        Edit: <b>{course?.title}</b> {/* <-- Added ?. */}
      </Typography>
      <Box className={styles.form} sx={{ mb: 6 }}>
        <TextField label="Course Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={4} fullWidth />
        <TextField label="Price (in ₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 100.00 (Enter 0 for free)" fullWidth />
        <Button className={styles.button} onClick={handleUpdate} disabled={saving} fullWidth>
          {saving ? <CircularProgress size={24} /> : 'Save Course Details'}
        </Button>
      </Box>

      <Divider sx={{ my: 6, borderColor: '#444' }} />

      {/* --- POST NEW MATERIAL FORM --- */}
      <Typography variant="h4" component="h1" className={styles.sectionTitle} mb={3}>
        Post New Material
      </Typography>
      <Box className={styles.form}>
        <TextField label="Material Title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} fullWidth />
        <TextField label="Description (Optional)" value={materialDescription} onChange={(e) => setMaterialDescription(e.target.value)} multiline rows={4} fullWidth />
        
        <Box sx={{ border: '1px dashed #666', borderRadius: 1, p: 2, textAlign: 'center', mt: 2 }}>
            <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{ color: '#ccc', borderColor: '#666' }}
            >
                {materialFile ? `Selected: ${materialFile.name}` : 'Upload PDF (Optional)'}
                <input
                    type="file"
                    hidden
                    accept="application/pdf"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                />
            </Button>
            {materialFile && (
                <Typography variant="caption" display="block" sx={{ color: '#aaa', mt: 1 }}>
                    Max 10MB
                </Typography>
            )}
        </Box>

        <Button className={styles.button} onClick={handlePostMaterial} disabled={postingMaterial} fullWidth sx={{ mt: 2 }}>
          {postingMaterial ? <CircularProgress size={24} /> : 'Post Material & Notify Students'}
        </Button>
      </Box>

      {/* --- LIST OF EXISTING MATERIALS --- */}
      <Typography variant="h5" component="h1" className={styles.sectionTitle} mt={6} mb={3}>
        Posted Materials
      </Typography>
      <List>
        {/* --- Added ?. here --- */}
        {(course?.materials?.length ?? 0) === 0 && (
          <Typography sx={{color: '#aaa'}}>No materials posted yet.</Typography>
        )}
        {/* --- Added ?. here --- */}
        {course?.materials?.slice().reverse().map((material: any) => (
          <ListItem key={material._id} sx={{ bgcolor: '#2d2d2d', mb: 2, borderRadius: 2, display: 'block' }}>
            <Typography variant="h6" sx={{color: '#eee'}}><b>{material.title}</b></Typography>
            {material.description && (
              <Typography variant="body2" sx={{ color: '#ccc', mt: 1, whiteSpace: 'pre-wrap' }}>
                {material.description}
              </Typography>
            )}
            {material.filePath && (
              <MuiLink
                  // href={`${API_BASE}/${material.filePath}`} // <-- OLD WAY
                  href={material.filePath} // <-- NEW WAY: Use Cloudinary URL directly
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'block', mt: 1, color: '#f39c12', fontWeight: 'bold' }}
                >
                  View File: {material.fileName || 'Download'}
                </MuiLink>
            )}
            <Typography variant="caption" sx={{ color: '#888', mt: 1, display: 'block' }}>
              Posted: {new Date(material.createdAt).toLocaleString()}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}