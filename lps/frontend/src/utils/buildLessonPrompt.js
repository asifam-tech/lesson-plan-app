export function buildLessonPrompt({
  topic,
  subject,
  grade_level,
  duration_minutes,
  specific_focus,
  teaching_approach,
  curriculum_text,
  curriculum_source,
}) {
  const duration = duration_minutes || 45;
  const trimmedCurriculum = curriculum_text ? curriculum_text.slice(0, 6000) : null;
  const approachLine = teaching_approach && teaching_approach !== 'Mixed' ? `Teaching approach: ${teaching_approach}\n` : '';
  const focusLine = specific_focus ? `Specific focus or challenge: ${specific_focus}\n` : '';
  const curriculumBlock = trimmedCurriculum
    ? `\nCURRICULUM CONTEXT (use this as the primary reference for content, learning outcomes, and sequencing):\n---\n${trimmedCurriculum}\n---\n`
    : `\nNo curriculum was provided. Generate from general educational knowledge appropriate for ${grade_level} ${subject}.\n`;

  return `You are an expert teacher trainer helping a school teacher prepare a formal lesson plan.
Generate a complete, professional lesson plan for the following lesson.
Respond ONLY with a valid JSON object — no markdown, no explanation, no preamble.

LESSON DETAILS:
Topic: ${topic}
Subject: ${subject}
Grade / Year Level: ${grade_level}
Duration: ${duration} minutes
${approachLine}${focusLine}${curriculumBlock}
Curriculum source: ${curriculum_source || 'general_knowledge'}

Generate a lesson plan with exactly these fields. Use clear, professional English.
The lesson must be realistic for a single ${duration}-minute class.

Respond with this exact JSON structure:
{
  "title": "Full descriptive title of the lesson",
  "objective": "One clear sentence starting with 'By the end of this lesson, students will be able to...' Use a measurable action verb (identify, explain, calculate, compare, demonstrate, analyse).",
  "prior_knowledge": "2-3 sentences on what students should already know before this lesson.",
  "materials": "Bulleted list of required materials, one per line, starting with -",
  "introduction": "How the teacher will open the lesson and engage students. Include timing in brackets e.g. [5 min]. Should hook curiosity.",
  "main_activity": "Step-by-step lesson flow with timings. Be specific about what the teacher does and what students do. [Total: ${Math.max(20, parseInt(duration, 10) - 10)} min approximate]",
  "assessment": "How the teacher will check understanding during and at the end of the lesson. Be specific.",
  "closure": "How the lesson ends — consolidation of key points, connection to next lesson.",
  "homework": "Optional homework or extension task. Write 'None' if not applicable.",
  "notes": "Differentiation suggestions: one tip for students who need support, one for advanced students."
}`;
}
