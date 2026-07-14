/**
 * Calculates the total XP points for a course from its quiz lessons.
 * Assumes the course object has a structure with sections, lessons, and questions with points.
 * @param {object} course - The course object.
 * @returns {number} The total points for the course.
 */
export const calculateTotalPoints = (course) => {
  if (!course || !course.sections) {
    return 0;
  }

  return course.sections.reduce((totalPoints, section) => {
    if (!section.lessons) {
      return totalPoints;
    }

    const sectionPoints = section.lessons.reduce((lessonTotal, lesson) => {
      const points = lesson.questions?.reduce((quizTotal, question) => quizTotal + (question.points || 0), 0) || 0;
      return lessonTotal + points;
    }, 0);

    return totalPoints + sectionPoints;
  }, 0);
};