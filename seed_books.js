const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY // fallback to anon if no service key
);

const sql = `
DO $$ 
DECLARE
    v_book_1 UUID;
    v_book_2 UUID;
    v_book_3 UUID;
    v_book_4 UUID;
BEGIN
    -- 1. Insert Books
    INSERT INTO public.books (title, isbn, publisher, publication_year, category) 
    VALUES 
        ('Introduction to Algorithms', '978-0262033848', 'MIT Press', 2009, 'Computer Science') RETURNING id INTO v_book_1;
        
    INSERT INTO public.books (title, isbn, publisher, publication_year, category) 
    VALUES 
        ('Clean Code: A Handbook of Agile Software Craftsmanship', '978-0132350884', 'Prentice Hall', 2008, 'Software Engineering') RETURNING id INTO v_book_2;
        
    INSERT INTO public.books (title, isbn, publisher, publication_year, category) 
    VALUES 
        ('University Physics with Modern Physics', '978-0321973610', 'Pearson', 2015, 'Physics') RETURNING id INTO v_book_3;
        
    INSERT INTO public.books (title, isbn, publisher, publication_year, category) 
    VALUES 
        ('Calculus: Early Transcendentals', '978-1285741550', 'Cengage Learning', 2015, 'Mathematics') RETURNING id INTO v_book_4;

    -- 2. Insert Copies for each book
    INSERT INTO public.book_copies (book_id, barcode, shelf_location) VALUES (v_book_1, 'B001', 'CS-A1');
    INSERT INTO public.book_copies (book_id, barcode, shelf_location) VALUES (v_book_1, 'B002', 'CS-A1');
    INSERT INTO public.book_copies (book_id, barcode, shelf_location) VALUES (v_book_2, 'B003', 'SE-B2');
    INSERT INTO public.book_copies (book_id, barcode, shelf_location) VALUES (v_book_2, 'B004', 'SE-B2');
    INSERT INTO public.book_copies (book_id, barcode, shelf_location) VALUES (v_book_3, 'B005', 'PHY-C1');
    INSERT INTO public.book_copies (book_id, barcode, shelf_location) VALUES (v_book_4, 'B006', 'MATH-D4');
END $$;
`;

async function runSql() {
  console.log("SQL generated.");
}
runSql();
