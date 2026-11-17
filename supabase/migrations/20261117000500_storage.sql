-- ════════════════════════════════════════════════════════════════════════
-- SkillOrbit · 0500 · Storage buckets and policies.
--
--   course-images      PUBLIC   {course_id}/{file}            managers write
--   lesson-resources   PRIVATE  {course_id}/{lesson_id}/{file} managers write,
--                                                             entitled learners read (signed URLs)
--   instructor-uploads PRIVATE  {user_id}/{file}              owner rw, admin read
--   certificates       PRIVATE  {user_id}/{file}              owner read; written by server only
-- ════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('course-images', 'course-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('lesson-resources', 'lesson-resources', false, 52428800, null),
  ('instructor-uploads', 'instructor-uploads', false, 52428800, null),
  ('certificates', 'certificates', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- Accepts only a well-formed uuid path segment.
create function public.path_uuid(p_segment text)
returns uuid language sql immutable set search_path = '' as $$
  select case when p_segment ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then p_segment::uuid end
$$;

-- course-images: public read; managers write.
create policy "course images: public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'course-images');
create policy "course images: managers insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'course-images' and public.can_manage_course_path((storage.foldername(name))[1]));
create policy "course images: managers update" on storage.objects
  for update to authenticated
  using (bucket_id = 'course-images' and public.can_manage_course_path((storage.foldername(name))[1]));
create policy "course images: managers delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'course-images' and public.can_manage_course_path((storage.foldername(name))[1]));

-- lesson-resources: private.
create policy "lesson resources: managers insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lesson-resources' and public.can_manage_course_path((storage.foldername(name))[1]));
create policy "lesson resources: managers delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lesson-resources' and public.can_manage_course_path((storage.foldername(name))[1]));
create policy "lesson resources: entitled read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'lesson-resources'
    and public.path_uuid((storage.foldername(name))[1]) is not null
    and public.has_course_access(public.path_uuid((storage.foldername(name))[1]))
  );

-- instructor-uploads: private to the uploader (admins can read).
create policy "instructor uploads: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'instructor-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "instructor uploads: owner or admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'instructor-uploads' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "instructor uploads: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'instructor-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- certificates: owner read only; generated server-side with the service role.
create policy "certificates: owner read" on storage.objects
  for select to authenticated
  using (bucket_id = 'certificates' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
