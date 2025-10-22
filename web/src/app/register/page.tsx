'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Container, Box, TextField, Button, MenuItem, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import styles from "./register.module.css";

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'student' });
  const router = useRouter();

  const submit = async () => {
    try {
      await api('/api/auth/register', { method:'POST', body: JSON.stringify(form) });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container className={styles.container} maxWidth={false} disableGutters>
      <Box className={styles.card} display="grid" gap={2}>
        <Typography variant="h5" className={styles.title}>
          Create Account
        </Typography>

        <TextField
          label="Name"
          value={form.name}
          onChange={e=>setForm({...form, name:e.target.value})}
          className={styles.input}
        />
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
        <TextField
          select
          label="Role"
          value={form.role}
          onChange={e=>setForm({...form, role:e.target.value})}
          className={styles.input}
        >
          <MenuItem value="student">Student</MenuItem>
          <MenuItem value="teacher">Teacher</MenuItem>
        </TextField>

        <Button
          variant="contained"
          onClick={submit}
          className={styles.button}
        >
          Register
        </Button>

        <Typography variant="body2" className={styles.linkText}>
          Already have an account? <a href="/login">Login</a>
        </Typography>
      </Box>
    </Container>
  );
}
