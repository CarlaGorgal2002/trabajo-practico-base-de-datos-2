UPDATE usuarios SET password_hash = '$2b$12$p3gLEbsqcOCjSKeiNS2LxuWWnQxfyP8Y07e2gCHS16ApbLZHIFJ2a' WHERE email = 'admin@talentum.plus';
SELECT email, password_hash FROM usuarios WHERE email = 'admin@talentum.plus';
