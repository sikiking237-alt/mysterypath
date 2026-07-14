// src/features/courses/coursesApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiEndpoints } from "../../config/apiConfig";

export const coursesApi = createApi({
  reducerPath: "coursesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: [
    "Course",
    "EnrolledCourse",
    "InstructorStats",
    "InstructorCourses",
    "InstructorStudents",
    "Lessons",
    "Sections",
    "CourseStructure"
  ],

  endpoints: (builder) => ({
    // ==================== STUDENT ENDPOINTS ====================
    getAllCourses: builder.query({
      query: () => `courses`,
      providesTags: (result = []) => [
        ...result.map(({ id }) => ({ type: "Course", id })),
        { type: "Course", id: "LIST" },
      ],
    }),

    getCourse: builder.query({
      query: (id) => `courses/${id}`,
      providesTags: (result, error, id) => [{ type: "Course", id }],
    }),

    enrollInCourse: builder.mutation({
      query: (courseId) => ({
        url: `enroll`,
        method: "POST",
        body: { course_id: courseId },
      }),
      invalidatesTags: ["EnrolledCourse"],
    }),

    getEnrolledCount: builder.query({
      query: () => `student/enrolled-count`,
      providesTags: ["EnrolledCourse"],
    }),

    // ==================== INSTRUCTOR ENDPOINTS ====================
    getInstructorStats: builder.query({
      query: () => `instructor/stats`,
      providesTags: ["InstructorStats"],
    }),

    getInstructorCourses: builder.query({
      query: () => `instructor/courses`,
      providesTags: ["InstructorCourses"],
    }),

    getInstructorStudents: builder.query({
      query: () => `instructor/students`,
      providesTags: ["InstructorStudents"],
    }),

    createInstructorCourse: builder.mutation({
      query: (courseData) => ({
        url: `instructor/courses`,
        method: "POST",
        body: courseData,
      }),
      invalidatesTags: ["InstructorCourses", "Course"],
    }),

    updateInstructorCourse: builder.mutation({
      query: ({ id, ...courseData }) => ({
        url: `instructor/courses/${id}`,
        method: "PUT",
        body: courseData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Course", id }, "InstructorCourses"],
    }),

    deleteInstructorCourse: builder.mutation({
      query: (id) => ({
        url: `instructor/courses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["InstructorCourses", "Course"],
    }),

    uploadImage: builder.mutation({
      query: (formData) => ({
        url: `upload/image`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Course", "InstructorCourses"],
    }),

    // ==================== COURSE STRUCTURE ENDPOINTS ====================
    getCourseStructure: builder.query({
      query: (courseId) => `instructor/courses/${courseId}/structure`,
      providesTags: ["CourseStructure"],
    }),
  }),
});

// ==================== EXPORT ALL HOOKS ====================
export const {
  // Student hooks
  useGetAllCoursesQuery,
  useGetCourseQuery,
  useEnrollInCourseMutation,
  useGetEnrolledCountQuery,

  // Instructor hooks
  useGetInstructorStatsQuery,
  useGetInstructorCoursesQuery,
  useGetInstructorStudentsQuery,
  useUploadImageMutation,
  useCreateInstructorCourseMutation,
  useUpdateInstructorCourseMutation,
  useDeleteInstructorCourseMutation,

  // Course Structure hooks
  useGetCourseStructureQuery,
} = coursesApi;
