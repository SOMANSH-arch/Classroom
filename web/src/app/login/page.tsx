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
    // The API call is correct, but we'll ensure form data is sent properly:
    await api('/api/auth/login', { 
        method: 'POST', 
        body: JSON.stringify(form) 
    });
    
    // Only navigate if the API call completes successfully (status 200/201)
    router.push('/dashboard');
    
  } catch (err: any) {
    console.error("Login Error:", err);
    
    // Display a user-friendly error message, extracting it from the API error response
    let errorMessage = "Login failed. Please check your network.";
    
    // Your api.ts throws an Error(await res.text()). We can try to parse the JSON error body
    try {
        const errorBody = JSON.parse(err.message);
        errorMessage = errorBody.message || "Invalid credentials or network error.";
    } catch {
        // If it's not JSON (e.g., an HTML 404 page), use a generic message
        if (err.message.includes('404')) {
             errorMessage = "API server unavailable or endpoint missing.";
        }
    }

    alert(errorMessage);
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
