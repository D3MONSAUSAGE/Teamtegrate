-- Update the "Como Solicitar un permiso" course to use Google Drive
UPDATE training_modules 
SET video_source = 'google_drive'
WHERE course_id IN (
  SELECT id FROM training_courses 
  WHERE title = 'Como Solicitar un permiso en Athoz'
) AND title = 'Solicitud De Permiso';