'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, API_BASE } from '@/lib/api'; // <-- Import API_BASE
// --- CORRECTED MUI IMPORT ---
import { Box, Button, Container, Typography, List, ListItem, CircularProgress, Paper, Divider, Link as MuiLink } from '@mui/material';
import Link from 'next/link'; // This is the Next.js Link

export default function StudentCoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      const loadData = async () => {
        try {
          const courseData = await api(`/api/courses/${courseId}/student-details`);
          setCourse(courseData.course);

          const assignData = await api(`/api/assignments/course/${courseId}`);
          setAssignments(assignData.assignments || []);

        } catch (err) {
          console.error(err);
          alert('Failed to load course data.');
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [courseId]);

  if (loading) {
    return <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Container>;
  }

  if (!course) {
    return <Container sx={{ py: 4 }}><Typography sx={{color: '#aaa', textAlign: 'center'}}>Course not found or you are not enrolled.</Typography></Container>;
  }

  return (
    <Container sx={{ py: 4 }} maxWidth="md">
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#f39c12' }}>
        <b>{course.title}</b>
      </Typography>
      <Typography variant="body1" sx={{ color: '#ccc' }} gutterBottom>
        {course.description}
      </Typography>

      <Divider sx={{ my: 4, borderColor: '#444' }} />

      <Typography variant="h4" component="h2" gutterBottom sx={{ color: '#f39c12' }}>
        <b>Course Materials</b>
      </Typography>
      <List>
        {(course?.materials?.length ?? 0) === 0 && <Typography sx={{ color: '#aaa' }}>No materials posted yet.</Typography>}
        {course?.materials?.slice().reverse().map((material: any) => (
          <ListItem key={material._id} sx={{ bgcolor: '#2d2d2d', mb: 2, borderRadius: 2, display: 'block' }}>
            <Typography variant="h6" sx={{ color: '#eee' }}><b>{material.title}</b></Typography>
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

      <Divider sx={{ my: 4, borderColor: '#444' }} />

      <Typography variant="h4" component="h2" gutterBottom sx={{ color: '#f39c12' }}>
        <b>Assignments</b>
      </Typography>
      <List>
        {(assignments?.length ?? 0) === 0 && <Typography sx={{ color: '#aaa' }}>No assignments posted yet.</Typography>}
        {assignments.map((assignment) => (
          <ListItem
            key={assignment._id}
            component={Link} // Use Next.js Link for routing
            href={`/student/assignments/${assignment._id}`}
            sx={{
              bgcolor: '#2d2d2d',
              mb: 2,
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'space-between',
              cursor: 'pointer',
              textDecoration: 'none', // Remove underline from link
              '&:hover': { bgcolor: '#3a3a3a' }
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ color: '#eee' }}><b>{assignment.title}</b></Typography>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Button variant="contained" sx={{ my: 'auto', bgcolor: '#f39c12', '&:hover': { bgcolor: '#e67e22' } }}>View</Button>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}