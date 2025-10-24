'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Box, Button, Container, Typography, List, ListItem } from '@mui/material';
import styles from "./courses.module.css";
import { useRouter } from 'next/navigation'; // <-- 1. IMPORT

// 1. ADD THIS TYPE DEFINITION FOR RAZORPAY
declare global {
  interface Window {
    Razorpay: any;
  }
}

// 2. ADD THIS HELPER FUNCTION TO FORMAT PRICE
const formatPrice = (priceInPaise: number) => {
  if (priceInPaise == null || priceInPaise === 0) return "Free";
  const priceInRupees = (priceInPaise / 100).toFixed(2);
  return `₹${priceInRupees}`;
};

export default function StudentCoursesPage() {
  const [publishedCourses, setPublishedCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const router = useRouter(); // <-- 2. INITIALIZE

  const loadPublished = async () => {
    try {
      const data = await api('/api/courses');
      setPublishedCourses(data.courses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadEnrolled = async () => {
    try {
      const data = await api('/api/courses/enrolled');
      setEnrolledCourses(data.courses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnroll = async (course: any) => {
    try {
      // --- 1. Create Order ---
      const { order, key } = await api(`/api/payment/checkout/${course._id}`, {
        method: 'POST',
      });

      // --- 2. Configure Razorpay Options ---
      const options = {
        key: key,
        amount: order.amount, // Amount in paise
        currency: order.currency,
        name: 'Innodeed Classroom',
        description: `Enroll in ${course.title}`,
        order_id: order.id,
        
        handler: async function (response: any) {
          try {
            // --- 4. Verify Payment ---
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: course._id,
            };
            
            await api('/api/payment/verify', {
              method: 'POST',
              body: JSON.stringify(verificationData),
            });
            
            alert('Payment successful! You are now enrolled.');
            loadEnrolled(); // Refresh the enrolled courses list

          } catch (err) {
            console.error(err);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          // name: "Student Name",
          // email: "student.email@example.com",
        },
        theme: {
          color: '#3399cc',
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp1.open();

    } catch (err) {
      console.error(err);
      alert('Error: Could not start payment.');
    }
  };

  useEffect(() => {
    loadPublished();
    loadEnrolled();
  }, []);

  // 3. --- ADD NAVIGATION FUNCTION ---
  const viewCourse = (courseId: string) => {
    router.push(`/student/courses/${courseId}`);
  };

  return (
    <Container className={styles.page} maxWidth={false} disableGutters>
      {/* Available Courses (No changes here) */}
      <Typography variant="h4" component="h1" className={styles.sectionTitle} mt={4} mb={2}>
        <b>AVAILABLE COURSES</b>
      </Typography>
      <List>
        {publishedCourses.map(course => (
          <ListItem key={course._id} className={styles.courseCard}>
            <Box className={styles.courseText}>
              <div className={styles.courseTitle}>
                {course.title} by {course.teacher?.name || 'Unknown'}
              </div>
              <div className={styles.courseDescription}>
                {course.description}
              </div>
            </Box>
            
            <Box style={{ textAlign: 'right', marginLeft: 'auto', flexShrink: 0 }}>
              <Typography variant="h6" component="div" className={styles.priceGradient}>
                {formatPrice(course.price)}
              </Typography>
              <Button
                sx={{ ml: 2 }} // Added margin-left
                className={styles.enrollButton}
                onClick={() => handleEnroll(course)}
                disabled={enrolledCourses.some(c => c._id === course._id)}
              >
                {enrolledCourses.some(c => c._id === course._id) ? 'Enrolled' : 'Enroll Now'}
              </Button>
            </Box>

          </ListItem>
        ))}
      </List>

      {/* Enrolled Courses */}
      <Typography variant="h4" component="h1" className={styles.sectionTitle} mt={6} mb={2}>
        <b>MY ENROLLED COURSES</b>
      </Typography>
      <List>
        {enrolledCourses.map(course => (
          // 4. --- APPLY CHANGES TO THIS LISTITEM ---
          <ListItem 
            key={course._id} 
            className={styles.enrolledCourseCard} // Use new style
            onClick={() => viewCourse(course._id)}  // Add onClick
          >
            <Box className={styles.courseText}>
              <div className={styles.courseTitle}>{course.title}</div>
              <div className={styles.courseDescription}>{course.description}</div>
            </Box>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}