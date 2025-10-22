'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Container, Box, TextField, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import styles from "./login.module.css";

export default function LoginPage() {
  const [form, setForm] = useState({ email:'', password:'' });
  const router = useRouter();

  const submit = async () => {
    try {
      await api('/api/auth/login', { method:'POST', body: JSON.stringify(form) });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container className={styles.container} maxWidth={false} disableGutters>
      <Box className={styles.box} display="grid" gap={2}>
        <Typography variant="h5" className={styles.title}>Sign in</Typography>
        <TextField 
          label="Email" 
          value={form.email} 
          onChange={e=>setForm({...form, email:e.target.value})}
          className={styles.input}
        />
        <TextField 
          label="Password" 
          type="password" 
          value={form.password} 
          onChange={e=>setForm({...form, password:e.target.value})}
          className={styles.input}
        />
        <Button 
          variant="contained" 
          onClick={submit} 
          className={styles.button}
        >
          Login
        </Button>
      </Box>
    </Container>
  );
}
