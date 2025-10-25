// web/src/app/teacher/submissions/page.tsx
import { Suspense } from 'react';
import { SubmissionsClient } from './SubmissionsClient';
import { Box, Container, CircularProgress } from '@mui/material';

// --- Loading Component (Fallback) ---
function Loading() {
    return (
        <Container sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress sx={{ color: '#f39c12' }} />
        </Container>
    );
}

// --- Main Page Component ---
export default function SubmissionsPage() {
    return (
        // The Suspense Boundary ensures SubmissionsClient (which uses useSearchParams)
        // only runs after the client-side environment is ready.
        <Suspense fallback={<Loading />}>
            <SubmissionsClient />
        </Suspense>
    );
}