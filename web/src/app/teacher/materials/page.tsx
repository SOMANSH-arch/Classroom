'use client';
import { useEffect, useState, useRef } from 'react';
import { api, API_BASE } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import {
    Box, Button, Container, TextField, Typography, Select, MenuItem,
    CircularProgress, SelectChangeEvent, List, ListItem, Divider, Link as MuiLink
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function TeacherMaterialsPage() {
    const searchParams = useSearchParams(); 
    const initialCourseId = searchParams.get('courseId') || ''; 

    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
    
    const [materialTitle, setMaterialTitle] = useState('');
    const [materialDescription, setMaterialDescription] = useState('');
    const [materialFile, setMaterialFile] = useState<File | null>(null);
    const [postingMaterial, setPostingMaterial] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingMaterials, setLoadingMaterials] = useState(false); // <-- NEW STATE
    const [existingMaterials, setExistingMaterials] = useState<any[]>([]); // <-- NEW STATE
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. Load courses and set initial selected course
    useEffect(() => {
        const loadCourses = async () => {
            try {
                const data = await api('/api/courses/my');
                const fetchedCourses = data.courses || [];
                setCourses(fetchedCourses);

                if (initialCourseId && fetchedCourses.some((c:any) => c._id === initialCourseId)) {
                     setSelectedCourseId(initialCourseId);
                } else if (initialCourseId) {
                    setSelectedCourseId('');
                }

            } catch (err) { console.error("Error loading courses:", err); }
            finally { setLoadingCourses(false); }
        };
        loadCourses();
    }, [initialCourseId]);

    // 2. --- NEW EFFECT: Load materials when course is selected ---
    useEffect(() => {
        const loadMaterials = async () => {
            if (!selectedCourseId) {
                setExistingMaterials([]);
                return;
            }
            setLoadingMaterials(true);
            try {
                // Fetch the single course details (which contains the materials array)
                const data = await api(`/api/courses/${selectedCourseId}/my`);
                setExistingMaterials(data.course?.materials || []);
            } catch (err) {
                console.error("Error loading existing materials:", err);
                setExistingMaterials([]);
            } finally {
                setLoadingMaterials(false);
            }
        };

        loadMaterials();
    }, [selectedCourseId]); // Reruns whenever a course is selected or changes


    // Handle course selection change
    const handleCourseChange = (event: SelectChangeEvent<string>) => {
        if (!initialCourseId) {
            setSelectedCourseId(event.target.value);
        }
    };

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMaterialFile(event.target.files?.[0] || null);
    };

    // Handle Upload and Posting
    const handlePostMaterial = async () => {
        if (!selectedCourseId || !materialTitle) { alert('Please select a course and enter a title.'); return; }
        
        setPostingMaterial(true);
        let uploadedFilePath = '';
        let uploadedFileName = '';

        try {
            // --- Step A: Upload the file if one is selected ---
            if (materialFile) {
                const formData = new FormData();
                formData.append('materialFile', materialFile);

                const uploadRes = await fetch(`${API_BASE}/api/courses/${selectedCourseId}/materials/upload`, { method: 'POST', body: formData, credentials: 'include', });

                if (!uploadRes.ok) {
                    const errorData = await uploadRes.json();
                    throw new Error(errorData.message || 'File upload failed');
                }
                const uploadData = await uploadRes.json();
                uploadedFilePath = uploadData.filePath;
                uploadedFileName = uploadData.fileName;
            }

            // --- Step B: Post the metadata ---
            const body = JSON.stringify({
                title: materialTitle, description: materialDescription, filePath: uploadedFilePath, fileName: uploadedFileName,
            });
            await api(`/api/courses/${selectedCourseId}/materials`, { method: 'POST', body: body, });
            
            // --- Success: Update UI and clear form ---
            alert('Material posted and students notified!');
            // Prepend new material to the list for immediate display
            const newMaterial = { 
                _id: Date.now().toString(), // Temp ID for key
                title: materialTitle, 
                description: materialDescription,
                filePath: uploadedFilePath,
                fileName: uploadedFileName,
                createdAt: new Date().toISOString()
            };
            setExistingMaterials(prev => [newMaterial, ...prev]);

            setMaterialTitle(''); setMaterialDescription(''); setMaterialFile(null);
            if (fileInputRef.current) { fileInputRef.current.value = ''; }

        } catch (err: any) {
            console.error(err);
            alert(`Failed to post material: ${err.message}`);
        } finally {
            setPostingMaterial(false);
        }
    };

    if (loadingCourses) {
        return <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: '#f39c12' }} /></Container>;
    }


    return (
        <Container sx={{ py: 4 }} maxWidth="md">
            <Typography variant="h4" component="h1" sx={{ color: '#f39c12', mt: 4, mb: 3 }}>
                <b>Post New Course Material</b>
            </Typography>
            
            {/* --- Course Selector --- */}
            <Box mb={4}>
                <Typography variant="subtitle1" sx={{ color: '#eee', mb: 1 }}>Select Course:</Typography>
                <Select
                    value={selectedCourseId}
                    onChange={handleCourseChange}
                    displayEmpty
                    fullWidth
                    disabled={!!initialCourseId} // Disable if pre-selected
                    sx={{ color: '#eee', bgcolor: '#2d2d2d', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' }, '& .MuiSelect-icon': { color: '#aaa' } }}
                    MenuProps={{ PaperProps: { sx: { bgcolor: '#2d2d2d', color: '#eee' } } }}
                >
                    <MenuItem value="" disabled>{initialCourseId ? (courses.find(c => c._id === initialCourseId)?.title || 'Course Pre-Selected') : 'Choose a Course'}</MenuItem>
                    {courses.map(c => (
                        <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>
                    ))}
                </Select>
                 {initialCourseId && <Typography variant="caption" sx={{ color: '#aaa', mt: 1, display: 'block' }}>Course is pre-selected from the Management Hub.</Typography>}
            </Box>


            {/* --- Post Material Form --- */}
            <Box component="form" className="form" sx={{ bgcolor: '#2d2d2d', p: 3, borderRadius: 2, mb: 4 }}>
                <TextField label="Material Title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} fullWidth required sx={{ mb: 2 }} InputLabelProps={{ sx: { color: '#aaa' } }} InputProps={{ sx: { color: '#eee', bgcolor: '#3a3a3a'} }} />
                <TextField label="Description (Optional)" value={materialDescription} onChange={(e) => setMaterialDescription(e.target.value)} multiline rows={4} fullWidth sx={{ mb: 2 }} InputLabelProps={{ sx: { color: '#aaa' } }} InputProps={{ sx: { color: '#eee', bgcolor: '#3a3a3a' } }} />
                
                {/* File Input */}
                <Box sx={{ border: '1px dashed #666', borderRadius: 1, p: 2, textAlign: 'center', mb: 2 }}>
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

                <Button onClick={handlePostMaterial} disabled={postingMaterial || !selectedCourseId} fullWidth sx={{ bgcolor: '#f39c12', '&:hover': { bgcolor: '#e67e22' } }}>
                    {postingMaterial ? <CircularProgress size={24} color="inherit"/> : 'Post Material & Notify Students'}
                </Button>
            </Box>

            {/* --- EXISTING MATERIALS LIST --- */}
            <Divider sx={{ my: 4, borderColor: '#444' }} />

            <Typography variant="h5" component="h2" sx={{ color: '#f39c12', mt: 4, mb: 2 }}>
                Existing Materials
            </Typography>

            {loadingMaterials ? (
                 <Box sx={{display: 'flex', justifyContent: 'center'}}><CircularProgress size={24} sx={{color: '#f39c12'}}/></Box>
            ) : (
                <List>
                    {selectedCourseId && existingMaterials.length === 0 && (
                        <Typography sx={{ color: '#aaa' }}>No materials posted for this course yet.</Typography>
                    )}
                    {!selectedCourseId && (
                         <Typography sx={{ color: '#aaa' }}>Please select a course to view existing materials.</Typography>
                    )}
                    
                    {/* Display materials, newest first */}
                    {existingMaterials.slice().reverse().map((material: any) => (
                        <ListItem key={material._id} sx={{ bgcolor: '#2d2d2d', mb: 2, borderRadius: 2, display: 'block' }}>
                            <Typography variant="h6" sx={{ color: '#eee' }}><b>{material.title}</b></Typography>
                            {material.description && (
                                <Typography variant="body2" sx={{ color: '#ccc', mt: 1, whiteSpace: 'pre-wrap' }}>
                                    {material.description}
                                </Typography>
                            )}
                            {material.filePath && (
                                <MuiLink
                                    href={material.filePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={material.fileName || true}
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
            )}
        </Container>
    );
}