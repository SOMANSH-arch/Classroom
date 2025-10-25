// web/src/app/teacher/assignments/page.tsx
import { Suspense } from 'react';
import { AssignmentsClient } from './AssignmentsClient';
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
export default function AssignmentsPage() {
    return (
        // The Suspense Boundary ensures AssignmentsClient (which uses useSearchParams)
        // only runs after the client-side environment is ready.
        <Suspense fallback={<Loading />}>
            <AssignmentsClient />
        </Suspense>
    );
}