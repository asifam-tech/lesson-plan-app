export function buildSuggestionPrompt(fieldName, form, curriculumSource) {
  const context = `
Topic: ${form.title || 'Not specified'}
Subject: ${form.subject || 'Not specified'}
Grade: ${form.grade_level || 'Not specified'}
Duration: ${form.duration_minutes || '45'} minutes
Current objective: ${form.objective || 'Not written yet'}
Curriculum source: ${curriculumSource || 'Not specified'}
`.trim();

  const instructions = {
    objective: `Write ONE clear learning objective for this lesson starting with "By the end of this lesson, students will be able to..." Use a measurable action verb. One sentence only. No preamble.`,
    main_activity: `Write a detailed main activity for this lesson. Include step-by-step instructions for the teacher with approximate timings in brackets. Be specific about what the teacher does and what students do. Total activity time should be roughly ${Math.max(20, (parseInt(form.duration_minutes, 10) || 45) - 15)} minutes. No preamble.`,
    assessment: `Write 2-3 specific assessment strategies for this lesson that check understanding during and at the end of class. Be concrete — name the specific technique (e.g. exit ticket, think-pair-share, mini whiteboard quiz). No preamble.`,
    closure: `Write a 3-5 minute lesson closure. Include consolidation of the key concept, a brief connection to the next lesson, and one question the teacher can ask to check final understanding. No preamble.`,
  };

  return `You are helping a teacher write one section of a lesson plan.

${context}

Task: ${instructions[fieldName]}

Respond with ONLY the text for that section. No labels, no JSON, no explanation.`;
}
