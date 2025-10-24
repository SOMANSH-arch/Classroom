"use client";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Box,
  Button,
  Container,
  MenuItem,
  Select,
  TextField,
  Typography,
  List,
  Divider,
  SelectChangeEvent,
  CircularProgress,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import styles from "./teacherSubmissions.module.css";

interface GradingState {
  score: string;
  feedback: string;
}

function TeacherSubmissionsPageInner() {
  const searchParams = useSearchParams();

  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [gradingStates, setGradingStates] = useState<{
    [key: string]: GradingState;
  }>({});
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Load courses
  useEffect(() => {
    const courseIdFromUrl = searchParams.get("courseId");
    const assignmentIdFromUrl = searchParams.get("assignmentId");

    const fetchInitialCourses = async () => {
      setLoadingCourses(true);
      try {
        const data = await api("/api/courses/my");
        setCourses(data.courses || []);
        if (
          courseIdFromUrl &&
          data.courses?.some((c: any) => c._id === courseIdFromUrl)
        ) {
          setSelectedCourse(courseIdFromUrl);
        }
      } catch (err) {
        console.error("Error loading initial courses:", err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchInitialCourses();
  }, [searchParams]);

  // Load assignments when course changes
  useEffect(() => {
    const assignmentIdFromUrl = searchParams.get("assignmentId");

    const fetchAssignments = async () => {
      if (!selectedCourse) return;

      setLoadingAssignments(true);
      setAssignments([]);
      setSubmissions([]);
      setGradingStates({});

      try {
        const data = await api(`/api/assignments/course/${selectedCourse}`);
        const fetchedAssignments = data.assignments || [];
        setAssignments(fetchedAssignments);

        if (
          assignmentIdFromUrl &&
          fetchedAssignments.some((a: any) => a._id === assignmentIdFromUrl)
        ) {
          setSelectedAssignment(assignmentIdFromUrl);
        }
      } catch (err) {
        console.error("Error loading assignments:", err);
      } finally {
        setLoadingAssignments(false);
      }
    };

    fetchAssignments();
  }, [selectedCourse, searchParams]);

  // Load submissions when assignment changes
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedAssignment) return;

      setLoadingSubmissions(true);
      setSubmissions([]);
      setGradingStates({});

      try {
        const data = await api(
          `/api/submissions/assignment/${selectedAssignment}`
        );
        const fetchedSubmissions = data.submissions || [];
        setSubmissions(fetchedSubmissions);

        const initialGradingStates: { [key: string]: GradingState } = {};
        fetchedSubmissions.forEach((sub: any) => {
          initialGradingStates[sub._id] = {
            score:
              sub.score !== undefined && sub.score !== null
                ? String(sub.score)
                : "",
            feedback: sub.feedback || "",
          };
        });
        setGradingStates(initialGradingStates);
        console.log("Fetched submissions automatically:", fetchedSubmissions);
      } catch (err) {
        console.error("Error loading submissions:", err);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    fetchSubmissions();
  }, [selectedAssignment]);

  // Handlers
  const handleCourseChange = (event: SelectChangeEvent<string>) => {
    const courseId = event.target.value;
    setSelectedCourse(courseId);
    setSelectedAssignment("");
    setAssignments([]);
    setSubmissions([]);
    setGradingStates({});
  };

  const handleAssignmentChange = (event: SelectChangeEvent<string>) => {
    const assignmentId = event.target.value;
    setSelectedAssignment(assignmentId);
    setSubmissions([]);
    setGradingStates({});
  };

  const handleGradeChange = (
    submissionId: string,
    field: "score" | "feedback",
    value: string
  ) => {
    setGradingStates((prev) => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], [field]: value },
    }));
  };

  const gradeSubmission = async (submissionId: string) => {
    const { score, feedback } = gradingStates[submissionId] || {};
    try {
      await api(`/api/submissions/${submissionId}/grade`, "PUT", {
        score,
        feedback,
      });
      alert("Grade saved successfully!");
    } catch (err) {
      console.error("Error grading submission:", err);
    }
  };

  return (
    <Container className={styles.page} maxWidth={false} disableGutters>
      <Typography
        className={styles.sectionTitle}
        variant="h4"
        sx={{ color: "#f39c12", mt: 4, mb: 2 }}
      >
        Grade Submissions
      </Typography>

      {/* Course Selector */}
      <Box mb={2}>
        {loadingCourses ? (
          <CircularProgress size={24} />
        ) : (
          <Select
            value={selectedCourse}
            onChange={handleCourseChange}
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>
              Select a Course
            </MenuItem>
            {courses.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.title}
              </MenuItem>
            ))}
          </Select>
        )}
      </Box>

      {/* Assignment Selector */}
      {selectedCourse && (
        <Box mb={3}>
          {loadingAssignments ? (
            <CircularProgress size={24} />
          ) : (
            <Select
              value={selectedAssignment}
              onChange={handleAssignmentChange}
              displayEmpty
              fullWidth
            >
              <MenuItem value="" disabled>
                Select an Assignment
              </MenuItem>
              {assignments.map((a) => (
                <MenuItem key={a._id} value={a._id}>
                  {a.title}
                </MenuItem>
              ))}
            </Select>
          )}
        </Box>
      )}

      {/* Submissions */}
      {loadingSubmissions && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "#f39c12" }} />
        </Box>
      )}

      {!loadingSubmissions && selectedAssignment && (
        <List>
          {submissions.length === 0 && (
            <Typography sx={{ color: "#aaa", textAlign: "center" }}>
              No submissions for this assignment yet.
            </Typography>
          )}
          {submissions.map((s) => {
            const currentGradeState = gradingStates[s._id] || {
              score: "",
              feedback: "",
            };
            return (
              <Box
                key={s._id}
                className={styles.submissionCard}
                sx={{
                  bgcolor: "#2d2d2d",
                  p: 3,
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ color: "#eee" }}>
                  {s.student?.name || "Unknown"}
                </Typography>
                <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
                  {s.student?.email}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#888", display: "block", mb: 2 }}
                >
                  Submitted: {new Date(s.createdAt).toLocaleString()}
                </Typography>

                <Divider sx={{ my: 2, borderColor: "#444" }} />
                <Typography
                  variant="subtitle1"
                  sx={{ color: "#ccc", fontWeight: "bold", mb: 1 }}
                >
                  Grade:
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    label="Score (0-100)"
                    type="number"
                    value={currentGradeState.score}
                    onChange={(e) =>
                      handleGradeChange(s._id, "score", e.target.value)
                    }
                    size="small"
                  />
                  <TextField
                    label="Feedback"
                    multiline
                    rows={3}
                    value={currentGradeState.feedback}
                    onChange={(e) =>
                      handleGradeChange(s._id, "feedback", e.target.value)
                    }
                  />
                  <Button
                    className={styles.button}
                    onClick={() => gradeSubmission(s._id)}
                    variant="contained"
                    sx={{ bgcolor: "#f39c12" }}
                  >
                    Save Grade
                  </Button>
                </Box>
              </Box>
            );
          })}
        </List>
      )}
    </Container>
  );
}

export default function TeacherSubmissionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherSubmissionsPageInner />
    </Suspense>
  );
}
