'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Box, Container, Typography, List, Divider } from '@mui/material';
import styles from "./submissions.module.css";

export default function StudentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSubmissions = async () => {
    try {
      const data = await api('/api/submissions/mine');
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  if (loading) {
    return (
      <Container className={styles.container}>
        <Typography className={styles.highlight}>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container className={styles.container} maxWidth={false} disableGutters>
      <Typography variant="h4" component="h1" className={styles.title}>
        <b>My Submissions</b>
        
      </Typography>

      {submissions.length === 0 ? (
        <Typography className={styles.highlight}>No submissions yet.</Typography>
      ) : (
        <List>
          {submissions.map((s) => (
            <Box key={s._id} className={styles.card}>
              <Typography variant="h6" className={styles.subtitle}>
                {s.assignment?.title || 'Untitled Assignment'}
              </Typography>
              <Typography className={styles.text}>
                Course: {s.assignment?.course?.title || 'Unknown'}
              </Typography>

              {s.content && (
                <Box mt={1} mb={1}>
                  <Typography className={styles.subtitle}>Your Answer:</Typography>
                  <Typography className={styles.text}>{s.content}</Typography>
                </Box>
              )}

              {s.files?.length > 0 && (
                <Box mt={1} mb={1}>
                  <Typography className={styles.subtitle}>Uploaded Files:</Typography>
                  {s.files.map((f: any, idx: number) => (
                    <a
                      key={idx}
                      href={`${process.env.NEXT_PUBLIC_API_BASE}${f.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      📄 {f.name}
                    </a>
                  ))}
                </Box>
              )}

              <Divider className={styles.divider} />

              {s.score !== undefined ? (
                <Box>
                  <Typography className={styles.subtitle}>
                    Score: {s.score}
                  </Typography>
                  {s.feedback && (
                    <Typography className={styles.text}>
                      Feedback: {s.feedback}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography className={styles.textMuted}>Not graded yet</Typography>
              )}
            </Box>
          ))}
        </List>
      )}
    </Container>
  );
}
