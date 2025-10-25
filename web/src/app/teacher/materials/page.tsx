// web/src/app/teacher/materials/page.tsx
import { Suspense } from 'react';
import { MaterialsClient } from './MaterialsClient';
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
export default function MaterialsPage() {
    return (
        // The Suspense Boundary ensures MaterialsClient (which uses useSearchParams)
        // only runs after the client-side environment is ready.
        <Suspense fallback={<Loading />}>
            <MaterialsClient />
        </Suspense>
    );
}