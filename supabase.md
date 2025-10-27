-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.annexures (
  id integer NOT NULL DEFAULT nextval('annexures_id_seq'::regclass),
  name character varying NOT NULL,
  subject_id integer,
  file_type character varying NOT NULL,
  file_url text NOT NULL,
  thumbnail_url text,
  created_by integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT annexures_pkey PRIMARY KEY (id),
  CONSTRAINT annexures_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT annexures_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
);
CREATE TABLE public.assessments (
  id integer NOT NULL DEFAULT nextval('assessments_id_seq'::regclass),
  question_paper_id integer,
  assigned_by integer,
  assigned_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  due_date timestamp with time zone,
  CONSTRAINT assessments_pkey PRIMARY KEY (id),
  CONSTRAINT assessments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id),
  CONSTRAINT assessments_question_paper_id_fkey FOREIGN KEY (question_paper_id) REFERENCES public.question_papers(id)
);
CREATE TABLE public.educase-db (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT educase-db_pkey PRIMARY KEY (id)
);
CREATE TABLE public.grades (
  id integer NOT NULL DEFAULT nextval('grades_id_seq'::regclass),
  level character varying NOT NULL,
  description character varying,
  CONSTRAINT grades_pkey PRIMARY KEY (id)
);
CREATE TABLE public.password_resets (
  id integer NOT NULL DEFAULT nextval('password_resets_id_seq'::regclass),
  user_id integer NOT NULL,
  token character varying NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT password_resets_pkey PRIMARY KEY (id),
  CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.question_addendums (
  id integer NOT NULL DEFAULT nextval('question_addendums_id_seq'::regclass),
  question_id integer NOT NULL,
  title character varying NOT NULL,
  description text,
  file_type character varying NOT NULL,
  file_url text NOT NULL,
  thumbnail_url text,
  created_by integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT question_addendums_pkey PRIMARY KEY (id),
  CONSTRAINT question_addendums_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT question_addendums_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.question_paper_questions (
  id integer NOT NULL DEFAULT nextval('question_paper_questions_id_seq'::regclass),
  question_paper_id integer,
  question_id integer,
  question_order integer NOT NULL,
  CONSTRAINT question_paper_questions_pkey PRIMARY KEY (id),
  CONSTRAINT question_paper_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id),
  CONSTRAINT question_paper_questions_question_paper_id_fkey FOREIGN KEY (question_paper_id) REFERENCES public.question_papers(id)
);
CREATE TABLE public.question_papers (
  id integer NOT NULL DEFAULT nextval('question_papers_id_seq'::regclass),
  title character varying NOT NULL,
  subject_id integer,
  grade_id integer,
  assessment_type character varying,
  assessment_date date,
  instructions text,
  created_by integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  user_id integer,
  CONSTRAINT question_papers_pkey PRIMARY KEY (id),
  CONSTRAINT question_papers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT question_papers_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grades(id),
  CONSTRAINT question_papers_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT question_papers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.questions (
  id integer NOT NULL DEFAULT nextval('questions_id_seq'::regclass),
  number character varying,
  description text,
  text text,
  latex text,
  difficulty character varying NOT NULL,
  marks integer NOT NULL,
  type character varying NOT NULL,
  cognitive_level character varying,
  memo text,
  topic_id integer,
  parent_id integer,
  created_by integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  table_data jsonb,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT questions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.questions(id),
  CONSTRAINT questions_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id)
);
CREATE TABLE public.student_assessments (
  id integer NOT NULL DEFAULT nextval('student_assessments_id_seq'::regclass),
  student_id integer,
  assessment_id integer,
  status character varying DEFAULT 'assigned'::character varying,
  score integer,
  total_marks integer,
  confidence_rating integer,
  completed_at timestamp with time zone,
  CONSTRAINT student_assessments_pkey PRIMARY KEY (id),
  CONSTRAINT student_assessments_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id),
  CONSTRAINT student_assessments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.students (
  id integer NOT NULL DEFAULT nextval('students_id_seq'::regclass),
  name character varying NOT NULL,
  grade character varying NOT NULL,
  user_id integer,
  teacher_id integer,
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id),
  CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.subjects (
  id integer NOT NULL DEFAULT nextval('subjects_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
);
CREATE TABLE public.templates (
  id integer NOT NULL DEFAULT nextval('templates_id_seq'::regclass),
  title character varying NOT NULL,
  subtitle character varying,
  description text,
  image_url text,
  created_by integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  subject_id integer,
  grade_id integer,
  topic_id integer,
  CONSTRAINT templates_pkey PRIMARY KEY (id),
  CONSTRAINT templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT templates_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grades(id),
  CONSTRAINT templates_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT templates_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id)
);
CREATE TABLE public.topics (
  id integer NOT NULL DEFAULT nextval('topics_id_seq'::regclass),
  name character varying NOT NULL,
  subject_id integer,
  grade_id integer,
  CONSTRAINT topics_pkey PRIMARY KEY (id),
  CONSTRAINT topics_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grades(id),
  CONSTRAINT topics_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  name character varying NOT NULL,
  role character varying NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);