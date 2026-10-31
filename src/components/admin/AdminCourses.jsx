import React from 'react';
import ApiContent from '../api/ApiContent';
// Compatibility wrapper: course management now uses the Spring Boot /api/v1/courses contract.
export default function AdminCourses(){return <ApiContent user={{role:'ADMIN'}} section="courses"/>;}
