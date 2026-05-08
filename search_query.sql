SELECT 'student' as type, name, nis as id FROM students WHERE nis = '862357963380'
UNION ALL
SELECT 'teacher' as type, name, nip as id FROM teachers WHERE nip = '862357963380'
UNION ALL
SELECT 'book' as type, title as name, isbn as id FROM books WHERE isbn = '862357963380';
