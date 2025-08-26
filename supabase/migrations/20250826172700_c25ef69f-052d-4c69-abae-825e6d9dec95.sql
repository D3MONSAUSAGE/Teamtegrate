
-- Preview the room to be deleted (no changes yet)
SELECT id, name, created_by, organization_id, is_public, created_at
FROM public.chat_rooms
WHERE id = 'c1744ceb-e5a0-40ac-bc05-fc188641513e';

-- Delete attachments -> messages -> participants -> room
WITH target_room AS (
  SELECT id
  FROM public.chat_rooms
  WHERE id = 'c1744ceb-e5a0-40ac-bc05-fc188641513e'
),
deleted_attachments AS (
  DELETE FROM public.chat_attachments ca
  USING public.chat_messages cm, target_room tr
  WHERE ca.message_id = cm.id
    AND cm.room_id = tr.id
  RETURNING ca.id
),
deleted_messages AS (
  DELETE FROM public.chat_messages cm
  USING target_room tr
  WHERE cm.room_id = tr.id
  RETURNING cm.id
),
deleted_participants AS (
  DELETE FROM public.chat_participants cp
  USING target_room tr
  WHERE cp.room_id = tr.id
  RETURNING cp.id
),
deleted_room AS (
  DELETE FROM public.chat_rooms cr
  USING target_room tr
  WHERE cr.id = tr.id
  RETURNING cr.id
)
SELECT 
  (SELECT count(*) FROM deleted_attachments) AS attachments_deleted,
  (SELECT count(*) FROM deleted_messages) AS messages_deleted,
  (SELECT count(*) FROM deleted_participants) AS participants_deleted,
  (SELECT count(*) FROM deleted_room) AS rooms_deleted;
