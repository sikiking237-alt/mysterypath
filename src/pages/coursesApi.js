import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiEndpoints } from "../../config/apiConfig";

export const coursesApi = createApi({
  reducerPath: "coursesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  // 1. Define a "Course" tag type.
  tagTypes: ["Course", "EnrolledCourse"],

  endpoints: (builder) => ({
    getAllCourses: builder.query({
      query: () => `courses`,
      // 2. This query now provides a list of 'Course' tags.
      // If any of these tags are invalidated, the query will automatically refetch.
      providesTags: (result = []) => [
        ...result.map(({ id }) => ({ type: "Course", id })),
        { type: "Course", id: "LIST" },
      ],
    }),

    // This is a hypothetical mutation for an admin creating a course.
    createCourse: builder.mutation({
      query: (newCourse) => ({
        url: "admin/courses", // Assuming an admin endpoint
        method: "POST",
        body: newCourse,
      }),
      // 3. When a course is created, invalidate the 'LIST' tag.
      // This forces `getAllCourses` to refetch.
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),

    enrollInCourse: builder.mutation({
      query: (courseId) => ({
        url: apiEndpoints.enrollments.enroll,
        method: "POST",
        body: { course_id: courseId },
      }),
      invalidatesTags: ["EnrolledCourse"],
    }),
  }),
});

export const { useGetAllCoursesQuery, useCreateCourseMutation, useEnrollInCourseMutation } = coursesApi;