// src/features/courses/coursesApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api');

export const coursesApi = createApi({
  reducerPath: 'coursesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Courses', 'MyLearning', 'Course', 'CourseStructure', 'EnrolledCount'],
  endpoints: (builder) => ({
    getAllCourses: builder.query({
      query: () => '/courses',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Courses', id })),
              { type: 'Courses', id: 'LIST' },
            ]
          : [{ type: 'Courses', id: 'LIST' }],
    }),
    getMyLearning: builder.query({
      query: () => '/my-learning',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'MyLearning', id })),
              { type: 'MyLearning', id: 'LIST' },
            ]
          : [{ type: 'MyLearning', id: 'LIST' }],
    }),
    getEnrolledCount: builder.query({
      query: () => '/student/enrolled-count',
      providesTags: ['EnrolledCount'],
    }),
    getCourseById: builder.query({
      query: (id) => `/courses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Course', id }],
    }),
    enrollInCourse: builder.mutation({
      query: (courseId) => ({
        url: '/enroll',
        method: 'POST',
        body: { course_id: courseId },
      }),
      invalidatesTags: (result, error, courseId) => [
        { type: 'MyLearning', id: 'LIST' },
        'EnrolledCount',
      ],
    }),
    getCourseStructure: builder.query({
      query: (id) => `/courses/${id}/structure`,
      providesTags: (result, error, id) => [{ type: 'CourseStructure', id }],
    }),
    markLessonComplete: builder.mutation({
      query: ({ courseId, lessonId }) => ({
        url: '/progress/update',
        method: 'POST',
        body: { course_id: courseId, lesson_id: lessonId },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: 'MyLearning', id: 'LIST' }, // To update progress on MyLearning page
        { type: 'Course', id: courseId }, // To update progress on CoursePlayer page
      ],
    }),
    getInstructorCourses: builder.query({
      query: () => '/instructor/courses',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Courses', id })), { type: 'Courses', id: 'LIST' }]
          : [{ type: 'Courses', id: 'LIST' }],
    }),
    createCourse: builder.mutation({
      query: (courseData) => ({
        url: '/instructor/courses',
        method: 'POST',
        body: courseData,
      }),
      invalidatesTags: [{ type: 'Courses', id: 'LIST' }],
    }),
    updateCourse: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/instructor/courses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Courses', id: 'LIST' },
        { type: 'Course', id },
      ],
    }),
    deleteCourse: builder.mutation({
      query: (id) => ({
        url: `/instructor/courses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Courses', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAllCoursesQuery,
  useGetMyLearningQuery,
  useGetCourseByIdQuery,
  useEnrollInCourseMutation,
  useGetInstructorCoursesQuery,
  useGetEnrolledCountQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetCourseStructureQuery,
  useMarkLessonCompleteMutation,
} = coursesApi;