/**
 * Represents a simplified certificate structure fetched from Moodle.
 */
export interface MoodleCertificate {
  courseName: string;
  issueDate: string;
  grade?: string;
  moodleCourseId: string;
}

/**
 * Mocked Moodle Service.
 * This service simulates fetching certificate data from a Moodle instance.
 * It should be replaced with a real implementation when the Moodle API details are available.
 */
const getMoodleCertificates = (userId: string): Promise<MoodleCertificate[]> => {
  console.log(`[MOCK] Fetching Moodle certificates for user: ${userId}`);

  // Fake data representing certificates from Moodle
  const fakeMoodleCerts: MoodleCertificate[] = [
    {
      courseName: 'Introdução à Culinária Moodle',
      issueDate: '2023-05-20T10:00:00Z',
      grade: '95%',
      moodleCourseId: 'moodle-course-1',
    },
    {
      courseName: 'Moodle Avançado para Educadores',
      issueDate: '2023-08-15T14:30:00Z',
      grade: 'Aprovado',
      moodleCourseId: 'moodle-course-2',
    },
  ];

  // Return a promise that resolves after a short delay to simulate a network request
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('[MOCK] Moodle certificates fetched successfully.');
      resolve(fakeMoodleCerts);
    }, 1200); // 1.2 second delay
  });
};

export const moodleService = {
  getMoodleCertificates,
};
